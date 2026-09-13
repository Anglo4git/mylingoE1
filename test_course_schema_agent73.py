import copy
import json
import os
import tempfile
import unittest

import course_schema as cs

ROOT = os.path.dirname(os.path.abspath(__file__))
MASTER_SOURCE = os.path.join(ROOT, "master_source.csv")
SAMPLE_CONTENT_DIR = os.path.join(ROOT, "course_content")

GOOD_COURSE = {
    "course_id": "course-a2",
    "level": "A2",
    "title": "English A2",
    "description": "desc",
    "version": 1,
    "status": "published",
    "unit_ids": ["course-a2-unit-01"],
}

GOOD_UNIT = {
    "unit_id": "course-a2-unit-01",
    "course_id": "course-a2",
    "title": "Everyday Life",
    "order": 1,
    "lesson_ids": ["course-a2-unit-01-lesson-01"],
}

GOOD_LESSON = {
    "lesson_id": "course-a2-unit-01-lesson-01",
    "unit_id": "course-a2-unit-01",
    "title": "Daily Routines",
    "category": "Mixed",
    "order": 1,
    "revision": {
        "summary": "Short revision text.",
        "examples": ["I wake up at 7."],
        "key_terms": ["always"],
        "estimated_minutes": 2,
    },
    "presentation_url": None,
    "youtube_url": None,
    "exercise_quiz_ids": ["a2-007", "a2-010"],
    "version": 1,
    "status": "published",
}


def write_content_dir(courses, units, lessons):
    tmpdir = tempfile.mkdtemp()
    with open(os.path.join(tmpdir, "courses.json"), "w") as fh:
        json.dump(courses, fh)
    with open(os.path.join(tmpdir, "units.json"), "w") as fh:
        json.dump(units, fh)
    with open(os.path.join(tmpdir, "lessons.json"), "w") as fh:
        json.dump(lessons, fh)
    return tmpdir


def codes(issues):
    return [i.code for i in issues]


class SampleDataValidatesCleanTests(unittest.TestCase):
    """The shipped course_content/ sample must validate with zero errors
    against the real master_source.csv."""

    def test_sample_content_has_no_errors(self):
        issues = cs.validate(SAMPLE_CONTENT_DIR, MASTER_SOURCE)
        errors = [i for i in issues if i.severity == "error"]
        self.assertEqual(errors, [], msg=[i.as_dict() for i in errors])

    def test_sample_content_has_no_warnings(self):
        issues = cs.validate(SAMPLE_CONTENT_DIR, MASTER_SOURCE)
        warnings = [i for i in issues if i.severity == "warning"]
        self.assertEqual(warnings, [], msg=[i.as_dict() for i in warnings])

    def test_sample_referenced_quizzes_are_real_and_published(self):
        quiz_status = cs.load_quiz_ids(MASTER_SOURCE)
        self.assertEqual(quiz_status.get("a2-007"), "published")
        self.assertEqual(quiz_status.get("a2-010"), "published")


class StructuralErrorTests(unittest.TestCase):
    def test_duplicate_course_id_is_CC_E01(self):
        tmp = write_content_dir([GOOD_COURSE, GOOD_COURSE], [GOOD_UNIT], [GOOD_LESSON])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E01", codes(issues))

    def test_missing_required_field_is_CC_E02(self):
        bad_course = copy.deepcopy(GOOD_COURSE)
        del bad_course["description"]
        tmp = write_content_dir([bad_course], [GOOD_UNIT], [GOOD_LESSON])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E02", codes(issues))

    def test_unknown_level_is_CC_E03(self):
        bad_course = copy.deepcopy(GOOD_COURSE)
        bad_course["level"] = "Z9"
        tmp = write_content_dir([bad_course], [GOOD_UNIT], [GOOD_LESSON])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E03", codes(issues))

    def test_unit_referencing_missing_course_is_CC_E04(self):
        bad_unit = copy.deepcopy(GOOD_UNIT)
        bad_unit["course_id"] = "course-does-not-exist"
        tmp = write_content_dir([GOOD_COURSE], [bad_unit], [GOOD_LESSON])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E04", codes(issues))

    def test_lesson_referencing_missing_unit_is_CC_E05(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["unit_id"] = "course-a2-unit-99"
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E05", codes(issues))

    def test_dangling_unit_ids_reference_is_CC_E06(self):
        bad_course = copy.deepcopy(GOOD_COURSE)
        bad_course["unit_ids"] = ["course-a2-unit-01", "course-a2-unit-02"]
        tmp = write_content_dir([bad_course], [GOOD_UNIT], [GOOD_LESSON])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E06", codes(issues))

    def test_empty_exercise_quiz_ids_is_CC_E07(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["exercise_quiz_ids"] = []
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E07", codes(issues))

    def test_broken_quiz_reference_is_CC_E08(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["exercise_quiz_ids"] = ["a2-999-does-not-exist"]
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E08", codes(issues))

    def test_duplicate_order_within_unit_is_CC_E09(self):
        lesson_2 = copy.deepcopy(GOOD_LESSON)
        lesson_2["lesson_id"] = "course-a2-unit-01-lesson-02"
        lesson_2["order"] = 1  # duplicate of GOOD_LESSON's order
        unit = copy.deepcopy(GOOD_UNIT)
        unit["lesson_ids"] = [GOOD_LESSON["lesson_id"], lesson_2["lesson_id"]]
        tmp = write_content_dir([GOOD_COURSE], [unit], [GOOD_LESSON, lesson_2])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E09", codes(issues))

    def test_published_course_with_no_units_is_CC_E10(self):
        bad_course = copy.deepcopy(GOOD_COURSE)
        bad_course["unit_ids"] = []
        tmp = write_content_dir([bad_course], [], [])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-E10", codes(issues))


class WarningTests(unittest.TestCase):
    def test_category_mismatch_is_CC_W01(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["category"] = "Writing"  # a2-007/a2-010 are Grammar/Vocabulary
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-W01", codes(issues))

    def test_long_summary_is_CC_W02(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["revision"] = dict(GOOD_LESSON["revision"])
        bad_lesson["revision"]["summary"] = "x" * 401
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-W02", codes(issues))

    def test_long_estimated_minutes_is_CC_W03(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["revision"] = dict(GOOD_LESSON["revision"])
        bad_lesson["revision"]["estimated_minutes"] = 25
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-W03", codes(issues))

    def test_malformed_youtube_url_is_CC_W04(self):
        bad_lesson = copy.deepcopy(GOOD_LESSON)
        bad_lesson["youtube_url"] = "https://example.com/not-youtube"
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [bad_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertIn("CC-W04", codes(issues))

    def test_well_formed_youtube_url_is_not_flagged(self):
        good_lesson = copy.deepcopy(GOOD_LESSON)
        good_lesson["youtube_url"] = "https://www.youtube.com/watch?v=abc123XYZ"
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [good_lesson])
        issues = cs.validate(tmp, MASTER_SOURCE)
        self.assertNotIn("CC-W04", codes(issues))

    def test_reference_to_non_published_quiz_is_CC_W05(self):
        # Use a synthetic master_source with one draft quiz row.
        tmp = write_content_dir([GOOD_COURSE], [GOOD_UNIT], [GOOD_LESSON])
        fake_master = os.path.join(tmp, "fake_master.csv")
        with open(fake_master, "w") as fh:
            fh.write("quiz_id,status\n")
            fh.write("a2-007,draft\n")
            fh.write("a2-010,published\n")
        issues = cs.validate(tmp, fake_master)
        self.assertIn("CC-W05", codes(issues))


class ReuseIsAllowedTests(unittest.TestCase):
    def test_same_quiz_referenced_by_two_lessons_is_not_an_error(self):
        unit = copy.deepcopy(GOOD_UNIT)
        lesson_2 = copy.deepcopy(GOOD_LESSON)
        lesson_2["lesson_id"] = "course-a2-unit-01-lesson-02"
        lesson_2["order"] = 2
        lesson_2["exercise_quiz_ids"] = ["a2-007"]  # reused from GOOD_LESSON
        unit["lesson_ids"] = [GOOD_LESSON["lesson_id"], lesson_2["lesson_id"]]
        tmp = write_content_dir([GOOD_COURSE], [unit], [GOOD_LESSON, lesson_2])
        issues = cs.validate(tmp, MASTER_SOURCE)
        errors = [i for i in issues if i.severity == "error"]
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
