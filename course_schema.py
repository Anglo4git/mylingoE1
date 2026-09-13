#!/usr/bin/env python3
"""
Mylingo Course Data Contract — Agent 73.

Defines and validates the Course -> Unit -> Lesson content shape described
in COURSE_SCHEMA.md. This module is intentionally standalone and
dependency-free (stdlib only), mirroring content_qa.py's style, but it does
NOT import build.py/content_qa.py and does NOT modify master_source.csv or
any file under site/. It only *reads* master_source.csv to validate the one
allowed cross-link: Lesson.exercise_quiz_ids -> quiz_id.

Three layers stay separate (see COURSE_SCHEMA.md):
  - CONTENT (this module): course/unit/lesson records + quiz references.
  - LEARNER STATE (placement/progress/mastery/review): untouched here.
  - PRESENTATION (site/**): untouched here.

Usage:
    python3 course_schema.py validate --content-dir course_content \
        --master-source master_source.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
from dataclasses import dataclass, field
from typing import Any, Iterable

ROOT = os.path.dirname(os.path.abspath(__file__))

LEVELS = ("A1", "A2", "B1", "B2", "C1", "C2")
QUIZ_CATEGORIES = ("Grammar", "Vocabulary", "Writing", "Academic English")
LESSON_CATEGORIES = QUIZ_CATEGORIES + ("Mixed",)
STATUSES = ("draft", "published")

COURSE_ID_RE = re.compile(r"^course-[a-z0-9-]+$")
UNIT_ID_RE = re.compile(r"^(?P<course_id>course-[a-z0-9-]+)-unit-(?P<n>[0-9]{2})$")
LESSON_ID_RE = re.compile(
    r"^(?P<unit_id>course-[a-z0-9-]+-unit-[0-9]{2})-lesson-(?P<n>[0-9]{2})$"
)
YOUTUBE_RE = re.compile(
    r"^https://(www\.youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]+"
)

SEVERITY_RANK = {"error": 3, "warning": 2, "info": 1}


@dataclass
class Issue:
    code: str
    severity: str  # "error" | "warning" | "info"
    entity_type: str
    entity_id: str
    message: str

    def as_dict(self) -> dict:
        return {
            "code": self.code,
            "severity": self.severity,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "message": self.message,
        }


def _issue(issues: list[Issue], code: str, severity: str, entity_type: str,
           entity_id: str, message: str) -> None:
    issues.append(Issue(code, severity, entity_type, entity_id, message))


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_json_array(path: str) -> list[dict]:
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def load_content_dir(content_dir: str) -> tuple[list[dict], list[dict], list[dict]]:
    courses = load_json_array(os.path.join(content_dir, "courses.json"))
    units = load_json_array(os.path.join(content_dir, "units.json"))
    lessons = load_json_array(os.path.join(content_dir, "lessons.json"))
    return courses, units, lessons


def load_quiz_ids(master_source_path: str) -> dict[str, str]:
    """Return {quiz_id: status} from master_source.csv. Read-only."""
    quiz_status: dict[str, str] = {}
    if not master_source_path or not os.path.exists(master_source_path):
        return quiz_status
    with open(master_source_path, "r", encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            qid = (row.get("quiz_id") or "").strip()
            if not qid:
                continue
            # Any published row is enough to mark the quiz published.
            status = (row.get("status") or "").strip()
            if qid not in quiz_status or status == "published":
                quiz_status[qid] = status
    return quiz_status


# ---------------------------------------------------------------------------
# Structural validation
# ---------------------------------------------------------------------------

def _require_fields(record: dict, fields: Iterable[str], entity_type: str,
                     entity_id: str, issues: list[Issue]) -> bool:
    ok = True
    for f in fields:
        if f not in record or record[f] in (None, ""):
            _issue(issues, "CC-E02", "error", entity_type, entity_id,
                   f"missing required field '{f}'")
            ok = False
    return ok


def validate_courses(courses: list[dict], issues: list[Issue]) -> dict[str, dict]:
    by_id: dict[str, dict] = {}
    seen_ids: set[str] = set()
    for c in courses:
        cid = c.get("course_id", "<missing>")
        if cid in seen_ids:
            _issue(issues, "CC-E01", "error", "course", cid, "duplicate course_id")
        seen_ids.add(cid)
        by_id[cid] = c

        _require_fields(
            c, ["course_id", "level", "title", "description", "version",
                "status", "unit_ids"],
            "course", cid, issues,
        )
        if cid != "<missing>" and not COURSE_ID_RE.match(cid):
            _issue(issues, "CC-E03", "error", "course", cid,
                   f"course_id '{cid}' does not match required pattern")
        if c.get("level") not in LEVELS:
            _issue(issues, "CC-E03", "error", "course", cid,
                   f"unknown level '{c.get('level')}'")
        if c.get("status") not in STATUSES:
            _issue(issues, "CC-E03", "error", "course", cid,
                   f"unknown status '{c.get('status')}'")
        if c.get("status") == "published" and not c.get("unit_ids"):
            _issue(issues, "CC-E10", "error", "course", cid,
                   "published course has empty unit_ids")
    return by_id


def validate_units(units: list[dict], courses_by_id: dict[str, dict],
                    issues: list[Issue]) -> dict[str, dict]:
    by_id: dict[str, dict] = {}
    seen_ids: set[str] = set()
    orders_by_course: dict[str, dict[int, str]] = {}

    for u in units:
        uid = u.get("unit_id", "<missing>")
        if uid in seen_ids:
            _issue(issues, "CC-E01", "error", "unit", uid, "duplicate unit_id")
        seen_ids.add(uid)
        by_id[uid] = u

        _require_fields(
            u, ["unit_id", "course_id", "title", "order", "lesson_ids"],
            "unit", uid, issues,
        )
        m = UNIT_ID_RE.match(uid) if uid != "<missing>" else None
        if uid != "<missing>" and not m:
            _issue(issues, "CC-E03", "error", "unit", uid,
                   f"unit_id '{uid}' does not match required pattern")
        elif m and u.get("course_id") and m.group("course_id") != u.get("course_id"):
            _issue(issues, "CC-E03", "error", "unit", uid,
                   "unit_id prefix does not match its own course_id field")

        course_id = u.get("course_id")
        if course_id and course_id not in courses_by_id:
            _issue(issues, "CC-E04", "error", "unit", uid,
                   f"course_id '{course_id}' does not reference an existing course")

        order = u.get("order")
        if isinstance(order, int) and course_id:
            bucket = orders_by_course.setdefault(course_id, {})
            if order in bucket:
                _issue(issues, "CC-E09", "error", "unit", uid,
                       f"order {order} duplicated within course '{course_id}' "
                       f"(also used by '{bucket[order]}')")
            else:
                bucket[order] = uid

        if u.get("status") == "published" and not u.get("lesson_ids"):
            _issue(issues, "CC-E10", "error", "unit", uid,
                   "published unit has empty lesson_ids")

    # unit_ids referenced from courses must exist.
    for cid, c in courses_by_id.items():
        for ref in c.get("unit_ids") or []:
            if ref not in by_id:
                _issue(issues, "CC-E06", "error", "course", cid,
                       f"unit_ids references non-existent unit '{ref}'")

    return by_id


def validate_lessons(lessons: list[dict], units_by_id: dict[str, dict],
                      quiz_status: dict[str, str],
                      issues: list[Issue]) -> dict[str, dict]:
    by_id: dict[str, dict] = {}
    seen_ids: set[str] = set()
    orders_by_unit: dict[str, dict[int, str]] = {}

    for lesson in lessons:
        lid = lesson.get("lesson_id", "<missing>")
        if lid in seen_ids:
            _issue(issues, "CC-E01", "error", "lesson", lid, "duplicate lesson_id")
        seen_ids.add(lid)
        by_id[lid] = lesson

        _require_fields(
            lesson,
            ["lesson_id", "unit_id", "title", "category", "order",
             "revision", "exercise_quiz_ids", "version", "status"],
            "lesson", lid, issues,
        )

        m = LESSON_ID_RE.match(lid) if lid != "<missing>" else None
        if lid != "<missing>" and not m:
            _issue(issues, "CC-E03", "error", "lesson", lid,
                   f"lesson_id '{lid}' does not match required pattern")
        elif m and lesson.get("unit_id") and m.group("unit_id") != lesson.get("unit_id"):
            _issue(issues, "CC-E03", "error", "lesson", lid,
                   "lesson_id prefix does not match its own unit_id field")

        unit_id = lesson.get("unit_id")
        if unit_id and unit_id not in units_by_id:
            _issue(issues, "CC-E05", "error", "lesson", lid,
                   f"unit_id '{unit_id}' does not reference an existing unit")

        if lesson.get("category") not in LESSON_CATEGORIES:
            _issue(issues, "CC-E03", "error", "lesson", lid,
                   f"unknown category '{lesson.get('category')}'")
        if lesson.get("status") not in STATUSES:
            _issue(issues, "CC-E03", "error", "lesson", lid,
                   f"unknown status '{lesson.get('status')}'")

        order = lesson.get("order")
        if isinstance(order, int) and unit_id:
            bucket = orders_by_unit.setdefault(unit_id, {})
            if order in bucket:
                _issue(issues, "CC-E09", "error", "lesson", lid,
                       f"order {order} duplicated within unit '{unit_id}' "
                       f"(also used by '{bucket[order]}')")
            else:
                bucket[order] = lid

        # revision object
        revision = lesson.get("revision")
        if isinstance(revision, dict):
            summary = revision.get("summary")
            if not summary:
                _issue(issues, "CC-E02", "error", "lesson", lid,
                       "revision.summary is required")
            elif len(summary) > 400:
                _issue(issues, "CC-W02", "warning", "lesson", lid,
                       f"revision.summary is {len(summary)} chars (>400, no longer brief)")
            minutes = revision.get("estimated_minutes")
            if isinstance(minutes, (int, float)) and minutes > 10:
                _issue(issues, "CC-W03", "warning", "lesson", lid,
                       f"revision.estimated_minutes is {minutes} (>10)")
        elif revision is not None:
            _issue(issues, "CC-E02", "error", "lesson", lid,
                   "revision must be an object")

        # optional media
        youtube_url = lesson.get("youtube_url")
        if youtube_url and not YOUTUBE_RE.match(youtube_url):
            _issue(issues, "CC-W04", "warning", "lesson", lid,
                   f"youtube_url '{youtube_url}' is not a well-formed YouTube URL")

        # quiz references — the one allowed cross-link to the quiz engine.
        exercise_quiz_ids = lesson.get("exercise_quiz_ids")
        if isinstance(exercise_quiz_ids, list):
            if not exercise_quiz_ids:
                _issue(issues, "CC-E07", "error", "lesson", lid,
                       "exercise_quiz_ids must be non-empty")
            referenced_categories = set()
            for qid in exercise_quiz_ids:
                if qid not in quiz_status:
                    _issue(issues, "CC-E08", "error", "lesson", lid,
                           f"exercise_quiz_ids references unknown quiz_id '{qid}'")
                    continue
                if quiz_status[qid] != "published":
                    _issue(issues, "CC-W05", "warning", "lesson", lid,
                           f"referenced quiz '{qid}' has status "
                           f"'{quiz_status[qid]}' (not published)")

    # lesson_ids referenced from units must exist.
    for uid, u in units_by_id.items():
        for ref in u.get("lesson_ids") or []:
            if ref not in by_id:
                _issue(issues, "CC-E06", "error", "unit", uid,
                       f"lesson_ids references non-existent lesson '{ref}'")

    return by_id


def validate_quiz_references(lessons: list[dict],
                              quiz_categories: dict[str, str],
                              issues: list[Issue]) -> None:
    """CC-W01: soft-check lesson.category against its referenced quizzes'
    quiz_category. quiz_categories: {quiz_id: quiz_category}."""
    for lesson in lessons:
        lid = lesson.get("lesson_id", "<missing>")
        category = lesson.get("category")
        if category == "Mixed" or category is None:
            continue
        for qid in lesson.get("exercise_quiz_ids") or []:
            quiz_cat = quiz_categories.get(qid)
            if quiz_cat and quiz_cat != category:
                _issue(issues, "CC-W01", "warning", "lesson", lid,
                       f"category '{category}' does not match referenced "
                       f"quiz '{qid}' category '{quiz_cat}'")


def load_quiz_categories(master_source_path: str) -> dict[str, str]:
    out: dict[str, str] = {}
    if not master_source_path or not os.path.exists(master_source_path):
        return out
    with open(master_source_path, "r", encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            qid = (row.get("quiz_id") or "").strip()
            if qid and qid not in out:
                out[qid] = (row.get("quiz_category") or "").strip()
    return out


# ---------------------------------------------------------------------------
# Top-level entry point
# ---------------------------------------------------------------------------

def validate(content_dir: str, master_source_path: str | None = None) -> list[Issue]:
    issues: list[Issue] = []
    courses, units, lessons = load_content_dir(content_dir)

    quiz_status = load_quiz_ids(master_source_path) if master_source_path else {}
    quiz_categories = load_quiz_categories(master_source_path) if master_source_path else {}

    courses_by_id = validate_courses(courses, issues)
    units_by_id = validate_units(units, courses_by_id, issues)
    validate_lessons(lessons, units_by_id, quiz_status, issues)
    validate_quiz_references(lessons, quiz_categories, issues)

    issues.sort(key=lambda i: (-SEVERITY_RANK[i.severity], i.code, i.entity_id))
    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate Mylingo course content.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_validate = sub.add_parser("validate", help="Validate a course_content directory.")
    p_validate.add_argument("--content-dir", default=os.path.join(ROOT, "course_content"))
    p_validate.add_argument("--master-source", default=os.path.join(ROOT, "master_source.csv"))
    p_validate.add_argument("--strict", action="store_true",
                             help="Exit non-zero on warnings too, not just errors.")

    args = parser.parse_args(argv)

    if args.cmd == "validate":
        issues = validate(args.content_dir, args.master_source)
        errors = [i for i in issues if i.severity == "error"]
        warnings = [i for i in issues if i.severity == "warning"]

        for i in issues:
            print(f"[{i.severity.upper()}] {i.code} {i.entity_type}:{i.entity_id} — {i.message}")

        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s).")

        if errors:
            return 1
        if args.strict and warnings:
            return 1
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
