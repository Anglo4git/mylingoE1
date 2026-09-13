#!/usr/bin/env python3
"""
Mylingo Course Content Mapping — Agent 74.

Deterministically maps every published quiz in master_source.csv into the
Course -> Unit -> Lesson shape defined by Agent 73 (COURSE_SCHEMA.md /
course_schema.py), and writes course_content/{courses,units,lessons}.json.

This is a MAPPING layer, not an authoring tool: it never invents question
content, and it reuses only fields that already exist in master_source.csv
(title, description, level, quiz_category). Re-running this script is
idempotent and deterministic — same input, same output, every time.

Mapping rule (see COURSE_CONTENT_MAPPING.md for the full rationale):
  - One course per CEFR level: course-a1 .. course-c2.
  - One unit per (level, quiz_category) bucket that exists in
    master_source.csv, in the fixed category order
    Grammar, Vocabulary, Writing, Academic English. This exactly mirrors
    the 19 level+category buckets already named in
    production_quiz_profiles.json — no new grouping concept introduced.
  - One lesson per quiz, in ascending quiz_id order within its unit.
    lesson.title = quiz.title, lesson.category = quiz.quiz_category,
    lesson.exercise_quiz_ids = [quiz_id] (single-quiz lessons; see
    COURSE_CONTENT_MAPPING.md for why 1:1 was chosen over clustering).
  - lesson.revision.summary = quiz.description, reused verbatim (it is
    already-published editorial metadata, not question/answer content).
    Richer revision authoring (explanations, examples, key_terms) is
    explicitly out of scope for this mapping pass — see the handoff notes.

Usage:
    python3 map_quiz_catalog.py --master-source master_source.csv \
        --out-dir course_content
"""

from __future__ import annotations

import argparse
import csv
import json
import os
from collections import OrderedDict, defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))

LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
CATEGORY_ORDER = ["Grammar", "Vocabulary", "Writing", "Academic English"]


def load_catalog(master_source_path: str) -> "OrderedDict[str, dict]":
    """First-seen row per quiz_id, preserving CSV order (deterministic)."""
    quizzes: "OrderedDict[str, dict]" = OrderedDict()
    with open(master_source_path, "r", encoding="utf-8", newline="") as fh:
        for row in csv.DictReader(fh):
            qid = (row.get("quiz_id") or "").strip()
            if not qid or qid in quizzes:
                continue
            quizzes[qid] = {
                "level": (row.get("level") or "").strip(),
                "title": (row.get("title") or "").strip(),
                "description": (row.get("description") or "").strip(),
                "category": (row.get("quiz_category") or "").strip(),
                "status": (row.get("status") or "").strip(),
            }
    return quizzes


def build_mapping(quizzes: "OrderedDict[str, dict]"):
    published = {qid: q for qid, q in quizzes.items() if q["status"] == "published"}
    skipped = {qid: q for qid, q in quizzes.items() if q["status"] != "published"}

    # Group published quizzes by (level, category), preserving quiz_id order.
    buckets: dict[tuple[str, str], list[str]] = defaultdict(list)
    for qid, q in published.items():
        buckets[(q["level"], q["category"])].append(qid)
    for qids in buckets.values():
        qids.sort()

    courses, units, lessons = [], [], []

    for level in LEVEL_ORDER:
        course_id = f"course-{level.lower()}"
        level_buckets = [
            (level, cat) for cat in CATEGORY_ORDER if (level, cat) in buckets
        ]
        if not level_buckets:
            continue  # no published content at this level yet

        unit_ids_for_course = []
        for unit_index, (lvl, category) in enumerate(level_buckets, start=1):
            unit_id = f"{course_id}-unit-{unit_index:02d}"
            unit_ids_for_course.append(unit_id)

            lesson_ids_for_unit = []
            for lesson_index, qid in enumerate(buckets[(lvl, category)], start=1):
                q = published[qid]
                lesson_id = f"{unit_id}-lesson-{lesson_index:02d}"
                lesson_ids_for_unit.append(lesson_id)
                lessons.append({
                    "lesson_id": lesson_id,
                    "unit_id": unit_id,
                    "title": q["title"],
                    "category": category,
                    "order": lesson_index,
                    "revision": {
                        "summary": q["description"] or f"Practice {q['title']}.",
                    },
                    "presentation_url": None,
                    "youtube_url": None,
                    "exercise_quiz_ids": [qid],
                    "version": 1,
                    "status": "published",
                })

            units.append({
                "unit_id": unit_id,
                "course_id": course_id,
                "title": category,
                "order": unit_index,
                "lesson_ids": lesson_ids_for_unit,
            })

        courses.append({
            "course_id": course_id,
            "level": level,
            "title": f"English {level}",
            "description": f"A guided path through {level}-level content, organized by topic.",
            "version": 1,
            "status": "published",
            "unit_ids": unit_ids_for_course,
        })

    return courses, units, lessons, published, skipped


def write_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
        fh.write("\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Map the quiz catalog into course content.")
    parser.add_argument("--master-source", default=os.path.join(ROOT, "master_source.csv"))
    parser.add_argument("--out-dir", default=os.path.join(ROOT, "course_content"))
    args = parser.parse_args()

    quizzes = load_catalog(args.master_source)
    courses, units, lessons, published, skipped = build_mapping(quizzes)

    os.makedirs(args.out_dir, exist_ok=True)
    write_json(os.path.join(args.out_dir, "courses.json"), courses)
    write_json(os.path.join(args.out_dir, "units.json"), units)
    write_json(os.path.join(args.out_dir, "lessons.json"), lessons)

    mapped_quiz_ids = {qid for lesson in lessons for qid in lesson["exercise_quiz_ids"]}
    print(f"quizzes in catalog: {len(quizzes)}")
    print(f"published quizzes: {len(published)}")
    print(f"skipped (non-published) quizzes: {len(skipped)}")
    print(f"courses: {len(courses)}  units: {len(units)}  lessons: {len(lessons)}")
    print(f"mapped quiz_ids: {len(mapped_quiz_ids)}")
    unmapped = set(published) - mapped_quiz_ids
    if unmapped:
        print(f"WARNING: {len(unmapped)} published quizzes were not mapped: {sorted(unmapped)}")
        return 1
    print("Every published quiz is mapped to exactly one lesson.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
