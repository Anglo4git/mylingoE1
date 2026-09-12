import shutil
import sys
import tempfile
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import offline_packs

SITE = ROOT / "site"


class TestIncrementalOfflinePackArtifacts(unittest.TestCase):
    """Continuation of Agent 57 (build.py's incremental build_site): applies
    the same skip-if-unchanged approach to offline_packs.py, which
    previously rewrote packs.json, core-manifest.json, and every pack ZIP
    unconditionally on every build regardless of whether anything backing
    them had actually changed."""

    def test_unchanged_rebuild_writes_nothing(self):
        # Prime: make sure every artifact exists and reflects current site/.
        offline_packs.write_offline_packs(SITE)

        watched = [
            SITE / "offline" / "packs.json",
            SITE / "offline" / "core-manifest.json",
            SITE / "offline" / "packs" / "core.zip",
            SITE / "offline" / "packs" / "a1.zip",
        ]
        mtimes_before = {p: p.stat().st_mtime_ns for p in watched}
        bytes_before = {p: p.read_bytes() for p in watched}
        time.sleep(0.01)

        stats = {}
        offline_packs.write_offline_packs(SITE, stats=stats)

        self.assertEqual(stats["written"], 0,
                          "no source change: nothing should be rewritten")
        self.assertGreater(stats["unchanged"], 0)
        for p in watched:
            self.assertEqual(p.stat().st_mtime_ns, mtimes_before[p],
                              f"{p} was rewritten even though content did not change")
            self.assertEqual(p.read_bytes(), bytes_before[p])

    def test_editing_one_levels_content_only_touches_that_pack_and_core(self):
        offline_packs.write_offline_packs(SITE)
        b1_zip = SITE / "offline" / "packs" / "b1.zip"
        a1_zip = SITE / "offline" / "packs" / "a1.zip"
        a1_before = a1_zip.read_bytes()
        time.sleep(0.01)
        a1_mtime_before = a1_zip.stat().st_mtime_ns

        manifest_path = SITE / "b1" / "quizzes.json"
        original = manifest_path.read_bytes()
        try:
            manifest_path.write_bytes(original + b"\n")  # trailing newline: harmless, still valid file bytes differ
            stats = {}
            offline_packs.write_offline_packs(SITE, stats=stats)
            self.assertGreaterEqual(stats["written"], 1)
            self.assertEqual(a1_zip.read_bytes(), a1_before)
            self.assertEqual(a1_zip.stat().st_mtime_ns, a1_mtime_before,
                              "unrelated pack ZIP was rewritten")
        finally:
            manifest_path.write_bytes(original)
            offline_packs.write_offline_packs(SITE)

    def test_write_bytes_if_changed_reports_accurately(self):
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "f.bin"
            self.assertTrue(offline_packs._write_bytes_if_changed(path, b"a"))
            self.assertFalse(offline_packs._write_bytes_if_changed(path, b"a"))
            self.assertTrue(offline_packs._write_bytes_if_changed(path, b"b"))
            self.assertEqual(path.read_bytes(), b"b")

    def test_write_offline_packs_without_stats_arg_still_works(self):
        # Back-compat: existing 1-arg callers (tests, build.py's pre-Agent-58
        # call sites) must keep working unchanged.
        index_path, records = offline_packs.write_offline_packs(SITE)
        self.assertTrue(index_path.is_file())
        self.assertTrue(records)

    def test_write_core_manifest_without_stats_arg_still_works(self):
        path = offline_packs.write_core_manifest(SITE)
        self.assertTrue(path.is_file())


if __name__ == "__main__":
    unittest.main()
