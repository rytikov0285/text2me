#!/usr/bin/env python3
"""Synthetic regression test for the GAR XML-to-SQLite builder."""
import json
import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

builder = Path(__file__).with_name("build-gar-index.py")
with tempfile.TemporaryDirectory(prefix="gar-builder-test-") as temp:
    root = Path(temp)
    archive = root / "fixture.zip"
    output = root / "fixture.sqlite"
    members = {
        "GAR/AS_ADDR_OBJ_20261020_abc.xml": """<?xml version="1.0"?><ADDRESSOBJECTS><OBJECT ID="1" OBJECTID="100" OBJECTGUID="g-100" NAME="Тестовая область" TYPENAME="обл" LEVEL="1" ISACTIVE="1" ISACTUAL="1" STARTDATE="2020-01-01"/><OBJECT ID="2" OBJECTID="200" OBJECTGUID="g-200" NAME="Тестовый город" TYPENAME="г" LEVEL="4" ISACTIVE="1" ISACTUAL="1" STARTDATE="2020-01-01"/></ADDRESSOBJECTS>""",
        "GAR/AS_ADM_HIERARCHY_20261020_abc.xml": """<?xml version="1.0"?><ITEMS><ITEM ID="1" OBJECTID="100" PARENTOBJID="0" ISACTIVE="1"/><ITEM ID="2" OBJECTID="200" PARENTOBJID="100" ISACTIVE="1"/><ITEM ID="3" OBJECTID="300" PARENTOBJID="200" ISACTIVE="1"/></ITEMS>""",
        "GAR/AS_HOUSES_20261020_abc.xml": """<?xml version="1.0"?><HOUSES><HOUSE ID="10" OBJECTID="300" OBJECTGUID="h-300" HOUSENUM="12А" BUILDNUM="2" POSTALCODE="123456" ISACTIVE="1" ISACTUAL="1"/></HOUSES>""",
    }
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, xml in members.items():
            zf.writestr(name, xml.encode("utf-8"))
    proc = subprocess.run([sys.executable, str(builder), str(archive), str(output)],
                          capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    report = json.loads(proc.stdout)
    assert report["result"] == "success", report
    assert report["table_counts"]["current_address_objects"] == 2, report
    assert report["table_counts"]["current_houses"] == 1, report
    assert report["checks"]["sqlite_integrity"] == "ok", report
    assert output.is_file() and output.stat().st_size > 0
    print("PASS: synthetic GAR XML archive built and checked.")
