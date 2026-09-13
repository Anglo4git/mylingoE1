#!/usr/bin/env python3
"""
Mylingo Course Content Composition — Agent 119.

Resolves the Agent 74 drift-guard conflict documented in
AGENT_109_CONTENT_EXPANSION.md via option (a): the mechanical baseline
mapping (map_quiz_catalog.py, unchanged) and hand-authored curated
additions (curated_lessons.json) are now two explicit, separately
version-controlled inputs that are composed *here*, deterministically,
into the final course_content/{courses,units,lessons}.json.

This script never invents quiz/question content. Every curated addition
in curated_lessons.json must reference only already-published quiz_ids
that already exist in master_source.csv — reuse, not duplication.

Usage:
    python3 apply_curated_content.py \
        --master-source master_source.csv \
        --curated curated_lessons.json \
        --out-dir course_content

The drift guard (test_shipped_content_matches_fresh_generation) now
compares shipped content against *this* script's output rather than
map_quiz_catalog.py's raw output directly, so curated additions are
permitted while accidental hand-edits (anything not traceable to either
master_source.csv or curated_lessons.json) are still caught.
"""

from __future__ import annotations

import argparse
import json
import os

import map_quiz_catalog as mapper

ROOT = os.path.dirname(os.path.abspath(__file__))


def load_curated(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    return data.get("additions", [])


def apply_additions(courses, units, lessons, additions, published_quiz_ids):
    """Append curated lessons to their target units, deterministically.

    Additions are applied in the order they appear in curated_lessons.json
    (itself a plain JSON list, so order is stable). Each addition must
    target an existing unit and reference only already-published quiz_ids.
    Raises ValueError on anything that would silently corrupt the graph
    (unknown unit, unknown quiz, duplicate lesson_id) rather than skipping
    it quietly.
    """
    units_by_id = {u["unit_id"]: u for u in units}
    existing_lesson_ids = {l["lesson_id"] for l in lessons}

    for addition in additions:
        lesson_id = addition["lesson_id"]
        unit_id = addition["unit_id"]

        if lesson_id in existing_lesson_ids:
            raise ValueError(f"curated lesson_id '{lesson_id}' collides with baseline mapping")
        if unit_id not in units_by_id:
            raise ValueError(f"curated addition '{lesson_id}' targets unknown unit '{unit_id}'")

        quiz_ids = addition["exercise_quiz_ids"]
        for qid in quiz_ids:
            if qid not in published_quiz_ids:
                raise ValueError(
                    f"curated addition '{lesson_id}' references quiz_id '{qid}' "
                    "which is not a published quiz in master_source.csv "
                    "(curated additions may only reuse existing published quizzes)"
                )

        unit = units_by_id[unit_id]
        next_order = len(unit["lesson_ids"]) + 1

        lessons.append({
            "lesson_id": lesson_id,
            "unit_id": unit_id,
            "title": addition["title"],
            "category": addition["category"],
            "order": next_order,
            "revision": addition["revision"],
            "presentation_url": None,
            "youtube_url": None,
            "exercise_quiz_ids": list(quiz_ids),
            "version": 1,
            "status": "published",
        })
        unit["lesson_ids"].append(lesson_id)
        existing_lesson_ids.add(lesson_id)

    return courses, units, lessons


def compose(master_source_path: str, curated_path: str):
    quizzes = mapper.load_catalog(master_source_path)
    courses, units, lessons, published, _skipped = mapper.build_mapping(quizzes)
    additions = load_curated(curated_path)
    courses, units, lessons = apply_additions(courses, units, lessons, additions, set(published))
    return courses, units, lessons


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compose baseline quiz mapping + curated additions into course_content/."
    )
    parser.add_argument("--master-source", default=os.path.join(ROOT, "master_source.csv"))
    parser.add_argument("--curated", default=os.path.join(ROOT, "curated_lessons.json"))
    parser.add_argument("--out-dir", default=os.path.join(ROOT, "course_content"))
    args = parser.parse_args()

    courses, units, lessons = compose(args.master_source, args.curated)

    os.makedirs(args.out_dir, exist_ok=True)
    mapper.write_json(os.path.join(args.out_dir, "courses.json"), courses)
    mapper.write_json(os.path.join(args.out_dir, "units.json"), units)
    mapper.write_json(os.path.join(args.out_dir, "lessons.json"), lessons)

    curated_count = len(load_curated(args.curated))
    print(f"baseline lessons: {len(lessons) - curated_count}")
    print(f"curated additions: {curated_count}")
    print(f"total courses: {len(courses)}  units: {len(units)}  lessons: {len(lessons)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
