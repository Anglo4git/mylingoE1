#!/usr/bin/env python3
"""
Unit tests for generation/promote.py.

Run: python3 -m unittest generation.test_promote -v
"""

import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import promote  # noqa: E402

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import build as build_module  # noqa: E402


def quiz_rows(quiz_id, level, title, category, status, n_questions,
              version="1", bad_row=False):
    rows = []
    for i in range(1, n_questions + 1):
        row = {
            "quiz_id": quiz_id, "level": level, "title": title,
            "description": f"Practice {title}.", "quiz_category": category,
            "quiz_tags": f"{category},{level}", "version": version, "status": status,
            "question_number": str(i), "question_text": f"Question {i}?",
            "question_category": category, "question_tags": f"{category},{level}",
            "explanation": "Because grammar." if not (bad_row and i == 1) else "",
            "correct_index": "1", "answer_1": "a", "answer_2": "b",
        }
        for col in build_module.ANSWER_COLS[2:]:
            row[col] = ""
        rows.append(row)
    return rows


class TestListPromotable(unittest.TestCase):
    def test_list_only_returns_promotable_statuses(self):
        rows = (quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5) +
                quiz_rows("a1-002", "A1", "Topic B", "Grammar", "published", 5) +
                quiz_rows("a1-003", "A1", "Topic C", "Grammar", "retired", 5))
        items = promote.list_promotable(rows)
        ids = {i["quiz_id"] for i in items}
        self.assertEqual(ids, {"a1-001"})


class TestPromote(unittest.TestCase):
    def test_promote_by_quiz_id(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "promoted")
        self.assertTrue(all(r["status"] == "published" for r in new_rows))

    def test_skip_already_published(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "published", 5)
        _, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "skipped")
        self.assertIn("published", outcomes[0].reason)

    def test_skip_unknown_quiz_id(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        _, outcomes = promote.promote(rows, quiz_ids=["a1-999"])
        self.assertEqual(outcomes[0].action, "skipped")
        self.assertIn("no such quiz_id", outcomes[0].reason)

    def test_blocked_when_promotion_would_fail_validation(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5, bad_row=True)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "blocked")
        # rows must be left untouched (still draft) since promotion was blocked
        self.assertTrue(all(r["status"] == "draft" for r in new_rows))

    def test_good_quiz_not_blocked_by_unrelated_bad_quiz(self):
        good = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        bad = quiz_rows("a1-002", "A1", "Topic B", "Grammar", "draft", 5, bad_row=True)
        new_rows, outcomes = promote.promote(good + bad, quiz_ids=["a1-001", "a1-002"])
        by_id = {o.quiz_id: o.action for o in outcomes}
        self.assertEqual(by_id["a1-001"], "promoted")
        self.assertEqual(by_id["a1-002"], "blocked")
        a1001_rows = [r for r in new_rows if r["quiz_id"] == "a1-001"]
        a1002_rows = [r for r in new_rows if r["quiz_id"] == "a1-002"]
        self.assertTrue(all(r["status"] == "published" for r in a1001_rows))
        self.assertTrue(all(r["status"] == "draft" for r in a1002_rows))

    def test_filter_by_level_and_category(self):
        rows = (quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5) +
                quiz_rows("a1-002", "A1", "Topic B", "Vocabulary", "draft", 5) +
                quiz_rows("b1-001", "B1", "Topic C", "Grammar", "draft", 5))
        _, outcomes = promote.promote(rows, level="A1", category="Grammar")
        promoted = {o.quiz_id for o in outcomes if o.action == "promoted"}
        self.assertEqual(promoted, {"a1-001"})

    def test_bump_version(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5, version="1")
        new_rows, _ = promote.promote(rows, quiz_ids=["a1-001"], bump_version=True)
        self.assertTrue(all(r["version"] == "2" for r in new_rows))

    def test_no_bump_by_default(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5, version="1")
        new_rows, _ = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertTrue(all(r["version"] == "1" for r in new_rows))

    def test_promoted_output_passes_build_validate(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        errors, warnings, _ = build_module.validate(new_rows)
        self.assertEqual(errors, [])

    def test_idempotent_second_promotion_is_a_noop_skip(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        once, _ = promote.promote(rows, quiz_ids=["a1-001"])
        twice, outcomes = promote.promote(once, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "skipped")
        self.assertEqual(once, twice)


class TestContentSchemaV2Dates(unittest.TestCase):
    """Content Schema v2 (07_CONTENT_SCHEMA_V2.md): date_updated stamping.

    `status` is a content-bearing field, so a quiz that is actually
    promoted gets `date_updated` stamped; anything skipped or blocked does
    not.
    """

    def test_promoted_rows_get_a_valid_iso_date_updated(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "promoted")
        stamps = {r["date_updated"] for r in new_rows}
        self.assertEqual(len(stamps), 1)
        stamp = next(iter(stamps))
        self.assertTrue(build_module._is_iso_datetime(stamp))

    def test_skipped_quiz_is_not_stamped(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "published", 5)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "skipped")
        self.assertTrue(all(r.get("date_updated", "") == "" for r in new_rows))

    def test_blocked_quiz_is_not_stamped(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5, bad_row=True)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "blocked")
        self.assertTrue(all(r.get("date_updated", "") == "" for r in new_rows))

    def test_only_the_promoted_quiz_is_stamped(self):
        good = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        untouched = quiz_rows("a1-002", "A1", "Topic B", "Grammar", "published", 5)
        new_rows, outcomes = promote.promote(good + untouched, quiz_ids=["a1-001"])
        a1001_rows = [r for r in new_rows if r["quiz_id"] == "a1-001"]
        a1002_rows = [r for r in new_rows if r["quiz_id"] == "a1-002"]
        self.assertTrue(all(r.get("date_updated") for r in a1001_rows))
        self.assertTrue(all(r.get("date_updated", "") == "" for r in a1002_rows))

    def test_existing_date_added_survives_the_write_master_csv_roundtrip(self):
        # Regression test: write_master_csv() used to hardcode a 23-column
        # fieldname list with extrasaction="ignore", which silently
        # dropped date_added/date_updated on any row written back out.
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        for r in rows:
            r["date_added"] = "2026-01-01T00:00:00+00:00"
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "promoted")
        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = os.path.join(tmpdir, "master_source.csv")
            promote.write_master_csv(out_path, new_rows)
            roundtripped = build_module.read_rows(out_path)
        self.assertTrue(all(r["date_added"] == "2026-01-01T00:00:00+00:00"
                             for r in roundtripped))
        self.assertTrue(all(r["date_updated"] for r in roundtripped))

    def test_promoted_output_has_no_date_format_warnings(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        new_rows, _ = promote.promote(rows, quiz_ids=["a1-001"])
        errors, warnings, _ = build_module.validate(new_rows)
        self.assertEqual(errors, [])
        self.assertEqual([w for w in warnings if w.rule_id in ("V-H1", "V-H2")], [])


class TestAgent77ContentQAGate(unittest.TestCase):
    """Agent 77 — promotion also enforces content_qa.py's error-level
    (safety/correctness) checks, not just build.py's structural validate().
    """

    def _mismatch_claim_rows(self, quiz_id="a1-777"):
        # Explanation explicitly claims "b" is correct, but correct_index
        # marks "a" as correct (CQ-X01). This is NOT a build.py structural
        # error — build_module.validate() has no notion of explanation
        # content — so it proves the new gate adds real coverage.
        rows = []
        for i in range(1, 6):
            rows.append({
                "quiz_id": quiz_id, "level": "A1", "title": "Injected Mismatch",
                "description": "Practice.", "quiz_category": "Grammar",
                "quiz_tags": "Grammar,A1", "version": "1", "status": "draft",
                "question_number": str(i), "question_text": f"Choose correctly for item {i}.",
                "question_category": "Grammar", "question_tags": "Grammar,A1",
                "explanation": "The correct answer is b, not a.",
                "correct_index": "1", "answer_1": "a", "answer_2": "b",
            })
            for col in build_module.ANSWER_COLS[2:]:
                rows[-1][col] = ""
        return rows

    def test_bad_fixture_content_defect_is_rejected(self):
        rows = self._mismatch_claim_rows()
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-777"])
        self.assertEqual(outcomes[0].action, "blocked")
        self.assertIn("CQ-X01", outcomes[0].reason)
        self.assertTrue(all(r["status"] == "draft" for r in new_rows))

    def test_valid_fixture_is_still_accepted(self):
        rows = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        new_rows, outcomes = promote.promote(rows, quiz_ids=["a1-001"])
        self.assertEqual(outcomes[0].action, "promoted")
        self.assertTrue(all(r["status"] == "published" for r in new_rows))

    def test_skip_content_qa_bypasses_the_gate(self):
        rows = self._mismatch_claim_rows()
        new_rows, outcomes = promote.promote(
            rows, quiz_ids=["a1-777"], enforce_content_qa=False)
        self.assertEqual(outcomes[0].action, "promoted")
        self.assertTrue(all(r["status"] == "published" for r in new_rows))

    def test_content_defect_in_one_quiz_does_not_block_a_clean_quiz(self):
        good = quiz_rows("a1-001", "A1", "Topic A", "Grammar", "draft", 5)
        bad = self._mismatch_claim_rows()
        new_rows, outcomes = promote.promote(good + bad, quiz_ids=["a1-001", "a1-777"])
        by_id = {o.quiz_id: o.action for o in outcomes}
        self.assertEqual(by_id["a1-001"], "promoted")
        self.assertEqual(by_id["a1-777"], "blocked")


if __name__ == "__main__":
    unittest.main()
