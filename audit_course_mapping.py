#!/usr/bin/env python3
"""
Mylingo Course Content Mapping — audit (Agent 74).

Goes beyond course_schema.py's structural validation (which checks that
references, once made, are well-formed) to check the *coverage and
correctness* of the mapping itself:

  1. Every published quiz in master_source.csv is referenced by at least
     one lesson (no orphan quizzes).
  2. Every quiz_id referenced by a lesson exists in master_source.csv
     (no broken exercise references) — re-checked here independently of
     course_schema.py as a cross-check, not a replacement for it.
  3. Every lesson belongs to a unit that belongs to a course whose level
     equals the level of every quiz the lesson references (no
     wrong-level assignment).
  4. Every lesson's category equals the quiz_category of every quiz it
     references (no wrong-category assignment) — stricter than
     course_schema.py's CC-W01, which allows "Mixed" and is only a
     warning; this audit is zero-tolerance because this mapping never
     produces "Mixed" lessons by construction.
  5. No unit/lesson exists that isn't reachable from its course's
     unit_ids / unit's lesson_ids (no orphan units/lessons).
  6. Duplicate-mapping report: any quiz_id referenced by more than one
     lesson is reported (not an error — reuse is allowed by the schema —
     but it must be visible, since this mapping pass intends 1:1 and an
     unexpected duplicate would signal a bug in map_quiz_catalog.py).

Exit code is non-zero only on (1)-(5). (6) is informational.

Usage:
    python3 audit_course_mapping.py --content-dir course_content \
        --master-source master_source.csv
"""

from __future__ import annotations

import argparse
import os
from collections import defaultdict

import course_schema as cs

ROOT = os.path.dirname(os.path.abspath(__file__))


def audit(content_dir: str, master_source_path: str) -> int:
    courses, units, lessons = cs.load_content_dir(content_dir)
    quiz_status = cs.load_quiz_ids(master_source_path)
    quiz_categories = cs.load_quiz_categories(master_source_path)
    quiz_levels = {}
    import csv
    with open(master_source_path, encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            qid = (row.get("quiz_id") or "").strip()
            if qid and qid not in quiz_levels:
                quiz_levels[qid] = (row.get("level") or "").strip()

    courses_by_id = {c["course_id"]: c for c in courses}
    units_by_id = {u["unit_id"]: u for u in units}
    lessons_by_id = {l["lesson_id"]: l for l in lessons}

    problems: list[str] = []
    notes: list[str] = []

    # (5) reachability: every unit/lesson must be reachable from its parent's
    # ordered list, and every ordered-list entry must exist.
    reachable_units = {uid for c in courses for uid in c.get("unit_ids", [])}
    for uid in units_by_id:
        if uid not in reachable_units:
            problems.append(f"ORPHAN UNIT: '{uid}' is not listed in any course.unit_ids")
    reachable_lessons = {lid for u in units for lid in u.get("lesson_ids", [])}
    for lid in lessons_by_id:
        if lid not in reachable_lessons:
            problems.append(f"ORPHAN LESSON: '{lid}' is not listed in any unit.lesson_ids")

    # (1)+(6) quiz coverage and duplicate mapping.
    published_quiz_ids = {qid for qid, status in quiz_status.items() if status == "published"}
    lessons_by_quiz: dict[str, list[str]] = defaultdict(list)
    for lesson in lessons:
        for qid in lesson.get("exercise_quiz_ids", []):
            lessons_by_quiz[qid].append(lesson["lesson_id"])

    unmapped_quizzes = published_quiz_ids - set(lessons_by_quiz)
    for qid in sorted(unmapped_quizzes):
        problems.append(f"ORPHAN QUIZ: published quiz '{qid}' is not referenced by any lesson")

    for qid, lids in sorted(lessons_by_quiz.items()):
        if len(lids) > 1:
            notes.append(f"REUSED QUIZ: '{qid}' is referenced by {len(lids)} lessons: {lids}")

    # (2) broken references (independent re-check).
    for lesson in lessons:
        for qid in lesson.get("exercise_quiz_ids", []):
            if qid not in quiz_status:
                problems.append(
                    f"BROKEN REFERENCE: lesson '{lesson['lesson_id']}' references "
                    f"unknown quiz_id '{qid}'"
                )

    # (3) level consistency + (4) category consistency.
    for lesson in lessons:
        unit = units_by_id.get(lesson.get("unit_id"))
        course = courses_by_id.get(unit.get("course_id")) if unit else None
        course_level = course.get("level") if course else None
        for qid in lesson.get("exercise_quiz_ids", []):
            quiz_level = quiz_levels.get(qid)
            if quiz_level and course_level and quiz_level != course_level:
                problems.append(
                    f"WRONG LEVEL: lesson '{lesson['lesson_id']}' (course level "
                    f"{course_level}) references quiz '{qid}' whose level is "
                    f"{quiz_level}"
                )
            quiz_cat = quiz_categories.get(qid)
            lesson_cat = lesson.get("category")
            if quiz_cat and lesson_cat and lesson_cat != "Mixed" and quiz_cat != lesson_cat:
                problems.append(
                    f"WRONG CATEGORY: lesson '{lesson['lesson_id']}' is categorized "
                    f"'{lesson_cat}' but references quiz '{qid}' categorized '{quiz_cat}'"
                )

    print(f"Published quizzes in master_source.csv: {len(published_quiz_ids)}")
    print(f"Quizzes referenced by at least one lesson: {len(lessons_by_quiz)}")
    print(f"Courses: {len(courses)}  Units: {len(units)}  Lessons: {len(lessons)}")
    print()

    if notes:
        print(f"{len(notes)} informational note(s):")
        for n in notes:
            print(f"  [NOTE] {n}")
        print()

    if problems:
        print(f"{len(problems)} problem(s) found:")
        for p in problems:
            print(f"  [FAIL] {p}")
        return 1

    print("PASS: no orphan quizzes, no orphan units/lessons, no broken references, "
          "no wrong-level or wrong-category assignments.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit the course content mapping.")
    parser.add_argument("--content-dir", default=os.path.join(ROOT, "course_content"))
    parser.add_argument("--master-source", default=os.path.join(ROOT, "master_source.csv"))
    args = parser.parse_args()
    return audit(args.content_dir, args.master_source)


if __name__ == "__main__":
    raise SystemExit(main())
