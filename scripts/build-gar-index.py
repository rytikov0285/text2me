#!/usr/bin/env python3
"""Build a validated SQLite address index from an official GAR/FIAS ZIP archive.

The archive is read in-place; XML files are not extracted to disk. The database is
written to a temporary sibling and atomically replaces the requested output only
after parsing and integrity checks pass.
"""
import argparse
import hashlib
import json
import os
import re
import sqlite3
import sys
import tempfile
import time
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

TABLE_PATTERNS = {
    "objects": re.compile(r"(?:^|/)AS_ADDR_OBJ(?:_\d+)?\.XML$", re.I),
    "houses": re.compile(r"(?:^|/)AS_HOUSES(?:_\d+)?\.XML$", re.I),
    "adm_hierarchy": re.compile(r"(?:^|/)AS_ADM_HIERARCHY(?:_\d+)?\.XML$", re.I),
}
MAX_ERRORS = 50

def local_name(tag):
    return tag.rsplit("}", 1)[-1].upper()

def attr(element, *names):
    upper = {str(k).upper(): v for k, v in element.attrib.items()}
    for name in names:
        if name.upper() in upper:
            return upper[name.upper()]
    return None

def as_int(value):
    try:
        return int(value) if value not in (None, "") else None
    except (TypeError, ValueError):
        return None

def current(value):
    return str(value or "").strip() in ("1", "true", "TRUE", "True")

def digest_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def find_groups(names):
    groups = {key: [] for key in TABLE_PATTERNS}
    for name in names:
        if name.endswith("/") or not name.lower().endswith(".xml"):
            continue
        for kind, pattern in TABLE_PATTERNS.items():
            if pattern.search(name):
                groups[kind].append(name)
    return groups

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("archive")
    parser.add_argument("output")
    args = parser.parse_args()
    started = time.time()
    archive_path = Path(args.archive)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="gar-index-", suffix=".sqlite", dir=str(output_path.parent))
    os.close(fd)
    os.unlink(temp_name)
    db_path = Path(temp_name)
    errors = []
    counts = {"objects_seen": 0, "objects_current": 0, "houses_seen": 0, "houses_current": 0, "hierarchy_rows": 0}
    groups = {}
    try:
        with zipfile.ZipFile(archive_path) as zf:
            bad = zf.testzip()
            if bad:
                raise RuntimeError("ZIP CRC failure in " + bad)
            groups = find_groups(zf.namelist())
            if not groups["objects"]:
                raise RuntimeError("No AS_ADDR_OBJ XML tables found.")
            if not groups["houses"]:
                raise RuntimeError("No AS_HOUSES XML tables found.")
            if not groups["adm_hierarchy"]:
                raise RuntimeError("No AS_ADM_HIERARCHY XML tables found.")

            con = sqlite3.connect(str(db_path))
            try:
                con.execute("PRAGMA journal_mode=OFF")
                con.execute("PRAGMA synchronous=OFF")
                con.execute("PRAGMA temp_store=FILE")
                con.execute("PRAGMA cache_size=-65536")
                con.executescript("""
                CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE address_objects (
                  object_id INTEGER PRIMARY KEY, object_guid TEXT, name TEXT NOT NULL,
                  typename TEXT, level INTEGER, is_active INTEGER NOT NULL, is_actual INTEGER NOT NULL,
                  start_date TEXT, end_date TEXT, source_file TEXT NOT NULL
                );
                CREATE TABLE houses (
                  house_id INTEGER PRIMARY KEY, object_id INTEGER NOT NULL, house_num TEXT,
                  add_num1 TEXT, add_num2 TEXT, postal_code TEXT, is_active INTEGER NOT NULL,
                  is_actual INTEGER NOT NULL, start_date TEXT, end_date TEXT, source_file TEXT NOT NULL
                );
                CREATE TABLE admin_hierarchy (
                  object_id INTEGER NOT NULL, parent_object_id INTEGER, path TEXT,
                  is_active INTEGER NOT NULL, start_date TEXT, end_date TEXT, source_file TEXT NOT NULL
                );
                """)
                con.execute("BEGIN")
                for file_name in groups["objects"]:
                    with zf.open(file_name) as stream:
                        for event, elem in ET.iterparse(stream, events=("end",)):
                            if local_name(elem.tag) in ("OBJECT", "ADDR_OBJ"):
                                oid = as_int(attr(elem, "OBJECTID", "ID"))
                                name = (attr(elem, "NAME") or "").strip()
                                if oid is not None and name:
                                    active = int(current(attr(elem, "ISACTIVE")))
                                    actual = int(current(attr(elem, "ISACTUAL")))
                                    con.execute("INSERT OR REPLACE INTO address_objects VALUES (?,?,?,?,?,?,?,?,?,?)", (
                                        oid, attr(elem, "OBJECTGUID", "GUID"), name,
                                        attr(elem, "TYPENAME"), as_int(attr(elem, "LEVEL")),
                                        active, actual, attr(elem, "STARTDATE"), attr(elem, "ENDDATE"), file_name))
                                    counts["objects_seen"] += 1
                                    counts["objects_current"] += int(active == 1 and actual == 1)
                                elem.clear()
                con.execute("CREATE INDEX idx_objects_guid ON address_objects(object_guid)")
                con.execute("CREATE INDEX idx_objects_current_name ON address_objects(is_active,is_actual,name COLLATE NOCASE)")
                for file_name in groups["adm_hierarchy"]:
                    with zf.open(file_name) as stream:
                        for event, elem in ET.iterparse(stream, events=("end",)):
                            if local_name(elem.tag) in ("ITEM", "HIERARCHY"):
                                oid = as_int(attr(elem, "OBJECTID", "ID"))
                                if oid is not None:
                                    active = int(current(attr(elem, "ISACTIVE")))
                                    con.execute("INSERT INTO admin_hierarchy VALUES (?,?,?,?,?,?,?)", (
                                        oid, as_int(attr(elem, "PARENTOBJID", "PARENTOBJECTID")),
                                        attr(elem, "PATH"), active, attr(elem, "STARTDATE"),
                                        attr(elem, "ENDDATE"), file_name))
                                    counts["hierarchy_rows"] += 1
                                elem.clear()
                con.execute("CREATE INDEX idx_hierarchy_object ON admin_hierarchy(object_id,is_active)")
                con.execute("CREATE INDEX idx_hierarchy_parent ON admin_hierarchy(parent_object_id)")
                for file_name in groups["houses"]:
                    with zf.open(file_name) as stream:
                        for event, elem in ET.iterparse(stream, events=("end",)):
                            if local_name(elem.tag) in ("HOUSE", "HOUSES"):
                                hid = as_int(attr(elem, "HOUSEID", "ID"))
                                oid = as_int(attr(elem, "OBJECTID"))
                                if hid is not None and oid is not None:
                                    active = int(current(attr(elem, "ISACTIVE")))
                                    actual = int(current(attr(elem, "ISACTUAL")))
                                    con.execute("INSERT OR REPLACE INTO houses VALUES (?,?,?,?,?,?,?,?,?,?,?)", (
                                        hid, oid, attr(elem, "HOUSENUM"), attr(elem, "ADDNUM1"),
                                        attr(elem, "ADDNUM2"), attr(elem, "POSTALCODE"), active, actual,
                                        attr(elem, "STARTDATE"), attr(elem, "ENDDATE"), file_name))
                                    counts["houses_seen"] += 1
                                    counts["houses_current"] += int(active == 1 and actual == 1)
                                elem.clear()
                con.execute("CREATE INDEX idx_houses_object ON houses(object_id,is_active,is_actual)")
                con.execute("CREATE INDEX idx_houses_postal ON houses(postal_code)")
                con.execute("CREATE INDEX idx_houses_number ON houses(house_num COLLATE NOCASE)")
                con.execute("CREATE VIEW current_address_objects AS SELECT * FROM address_objects WHERE is_active=1 AND is_actual=1")
                con.execute("CREATE VIEW current_houses AS SELECT * FROM houses WHERE is_active=1 AND is_actual=1")
                object_count = con.execute("SELECT COUNT(*) FROM address_objects").fetchone()[0]
                house_count = con.execute("SELECT COUNT(*) FROM houses").fetchone()[0]
                hierarchy_count = con.execute("SELECT COUNT(*) FROM admin_hierarchy").fetchone()[0]
                duplicate_hierarchy = con.execute("SELECT COUNT(*) FROM (SELECT object_id FROM admin_hierarchy WHERE is_active=1 GROUP BY object_id HAVING COUNT(*)>1)").fetchone()[0]
                missing_hierarchy = con.execute("""
                    SELECT COUNT(*) FROM address_objects o
                    LEFT JOIN admin_hierarchy h ON h.object_id=o.object_id AND h.is_active=1
                    WHERE o.is_active=1 AND o.is_actual=1 AND h.object_id IS NULL
                """).fetchone()[0]
                missing_house_objects = con.execute("""
                    SELECT COUNT(*) FROM houses h LEFT JOIN address_objects o ON o.object_id=h.object_id
                    WHERE h.is_active=1 AND h.is_actual=1 AND o.object_id IS NULL
                """).fetchone()[0]
                con.execute("INSERT INTO metadata VALUES (?,?)", ("schema_version", "1.0.0"))
                con.execute("INSERT INTO metadata VALUES (?,?)", ("source", "GAR/ФИАС; official open-data archive"))
                con.execute("INSERT INTO metadata VALUES (?,?)", ("built_at_utc", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())))
                con.execute("INSERT INTO metadata VALUES (?,?)", ("archive_sha256", digest_file(archive_path)))
                con.execute("INSERT INTO metadata VALUES (?,?)", ("objects_total", str(object_count)))
                con.execute("INSERT INTO metadata VALUES (?,?)", ("houses_total", str(house_count)))
                con.execute("INSERT INTO metadata VALUES (?,?)", ("hierarchy_rows_total", str(hierarchy_count)))
                con.commit()
                con.execute("PRAGMA optimize")
                integrity = con.execute("PRAGMA integrity_check").fetchone()[0]
                if integrity != "ok":
                    raise RuntimeError("SQLite integrity_check failed: " + str(integrity))
                if object_count == 0 or house_count == 0 or hierarchy_count == 0:
                    raise RuntimeError("Built index has an empty required table.")
                if missing_house_objects:
                    errors.append({"check": "houses_missing_address_object", "count": missing_house_objects})
                if missing_hierarchy:
                    errors.append({"check": "current_objects_missing_active_hierarchy", "count": missing_hierarchy})
                report = {
                    "result": "success" if not errors else "success_with_integrity_warnings",
                    "database": str(output_path),
                    "database_bytes": db_path.stat().st_size,
                    "database_sha256": digest_file(db_path),
                    "archive_sha256": digest_file(archive_path),
                    "counts": counts,
                    "table_counts": {"address_objects": object_count, "houses": house_count, "admin_hierarchy": hierarchy_count},
                    "checks": {
                        "sqlite_integrity": integrity,
                        "duplicate_active_hierarchy_object_ids": duplicate_hierarchy,
                        "current_objects_missing_active_hierarchy": missing_hierarchy,
                        "current_houses_missing_address_object": missing_house_objects,
                        "expected_xml_groups_found": {k: len(v) for k, v in groups.items()}
                    },
                    "warnings": errors[:MAX_ERRORS],
                    "duration_seconds": round(time.time() - started, 2),
                    "limitations": [
                        "XML attribute mapping must be confirmed against a real current archive.",
                        "This is a normalized SQLite data store, not yet an HTTP API or a browser-deployed search service.",
                        "Administrative hierarchy only; municipal hierarchy and XSD validation are not yet included."
                    ]
                }
                con.close()
                if errors:
                    print(json.dumps(report, ensure_ascii=False, indent=2))
                    raise RuntimeError("Referential integrity checks reported warnings; do not publish index as healthy.")
                os.replace(db_path, output_path)
                report["result"] = "success"
                report["database_bytes"] = output_path.stat().st_size
                print(json.dumps(report, ensure_ascii=False, indent=2))
            finally:
                try: con.close()
                except Exception: pass
        return 0
    except Exception as exc:
        try: db_path.unlink(missing_ok=True)
        except Exception: pass
        print(json.dumps({"result": "error", "error": str(exc), "counts": counts,
                          "expected_xml_groups_found": {k: len(v) for k, v in groups.items()},
                          "parse_errors": errors[:MAX_ERRORS]}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())
