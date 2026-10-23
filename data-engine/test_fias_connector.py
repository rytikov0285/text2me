import hashlib, os, sys, tempfile, unittest, zipfile
from unittest import mock
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
    def test_size_preflight_never_falls_back_to_get(self):
        with mock.patch.object(connector.urllib.request, "urlopen", side_effect=TimeoutError("timed out")) as open_url:
            result = connector.inspect_release_size("https://fias.nalog.ru/opendata/7707329152-fias/data.zip")
        self.assertEqual(result["result"], "unavailable")
        self.assertIsNone(result["declared_size_bytes"])
        self.assertIn("no GET fallback", result["note"])
        self.assertEqual(open_url.call_count, 1)
        self.assertEqual(open_url.call_args.args[0].get_method(), "HEAD")

    def test_refuses_archive_above_runner_limit_before_download(self):
        oversized = {"declared_size_bytes": connector.MAX_ARCHIVE_BYTES + 1, "result": "checked"}
        with mock.patch.object(connector, "inspect_release_size", return_value=oversized), \
             mock.patch.object(connector.urllib.request, "urlopen") as open_url:
            with self.assertRaisesRegex(ValueError, "above configured limit"):
                connector.download_and_validate("https://fias.nalog.ru/opendata/7707329152-fias/data.zip")
        open_url.assert_not_called()

    def test_refuses_unknown_archive_size_without_override(self):
        unknown = {"declared_size_bytes": None, "result": "unavailable", "error": "timed out"}
        with mock.patch.dict(os.environ, {"GAR_ALLOW_UNSIZED_ARCHIVE": ""}), \
             mock.patch.object(connector, "inspect_release_size", return_value=unknown), \
             mock.patch.object(connector.urllib.request, "urlopen") as open_url:
            with self.assertRaisesRegex(ValueError, "could not be verified by HEAD"):
                connector.download_and_validate("https://fias.nalog.ru/opendata/7707329152-fias/data.zip")
        open_url.assert_not_called()

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
