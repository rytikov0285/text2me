#!/usr/bin/env python3
"""Build a normalized SQLite GAR/FIAS database from an official XML ZIP.

The archive is streamed from ZIP members; XML is never extracted as a whole.
Output is replaced atomically only after SQLite and referential checks pass.
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

PATTERNS = {
    "objects": re.compile(r"(?:^|/)AS_ADDR_OBJ(?:_[A-Z0-9-]+)*\.XML$", re.I),
    "houses": re.compile(r"(?:^|/)AS_HOUSES(?:_[A-Z0-9-]+)*\.XML$", re.I),
    "adm_hierarchy": re.compile(r"(?:^|/)AS_ADM_HIERARCHY(?:_[A-Z0-9-]+)*\.XML$", re.I),
    "mun_hierarchy": re.compile(r"(?:^|/)AS_MUN_HIERARCHY(?:_[A-Z0-9-]+)*\.XML$", re.I),
}
BATCH_SIZE = 5000

def lname(tag):
    return tag.rsplit("}", 1)[-1].upper()

def attrs(element):
    return {str(k).upper(): v for k, v in element.attrib.items()}

def get(a, *keys):
    for key in keys:
        if key in a:
            return a[key]
    return None

def integer(value):
    try:
        return int(value) if value not in (None, "") else None
    except (ValueError, TypeError):
        return None

def flag(value):
    return int(str(value or "").strip() == "1")

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def flush(con, sql, batch):
    if batch:
        con.executemany(sql, batch)
        batch.clear()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("archive")
    parser.add_argument("output")
    args = parser.parse_args()
    started = time.time()
    archive = Path(args.archive)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix="gar-index-", suffix=".sqlite", dir=str(output.parent))
    os.close(fd)
    os.unlink(tmp)
    dbpath = Path(tmp)
    groups = {k: [] for k in PATTERNS}
    counts = {"object_rows": 0, "house_rows": 0, "admin_hierarchy_rows": 0, "municipal_hierarchy_rows": 0}
    warnings = []
    try:
        with zipfile.ZipFile(archive) as zf:
            bad = zf.testzip()
            if bad:
                raise RuntimeError("ZIP CRC error: " + bad)
            for name in zf.namelist():
                if name.endswith("/") or not name.lower().endswith(".xml"):
                    continue
                for kind, pattern in PATTERNS.items():
                    if pattern.search(name):
                        groups[kind].append(name)
            for required in ("objects", "houses", "adm_hierarchy"):
                if not groups[required]:
                    raise RuntimeError("Required GAR XML group missing: " + required)

            con = sqlite3.connect(str(dbpath))
            try:
                con.execute("PRAGMA journal_mode=OFF")
                con.execute("PRAGMA synchronous=OFF")
                con.execute("PRAGMA temp_store=FILE")
                con.execute("PRAGMA cache_size=-65536")
                con.executescript("""
                CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE address_objects(
                  row_id INTEGER PRIMARY KEY, object_id INTEGER NOT NULL, object_guid TEXT,
                  name TEXT NOT NULL, name_folded TEXT NOT NULL, type_name TEXT, level INTEGER, is_active INTEGER NOT NULL,
                  is_actual INTEGER NOT NULL, start_date TEXT, end_date TEXT, source_file TEXT NOT NULL
                );
                CREATE TABLE houses(
                  row_id INTEGER PRIMARY KEY, house_object_id INTEGER NOT NULL, object_guid TEXT,
                  house_num TEXT, house_num_folded TEXT, build_num TEXT, postal_code TEXT, is_active INTEGER NOT NULL,
                  is_actual INTEGER NOT NULL, start_date TEXT, end_date TEXT, source_file TEXT NOT NULL
                );
                CREATE TABLE hierarchy(
                  row_id INTEGER PRIMARY KEY AUTOINCREMENT, division TEXT NOT NULL,
                  object_id INTEGER NOT NULL, parent_object_id INTEGER, is_active INTEGER NOT NULL,
                  start_date TEXT, end_date TEXT, source_file TEXT NOT NULL
                );
                """)
                con.execute("BEGIN")
                object_sql = "INSERT OR REPLACE INTO address_objects VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
                for filename in groups["objects"]:
                    batch = []
                    with zf.open(filename) as stream:
                        for _, elem in ET.iterparse(stream, events=("end",)):
                            if lname(elem.tag) == "OBJECT":
                                a = attrs(elem)
                                row_id, oid = integer(get(a, "ID")), integer(get(a, "OBJECTID"))
                                name = (get(a, "NAME") or "").strip()
                                if row_id is None or oid is None or not name:
                                    raise RuntimeError("Invalid required OBJECT attributes in " + filename)
                                batch.append((row_id, oid, get(a, "OBJECTGUID"), name, get(a, "TYPENAME"),
                                    integer(get(a, "LEVEL")), name.casefold(), flag(get(a, "ISACTIVE")), flag(get(a, "ISACTUAL")),
                                    get(a, "STARTDATE"), get(a, "ENDDATE"), filename))
                                counts["object_rows"] += 1
                                if len(batch) >= BATCH_SIZE:
                                    flush(con, object_sql, batch)
                            elem.clear()
                    flush(con, object_sql, batch)

                hierarchy_sql = "INSERT INTO hierarchy(division,object_id,parent_object_id,is_active,start_date,end_date,source_file) VALUES (?,?,?,?,?,?,?)"
                for division in ("adm_hierarchy", "mun_hierarchy"):
                    for filename in groups[division]:
                        batch = []
                        with zf.open(filename) as stream:
                            for _, elem in ET.iterparse(stream, events=("end",)):
                                if lname(elem.tag) == "ITEM":
                                    a = attrs(elem)
                                    oid = integer(get(a, "OBJECTID"))
                                    if oid is None:
                                        raise RuntimeError("Hierarchy ITEM without OBJECTID in " + filename)
                                    batch.append((division, oid, integer(get(a, "PARENTOBJID")),
                                        flag(get(a, "ISACTIVE")), get(a, "STARTDATE"), get(a, "ENDDATE"), filename))
                                    counts[division + "_rows"] += 1
                                    if len(batch) >= BATCH_SIZE:
                                        flush(con, hierarchy_sql, batch)
                                elem.clear()
                        flush(con, hierarchy_sql, batch)

                house_sql = "INSERT OR REPLACE INTO houses VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
                for filename in groups["houses"]:
                    batch = []
                    with zf.open(filename) as stream:
                        for _, elem in ET.iterparse(stream, events=("end",)):
                            if lname(elem.tag) == "HOUSE":
                                a = attrs(elem)
                                row_id = integer(get(a, "ID"))
                                house_oid = integer(get(a, "OBJECTID"))
                                if row_id is None or house_oid is None:
                                    raise RuntimeError("Invalid required HOUSE attributes in " + filename)
                                house_num = get(a, "HOUSENUM")
                                batch.append((row_id, house_oid, get(a, "OBJECTGUID"), house_num,
                                    (house_num or "").casefold(), get(a, "BUILDNUM"), get(a, "POSTALCODE"), flag(get(a, "ISACTIVE")),
                                    flag(get(a, "ISACTUAL")), get(a, "STARTDATE"), get(a, "ENDDATE"), filename))
                                counts["house_rows"] += 1
                                if len(batch) >= BATCH_SIZE:
                                    flush(con, house_sql, batch)
                            elem.clear()
                    flush(con, house_sql, batch)

                con.executescript("""
                CREATE INDEX idx_address_object_id ON address_objects(object_id);
                CREATE INDEX idx_address_current_name ON address_objects(is_active,is_actual,name_folded);
                CREATE INDEX idx_address_guid ON address_objects(object_guid);
                CREATE INDEX idx_house_object_id ON houses(house_object_id);
                CREATE INDEX idx_house_current_number ON houses(is_active,is_actual,house_num_folded);
                CREATE INDEX idx_house_current_postal ON houses(is_active,is_actual,postal_code);
                CREATE INDEX idx_hierarchy_object ON hierarchy(object_id,division,is_active);
                CREATE INDEX idx_hierarchy_parent ON hierarchy(parent_object_id,division,is_active);
                CREATE VIEW current_address_objects AS SELECT * FROM address_objects WHERE is_active=1 AND is_actual=1;
                CREATE VIEW current_houses AS SELECT * FROM houses WHERE is_active=1 AND is_actual=1;
                """)
                counts_by_table = {
                    "address_objects": con.execute("SELECT COUNT(*) FROM address_objects").fetchone()[0],
                    "houses": con.execute("SELECT COUNT(*) FROM houses").fetchone()[0],
                    "hierarchy": con.execute("SELECT COUNT(*) FROM hierarchy").fetchone()[0],
                    "current_address_objects": con.execute("SELECT COUNT(*) FROM current_address_objects").fetchone()[0],
                    "current_houses": con.execute("SELECT COUNT(*) FROM current_houses").fetchone()[0],
                }
                missing_object_hierarchy = con.execute("""
                  SELECT COUNT(*) FROM (
                    SELECT DISTINCT o.object_id FROM current_address_objects o
                    LEFT JOIN hierarchy h ON h.object_id=o.object_id AND h.is_active=1
                    WHERE h.object_id IS NULL
                  )
                """).fetchone()[0]
                missing_house_hierarchy = con.execute("""
                  SELECT COUNT(*) FROM current_houses h
                  LEFT JOIN hierarchy x ON x.object_id=h.house_object_id AND x.is_active=1
                  WHERE x.object_id IS NULL
                """).fetchone()[0]
                duplicate_current_ids = con.execute("""
                  SELECT COUNT(*) FROM (
                    SELECT object_id FROM current_address_objects GROUP BY object_id HAVING COUNT(*)>1
                  )
                """).fetchone()[0]
                con.executemany("INSERT INTO metadata VALUES (?,?)", [
                    ("schema_version", "1.0.0"),
                    ("source", "Official GAR/FIAS XML ZIP"),
                    ("built_at_utc", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
                    ("archive_sha256", sha256(archive)),
                    ("address_objects_total", str(counts_by_table["address_objects"])),
                    ("houses_total", str(counts_by_table["houses"])),
                    ("hierarchy_total", str(counts_by_table["hierarchy"])),
                ])
                con.commit()
                con.execute("PRAGMA optimize")
                integrity = con.execute("PRAGMA integrity_check").fetchone()[0]
                if integrity != "ok":
                    raise RuntimeError("SQLite integrity_check failed: " + str(integrity))
                if not counts_by_table["current_address_objects"] or not counts_by_table["current_houses"]:
                    raise RuntimeError("Current address objects or houses table is empty.")
                if duplicate_current_ids:
                    raise RuntimeError("Duplicate current object IDs found: " + str(duplicate_current_ids))
                # Some source rows may legitimately lack hierarchy. Record rates, don't silently discard them.
                denominator = max(1, counts_by_table["current_address_objects"])
                missing_ratio = missing_object_hierarchy / denominator
                if missing_ratio > 0.01:
                    raise RuntimeError("More than 1% of current address objects lack active hierarchy: " + str(missing_object_hierarchy))
                if missing_object_hierarchy:
                    warnings.append({"check": "current_objects_missing_active_hierarchy", "count": missing_object_hierarchy})
                if missing_house_hierarchy:
                    warnings.append({"check": "current_houses_missing_active_hierarchy", "count": missing_house_hierarchy})
                report = {
                    "result": "success",
                    "database": str(output),
                    "database_bytes": dbpath.stat().st_size,
                    "database_sha256": sha256(dbpath),
                    "archive_sha256": sha256(archive),
                    "counts": counts,
                    "table_counts": counts_by_table,
                    "checks": {
                        "sqlite_integrity": integrity,
                        "duplicate_current_object_ids": duplicate_current_ids,
                        "current_objects_missing_active_hierarchy": missing_object_hierarchy,
                        "current_houses_missing_active_hierarchy": missing_house_hierarchy,
                        "xml_groups": {k: len(v) for k, v in groups.items()}
                    },
                    "warnings": warnings,
                    "duration_seconds": round(time.time() - started, 2),
                    "limitations": [
                        "XML attribute mapping is based on the official GAR XML format and must be verified on a real current archive.",
                        "The SQLite file is a data artifact, not a deployed public search API.",
                        "Postal index is retained only where present on HOUSE records; a dedicated postal-operations classifier is separate."
                    ]
                }
                con.close()
                os.replace(dbpath, output)
                report["database_bytes"] = output.stat().st_size
                print(json.dumps(report, ensure_ascii=False, indent=2))
            finally:
                try:
                    con.close()
                except Exception:
                    pass
    except Exception as exc:
        try:
            dbpath.unlink(missing_ok=True)
        except Exception:
            pass
        print(json.dumps({"result": "error", "error": str(exc), "counts": counts,
            "xml_groups": {k: len(v) for k, v in groups.items()}, "warnings": warnings[:50]},
            ensure_ascii=False, indent=2), file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
