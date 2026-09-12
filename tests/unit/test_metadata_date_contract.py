import csv
import json
import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import build


BASE = {
    "quiz_id": "a1-meta",
    "level": "A1",
    "title": "Metadata",
    "description": "Metadata test.",
    "quiz_category": "Grammar",
    "quiz_tags": "Grammar,A1",
    "version": "1",
    "status": "published",
    "question_number": "1",
    "question_text": "Choose one.",
    "question_category": "Grammar",
    "question_tags": "Grammar,A1",
    "explanation": "Choose the correct option.",
    "correct_index": "1",
    "answer_1": "A",
    "answer_2": "B",
}


class MetadataDateContractTests(unittest.TestCase):
    def test_valid_dates_validate_cleanly(self):
        row = dict(BASE, date_added="2026-09-01T00:00:00Z", date_updated="2026-09-08T00:00:00Z")
        errors, warnings, _ = build.validate([row])
        self.assertEqual(errors, [])
        self.assertEqual([w.rule_id for w in warnings], [])

    def test_invalid_dates_warn(self):
        row = dict(BASE, date_added="not-a-date", date_updated="also-bad")
        errors, warnings, _ = build.validate([row])
        self.assertEqual(errors, [])
        self.assertEqual({w.rule_id for w in warnings}, {"V-H1", "V-H2"})

    def test_latest_source_metadata_populates_manifest_date(self):
        rows = [
            dict(BASE, date_added="2026-09-01T00:00:00Z", date_updated="2026-09-04T00:00:00Z"),
            dict(BASE, question_number="2", question_text="Second.", date_added="2026-09-02T00:00:00Z", date_updated="2026-09-07T12:00:00Z"),
        ]
        errors, _, quizzes = build.validate(rows)
        self.assertEqual(errors, [])
        with tempfile.TemporaryDirectory() as td:
            paths, by_level = build.build_site(quizzes, td)
            manifest = json.loads((Path(td) / "a1" / "quizzes.json").read_text())
            self.assertEqual(manifest[0]["date"], "2026-09-07T12:00:00Z")

    def test_no_source_date_does_not_invent_placeholder(self):
        errors, _, quizzes = build.validate([dict(BASE)])
        self.assertEqual(errors, [])
        with tempfile.TemporaryDirectory() as td:
            build.build_site(quizzes, td)
            manifest = json.loads((Path(td) / "a1" / "quizzes.json").read_text())
            self.assertNotIn("date", manifest[0])
            self.assertNotIn("2026-09-05", (Path(td) / "a1" / "quizzes.json").read_text())


if __name__ == "__main__":
    unittest.main()
