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
searcher = Path(__file__).with_name("search-gar-index.py")
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
    search = subprocess.run([sys.executable, str(searcher), str(output), "Тестовая"],
                            capture_output=True, text=True, encoding="utf-8", check=True)
    search_result = json.loads(search.stdout)
    assert search_result["count"] >= 1 and search_result["results"][0]["name"] == "Тестовая область", search_result
    house_search = subprocess.run([sys.executable, str(searcher), str(output), "12", "--include-houses"],
                                  capture_output=True, text=True, encoding="utf-8", check=True)
    house_result = json.loads(house_search.stdout)
    assert any(row["kind"] == "house" and row["house_number"] == "12А" for row in house_result["results"]), house_result
    os.environ["GAR_DATABASE_PATH"] = str(output)
    import importlib.util
    api_file = Path(__file__).resolve().parents[1] / "api" / "gar_api.py"
    spec = importlib.util.spec_from_file_location("text2me_gar_api_test", api_file)
    api = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(api)
    api_result = api.search("Тестовая", 10, False)
    assert api_result["count"] >= 1 and api_result["results"][0]["name"] == "Тестовая область", api_result
    api_house_result = api.search("12А", 10, True)
    assert any(row["kind"] == "house" and row["house_number"] == "12А" for row in api_house_result["results"]), api_house_result
    assert api.DB_PATH == output, "API must use the configured SQLite database path"
    before = output.read_bytes()
    broken = root / "broken.zip"
    with zipfile.ZipFile(broken, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("GAR/UNRELATED.xml", "<ROOT/>")
    failed = subprocess.run([sys.executable, str(builder), str(broken), str(output)],
                            capture_output=True, text=True, encoding="utf-8")
    assert failed.returncode != 0, "Builder must reject an archive missing required GAR tables."
    assert output.read_bytes() == before, "Failed update must preserve the last successful database."
    print("PASS: synthetic GAR build, CLI/API address search, and failed-update preservation.")
