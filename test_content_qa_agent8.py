import csv
import unittest
from pathlib import Path

from content_qa import audit_rows


class Agent8ProductionContentDiversityTests(unittest.TestCase):
    """Regression guard for the production content-quality disposition."""

    @staticmethod
    def production_rows():
        path = Path(__file__).with_name("master_source.csv")
        with path.open(newline="", encoding="utf-8") as handle:
            return list(csv.DictReader(handle))

    def test_production_content_has_no_strict_errors_or_warnings(self):
        report = audit_rows(self.production_rows(), strict=True)
        blocking = [issue for issue in report["issues"] if issue["severity"] in {"error", "warning"}]
        self.assertEqual([], blocking, msg="production content has unresolved strict QA findings")

    def test_all_seven_agent8_diversity_warnings_are_resolved(self):
        report = audit_rows(self.production_rows(), strict=True)
        d06 = [issue for issue in report["issues"] if issue["code"] == "CQ-D06"]
        self.assertEqual([], d06, msg="within-quiz low-diversity repeats remain")


if __name__ == "__main__":
    unittest.main()
