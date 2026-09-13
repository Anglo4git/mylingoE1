import csv
import io
import os
import tempfile
import unittest

import map_quiz_catalog as mapper
import apply_curated_content as curated_mod
import audit_course_mapping as audit_mod
import course_schema as cs

ROOT = os.path.dirname(os.path.abspath(__file__))
MASTER_SOURCE = os.path.join(ROOT, "master_source.csv")
CURATED_LESSONS = os.path.join(ROOT, "curated_lessons.json")
SHIPPED_CONTENT_DIR = os.path.join(ROOT, "course_content")

CSV_HEADER = [
    "quiz_id", "level", "title", "description", "quiz_category", "quiz_tags",
    "version", "status", "question_number", "question_text", "question_category",
    "question_tags", "explanation", "correct_index",
    "answer_1", "answer_2", "answer_3", "answer_4",
]


def write_fake_master_source(rows):
    """rows: list of dicts with quiz-level fields; one question row each."""
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, newline="")
    writer = csv.DictWriter(tmp, fieldnames=CSV_HEADER)
    writer.writeheader()
    for r in rows:
        row = {k: "" for k in CSV_HEADER}
        row.update(r)
        row.setdefault("question_number", "1")
        row.setdefault("question_text", "Q?")
        row.setdefault("correct_index", "1")
        row.setdefault("answer_1", "a")
        row.setdefault("answer_2", "b")
        writer.writerow(row)
    tmp.close()
    return tmp.name


class MappingGeneratorTests(unittest.TestCase):
    def test_full_catalog_maps_every_published_quiz_exactly_once(self):
        quizzes = mapper.load_catalog(MASTER_SOURCE)
        courses, units, lessons, published, skipped = mapper.build_mapping(quizzes)

        mapped_ids = [qid for l in lessons for qid in l["exercise_quiz_ids"]]
        self.assertEqual(len(mapped_ids), len(set(mapped_ids)),
                          "a quiz was mapped into more than one lesson")
        self.assertEqual(set(mapped_ids), set(published),
                          "every published quiz must be mapped, and only published quizzes")
        self.assertEqual(len(skipped), 0)  # current catalog has no non-published rows

    def test_non_published_quiz_is_excluded_not_mapped(self):
        path = write_fake_master_source([
            {"quiz_id": "x1-001", "level": "A1", "title": "T1",
             "description": "D1", "quiz_category": "Grammar",
             "quiz_tags": "Grammar,A1", "version": "1", "status": "published"},
            {"quiz_id": "x1-002", "level": "A1", "title": "T2",
             "description": "D2", "quiz_category": "Grammar",
             "quiz_tags": "Grammar,A1", "version": "1", "status": "draft"},
        ])
        try:
            quizzes = mapper.load_catalog(path)
            courses, units, lessons, published, skipped = mapper.build_mapping(quizzes)
            mapped_ids = {qid for l in lessons for qid in l["exercise_quiz_ids"]}
            self.assertIn("x1-001", mapped_ids)
            self.assertNotIn("x1-002", mapped_ids)
            self.assertIn("x1-002", skipped)
        finally:
            os.unlink(path)

    def test_units_are_grouped_one_per_level_category_bucket(self):
        path = write_fake_master_source([
            {"quiz_id": "x1-001", "level": "A1", "title": "T1", "description": "D1",
             "quiz_category": "Grammar", "quiz_tags": "Grammar,A1", "version": "1",
             "status": "published"},
            {"quiz_id": "x1-002", "level": "A1", "title": "T2", "description": "D2",
             "quiz_category": "Grammar", "quiz_tags": "Grammar,A1", "version": "1",
             "status": "published"},
            {"quiz_id": "x1-003", "level": "A1", "title": "T3", "description": "D3",
             "quiz_category": "Vocabulary", "quiz_tags": "Vocabulary,A1", "version": "1",
             "status": "published"},
        ])
        try:
            quizzes = mapper.load_catalog(path)
            courses, units, lessons, published, skipped = mapper.build_mapping(quizzes)
            self.assertEqual(len(courses), 1)
            self.assertEqual(len(units), 2)  # Grammar bucket + Vocabulary bucket
            grammar_unit = next(u for u in units if u["title"] == "Grammar")
            self.assertEqual(len(grammar_unit["lesson_ids"]), 2)
        finally:
            os.unlink(path)

    def test_output_validates_clean_with_course_schema(self):
        quizzes = mapper.load_catalog(MASTER_SOURCE)
        courses, units, lessons, published, skipped = mapper.build_mapping(quizzes)
        with tempfile.TemporaryDirectory() as tmp:
            mapper.write_json(os.path.join(tmp, "courses.json"), courses)
            mapper.write_json(os.path.join(tmp, "units.json"), units)
            mapper.write_json(os.path.join(tmp, "lessons.json"), lessons)
            issues = cs.validate(tmp, MASTER_SOURCE)
            errors = [i for i in issues if i.severity == "error"]
            self.assertEqual(errors, [], msg=[i.as_dict() for i in errors])

    def test_mapping_is_deterministic_across_runs(self):
        quizzes = mapper.load_catalog(MASTER_SOURCE)
        result_a = mapper.build_mapping(quizzes)
        result_b = mapper.build_mapping(quizzes)
        self.assertEqual(result_a[0], result_b[0])  # courses
        self.assertEqual(result_a[1], result_b[1])  # units
        self.assertEqual(result_a[2], result_b[2])  # lessons


class ShippedContentMatchesGeneratorTests(unittest.TestCase):
    """The checked-in course_content/ must be exactly what the generator
    produces from the current master_source.csv — catches drift if someone
    edits the JSON by hand without re-running the mapper."""

    def test_shipped_content_matches_fresh_generation(self):
        """Drift guard (Agent 74, widened by Agent 119).

        Shipped course_content/ must equal a fresh run of the *composed*
        generation pipeline: map_quiz_catalog.py's mechanical baseline
        plus curated_lessons.json's hand-authored additions layered on
        top by apply_curated_content.py. This still catches any
        hand-edit to course_content/ that isn't traceable to one of
        those two tracked source files, which is the property this test
        exists to guarantee — it no longer requires shipped content to
        be *exclusively* the mechanical baseline with zero curation.
        """
        courses, units, lessons = curated_mod.compose(MASTER_SOURCE, CURATED_LESSONS)
        shipped_courses, shipped_units, shipped_lessons = cs.load_content_dir(
            SHIPPED_CONTENT_DIR
        )
        self.assertEqual(courses, shipped_courses)
        self.assertEqual(units, shipped_units)
        self.assertEqual(lessons, shipped_lessons)

    def test_baseline_mapping_alone_is_still_exposed_and_unchanged(self):
        """The raw mechanical mapper (Agent 74's original contract) is
        still available and still deterministic/idempotent on its own —
        composition in apply_curated_content.py is additive, not a
        replacement of the baseline mapper's behavior."""
        quizzes = mapper.load_catalog(MASTER_SOURCE)
        courses_a, units_a, lessons_a, published_a, skipped_a = mapper.build_mapping(quizzes)
        courses_b, units_b, lessons_b, published_b, skipped_b = mapper.build_mapping(quizzes)
        self.assertEqual(courses_a, courses_b)
        self.assertEqual(units_a, units_b)
        self.assertEqual(lessons_a, lessons_b)
        self.assertEqual(published_a, published_b)
        self.assertEqual(skipped_a, skipped_b)

    def test_curated_additions_only_reuse_published_quizzes(self):
        """Every curated addition must reference quiz_ids that already
        exist and are published in master_source.csv — reuse, never new
        quiz/question content authored out of thin air."""
        quizzes = mapper.load_catalog(MASTER_SOURCE)
        published_ids = {qid for qid, q in quizzes.items() if q["status"] == "published"}
        additions = curated_mod.load_curated(CURATED_LESSONS)
        self.assertTrue(len(additions) > 0, "expected at least one curated addition")
        for addition in additions:
            for qid in addition["exercise_quiz_ids"]:
                self.assertIn(qid, published_ids,
                              f"curated addition '{addition['lesson_id']}' "
                              f"references non-existent/unpublished quiz '{qid}'")

    def test_curated_additions_do_not_collide_with_baseline_lesson_ids(self):
        quizzes = mapper.load_catalog(MASTER_SOURCE)
        _, _, baseline_lessons, _, _ = mapper.build_mapping(quizzes)
        baseline_ids = {l["lesson_id"] for l in baseline_lessons}
        additions = curated_mod.load_curated(CURATED_LESSONS)
        for addition in additions:
            self.assertNotIn(addition["lesson_id"], baseline_ids)


class AuditTests(unittest.TestCase):
    def test_audit_passes_clean_on_shipped_content(self):
        result = audit_mod.audit(SHIPPED_CONTENT_DIR, MASTER_SOURCE)
        self.assertEqual(result, 0)

    def test_audit_catches_orphan_quiz(self):
        courses, units, lessons = cs.load_content_dir(SHIPPED_CONTENT_DIR)
        # Remove one lesson (and its reference from its unit) so its quiz
        # becomes unmapped.
        removed = lessons[0]
        remaining_lessons = lessons[1:]
        fixed_units = []
        for u in units:
            u = dict(u)
            u["lesson_ids"] = [lid for lid in u["lesson_ids"] if lid != removed["lesson_id"]]
            fixed_units.append(u)

        with tempfile.TemporaryDirectory() as tmp:
            mapper.write_json(os.path.join(tmp, "courses.json"), courses)
            mapper.write_json(os.path.join(tmp, "units.json"), fixed_units)
            mapper.write_json(os.path.join(tmp, "lessons.json"), remaining_lessons)
            result = audit_mod.audit(tmp, MASTER_SOURCE)
            self.assertEqual(result, 1)

    def test_audit_catches_wrong_level_assignment(self):
        courses, units, lessons = cs.load_content_dir(SHIPPED_CONTENT_DIR)
        # Move one A1 lesson under an A2 unit to simulate a wrong-level bug.
        a1_lesson = next(l for l in lessons if l["lesson_id"].startswith("course-a1-"))
        a2_unit = next(u for u in units if u["unit_id"].startswith("course-a2-unit-01"))

        fixed_lessons = [dict(l) for l in lessons]
        for l in fixed_lessons:
            if l["lesson_id"] == a1_lesson["lesson_id"]:
                l["unit_id"] = a2_unit["unit_id"]

        fixed_units = [dict(u) for u in units]
        for u in fixed_units:
            if u["unit_id"] == a2_unit["unit_id"]:
                u["lesson_ids"] = list(u["lesson_ids"]) + [a1_lesson["lesson_id"]]

        with tempfile.TemporaryDirectory() as tmp:
            mapper.write_json(os.path.join(tmp, "courses.json"), courses)
            mapper.write_json(os.path.join(tmp, "units.json"), fixed_units)
            mapper.write_json(os.path.join(tmp, "lessons.json"), fixed_lessons)
            result = audit_mod.audit(tmp, MASTER_SOURCE)
            self.assertEqual(result, 1)


if __name__ == "__main__":
    unittest.main()
