import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
FIXTURE = ROOT / 'tests' / 'fixtures' / 'quiz-question-types.json'
QUIZ = ROOT / 'site' / 'shared' / 'quiz.html'

SUPPORTED = {
    'radio', 'checkbox', 'dropdown', 'text', 'short_text', 'number', 'date',
    'matching', 'ranking', 'fill_in_the_blank', 'banner'
}

class QuizQuestionCoverageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = json.loads(FIXTURE.read_text(encoding='utf-8'))
        cls.source = QUIZ.read_text(encoding='utf-8')
        cls.questions = cls.fixture['questions']

    def test_fixture_covers_every_supported_renderer_type(self):
        types = {q['question_type'] for q in self.questions}
        self.assertEqual(types, SUPPORTED)

    def test_fixture_question_ids_are_unique(self):
        ids = [q['id'] for q in self.questions]
        self.assertEqual(len(ids), len(set(ids)))

    def test_fixture_has_valid_minimal_contract_per_type(self):
        for q in self.questions:
            t = q['question_type']
            self.assertTrue(q.get('question_text') or t == 'banner')
            if t in {'radio', 'dropdown', 'checkbox'}:
                self.assertGreaterEqual(len(q['answers']), 2)
                self.assertLessEqual(len(q['answers']), 9)
            elif t in {'text', 'short_text', 'number', 'date', 'fill_in_the_blank'}:
                self.assertTrue(q.get('acceptedAnswers'))
            elif t == 'matching':
                self.assertGreaterEqual(len(q['pairs']), 2)
            elif t == 'ranking':
                self.assertGreaterEqual(len(q['items']), 2)
                self.assertEqual(len(q['items']), len(q['correctOrder']))

    def test_runtime_source_exposes_each_renderer(self):
        for t in sorted(SUPPORTED):
            self.assertIn(f"type==='{t}'", self.source)

    def test_fixture_contains_feedback_and_completion_data(self):
        for q in self.questions:
            self.assertIn('explanation', q)
        self.assertIn("$('next').style.display='inline-block'", self.source)
        self.assertIn('updateSessionAnswer(input,ok,correctText)', self.source)
        self.assertIn('save(false)', self.source)

if __name__ == '__main__':
    unittest.main()
