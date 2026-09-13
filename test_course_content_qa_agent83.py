import json
import os
import shutil
import tempfile
import unittest

import course_content_qa as qa

ROOT = os.path.dirname(os.path.abspath(__file__))
LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"]
CATEGORY_DIRS = ["grammar", "vocabulary", "writing", "academic-english"]


def fresh_sandbox():
    """A full, working copy of the real content graph + built site, so each
    test can break exactly one thing and confirm exactly one code fires —
    mirroring the fixture style of test_course_schema_agent73.py."""
    tmp = tempfile.mkdtemp()
    shutil.copytree(os.path.join(ROOT, "course_content"), os.path.join(tmp, "course_content"))
    shutil.copy(os.path.join(ROOT, "master_source.csv"), os.path.join(tmp, "master_source.csv"))
    site = os.path.join(tmp, "site")
    os.makedirs(site)
    for level in LEVELS:
        shutil.copytree(os.path.join(ROOT, "site", level), os.path.join(site, level))
    for cat in CATEGORY_DIRS:
        src = os.path.join(ROOT, "site", cat)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(site, cat))
    shutil.copytree(os.path.join(ROOT, "site", "course_content"), os.path.join(site, "course_content"))
    return tmp


def paths(tmp):
    return (
        os.path.join(tmp, "course_content"),
        os.path.join(tmp, "master_source.csv"),
        os.path.join(tmp, "site"),
    )


def codes(report):
    return sorted({issue.code for issue in report.issues})


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh)


class RealDatasetIsClean(unittest.TestCase):
    """The shipped course_content/master_source.csv/site graph should have
    zero findings from every Agent 83 check today. This is the regression
    guard: if a future content change reintroduces drift, this fails."""

    def test_no_findings_against_real_repo(self):
        report = qa.run(
            os.path.join(ROOT, "course_content"),
            os.path.join(ROOT, "master_source.csv"),
            os.path.join(ROOT, "site"),
        )
        self.assertEqual(report.by_severity("error"), [], report.by_severity("error"))
        self.assertEqual(report.by_severity("warning"), [], report.by_severity("warning"))


class SyntheticFixtures(unittest.TestCase):
    def setUp(self):
        self.tmp = fresh_sandbox()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.content_dir, self.master_source, self.site_dir = paths(self.tmp)

    def lessons_path(self):
        return os.path.join(self.content_dir, "lessons.json")

    def site_lessons_path(self):
        return os.path.join(self.site_dir, "course_content", "lessons.json")

    def write_lessons(self, lessons):
        write_json(self.lessons_path(), lessons)
        write_json(self.site_lessons_path(), lessons)

    def run_qa(self):
        return qa.run(self.content_dir, self.master_source, self.site_dir)

    def test_duplicate_quiz_ref_in_one_lesson_is_CQG_E01(self):
        lessons = json.load(open(self.lessons_path()))
        lessons[0]["exercise_quiz_ids"] = [lessons[0]["exercise_quiz_ids"][0]] * 2
        self.write_lessons(lessons)
        self.assertIn("CQG-E01", codes(self.run_qa()))

    def test_orphan_published_quiz_is_CQG_W01(self):
        lessons = json.load(open(self.lessons_path()))
        for lesson in lessons:
            lesson["exercise_quiz_ids"] = [q for q in lesson["exercise_quiz_ids"] if q != "a1-002"]
        self.write_lessons(lessons)
        self.assertIn("CQG-W01", codes(self.run_qa()))

    def test_wrong_level_reference_is_CQG_W02(self):
        lessons = json.load(open(self.lessons_path()))
        lessons[0]["exercise_quiz_ids"] = ["a2-001"]
        self.write_lessons(lessons)
        self.assertIn("CQG-W02", codes(self.run_qa()))

    def test_manifest_question_count_drift_is_CQG_E03(self):
        manifest_path = os.path.join(self.site_dir, "a1", "quizzes.json")
        manifest = json.load(open(manifest_path))
        manifest[0]["questions"] = 999
        write_json(manifest_path, manifest)
        self.assertIn("CQG-E03", codes(self.run_qa()))

    def test_missing_built_quiz_file_is_CQG_E02(self):
        manifest_path = os.path.join(self.site_dir, "a1", "quizzes.json")
        manifest = json.load(open(manifest_path))
        target = os.path.join(self.site_dir, manifest[0]["file"])
        os.remove(target)
        self.assertIn("CQG-E02", codes(self.run_qa()))

    def test_site_mirror_drift_is_CQG_E04(self):
        mirror_path = os.path.join(self.site_dir, "course_content", "courses.json")
        courses = json.load(open(mirror_path))
        courses[0]["title"] = "DRIFTED"
        write_json(mirror_path, courses)
        self.assertIn("CQG-E04", codes(self.run_qa()))

    def test_lesson_claimed_by_two_units_is_CQG_E05(self):
        units_path = os.path.join(self.content_dir, "units.json")
        units = json.load(open(units_path))
        units[1]["lesson_ids"].append(units[0]["lesson_ids"][0])
        write_json(units_path, units)
        write_json(os.path.join(self.site_dir, "course_content", "units.json"), units)
        self.assertIn("CQG-E05", codes(self.run_qa()))

    def test_unsafe_media_uri_is_CQG_W03(self):
        quiz_path = os.path.join(self.site_dir, "grammar", "a1", "a1-001.json")
        data = json.load(open(quiz_path))
        data["questions"][0]["media"] = {"image": "javascript:alert(1)"}
        write_json(quiz_path, data)
        self.assertIn("CQG-W03", codes(self.run_qa()))

    def test_clean_sandbox_copy_has_no_findings(self):
        """Sanity check on the fixture harness itself: an untouched copy of
        the real graph must report clean, same as the real repo."""
        self.assertEqual(self.run_qa().issues, [])


if __name__ == "__main__":
    unittest.main()
