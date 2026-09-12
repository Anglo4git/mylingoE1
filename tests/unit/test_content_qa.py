import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)

import content_qa  # noqa: E402


def row(quiz_id="a1-001", level="A1", category="Grammar", qnum="1",
        question="Choose the correct form: She ___ to school every day.",
        explanation="Use -s with he/she/it in the present simple.",
        correct="2", answers=("go", "goes", "going", "gone")):
    data = {
        "quiz_id": quiz_id,
        "level": level,
        "title": "Present Simple",
        "description": "Practice Present Simple.",
        "quiz_category": category,
        "quiz_tags": f"{category},{level}",
        "version": "1",
        "status": "published",
        "question_number": qnum,
        "question_text": question,
        "question_category": category,
        "question_tags": f"{category},{level}",
        "explanation": explanation,
        "correct_index": correct,
    }
    for i in range(1, 10):
        data[f"answer_{i}"] = answers[i - 1] if i <= len(answers) else ""
    return data


class TestContentQA(unittest.TestCase):
    def test_clean_row_has_no_issues(self):
        report = content_qa.audit_rows([row()])
        self.assertEqual(report["summary"]["errors"], 0)
        self.assertEqual(report["summary"]["warnings"], 1)  # underfilled starter quiz
        self.assertEqual(report["summary"]["quality_score"], 95)

    def test_duplicate_answers_are_error(self):
        bad = row(answers=("go", "go", "going", "gone"))
        report = content_qa.audit_rows([bad])
        self.assertIn("CQ-A03", {i["code"] for i in report["issues"]})
        self.assertEqual(report["summary"]["errors"], 1)

    def test_explicit_explanation_claim_must_match(self):
        bad = row(explanation='The correct answer is "go" because it uses the base form.')
        report = content_qa.audit_rows([bad])
        self.assertIn("CQ-X01", {i["code"] for i in report["issues"]})

    def test_same_quiz_duplicate_question_is_error(self):
        report = content_qa.audit_rows([row(), row(qnum="2")])
        issue = next(i for i in report["issues"] if i["code"] == "CQ-D01")
        self.assertEqual(issue["severity"], "error")

    def test_cross_quiz_duplicate_question_is_warning(self):
        report = content_qa.audit_rows([row(), row(quiz_id="a1-002")])
        issue = next(i for i in report["issues"] if i["code"] == "CQ-D01")
        self.assertEqual(issue["severity"], "warning")

    def test_strict_mode_promotes_underfilled_quiz(self):
        report = content_qa.audit_rows([row()], strict=True)
        issue = next(i for i in report["issues"] if i["code"] == "CQ-B01")
        self.assertEqual(issue["severity"], "error")

    def test_executable_content_is_blocked(self):
        bad = row(question='<script>alert(1)</script> Choose an answer.')
        report = content_qa.audit_rows([bad])
        self.assertIn("CQ-S05", {i["code"] for i in report["issues"]})
        self.assertGreaterEqual(report["summary"]["errors"], 1)

    def test_correct_answer_position_bias(self):
        rows = []
        for i in range(5):
            rows.append(row(quiz_id="a1-001", qnum=str(i + 1), question=f"Choose item {i} correctly?"))
        report = content_qa.audit_rows(rows)
        self.assertIn("CQ-B05", {i["code"] for i in report["issues"]})

    def test_quality_score_does_not_collapse_for_repeated_same_warning(self):
        rows = [row(quiz_id=f"a1-{i:03d}") for i in range(1, 61)]
        report = content_qa.audit_rows(rows)
        self.assertGreaterEqual(report["summary"]["warnings"], 60)
        self.assertGreater(report["summary"]["quality_score"], 0)

    # --- Content Schema v2 (07_CONTENT_SCHEMA_V2.md) ---

    def test_v1_rows_without_date_columns_are_unaffected(self):
        report = content_qa.audit_rows([row()])
        codes = {i["code"] for i in report["issues"]}
        self.assertFalse(codes & {"CQ-M01", "CQ-M02", "CQ-M03"})

    def test_unknown_tag_flags_cq_t01(self):
        bad = row()
        bad["quiz_tags"] = "Grammar,A1,Astrology"
        report = content_qa.audit_rows([bad])
        issue = next(i for i in report["issues"] if i["code"] == "CQ-T01")
        self.assertEqual(issue["severity"], "warning")
        self.assertIn("Astrology", issue["message"])

    def test_known_tags_do_not_flag_cq_t01(self):
        report = content_qa.audit_rows([row()])
        self.assertNotIn("CQ-T01", {i["code"] for i in report["issues"]})

    def test_present_but_empty_date_column_is_cq_m01(self):
        r = row()
        r["date_added"] = ""
        report = content_qa.audit_rows([r])
        self.assertIn("CQ-M01", {i["code"] for i in report["issues"]})

    def test_malformed_date_is_cq_m02_error(self):
        r = row()
        r["date_added"] = "not-a-date"
        report = content_qa.audit_rows([r])
        issue = next(i for i in report["issues"] if i["code"] == "CQ-M02")
        self.assertEqual(issue["severity"], "error")

    def test_valid_dates_produce_no_metadata_issues(self):
        r = row()
        r["date_added"] = "2026-01-01T00:00:00Z"
        r["date_updated"] = "2026-02-01T00:00:00Z"
        report = content_qa.audit_rows([r])
        codes = {i["code"] for i in report["issues"]}
        self.assertFalse(codes & {"CQ-M01", "CQ-M02", "CQ-M03"})

    def test_date_updated_before_date_added_is_cq_m03(self):
        r = row()
        r["date_added"] = "2026-02-01T00:00:00Z"
        r["date_updated"] = "2026-01-01T00:00:00Z"
        report = content_qa.audit_rows([r])
        issue = next(i for i in report["issues"] if i["code"] == "CQ-M03")
        self.assertEqual(issue["severity"], "warning")


if __name__ == "__main__":
    unittest.main()

    def test_large_bucket_near_duplicate_detection_not_disabled(self):
        rows = []
        for i in range(2601):
            rows.append(row(quiz_id=f"a1-{i:04d}", qnum="1", question=f"Choose the correct form for learner sentence token {i} alpha beta gamma delta?"))
        rows[2600]["question_text"] = rows[0]["question_text"]
        rows[2600]["quiz_id"] = "a1-9999"
        report = content_qa.audit_rows(rows)
        self.assertIn("CQ-D01", {i["code"] for i in report["issues"]})

    def test_iter_csv_rows_is_chunked(self):
        import tempfile, csv
        with tempfile.NamedTemporaryFile("w", newline="", suffix=".csv", delete=False) as f:
            writer = csv.DictWriter(f, fieldnames=["quiz_id"])
            writer.writeheader(); writer.writerows([{"quiz_id": str(i)} for i in range(5)])
            name = f.name
        try:
            chunks = list(content_qa.iter_csv_rows(name, chunk_size=2))
            self.assertEqual([len(c) for c in chunks], [2,2,1])
        finally:
            os.unlink(name)

class TestContentQADiversity(unittest.TestCase):
    def test_repeated_question_frame_is_reported_across_quizzes(self):
        rows = [
            row(quiz_id=f"a1-{i:03d}", question=f"Choose the correct form: She learner{i} ___ to school every day?")
            for i in range(1, 5)
        ]
        report = content_qa.audit_rows(rows)
        issue = next(i for i in report["issues"] if i["code"] == "CQ-D04")
        self.assertEqual(issue["severity"], "warning")
        self.assertIn("4 times across 4 quizzes", issue["message"])

    def test_diversity_frame_does_not_flag_three_quizzes(self):
        rows = [row(quiz_id=f"a1-{i:03d}", question=f"Choose the correct form: She learner{i} ___ to school every day?") for i in range(1, 4)]
        report = content_qa.audit_rows(rows)
        self.assertNotIn("CQ-D04", {i["code"] for i in report["issues"]})
