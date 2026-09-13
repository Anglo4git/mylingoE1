#!/usr/bin/env python3
"""Mylingo — Course/Lesson/Journey content-graph QA (Agent 83).

`course_schema.py` (Agent 73) already validates the *structural* contract
of `course_content/*.json` in isolation (duplicate IDs, dangling
parent/child references, enum values, summary length, YouTube URL shape —
codes `CC-E0x`/`CC-W0x`). This module does not re-implement or weaken any
of that; it reuses `course_schema.validate()` as-is and adds the checks
from the Agent 83 handoff that require looking *across* the graph and
*into the built site*, which a single-directory schema check cannot see:

  - orphan quizzes (published in master_source.csv, never referenced by
    any lesson) and duplicate quiz references within one lesson,
  - drift between a lesson's `exercise_quiz_ids` and what the level's
    built `quizzes.json` manifest / physical quiz JSON file actually
    contain (id, question count) — content that could bypass
    `content_qa.py`/`course_schema.py` by disagreeing with the shipped
    site rather than with the CSV,
  - a lesson's course level not matching the level of a quiz it
    references (wrong-level mapping),
  - a lesson_id claimed by more than one unit (the one shape that would
    make the course->unit->lesson tree non-tree-shaped, i.e. capable of
    "circular" journey traversal),
  - `site/course_content/*.json` drifting out of sync with the canonical
    `course_content/*.json` the presentation layer is supposed to mirror,
  - unsafe URI schemes in any question's media reference.

Severity model matches the project convention (error > warning > info).
Guardrail: this module never repairs content. It only detects and reports.
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

import course_schema as cs

ROOT = os.path.dirname(os.path.abspath(__file__))
VALID_LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"]
UNSAFE_URI_RE = re.compile(r"^\s*(javascript:|data:text/html|vbscript:)", re.I)

SEVERITY_RANK = {"error": 0, "warning": 1, "info": 2}


@dataclass
class Issue:
    code: str
    severity: str
    message: str
    ref: str = ""


@dataclass
class Report:
    issues: list = field(default_factory=list)

    def add(self, code: str, severity: str, message: str, ref: str = "") -> None:
        self.issues.append(Issue(code, severity, message, ref))

    def by_severity(self, severity: str):
        return [i for i in self.issues if i.severity == severity]


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def load_master_source(path: str):
    """quiz_id -> {level, category, status, title, row_count}."""
    quizzes: dict[str, dict[str, Any]] = {}
    with open(path, newline="", encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            qid = row["quiz_id"]
            entry = quizzes.setdefault(
                qid,
                {
                    "level": row["level"],
                    "category": row["quiz_category"],
                    "status": row["status"],
                    "title": row["title"],
                    "row_count": 0,
                },
            )
            entry["row_count"] += 1
    return quizzes


def check_orphans_and_duplicates(lessons, quizzes, report: Report) -> None:
    referenced: dict[str, list[str]] = {}
    for lesson in lessons:
        ids = lesson.get("exercise_quiz_ids") or []
        seen = set()
        for qid in ids:
            if qid in seen:
                report.add(
                    "CQG-E01", "error",
                    f"Lesson {lesson.get('lesson_id')} lists quiz {qid!r} more than once "
                    "in exercise_quiz_ids.",
                    lesson.get("lesson_id", ""),
                )
            seen.add(qid)
            referenced.setdefault(qid, []).append(lesson.get("lesson_id", ""))

    for qid, info in quizzes.items():
        if info["status"] == "published" and qid not in referenced:
            report.add(
                "CQG-W01", "warning",
                f"Quiz {qid!r} ({info['level']}/{info['category']}) is published but not "
                "referenced by any lesson — orphaned content.",
                qid,
            )


def check_level_alignment(lessons, units, courses, quizzes, report: Report) -> None:
    unit_by_id = {u["unit_id"]: u for u in units}
    course_by_id = {c["course_id"]: c for c in courses}
    for lesson in lessons:
        unit = unit_by_id.get(lesson.get("unit_id"))
        if not unit:
            continue  # CC-E05 (course_schema.py) already flags this dangling ref
        course = course_by_id.get(unit.get("course_id"))
        if not course:
            continue  # CC-E04 already flags this
        course_level = course.get("level")
        for qid in lesson.get("exercise_quiz_ids") or []:
            info = quizzes.get(qid)
            if info and info["level"] and info["level"] != course_level:
                report.add(
                    "CQG-W02", "warning",
                    f"Lesson {lesson.get('lesson_id')} belongs to a {course_level} course but "
                    f"references quiz {qid!r}, which is level {info['level']}.",
                    lesson.get("lesson_id", ""),
                )


def check_lesson_tree_shape(units, report: Report) -> None:
    """A lesson claimed by >1 unit turns the course->unit->lesson hierarchy
    from a tree into a graph, which is the one shape in this schema that
    could make journey traversal ("next lesson in this unit") ambiguous or
    cyclical. There is no explicit prerequisite/next-lesson graph in this
    schema (journey order is purely derived from course/unit/lesson
    `order` fields at render time), so this is the full extent of what
    "circular journey reference" can mean here — see the QA report for the
    explicit disposition."""
    owner: dict[str, str] = {}
    for unit in units:
        for lid in unit.get("lesson_ids") or []:
            if lid in owner and owner[lid] != unit["unit_id"]:
                report.add(
                    "CQG-E05", "error",
                    f"Lesson {lid!r} is listed under both unit {owner[lid]!r} and "
                    f"{unit['unit_id']!r} — the course/unit/lesson tree must be "
                    "single-parent, or journey traversal becomes ambiguous.",
                    lid,
                )
            owner[lid] = unit["unit_id"]


def check_site_manifest_drift(lessons, quizzes, site_dir: str, report: Report) -> None:
    manifests: dict[str, list] = {}
    for level in VALID_LEVELS:
        manifest_path = os.path.join(site_dir, level, "quizzes.json")
        if not os.path.isfile(manifest_path):
            continue
        try:
            manifests[level] = load_json(manifest_path)
        except (OSError, json.JSONDecodeError) as exc:
            report.add("CQG-E02", "error", f"Could not read {manifest_path}: {exc}", level)

    manifest_by_id: dict[str, dict] = {}
    for level, entries in manifests.items():
        for entry in entries:
            manifest_by_id[entry.get("id")] = {"level": level, **entry}

    checked_files: dict[str, int] = {}
    for lesson in lessons:
        for qid in lesson.get("exercise_quiz_ids") or []:
            entry = manifest_by_id.get(qid)
            if not entry:
                report.add(
                    "CQG-E02", "error",
                    f"Lesson {lesson.get('lesson_id')} references quiz {qid!r}, which is not "
                    "listed in any built site/*/quizzes.json manifest (site build drift).",
                    lesson.get("lesson_id", ""),
                )
                continue
            file_path = os.path.join(site_dir, entry["file"])
            if qid not in checked_files:
                if not os.path.isfile(file_path):
                    report.add(
                        "CQG-E02", "error",
                        f"Quiz {qid!r} manifest entry points at missing file {entry['file']}.",
                        qid,
                    )
                else:
                    try:
                        data = load_json(file_path)
                    except (OSError, json.JSONDecodeError) as exc:
                        report.add("CQG-E02", "error", f"{file_path} is not valid JSON: {exc}", qid)
                        data = None
                    if isinstance(data, dict):
                        actual_q = len(data.get("questions") or [])
                        manifest_q = entry.get("questions")
                        csv_q = quizzes.get(qid, {}).get("row_count")
                        if manifest_q is not None and actual_q != manifest_q:
                            report.add(
                                "CQG-E03", "error",
                                f"Quiz {qid!r}: manifest says {manifest_q} questions, file has "
                                f"{actual_q}.",
                                qid,
                            )
                        if csv_q is not None and actual_q != csv_q:
                            report.add(
                                "CQG-E03", "error",
                                f"Quiz {qid!r}: master_source.csv has {csv_q} question rows, "
                                f"built file has {actual_q}.",
                                qid,
                            )
                checked_files[qid] = 1


def check_content_dir_mirror(content_dir: str, site_content_dir: str, report: Report) -> None:
    if not os.path.isdir(site_content_dir):
        return
    for name in ("courses.json", "units.json", "lessons.json"):
        canonical = os.path.join(content_dir, name)
        mirror = os.path.join(site_content_dir, name)
        if not os.path.isfile(mirror):
            report.add("CQG-E04", "error", f"{mirror} is missing (mirror of {canonical}).", name)
            continue
        try:
            if load_json(canonical) != load_json(mirror):
                report.add(
                    "CQG-E04", "error",
                    f"site/course_content/{name} has drifted out of sync with "
                    f"course_content/{name} — the presentation layer would serve stale "
                    "course-graph data.",
                    name,
                )
        except (OSError, json.JSONDecodeError) as exc:
            report.add("CQG-E04", "error", f"Could not compare {name}: {exc}", name)


def check_media_safety(site_dir: str, report: Report) -> None:
    """Scan every built quiz's questions for an unsafe media URI scheme.
    There is currently no media content in this dataset (all quizzes are
    text-only), so this is expected to find nothing today — see the QA
    report for that explicit disposition — but it must run every time so a
    future media-bearing quiz can't ship an unsafe reference silently."""
    seen_files = set()
    for level in VALID_LEVELS:
        manifest_path = os.path.join(site_dir, level, "quizzes.json")
        if not os.path.isfile(manifest_path):
            continue
        try:
            entries = load_json(manifest_path)
        except (OSError, json.JSONDecodeError):
            continue
        for entry in entries:
            file_path = os.path.join(site_dir, entry.get("file", ""))
            if not file_path or file_path in seen_files or not os.path.isfile(file_path):
                continue
            seen_files.add(file_path)
            try:
                data = load_json(file_path)
            except (OSError, json.JSONDecodeError):
                continue
            if not isinstance(data, dict):
                continue
            for q in data.get("questions") or []:
                if not isinstance(q, dict):
                    continue
                media = q.get("media") if isinstance(q.get("media"), dict) else {}
                candidates = [
                    media.get("image"), media.get("audio"),
                    q.get("imageUrl"), q.get("audioUrl"),
                ]
                for value in candidates:
                    src = value.get("src") if isinstance(value, dict) else value
                    if isinstance(src, str) and UNSAFE_URI_RE.match(src):
                        report.add(
                            "CQG-W03", "warning",
                            f"Unsafe media URI scheme in {entry.get('id')} "
                            f"(question {q.get('question_number')}): {src!r}",
                            entry.get("id", ""),
                        )


def run(content_dir: str, master_source: str, site_dir: str) -> Report:
    report = Report()

    # 1. Reuse Agent 73's structural contract as-is (do not re-derive it).
    schema_issues = cs.validate(content_dir, master_source)
    for issue in schema_issues:
        report.add(issue.code, issue.severity, issue.message, issue.entity_id)

    courses = cs.load_json_array(os.path.join(content_dir, "courses.json"))
    units = cs.load_json_array(os.path.join(content_dir, "units.json"))
    lessons = cs.load_json_array(os.path.join(content_dir, "lessons.json"))
    quizzes = load_master_source(master_source)

    # 2. Cross-graph + cross-site checks from the Agent 83 handoff.
    check_orphans_and_duplicates(lessons, quizzes, report)
    check_level_alignment(lessons, units, courses, quizzes, report)
    check_lesson_tree_shape(units, report)
    check_site_manifest_drift(lessons, quizzes, site_dir, report)
    check_content_dir_mirror(content_dir, os.path.join(site_dir, "course_content"), report)
    check_media_safety(site_dir, report)

    return report


def render(report: Report) -> str:
    lines = ["# Course Content QA (Agent 83)", ""]
    counts = {"error": len(report.by_severity("error")),
              "warning": len(report.by_severity("warning")),
              "info": len(report.by_severity("info"))}
    lines.append(f"{counts['error']} error(s), {counts['warning']} warning(s), "
                 f"{counts['info']} info.")
    if report.issues:
        lines.append("")
        for sev in ("error", "warning", "info"):
            group = report.by_severity(sev)
            if not group:
                continue
            lines.append(f"## {sev.title()}s ({len(group)})")
            for issue in group:
                lines.append(f"- `{issue.code}` {issue.message}")
            lines.append("")
    return "\n".join(lines)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Course/Lesson/Journey content-graph QA.")
    parser.add_argument("--content-dir", default=os.path.join(ROOT, "course_content"))
    parser.add_argument("--master-source", default=os.path.join(ROOT, "master_source.csv"))
    parser.add_argument("--site-dir", default=os.path.join(ROOT, "site"))
    parser.add_argument("--strict", action="store_true",
                         help="Exit non-zero on warnings too, not just errors.")
    args = parser.parse_args(argv)

    report = run(args.content_dir, args.master_source, args.site_dir)
    print(render(report))

    if report.by_severity("error"):
        return 1
    if args.strict and report.by_severity("warning"):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
