import json
import subprocess
import sys
import unittest

class ScaleBenchmarkHarnessTests(unittest.TestCase):
    def test_small_benchmark_is_deterministic_shape_and_passes(self):
        p = subprocess.run(
            [sys.executable, 'scripts/scale_benchmark.py', '--rows', '100'],
            capture_output=True, text=True, check=True,
        )
        result = json.loads(p.stdout)
        self.assertEqual(result['rows'], 100)
        self.assertEqual(result['target_rows'], 1_200_000)
        self.assertGreater(result['rows_per_second'], 0)
        self.assertGreater(result['projected_target_seconds'], 0)
        self.assertEqual(result['status'], 'PASS')

if __name__ == '__main__': unittest.main()
