import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
QUIZ = ROOT / 'site/shared/quiz.html'

class Agent112QuizScreenAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = QUIZ.read_text(encoding='utf-8')

    def test_required_state_nodes_exist(self):
        for node in ['loading','start','error','end','question','feedback','next','result']:
            self.assertRegex(self.source, rf'id="{re.escape(node)}"')

    def test_load_path_covers_loading_start_and_error_states(self):
        self.assertIn("show('loading')", self.source)
        self.assertIn("show('start')", self.source)
        self.assertIn("errorState('No quiz to load'", self.source)
        self.assertIn("errorState('Quiz not found'", self.source)
        self.assertIn("errorState('Connection problem'", self.source)
        self.assertIn("errorState('Quiz data error'", self.source)

    def test_question_answer_feedback_and_completion_states_are_connected(self):
        self.assertIn('show(null);', self.source)
        self.assertIn("f.className='feedback show '+(ok?'good':'bad')", self.source)
        self.assertIn("$('next').style.display='inline-block'", self.source)
        self.assertIn('function next()', self.source)
        self.assertIn('else end();', self.source)
        self.assertIn("show('end')", self.source)

    def test_background_content_is_inert_during_overlays(self):
        self.assertIn("setBackgroundInert(!!section)", self.source)
        self.assertIn("el.setAttribute('inert','')", self.source)
        self.assertIn("el.removeAttribute('inert')", self.source)

    def test_quiz_nav_visibility_matches_state_contract(self):
        self.assertIn('window.MylingoAppShell.setVisible(!!section)', self.source)
        self.assertIn('section===null', self.source)
        self.assertIn("show('end')", self.source)

    def test_answer_controls_are_disabled_after_grading(self):
        self.assertIn("$('options').querySelectorAll('input,select,button').forEach(el=>el.disabled=true)", self.source)
        self.assertIn('locked=true', self.source)

    def test_mobile_and_focus_baseline_is_present(self):
        self.assertIn('viewport-fit=cover', self.source)
        self.assertIn(':focus-visible', self.source)
        self.assertIn('min-height:44px', self.source)
        self.assertIn("$('next').focus()", self.source)

if __name__ == '__main__':
    unittest.main()
