import unittest
from content_qa import audit_rows

BASE = {
    'quiz_id':'a1-001','level':'A1','title':'T','description':'D','quiz_category':'Grammar','quiz_tags':'Grammar,A1',
    'version':'1','status':'published','question_number':'1','question_text':'Choose the correct word.','question_category':'Grammar','question_tags':'Grammar,A1',
    'explanation':'This is the correct answer.','correct_index':'1','answer_1':'one','answer_2':'two','answer_3':'three','answer_4':'four',
}

def row(qid, category, level='A1'):
    r=dict(BASE); r.update(quiz_id=qid, level=level, quiz_category=category, quiz_tags=f'{category},{level}', question_category=category, question_tags=f'{category},{level}')
    return r

class Agent72CoverageTests(unittest.TestCase):
    def test_a1_policy_accepts_8_grammar_2_vocabulary(self):
        rows=[row(f'a1-{i:03d}', 'Grammar') for i in range(1,9)] + [row('a1-009','Vocabulary'), row('a1-010','Vocabulary')]
        report=audit_rows(rows)
        self.assertNotIn('CQ-B07', [x['code'] for x in report['issues']])
        self.assertEqual(report['cefr_category_coverage']['A1']['required_shares']['Vocabulary']['actual'], .2)

    def test_a1_policy_rejects_100_percent_grammar(self):
        rows=[row(f'a1-{i:03d}', 'Grammar') for i in range(1,11)]
        report=audit_rows(rows)
        self.assertIn('CQ-B07', [x['code'] for x in report['issues']])

    def test_a2_policy_is_independent(self):
        rows=[row(f'a2-{i:03d}', 'Grammar','A2') for i in range(1,9)] + [row('a2-009','Vocabulary','A2'), row('a2-010','Vocabulary','A2')]
        report=audit_rows(rows)
        self.assertNotIn('CQ-B07', [x['code'] for x in report['issues']])

if __name__ == '__main__': unittest.main()
