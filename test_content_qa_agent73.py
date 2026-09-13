import unittest
from content_qa import audit_rows

BASE = {
    'quiz_id': 'a1-001', 'level': 'A1', 'title': 'T', 'description': 'D',
    'quiz_category': 'Grammar', 'quiz_tags': 'Grammar,A1', 'version': '1',
    'status': 'published', 'question_number': '1',
    'question_text': 'Choose the correct word for it.', 'question_category': 'Grammar',
    'question_tags': 'Grammar,A1', 'explanation': 'This is the correct answer choice.',
    'correct_index': '1', 'answer_1': 'one', 'answer_2': 'two', 'answer_3': 'three', 'answer_4': 'four',
}


def row(quiz_id, qnum, question, answers, correct_index, category='Grammar', level='A1'):
    r = dict(BASE)
    r.update(
        quiz_id=quiz_id, question_number=str(qnum), question_text=question,
        correct_index=str(correct_index), quiz_category=category, level=level,
        quiz_tags=f'{category},{level}', question_category=category, question_tags=f'{category},{level}',
    )
    for i, a in enumerate(answers, start=1):
        r[f'answer_{i}'] = a
    for i in range(len(answers) + 1, 5):
        r[f'answer_{i}'] = ''
    return r


class Agent73AnswerTupleTests(unittest.TestCase):
    def test_repeated_answer_tuple_across_many_quizzes_is_flagged(self):
        rows = []
        for i in range(1, 5):
            rows.append(row(f'a1-{i:03d}', 1, f'Question stem number {i} here.',
                             ['clearly', 'appear to', 'must', 'never'], 2))
        report = audit_rows(rows)
        self.assertIn('CQ-D05', [x['code'] for x in report['issues']])

    def test_reused_answer_tuple_within_one_quiz_is_not_flagged_as_dataset_pattern(self):
        # A single quiz legitimately reusing the same option set (e.g. an
        # "am/is/are" paradigm) across several questions must not trigger the
        # dataset-scope CQ-D05 gate, since it only ever touches one quiz.
        rows = []
        for i in range(1, 6):
            rows.append(row('a1-001', i, f'She ___ happy today, sentence {i}.',
                             ['am', 'is', 'are', 'be'], 2))
        report = audit_rows(rows)
        self.assertNotIn('CQ-D05', [x['code'] for x in report['issues']])


class Agent73WithinQuizSignatureTests(unittest.TestCase):
    def test_repeated_stem_answerset_and_correct_answer_in_one_quiz_is_flagged(self):
        # Same 5-token stem frame, same option set, same correct answer text
        # (just a different sentence tail) — a genuine near-duplicate item.
        rows = [
            row('b2-001', 1, 'The results ___ suggest that the policy was effective.',
                ['appear to', 'clearly', 'must', 'never'], 1, level='B2'),
            row('b2-001', 2, 'The results ___ suggest that demand is falling instead.',
                ['clearly', 'must', 'appear to', 'never'], 3, level='B2'),
        ]
        report = audit_rows(rows)
        self.assertIn('CQ-D06', [x['code'] for x in report['issues']])

    def test_varying_correct_answer_avoids_false_positive(self):
        # Same stem frame and same option set, but a different correct answer
        # each time is a legitimate paradigm drill, not a near-duplicate item.
        rows = [
            row('a1-001', i, f'She ___ happy today, in example number {i} here.',
                ['am', 'is', 'are', 'be'], correct)
            for i, correct in enumerate([1, 2, 3], start=1)
        ]
        report = audit_rows(rows)
        self.assertNotIn('CQ-D06', [x['code'] for x in report['issues']])


class Agent73StemDiversityRatioTests(unittest.TestCase):
    def test_low_stem_diversity_ratio_in_large_quiz_is_flagged(self):
        rows = []
        for i in range(1, 7):
            frame_choice = 'Choose the correct form: She ___ happy' if i % 2 == 0 else f'Sentence {i} choose correct form:'
            rows.append(row('c1-001', i, frame_choice, [f'opt{i}a', f'opt{i}b', f'opt{i}c'], 1, level='C1'))
        report = audit_rows(rows)
        self.assertIn('CQ-D07', [x['code'] for x in report['issues']])

    def test_small_quiz_is_exempt_from_stem_diversity_ratio(self):
        rows = [
            row('c1-002', i, 'Choose the correct form: She ___ happy', [f'opt{i}a', f'opt{i}b', f'opt{i}c'], 1, level='C1')
            for i in range(1, 5)
        ]
        report = audit_rows(rows)
        self.assertNotIn('CQ-D07', [x['code'] for x in report['issues']])


if __name__ == '__main__':
    unittest.main()
