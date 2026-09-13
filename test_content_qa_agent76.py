"""Agent 76 — strict QA warning-to-blocking policy regression test.

Injects a deliberate CQ-B05 (answer-position pattern) + CQ-D02 (repeated
explanation) + CQ-C06 (answer-length clue) violation and proves:
  1. Diagnostic mode (default) reports all three but does NOT fail (no errors).
  2. Strict mode promotes all three to errors and fails (report/CLI exit != 0).
"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import content_qa


def _row(quiz_id, qnum, question, explanation, answers, correct_index):
    r = {
        "quiz_id": quiz_id, "level": "A1", "quiz_category": "Grammar",
        "title": "Injected Regression Quiz",
        "question_number": str(qnum), "question_text": question,
        "explanation": explanation, "correct_index": str(correct_index),
    }
    for i in range(1, 10):
        r[f"answer_{i}"] = answers[i - 1] if i <= len(answers) else ""
    return r


def _violating_rows():
    """5 rows in one quiz: correct_index=1 every time (CQ-B05) and a blatant
    correct-answer length clue on every row (CQ-C06). One extra row in a
    *second* quiz reuses the identical explanation, so the same normalized
    explanation is reused 6 times across 2 quizzes — the cross-quiz
    template-drift signal (CQ-D02 "warning"), not the legitimate single-quiz
    reuse case (CQ-D02 "info"), which is intentionally never blocking."""
    explanation = "The first option is correct in this context."
    long_correct = "This is an extremely long and unusually detailed correct answer"
    rows = []
    for i in range(1, 6):
        rows.append(_row(
            "inject-001", i, f"Choose the best answer for item {i}.", explanation,
            [long_correct, "a", "b", "c"], correct_index=1,
        ))
    rows.append(_row(
        "inject-002", 1, "Choose the best answer for a different quiz.", explanation,
        [long_correct, "d", "e", "f"], correct_index=1,
    ))
    return rows


class Agent76StrictBlockingPolicyTests(unittest.TestCase):
    def test_diagnostic_mode_reports_but_does_not_block(self):
        report = content_qa.audit_rows(_violating_rows(), strict=False)
        codes = {(i["code"], i["severity"]) for i in report["issues"]}
        self.assertIn(("CQ-B05", "warning"), codes)
        self.assertIn(("CQ-D02", "warning"), codes)
        self.assertTrue(any(c == "CQ-C06" and s == "warning" for c, s in codes))
        self.assertEqual(report["summary"]["errors"], 0)

    def test_strict_mode_promotes_and_blocks(self):
        report = content_qa.audit_rows(_violating_rows(), strict=True)
        codes = {(i["code"], i["severity"]) for i in report["issues"]}
        self.assertIn(("CQ-B05", "error"), codes)
        self.assertIn(("CQ-D02", "error"), codes)
        self.assertTrue(any(c == "CQ-C06" and s == "error" for c, s in codes))
        self.assertGreater(report["summary"]["errors"], 0)

    def test_legitimate_single_quiz_explanation_reuse_never_blocks(self):
        # Regression guard: a real quiz where every question shares one
        # explanation (a single grammar point) must stay "info" and must
        # never be promoted to error, even under --strict.
        explanation = "Use am with the pronoun I in the present simple."
        rows = [
            _row("legit-001", i, f"I ___ item {i}.", explanation, ["am", "is", "are"], 1)
            for i in range(1, 6)
        ]
        report = content_qa.audit_rows(rows, strict=True)
        codes = {(i["code"], i["severity"]) for i in report["issues"]}
        self.assertIn(("CQ-D02", "info"), codes)
        self.assertFalse(any(c == "CQ-D02" and s == "error" for c, s in codes))

    def test_strict_blocking_codes_policy_is_exhaustive_for_this_injection(self):
        # Guards against a future refactor silently dropping a code from the
        # canonical policy without a test failing here.
        for code in ("CQ-B05", "CQ-C06", "CQ-D02"):
            self.assertIn(code, content_qa.STRICT_BLOCKING_CODES)

    def test_cli_exits_nonzero_in_strict_mode_and_zero_in_diagnostic(self):
        rows = _violating_rows()
        fieldnames = list(rows[0].keys())
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = Path(tmp) / "master_source.csv"
            import csv
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                w = csv.DictWriter(f, fieldnames=fieldnames)
                w.writeheader()
                w.writerows(rows)

            diag = subprocess.run(
                [sys.executable, "content_qa.py", "--input", str(csv_path),
                 "--out-dir", str(Path(tmp) / "qa-diag")],
                cwd=Path(__file__).resolve().parent, capture_output=True, text=True,
            )
            self.assertEqual(diag.returncode, 0, diag.stdout + diag.stderr)

            strict = subprocess.run(
                [sys.executable, "content_qa.py", "--input", str(csv_path),
                 "--out-dir", str(Path(tmp) / "qa-strict"), "--strict"],
                cwd=Path(__file__).resolve().parent, capture_output=True, text=True,
            )
            self.assertNotEqual(strict.returncode, 0, strict.stdout + strict.stderr)


if __name__ == "__main__":
    unittest.main()
