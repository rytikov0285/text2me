import hashlib, os, sys, tempfile, unittest, zipfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fias_connector as connector

class FiasConnectorTests(unittest.TestCase):
    def test_extracts_only_official_release_link(self):
        html='<a href="https://evil.example/7707329152-fias/data.zip">bad</a><a href="https://fias.nalog.ru/opendata/7707329152-fias/data-23102026-structure.zip">good</a>'
        self.assertEqual(connector.extract_release_url(html),"https://fias.nalog.ru/opendata/7707329152-fias/data-23102026-structure.zip")
    def test_rejects_non_dataset_path_on_official_host(self):
        html='<a href="https://fias.nalog.ru/unrelated/7707329152-fias.zip">bad</a>'
        with self.assertRaises(ValueError): connector.extract_release_url(html)
    def test_rejects_page_without_release(self):
        with self.assertRaises(ValueError): connector.extract_release_url('<a href="https://example.com/file.zip">file</a>')
    def test_extracts_date_metadata(self):
        text="Дата последнего внесения изменений 20.10.2026 Дата актуальности 21.10.2026"
        self.assertEqual(connector.extract_date_after_label(text,"Дата последнего внесения изменений"),"20.10.2026")
        self.assertEqual(connector.extract_date_after_label(text,"Дата актуальности"),"21.10.2026")
    def test_validates_xml_zip(self):
        with tempfile.TemporaryDirectory() as directory:
            path=os.path.join(directory,"sample.zip")
            with zipfile.ZipFile(path,"w",zipfile.ZIP_DEFLATED) as archive: archive.writestr("AS_ADDR_OBJ.XML","<root><item/></root>")
            payload=Path(path).read_bytes(); result=connector.validate_archive_file(path,len(payload),hashlib.sha256(payload).hexdigest())
            self.assertEqual(result["xml_members"],1); self.assertEqual(result["archive_crc_validation"],"passed")
    def test_registry_has_required_fields_and_disables_paid_apis(self):
        import json
        registry_path = Path(__file__).resolve().parent / "sources.json"
        registry = json.loads(registry_path.read_text(encoding="utf-8"))
        self.assertFalse(registry["policy"]["paid_apis_allowed_initially"])
        required = set(registry["required_fields"])
        self.assertGreaterEqual(len(registry["sources"]), 10)
        for source in registry["sources"]:
            self.assertTrue(required.issubset(source.keys()), source.get("id"))
    def test_rejects_zip_without_xml(self):
        with tempfile.TemporaryDirectory() as directory:
            path=os.path.join(directory,"sample.zip")
            with zipfile.ZipFile(path,"w",zipfile.ZIP_DEFLATED) as archive: archive.writestr("README.txt","not data")
            payload=Path(path).read_bytes()
            with self.assertRaisesRegex(ValueError,"no XML"): connector.validate_archive_file(path,len(payload),hashlib.sha256(payload).hexdigest())
if __name__=="__main__": unittest.main()
