import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import build


def row(items, order):
    return {
        "quiz_id": "b1-ranking",
        "level": "B1",
        "title": "Ranking",
        "description": "Rank these.",
        "quiz_category": "Writing",
        "quiz_tags": "B1,Writing",
        "version": "1",
        "status": "published",
        "question_number": "1",
        "question_text": "Put these in order.",
        "question_category": "Writing",
        "question_tags": "B1,Writing",
        "explanation": "Order the items by the rule.",
        "correct_index": "1",
        "answer_1": "A",
        "answer_2": "B",
        "items": __import__("json").dumps(items),
        "correct_order": __import__("json").dumps(order),
        "question_type": "ranking",
    }


class RankingValidationSemanticsTests(unittest.TestCase):
    def errors_for(self, r):
        errors, _, _ = build.validate([r])
        return [e for e in errors if e.rule_id == "V-R4"]

    def test_valid_permutation_passes(self):
        self.assertEqual(self.errors_for(row(["A", "B", "C"], ["C", "A", "B"])), [])

    def test_duplicate_item_fails(self):
        self.assertTrue(self.errors_for(row(["A", "A", "C"], ["A", "C", "A"])))

    def test_missing_item_fails(self):
        self.assertTrue(self.errors_for(row(["A", "B", "C"], ["A", "B", "D"])))

    def test_extra_item_fails(self):
        self.assertTrue(self.errors_for(row(["A", "B", "C"], ["A", "B", "C", "D"])))

    def test_normalized_duplicates_fail(self):
        self.assertTrue(self.errors_for(row(["A", " A ", "C"], ["A", " A ", "C"])))

    def test_case_and_whitespace_permutation_passes(self):
        self.assertEqual(self.errors_for(row(["A", "Beta", "Gamma"], [" gamma ", "a", "BETA"])), [])

    def test_empty_correct_order_fails(self):
        self.assertTrue(self.errors_for(row(["A", "B"], [])))


if __name__ == "__main__":
    unittest.main()
