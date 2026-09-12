import json
import shutil
import tempfile
import unittest
from pathlib import Path

import build


def _write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def _quiz(question_count, padding=""):
    return {
        "id": "a1-001",
        "title": "Sample",
        "level": "A1",
        "version": 1,
        "padding": padding,
        "questions": [
            {
                "question": f"Q{i}?",
                "answers": ["correct", "wrong"],
                "correctIndex": 1,
            }
            for i in range(question_count)
        ],
    }


class ScaleReleaseGateBudgetTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.mkdtemp(prefix="mylingo-scale-gate-")
        self.addCleanup(shutil.rmtree, self.tmpdir, ignore_errors=True)
        self.site = Path(self.tmpdir)

    def _make_normal_site(self):
        _write_json(self.site / "a1" / "quizzes.json", [{"id": "a1-001", "file": "grammar/a1/a1-001.json"}])
        _write_json(self.site / "grammar" / "a1" / "a1-001.json", _quiz(5))

    def test_normal_sized_site_passes_with_no_findings(self):
        self._make_normal_site()
        errors, warnings = build.check_scale_budgets(self.site)
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])

    def test_quiz_file_with_too_many_questions_is_blocked(self):
        self._make_normal_site()
        _write_json(
            self.site / "grammar" / "a1" / "a1-001.json",
            _quiz(build.MAX_QUESTIONS_PER_QUIZ_FILE + 1),
        )
        errors, warnings = build.check_scale_budgets(self.site)
        self.assertTrue(any("exceeds per-file budget" in e for e in errors))

    def test_oversized_quiz_file_bytes_is_blocked(self):
        self._make_normal_site()
        _write_json(
            self.site / "grammar" / "a1" / "a1-001.json",
            _quiz(5, padding="x" * (build.MAX_QUIZ_FILE_BYTES + 1)),
        )
        errors, warnings = build.check_scale_budgets(self.site)
        self.assertTrue(any("exceeds quiz-file budget" in e for e in errors))

    def test_oversized_manifest_is_blocked(self):
        self._make_normal_site()
        manifest_path = self.site / "a1" / "quizzes.json"
        manifest_path.write_text("x" * (build.MAX_MANIFEST_FILE_BYTES + 1), encoding="utf-8")
        errors, warnings = build.check_scale_budgets(self.site)
        self.assertTrue(any("exceeds" in e and "manifest budget" in e for e in errors))

    def test_missing_site_directory_is_a_no_op_not_a_crash(self):
        errors, warnings = build.check_scale_budgets(self.site / "does-not-exist")
        self.assertEqual(errors, [])
        self.assertEqual(warnings, [])


if __name__ == "__main__":
    unittest.main()
