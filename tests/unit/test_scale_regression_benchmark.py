import json
import subprocess
import sys
import unittest

class ScaleRegressionBenchmarkTests(unittest.TestCase):
    def test_small_run_is_deterministic_shape_and_linear(self):
        # 3,000 / 30,000 rather than a smaller pair: below a few thousand
        # rows, fixed process-startup cost dominates elapsed time and the
        # growth-ratio check becomes noisy/flaky in shared CI environments,
        # independent of any real regression.
        p = subprocess.run(
            [sys.executable, 'scripts/scale_regression_benchmark.py',
             '--baseline-rows', '3000', '--rows', '30000'],
            capture_output=True, text=True, check=True,
        )
        result = json.loads(p.stdout)
        self.assertEqual(result['baseline']['rows'], 3000)
        self.assertEqual(result['large']['rows'], 30000)
        self.assertEqual(result['row_count_ratio'], 10.0)
        self.assertEqual(result['target_rows'], 1_200_000)
        self.assertGreater(result['projected_target_seconds'], 0)
        # The regression signal itself: growth must not be flagged as
        # super-linear for a normal, non-regressed run.
        self.assertTrue(result['time_linear_or_better'])
        self.assertTrue(result['memory_linear_or_better'])
        self.assertEqual(result['status'], 'PASS')

    def test_rejects_baseline_not_smaller_than_rows(self):
        p = subprocess.run(
            [sys.executable, 'scripts/scale_regression_benchmark.py',
             '--baseline-rows', '2000', '--rows', '2000'],
            capture_output=True, text=True,
        )
        self.assertNotEqual(p.returncode, 0)

if __name__ == '__main__': unittest.main()
