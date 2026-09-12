import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import offline_packs


ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "site"


class OfflineCorePackageIntegrityTests(unittest.TestCase):
    def test_core_manifest_exists_and_is_canonical(self):
        manifest_path = SITE / "offline" / "core-manifest.json"
        self.assertTrue(manifest_path.is_file(), "generated core-manifest.json is missing")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.assertEqual(manifest["schema"], "mylingo.offline-core.v1")
        self.assertEqual(manifest["files"], sorted(set(offline_packs.CORE_FILES)))

    def test_generated_core_zip_matches_manifest_exactly(self):
        index_path, records = offline_packs.write_offline_packs(SITE)
        self.assertTrue(index_path.is_file())
        core = next(record for record in records if record["id"] == "core")
        zip_path = SITE / "offline" / "packs" / "core.zip"
        with ZipFile(zip_path) as zf:
            names = set(zf.namelist())
            payload_names = names - {"PACK_MANIFEST.json"}
            self.assertEqual(payload_names, set(core["files"]))
            pack_manifest = json.loads(zf.read("PACK_MANIFEST.json"))
        self.assertEqual(pack_manifest["files"], core["files"])


    def test_verifier_rejects_extra_core_zip_content(self):
        offline_packs.write_offline_packs(SITE)
        zip_path = SITE / "offline" / "packs" / "core.zip"
        temp_zip = SITE / "offline" / "packs" / "core-extra-test.zip"
        try:
            with ZipFile(zip_path, "r") as source, ZipFile(temp_zip, "w", compression=ZIP_DEFLATED) as target:
                for item in source.infolist():
                    target.writestr(item, source.read(item.filename))
                target.writestr("not-core.txt", b"unexpected")
            zip_path.unlink()
            temp_zip.rename(zip_path)
            errors, _ = offline_packs.verify_offline_packs(SITE)
            self.assertTrue(any("ZIP contains" in e or "exactly match" in e for e in errors), errors)
        finally:
            offline_packs.write_offline_packs(SITE)

    def test_missing_core_runtime_file_does_not_get_silently_omitted(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            skipped = "shared/js/offline-packs-ui.js"
            for rel in offline_packs.CORE_FILES:
                if rel in {"offline/packs.json", "offline/core-manifest.json", skipped}:
                    continue
                path = root / rel
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"x")
            with self.assertRaises(FileNotFoundError):
                offline_packs.write_core_manifest(root)
            # Confirm the expected contract is explicit: a core entry is not
            # allowed to shrink merely because a runtime file is absent.
            self.assertEqual(len(offline_packs.CORE_FILES), len(set(offline_packs.CORE_FILES)))


if __name__ == "__main__":
    unittest.main(verbosity=2)
