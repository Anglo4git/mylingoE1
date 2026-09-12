import os, sys, unittest
from copy import deepcopy
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT,"generation"))
from answer_position import rebalance_quiz_rows, target_position


def make(qnum, correct=2, qid="a1-001"):
    r={"quiz_id":qid,"question_number":str(qnum),"correct_index":str(correct)}
    for i,a in enumerate(("alpha","beta","gamma","delta"),1): r[f"answer_{i}"]=a
    return r

class TestAnswerPosition(unittest.TestCase):
    def test_balances_identical_positions(self):
        rows=[make(i,2) for i in range(1,6)]
        out=rebalance_quiz_rows(rows)
        positions=[int(r["correct_index"]) for r in out]
        self.assertEqual(len(set(positions)),4)
        self.assertLess(max(positions.count(p) for p in set(positions))/5, .8)

    def test_correct_answer_text_is_preserved(self):
        rows=[make(i,2) for i in range(1,6)]
        before=[r[f"answer_{int(r['correct_index'])}"] for r in rows]
        out=rebalance_quiz_rows(rows)
        after=[r[f"answer_{int(r['correct_index'])}"] for r in out]
        self.assertEqual(before,after)

    def test_deterministic_and_idempotent(self):
        rows=[make(i,2) for i in range(1,6)]
        a=rebalance_quiz_rows(deepcopy(rows)); b=rebalance_quiz_rows(deepcopy(rows))
        self.assertEqual(a,b)
        self.assertEqual(a,rebalance_quiz_rows(deepcopy(a)))

    def test_target_is_valid(self):
        for n in range(2,10):
            self.assertTrue(1 <= target_position("a1-001", 1, n) <= n)

if __name__ == "__main__": unittest.main()
