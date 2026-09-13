import unittest
import content_qa


def row(question, explanation, answers, correct_index=1):
    r = {"quiz_id":"test-001","level":"A1","quiz_category":"Grammar",
         "question_text":question,"explanation":explanation,
         "correct_index":str(correct_index)}
    for i in range(1,10): r[f"answer_{i}"] = answers[i-1] if i <= len(answers) else ""
    return r

class TestAgent70(unittest.TestCase):
    def test_question_specific_subject_match_is_clean(self):
        r = row("I ___ a student.", "Use am with the pronoun I in the present simple.", ["am","is","are"], 1)
        report = content_qa.audit_rows([r])
        self.assertFalse(any(i.code == "CQ-X02" for i in [content_qa.QAIssue(**x) for x in report["issues"]]))

    def test_question_specific_subject_mismatch_is_error(self):
        r = row("She ___ my friend.", "Use am with the pronoun I in the present simple.", ["am","is","are"], 2)
        report = content_qa.audit_rows([r])
        self.assertTrue(any(x["code"] == "CQ-X02" and x["severity"] == "error" for x in report["issues"]))

class TestAgent71(unittest.TestCase):
    def test_parallel_multword_options_do_not_trigger_length_clue(self):
        r = row("Choose the best phrase.", "The phrase is appropriate in this context.",
                ["Kids need more help.", "Children require additional support.", "Kids gotta get help.", "Children need stuff."], 2)
        report = content_qa.audit_rows([r])
        self.assertFalse(any(x["code"] == "CQ-C06" for x in report["issues"]))

    def test_blatant_length_clue_is_caught(self):
        r = row("Choose the best answer.", "The first option is correct.",
                ["a", "This is an extremely long and unusually detailed correct answer", "b", "c"], 2)
        report = content_qa.audit_rows([r])
        self.assertTrue(any(x["code"] == "CQ-C06" for x in report["issues"]))

if __name__ == "__main__": unittest.main()
