import json
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)
import build


BASE = {
    "quiz_id": "a1-inc", "level": "A1", "title": "Incremental",
    "description": "D", "quiz_category": "Grammar", "quiz_tags": "grammar",
    "version": "1", "status": "published", "question_number": "1",
    "question_text": "Choose one.", "question_category": "", "question_tags": "",
    "explanation": "Because it is correct.", "correct_index": "1",
    "answer_1": "A", "answer_2": "B",
}

OTHER = dict(BASE, quiz_id="a1-other")


class TestIncrementalBuildArtifacts(unittest.TestCase):
    """Agent 57: build_site() must skip rewriting files whose content is
    already byte-identical on disk, and must never skip a file whose
    content actually changed."""

    def _quizzes_for(self, rows):
        _, _, quizzes = build.validate(rows)
        return quizzes

    def test_unchanged_rebuild_writes_nothing(self):
        quizzes = self._quizzes_for([dict(BASE), dict(OTHER)])
        with tempfile.TemporaryDirectory() as td:
            stats1 = {}
            build.build_site(quizzes, td, stats=stats1)
            self.assertEqual(stats1["unchanged"], 0)
            self.assertGreater(stats1["written"], 0)

            paths = [Path(td) / "grammar" / "a1" / "a1-inc.json",
                     Path(td) / "grammar" / "a1" / "a1-other.json",
                     Path(td) / "a1" / "quizzes.json"]
            mtimes_before = {p: p.stat().st_mtime_ns for p in paths}
            time.sleep(0.01)

            stats2 = {}
            build.build_site(quizzes, td, stats=stats2)
            self.assertEqual(stats2["written"], 0,
                              "no source change: nothing should be rewritten")
            self.assertEqual(stats2["unchanged"], stats1["written"])
            for p in paths:
                self.assertEqual(p.stat().st_mtime_ns, mtimes_before[p],
                                  f"{p} was rewritten even though content did not change")

    def test_editing_one_quiz_only_rewrites_that_quiz(self):
        quizzes_v1 = self._quizzes_for([dict(BASE), dict(OTHER)])
        with tempfile.TemporaryDirectory() as td:
            build.build_site(quizzes_v1, td)
            other_path = Path(td) / "grammar" / "a1" / "a1-other.json"
            edited_path = Path(td) / "grammar" / "a1" / "a1-inc.json"
            other_before = other_path.read_bytes()
            time.sleep(0.01)
            other_mtime_before = other_path.stat().st_mtime_ns

            edited_row = dict(BASE, explanation="Because it is correct now.")
            quizzes_v2 = self._quizzes_for([edited_row, dict(OTHER)])
            stats = {}
            build.build_site(quizzes_v2, td, stats=stats)

            self.assertEqual(other_path.read_bytes(), other_before)
            self.assertEqual(other_path.stat().st_mtime_ns, other_mtime_before,
                              "untouched quiz's file was rewritten")
            self.assertIn("Because it is correct now.",
                           edited_path.read_text(encoding="utf-8"))
            # exactly the edited quiz file changed among the two quiz docs;
            # the level manifest may or may not change depending on whether
            # any manifest-visible field moved (it didn't here), so only
            # assert on what's guaranteed:
            self.assertGreaterEqual(stats["written"], 1)

    def test_write_text_if_changed_reports_accurately(self):
        with tempfile.TemporaryDirectory() as td:
            path = os.path.join(td, "f.json")
            self.assertTrue(build._write_text_if_changed(path, "a"))
            self.assertFalse(build._write_text_if_changed(path, "a"))
            self.assertTrue(build._write_text_if_changed(path, "b"))
            self.assertEqual(Path(path).read_text(), "b")

    def test_build_site_without_stats_arg_still_works(self):
        # Back-compat: existing 2-arg callers (tests, other agents) must
        # keep working unchanged.
        quizzes = self._quizzes_for([dict(BASE)])
        with tempfile.TemporaryDirectory() as td:
            written_files, by_level = build.build_site(quizzes, td)
            self.assertTrue(written_files)
            self.assertIn("a1", by_level)


if __name__ == "__main__":
    unittest.main()
