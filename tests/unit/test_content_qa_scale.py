import os, sys, tempfile, csv, unittest
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, ROOT)
import content_qa

class TestContentQAScale(unittest.TestCase):
    def test_chunked_csv_reader(self):
        with tempfile.NamedTemporaryFile('w', newline='', suffix='.csv', delete=False) as f:
            writer=csv.DictWriter(f, fieldnames=['quiz_id']); writer.writeheader(); writer.writerows([{'quiz_id':str(i)} for i in range(5)]); path=f.name
        try: self.assertEqual([len(x) for x in content_qa.iter_csv_rows(path,2)],[2,2,1])
        finally: os.unlink(path)

    def test_large_bucket_candidates(self):
        bucket=[]
        for i in range(2601): bucket.append((i,f'q{i}',f'choose correct form learner token {i} alpha beta gamma delta'))
        pairs,_=content_qa._near_duplicate_candidates(bucket)
        self.assertIsInstance(pairs,set)

if __name__=='__main__': unittest.main()
