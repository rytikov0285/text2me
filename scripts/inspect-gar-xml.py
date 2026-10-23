#!/usr/bin/env python3
"""Inspect GAR XML members in a ZIP without extracting the archive to disk."""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import PurePosixPath

if len(sys.argv) != 2:
    print("Usage: inspect-gar-xml.py archive.zip", file=sys.stderr)
    sys.exit(2)

archive_path = sys.argv[1]
reports = []
errors = []
with zipfile.ZipFile(archive_path) as archive:
    names = [n for n in archive.namelist() if n.lower().endswith(".xml") and not n.endswith("/")]
    if not names:
        raise SystemExit("No XML files found in archive")

    for name in names:
        root_name = None
        root_attributes = []
        top_level_tags = Counter()
        record_count = 0
        sample_attributes = {}
        parsed = False
        try:
            with archive.open(name) as stream:
                iterator = ET.iterparse(stream, events=("start", "end"))
                depth = 0
                for event, element in iterator:
                    tag = element.tag.rsplit("}", 1)[-1]
                    if event == "start":
                        depth += 1
                        if depth == 1:
                            root_name = tag
                            root_attributes = sorted(element.attrib.keys())
                        elif depth == 2:
                            top_level_tags[tag] += 1
                            record_count += 1
                            if tag not in sample_attributes:
                                sample_attributes[tag] = sorted(element.attrib.keys())
                    else:
                        if depth == 2:
                            element.clear()
                        depth -= 1
                parsed = root_name is not None
        except (ET.ParseError, OSError, RuntimeError, zipfile.BadZipFile) as exc:
            errors.append({"file": name, "error": str(exc)[:500]})

        base = PurePosixPath(name).name.upper()
        table_kind = "other"
        if "AS_ADDR_OBJ" in base or "ADDR_OBJ" in base:
            table_kind = "address_objects"
        elif "AS_HOUSES" in base or "HOUSES" in base:
            table_kind = "houses"
        elif "AS_ADM_HIERARCHY" in base or "ADM_HIERARCHY" in base:
            table_kind = "administrative_hierarchy"
        elif "AS_MUN_HIERARCHY" in base or "MUN_HIERARCHY" in base:
            table_kind = "municipal_hierarchy"
        elif "AS_ADDR_OBJ_TYPES" in base or "ADDR_OBJ_TYPES" in base:
            table_kind = "address_object_types"
        elif "AS_HOUSE_TYPES" in base or "HOUSE_TYPES" in base:
            table_kind = "house_types"

        reports.append({
            "file": name,
            "table_kind": table_kind,
            "xml_well_formed": parsed and not any(e["file"] == name for e in errors),
            "root_element": root_name,
            "root_attributes": root_attributes,
            "top_level_record_count": record_count,
            "top_level_tags": dict(top_level_tags.most_common(10)),
            "sample_record_attributes": sample_attributes,
        })

    recognized = {r["table_kind"] for r in reports}
    required_groups = {
        "address_objects": "address_objects",
        "houses": "houses",
    }
    missing_groups = [group for group in required_groups if group not in recognized]
    result = {
        "archive_xml_file_count": len(names),
        "xml_files_well_formed": len(errors) == 0,
        "recognized_table_kinds": sorted(recognized),
        "missing_expected_table_kinds": missing_groups,
        "parse_errors": errors[:100],
        "files": reports,
        "note": "Это инвентаризация XML и проверка синтаксической корректности, а не полная валидация XSD, связей объектов или построение поискового индекса."
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if errors:
        sys.exit(1)
