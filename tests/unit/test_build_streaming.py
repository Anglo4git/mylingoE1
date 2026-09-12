import csv
import inspect
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)
import build


FIELDS = ["quiz_id", "level", "title", "description", "quiz_category", "quiz_tags",
          "version", "status", "question_number", "question_text",
          "question_category", "question_tags", "explanation", "correct_index",
          "answer_1", "answer_2"]


def _row(quiz_id, qnum):
    return {
        "quiz_id": quiz_id, "level": "A1", "title": "T", "description": "D",
        "quiz_category": "Grammar", "quiz_tags": "grammar", "version": "1",
        "status": "published", "question_number": str(qnum),
        "question_text": f"Q{qnum} for {quiz_id}", "question_category": "",
        "question_tags": "", "explanation": "Because reasons apply here.",
        "correct_index": "1", "answer_1": "yes", "answer_2": "no",
    }


class TestBuildStreamingIngestion(unittest.TestCase):
    """Agent 56: build.py's CLI path streams CSV rows instead of holding the
    whole master source as a list, so validate()'s `quizzes` grouping is the
    only full-dataset structure resident in memory."""

    def _write_csv(self, rows):
        f = tempfile.NamedTemporaryFile("w", newline="", suffix=".csv", delete=False)
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
        f.close()
        return f.name

    def test_iter_rows_streaming_is_a_generator_not_a_list(self):
        path = self._write_csv([_row("a1-001", 1)])
        try:
            result = build.iter_rows_streaming(path)
            self.assertTrue(inspect.isgenerator(result))
        finally:
            os.unlink(path)

    def test_streamed_rows_validate_identically_to_read_rows(self):
        rows = [_row("a1-001", 1), _row("a1-001", 2), _row("a1-002", 1)]
        path = self._write_csv(rows)
        try:
            list_errors, list_warnings, list_quizzes = build.validate(build.read_rows(path))
            counted = build._CountingIter(build.iter_rows_streaming(path))
            stream_errors, stream_warnings, stream_quizzes = build.validate(counted)

            self.assertEqual([str(e) for e in list_errors], [str(e) for e in stream_errors])
            self.assertEqual([str(w) for w in list_warnings], [str(w) for w in stream_warnings])
            self.assertEqual(set(list_quizzes.keys()), set(stream_quizzes.keys()))
            self.assertEqual(counted.count, 3)
        finally:
            os.unlink(path)

    def test_validate_accepts_empty_generator(self):
        # Previously `bool(rows) and "date_added" in rows[0]` assumed a
        # sequence; an empty streamed source must not raise IndexError.
        errors, warnings, quizzes = build.validate(iter([]))
        self.assertEqual(errors, [])
        self.assertEqual(quizzes, {})

    def test_counting_iter_tracks_single_pass_length(self):
        counted = build._CountingIter(iter(range(7)))
        consumed = list(counted)
        self.assertEqual(len(consumed), 7)
        self.assertEqual(counted.count, 7)


if __name__ == "__main__":
    unittest.main()
