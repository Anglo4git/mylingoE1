#!/usr/bin/env python3
"""
Mylingo site generator — Agent 3.

Reads a master source (CSV or XLSX, one row per question) and produces, per
CEFR level: quizzes.json (manifest) + quizzes/<quiz_id>.json (quiz datasets),
matching the exact JSON shape Agent 1's runtime (shared/quiz.html) already
consumes:

  manifest entry: file, id, title, description, category, tags, level,
                  questions (count), optional source-derived date, version
  quiz file:      id, title, description, brand, category, tags, level,
                  version, questions[]
  question:       question, category, tags, explanation, correctIndex (1-based),
                  answers[] (2-9 strings)

Commands:
    python3 build.py validate --input master_source.csv
    python3 build.py build    --input master_source.csv --out ./site --report BUILD_REPORT.md

Design goals (per HANDOFF_5_AGENTS.md):
    - Deterministic / idempotent: identical input -> byte-identical output on
      every run. Manifest dates are copied only from valid source metadata
      (`date_updated`/`date_added`); no build-time clock is embedded.
    - Does not touch shared/quiz.html, index.html, dashboard.html, or main/ —
      those are Agent 1/4's runtime and are copied verbatim, never regenerated.
    - Named, countable validation failures (rule IDs), not a single pass/fail.
"""

import argparse
import csv
import json
import os
from pathlib import Path
import re

from offline_packs import PACK_VERSION, verify_offline_packs, write_offline_packs
import shutil
import sys
from collections import defaultdict
from datetime import datetime, timezone

LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
VALID_STATUS = {"draft", "in_review", "approved", "published", "retired"}
MAX_ANSWERS = 9
MIN_ANSWERS = 2
ANSWER_COLS = [f"answer_{i}" for i in range(1, MAX_ANSWERS + 1)]

REQUIRED_QUIZ_FIELDS = ["quiz_id", "level", "title", "description",
                        "quiz_category", "quiz_tags", "version", "status"]

# Agent 66 — scale release-gate budgets. These turn the "whole-dataset
# in one file" risk (see MYLINGO scale-hardening handoff) into a blocking,
# automatically-checked release gate instead of a design intention. Each
# bound has generous headroom over the current sample dataset (see
# AGENT_66_COMPLETION.md for the sizing math) while still catching an
# accidental full-corpus dump into a single quiz file or level manifest.
MAX_QUESTIONS_PER_QUIZ_FILE = 300
MAX_QUIZ_FILE_BYTES = 250_000
MAX_MANIFEST_FILE_BYTES = 3_000_000
REQUIRED_QUESTION_FIELDS = ["question_number", "question_text",
                            "explanation", "correct_index"]

# Content Schema v2 (07_CONTENT_SCHEMA_V2.md): optional, appended columns.
# Never required — the 23 canonical columns above stay frozen. Only checked
# when the source file actually includes the column at all.
SCHEMA_V2_DATE_COLUMNS = ["date_added", "date_updated"]

# Agent 64 — canonical learning metadata. These columns are optional and
# additive so the frozen 23-column source contract remains compatible.
CANONICAL_METADATA_COLUMNS = [
    "skill", "subskill", "objective", "learning_objective",
    "difficulty", "cefr", "estimated_time_seconds",
]
CANONICAL_SKILLS = {"grammar", "vocabulary", "reading", "listening", "writing", "usage"}
CANONICAL_CATEGORY_SKILL = {
    "grammar": "grammar", "vocabulary": "vocabulary", "reading": "reading",
    "listening": "listening", "writing": "writing", "usage": "usage",
    "academic english": "usage",
}

# Rich Question Authoring MVP optional columns. Values are JSON encoded
# for arrays/objects when exported from the browser authoring app. Unknown
# columns remain harmless, but these are promoted into learner-facing JSON.
RICH_QUESTION_COLUMNS = [
    "question_type", "subprompt", "accepted_answers", "tolerance",
    "pairs", "items", "correct_order", "image_url", "image_alt",
    "audio_url", "audio_label"
]
RICH_TYPES = {"radio", "text", "short_text", "fill_in_the_blank", "number", "date", "matching", "ranking"}

def _rich_json(value, fallback):
    if value is None:
        return fallback
    text = str(value).strip()
    if not text:
        return fallback
    try:
        return json.loads(text)
    except (TypeError, ValueError, json.JSONDecodeError):
        return fallback


def _is_iso_datetime(value):
    """True if value parses as an ISO 8601 date or date-time string."""
    if not value:
        return False
    try:
        datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


def _normalize_ranking_item(value):
    """Canonical comparison value for ranking items."""
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def _ranking_order_valid(items, order):
    """Return True when correct_order is a unique permutation of items."""
    if not isinstance(items, list) or not isinstance(order, list):
        return False
    if len(items) < 2 or len(order) != len(items):
        return False
    normalized_items = [_normalize_ranking_item(v) for v in items]
    normalized_order = [_normalize_ranking_item(v) for v in order]
    if any(not v for v in normalized_items + normalized_order):
        return False
    if len(set(normalized_items)) != len(normalized_items):
        return False
    if len(set(normalized_order)) != len(normalized_order):
        return False
    return set(normalized_order) == set(normalized_items)


class ValidationError:
    __slots__ = ("rule_id", "ref", "message")

    def __init__(self, rule_id, ref, message):
        self.rule_id = rule_id
        self.ref = ref
        self.message = message

    def __str__(self):
        return f"[{self.rule_id}] {self.ref}: {self.message}"


def read_rows(path):
    """Read the master source as a list of dicts. Supports .csv and .xlsx."""
    if path.lower().endswith(".xlsx"):
        import openpyxl
        wb = openpyxl.load_workbook(path, data_only=True)
        ws = wb["Quizzes"] if "Quizzes" in wb.sheetnames else wb.active
        rows_iter = ws.iter_rows(values_only=True)
        headers = [str(h).strip() if h is not None else "" for h in next(rows_iter)]
        rows = []
        for raw in rows_iter:
            if all(v is None for v in raw):
                continue
            row = {headers[i]: ("" if raw[i] is None else raw[i])
                   for i in range(len(headers))}
            rows.append(row)
        return rows
    else:
        with open(path, newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))


def iter_rows_streaming(path):
    """Yield master-source rows one at a time instead of materializing the
    whole file as a list. Used by the CLI (validate/build/release-gate)
    so a 1.2M-row source isn't held twice in memory (once as a flat list,
    once regrouped into `quizzes` by validate()) — only the `quizzes`
    grouping, which the build genuinely needs, stays resident.

    .xlsx still goes through read_rows() (openpyxl already loads the whole
    workbook, so there's nothing to stream there); this only changes the
    CSV path, which is what a 1.2M-question source will actually use.
    read_rows() itself is untouched and keeps returning a full list — other
    callers (generation/, tests) rely on that list-returning contract.
    """
    if path.lower().endswith(".xlsx"):
        yield from read_rows(path)
        return
    with open(path, newline="", encoding="utf-8") as f:
        yield from csv.DictReader(f)


class _CountingIter:
    """Wraps an iterable and tracks how many items were yielded, so the CLI
    can report a row count after a single streaming pass without keeping
    the rows themselves around."""

    def __init__(self, iterable):
        self._iterable = iterable
        self.count = 0

    def __iter__(self):
        for item in self._iterable:
            self.count += 1
            yield item


def _validate_canonical_metadata(row, ref, errors, warnings):
    """Validate optional skill/objective metadata without blocking legacy rows."""
    skill = str(row.get("skill", "") or "").strip().lower()
    if skill and skill not in CANONICAL_SKILLS:
        warnings.append(ValidationError("V-M1", ref, f"unknown skill '{skill}' (expected one of {sorted(CANONICAL_SKILLS)})"))
    objective = str(row.get("objective", "") or row.get("learning_objective", "") or "").strip()
    if row.get("objective", "") not in (None, "") and not objective:
        warnings.append(ValidationError("V-M2", ref, "objective is present but empty"))
    difficulty = str(row.get("difficulty", "") or "").strip()
    if difficulty:
        try:
            value = float(difficulty)
            if value < 1 or value > 5:
                warnings.append(ValidationError("V-M3", ref, "difficulty must be between 1 and 5 when supplied"))
        except ValueError:
            warnings.append(ValidationError("V-M3", ref, "difficulty must be numeric when supplied"))


def validate(rows):
    """Run every V-* rule against the row set. Returns (errors, warnings, quizzes).

    quizzes: dict quiz_id -> {meta fields, questions: [rows sorted by question_number]}

    `rows` may be a list or any single-pass iterable (e.g. a streamed CSV
    reader) — this only ever iterates it once, in order, and never indexes
    or re-reads it, so a generator works exactly like a list here.
    """
    errors = []
    warnings = []
    quizzes = defaultdict(list)
    seen_question_ids = set()

    for idx, row in enumerate(rows):
        rownum = idx + 2  # +1 header, +1 1-indexed
        ref = f"row {rownum} (quiz_id={row.get('quiz_id','?')})"
        _validate_canonical_metadata(row, ref, errors, warnings)

        # Content Schema v2: these columns are opt-in per dataset. Only run
        # the format check when the source actually has the column at all,
        # so files written against the frozen v1 23-column shape are
        # entirely unaffected. Checked per-row (cheap dict membership test)
        # rather than pre-checked against rows[0], since `rows` may now be
        # a generator that can't be indexed or re-read.
        has_date_added = "date_added" in row
        has_date_updated = "date_updated" in row

        # V-H1/V-H2 (Content Schema v2, optional columns): format only, not
        # presence — an empty value in a present column is valid (a row may
        # simply not have been touched under schema v2 yet).
        if has_date_added:
            date_added = str(row.get("date_added", "") or "").strip()
            if date_added and not _is_iso_datetime(date_added):
                warnings.append(ValidationError(
                    "V-H1", ref, f"date_added '{date_added}' is not a valid ISO 8601 date/time"))
        if has_date_updated:
            date_updated = str(row.get("date_updated", "") or "").strip()
            if date_updated and not _is_iso_datetime(date_updated):
                warnings.append(ValidationError(
                    "V-H2", ref, f"date_updated '{date_updated}' is not a valid ISO 8601 date/time"))

        # V-A1 / V-A2: required fields
        for field in REQUIRED_QUIZ_FIELDS + REQUIRED_QUESTION_FIELDS:
            if str(row.get(field, "")).strip() == "":
                errors.append(ValidationError("V-A1/A2", ref, f"missing required field '{field}'"))

        quiz_id = str(row.get("quiz_id", "")).strip()
        level = str(row.get("level", "")).strip().upper()

        # V-C1: level enum
        if level and level not in LEVELS:
            errors.append(ValidationError("V-C1", ref, f"invalid level '{level}'"))

        # V-A4: quiz_id must be {level}-{seq}, prefix must match level
        if quiz_id:
            prefix = quiz_id.split("-")[0].upper()
            if prefix != level:
                errors.append(ValidationError(
                    "V-A4", ref,
                    f"quiz_id prefix '{prefix}' does not match level '{level}'"))

        # V-C4: status enum
        status = str(row.get("status", "")).strip().lower()
        if status and status not in VALID_STATUS:
            errors.append(ValidationError("V-C4", ref, f"invalid status '{status}'"))

        # question_number must be a positive int
        try:
            qnum = int(row.get("question_number"))
            if qnum < 1:
                raise ValueError()
        except (TypeError, ValueError):
            errors.append(ValidationError("V-A3", ref, "question_number must be a positive integer"))
            qnum = None

        # correct_index must be an int
        try:
            correct_index = int(row.get("correct_index"))
        except (TypeError, ValueError):
            errors.append(ValidationError("V-D1", ref, "correct_index must be an integer"))
            correct_index = None

        rich_type = str(row.get("question_type", "") or "").strip().lower().replace("-", "_")

        # answers: contiguous, 2-9, no gaps for multiple choice/ranking/matching
        # authoring rows. Text-like rich questions use accepted_answers instead.
        answers = []
        gap_found = False
        for col in ANSWER_COLS:
            val = str(row.get(col, "") or "").strip()
            if val == "":
                gap_found = True
                continue
            if gap_found:
                errors.append(ValidationError(
                    "V-D2", ref, f"gap in answer columns before '{col}' — answers must be contiguous"))
            answers.append(val)

        if rich_type in {"text", "short_text", "fill_in_the_blank", "number", "date"}:
            if len(answers) > MAX_ANSWERS:
                errors.append(ValidationError("V-D2", ref, f"{len(answers)} answer(s) provided; maximum is {MAX_ANSWERS}"))
        else:
            if len(answers) < MIN_ANSWERS:
                errors.append(ValidationError(
                    "V-D2", ref, f"only {len(answers)} answer(s) provided; minimum is {MIN_ANSWERS}"))
            elif len(answers) > MAX_ANSWERS:
                errors.append(ValidationError(
                    "V-D2", ref, f"{len(answers)} answers provided; maximum is {MAX_ANSWERS}"))

        # V-D6 (adapted): correct_index must reference a real answer position
        # only when answer choices are the grading primitive. Rich text/date
        # questions grade against accepted_answers instead.
        if rich_type not in {"text", "short_text", "fill_in_the_blank", "number", "date"}:
            if correct_index is not None and answers:
                if not (1 <= correct_index <= len(answers)):
                    errors.append(ValidationError(
                        "V-D6", ref,
                        f"correct_index {correct_index} out of range for {len(answers)} answer(s)"))

        # duplicate answers within a question (V-B4)
        if rich_type not in {"text", "short_text", "fill_in_the_blank", "number", "date"} and len(answers) != len(set(a.lower() for a in answers)):
            errors.append(ValidationError("V-B4", ref, "duplicate answer options within one question"))

        # Rich Question Authoring MVP: optional typed-question validation.
        rich_type = str(row.get("question_type", "") or "").strip().lower().replace("-", "_")
        if rich_type and rich_type not in RICH_TYPES:
            errors.append(ValidationError("V-R1", ref, f"invalid question_type '{rich_type}'"))
        if rich_type in {"text", "short_text", "fill_in_the_blank", "number", "date"}:
            accepted = _rich_json(row.get("accepted_answers"), [])
            if not isinstance(accepted, list) or not accepted:
                errors.append(ValidationError("V-R2", ref, "text-like rich question needs a non-empty accepted_answers list"))
        if rich_type == "matching":
            pairs = _rich_json(row.get("pairs"), [])
            if not isinstance(pairs, list) or len(pairs) < 2 or any(not isinstance(p, dict) or not str(p.get("left", "")).strip() or not str(p.get("right", "")).strip() for p in pairs):
                errors.append(ValidationError("V-R3", ref, "matching question needs at least 2 complete pairs"))
        if rich_type == "ranking":
            items = _rich_json(row.get("items"), [])
            order = _rich_json(row.get("correct_order"), [])
            if not _ranking_order_valid(items, order):
                errors.append(ValidationError("V-R4", ref, "ranking correct_order must be a unique permutation of items"))
        if row.get("image_url") and not str(row.get("image_alt", "") or "").strip():
            warnings.append(ValidationError("V-R5", ref, "image_url is present without image_alt"))

        # explanation length (V-E3, soft)
        explanation = str(row.get("explanation", "") or "").strip()
        if explanation and len(explanation) < 10:
            warnings.append(ValidationError("V-E3", ref, "explanation is suspiciously short"))

        # question_id uniqueness (derived, not required as an input column —
        # generator derives it as {quiz_id}-q{NN} and checks for collisions)
        derived_qid = f"{quiz_id}-q{qnum:02d}" if quiz_id and qnum else None
        if derived_qid:
            if derived_qid in seen_question_ids:
                errors.append(ValidationError("V-B2", ref, f"duplicate derived question_id '{derived_qid}'"))
            seen_question_ids.add(derived_qid)

        if quiz_id:
            quizzes[quiz_id].append({**row, "_question_number": qnum, "_correct_index": correct_index,
                                      "_answers": answers, "_level": level, "_status": status})

    # Per-quiz checks
    for quiz_id, qrows in quizzes.items():
        ref = f"quiz {quiz_id}"

        # V-A3: contiguous question_number starting at 1, no duplicates
        nums = sorted(r["_question_number"] for r in qrows if r["_question_number"] is not None)
        expected = list(range(1, len(nums) + 1))
        if nums != expected:
            errors.append(ValidationError(
                "V-A3", ref, f"question_number set {nums} is not a contiguous run starting at 1"))

        # V-G1: status must be uniform across the whole quiz
        statuses = set(r["_status"] for r in qrows)
        if len(statuses) > 1:
            errors.append(ValidationError(
                "V-G1", ref, f"mixed status values across rows of one quiz: {sorted(statuses)}"))

        # V-B3: duplicate question_text within a quiz
        texts = [str(r.get("question_text", "")).strip().lower() for r in qrows]
        if len(texts) != len(set(texts)):
            errors.append(ValidationError("V-B3", ref, "duplicate question_text within this quiz"))

        # V-E2: question count sanity (soft ceiling, hard floor for published)
        first = qrows[0]
        if first["_status"] == "published" and len(qrows) < 1:
            errors.append(ValidationError("V-E2", ref, "published quiz has zero questions"))
        if len(qrows) > 150:
            warnings.append(ValidationError("V-E2", ref, f"{len(qrows)} questions exceeds soft ceiling of 150"))

        # consistent level/title/etc across rows of the same quiz (basic sanity)
        for field in ["level", "title", "description", "quiz_category", "quiz_tags", "version"]:
            vals = set(str(r.get(field, "")).strip() for r in qrows)
            if len(vals) > 1:
                errors.append(ValidationError(
                    "V-A1/A2", ref, f"inconsistent '{field}' across rows of the same quiz: {vals}"))

    return errors, warnings, quizzes


def topic_slug(category):
    """Slugify a quiz_category value into its top-level topic folder name,
    e.g. 'Academic English' -> 'academic-english'. Content lives under
    site/<topic-slug>/<level>/<quiz_id>.json so each topic has one folder
    shared across all six levels."""
    return str(category).strip().lower().replace(" ", "-")


def topic_name(title):
    """Derive a stable topic label from a quiz title.

    Multiple quizzes can share one topic while keeping distinct titles/IDs:
    "Simple Present 1", "Simple Present 2", and "Simple Present Review"
    all resolve to the same "Simple Present" topic. Titles that do not carry
    a numbered/review suffix remain their own topic.
    """
    value = str(title or "").strip()
    if not value:
        return ""
    stripped = re.sub(r"\s+(?:\d+|review)\s*$", "", value, flags=re.IGNORECASE).strip()
    return stripped or value


def _latest_metadata_date(qrows):
    """Return the latest valid source metadata timestamp, preserving its text."""
    candidates = []
    for row in qrows:
        for field in ("date_updated", "date_added"):
            value = str(row.get(field, "") or "").strip()
            if value and _is_iso_datetime(value):
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                candidates.append((parsed, value))
    if not candidates:
        return ""
    return max(candidates, key=lambda item: (item[0], item[1]))[1]


def _write_text_if_changed(path, text):
    """Write `text` to `path` only when it differs from what's already
    there. Returns True if a write actually happened (new file or changed
    content), False if the existing file was already byte-identical and
    the write was skipped.

    At 12,000-quiz scale, most rebuilds touch a small fraction of quizzes;
    rewriting every manifest/quiz file on every build regardless (previous
    behavior) means needless disk I/O and spurious mtime/diff churn for
    content that didn't change — costly for git-tracked output, rsync/CDN
    deploys, and incremental CI caching."""
    try:
        with open(path, encoding="utf-8") as f:
            if f.read() == text:
                return False
    except FileNotFoundError:
        pass
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return True


def build_site(quizzes, out_dir, stats=None):
    """Write manifests + quiz JSON files. Deterministic: sorted keys, fixed
    separators, no embedded timestamps. Only status=published quizzes are
    written (V-G1 requires uniform status, so checking the first row suffices).

    Skips the actual disk write for any quiz file or level manifest whose
    content is already byte-identical on disk (incremental build) — every
    path is still returned in `written_files` exactly as before, so the
    return contract and file *set* are unchanged; only whether bytes were
    physically rewritten changes. Pass a dict as `stats` (optional, back-
    compatible — existing 2-arg callers are unaffected) to receive
    {'written': N, 'unchanged': N} counts of that split."""
    written_files = []
    by_level = defaultdict(list)
    counts = {"written": 0, "unchanged": 0}

    for quiz_id in sorted(quizzes.keys()):
        qrows = quizzes[quiz_id]
        if qrows[0]["_status"] != "published":
            continue
        qrows_sorted = sorted(qrows, key=lambda r: r["_question_number"])
        level = qrows_sorted[0]["_level"].lower()
        first = qrows_sorted[0]

        questions_out = []
        for r in qrows_sorted:
            q = {
                "question": str(r.get("question_text", "")).strip(),
                "category": str(r.get("question_category", "")).strip(),
                "tags": str(r.get("question_tags", "")).strip(),
                "explanation": str(r.get("explanation", "")).strip(),
                "correctIndex": r["_correct_index"],
                "answers": r["_answers"],
            }
            rich_type = str(r.get("question_type", "") or "").strip().lower().replace("-", "_")
            if rich_type and rich_type != "radio":
                q["question_type"] = rich_type
            subprompt = str(r.get("subprompt", "") or "").strip()
            if subprompt:
                q["subprompt"] = subprompt
            accepted = _rich_json(r.get("accepted_answers"), [])
            if isinstance(accepted, list) and accepted:
                q["acceptedAnswers"] = accepted
            tolerance = str(r.get("tolerance", "") or "").strip()
            if tolerance:
                try:
                    q["tolerance"] = float(tolerance)
                except ValueError:
                    pass
            pairs = _rich_json(r.get("pairs"), [])
            if isinstance(pairs, list) and pairs:
                q["pairs"] = pairs
            items = _rich_json(r.get("items"), [])
            if isinstance(items, list) and items:
                q["items"] = items
            order = _rich_json(r.get("correct_order"), [])
            if isinstance(order, list) and order:
                q["correctOrder"] = order
            image_url = str(r.get("image_url", "") or "").strip()
            audio_url = str(r.get("audio_url", "") or "").strip()
            media = {}
            if image_url:
                media["image"] = {"src": image_url, "alt": str(r.get("image_alt", "") or "").strip()}
            if audio_url:
                media["audio"] = {"src": audio_url, "label": str(r.get("audio_label", "") or "").strip()}
            if media:
                q["media"] = media

            # Canonical learning metadata is additive. `objective` is the
            # preferred runtime name; `learning_objective` remains accepted
            # as a generation-side alias. No metadata is invented for legacy
            # rows, preserving existing output byte-for-byte.
            skill = str(r.get("skill", "") or "").strip().lower()
            if skill:
                q["skill"] = skill
            subskill = str(r.get("subskill", "") or "").strip()
            if subskill:
                q["subskill"] = subskill
            objective = str(r.get("objective", "") or r.get("learning_objective", "") or "").strip()
            if objective:
                q["objective"] = objective
            for key in ("difficulty", "cefr", "estimated_time_seconds"):
                value = str(r.get(key, "") or "").strip()
                if value:
                    if key == "estimated_time_seconds":
                        try:
                            q[key] = float(value)
                        except ValueError:
                            pass
                    elif key == "difficulty":
                        try:
                            q[key] = float(value)
                            if q[key].is_integer(): q[key] = int(q[key])
                        except ValueError:
                            pass
                    else:
                        q[key] = value.upper() if key == "cefr" else value
            questions_out.append(q)

        quiz_doc = {
            "id": quiz_id,
            "title": str(first.get("title", "")).strip(),
            "description": str(first.get("description", "")).strip(),
            "brand": "Mylingo",
            "category": str(first.get("quiz_category", "")).strip(),
            "tags": str(first.get("quiz_tags", "")).strip(),
            "level": first["_level"],
            "version": int(first.get("version")),
            "questions": questions_out,
        }

        slug = topic_slug(quiz_doc["category"])
        topic_dir = os.path.join(out_dir, slug, level)
        os.makedirs(topic_dir, exist_ok=True)
        out_path = os.path.join(topic_dir, f"{quiz_id}.json")
        quiz_text = json.dumps(quiz_doc, indent=2, sort_keys=False, ensure_ascii=False) + "\n"
        if _write_text_if_changed(out_path, quiz_text):
            counts["written"] += 1
        else:
            counts["unchanged"] += 1
        written_files.append(out_path)

        manifest_entry = {
            # Path is relative to the site root (site/<level>/quizzes.json lives
            # one level down, so runtime code fetches '../'+file). Topic-first:
            # one folder per topic (grammar/, vocabulary/, ...) holding every level.
            "file": f"{slug}/{level}/{quiz_id}.json",
            "id": quiz_id,
            "title": quiz_doc["title"],
            "topic": topic_name(quiz_doc["title"]),
            "description": quiz_doc["description"],
            "category": quiz_doc["category"],
            "tags": quiz_doc["tags"],
            "level": quiz_doc["level"],
            "questions": len(questions_out),
            "version": quiz_doc["version"],
        }
        publication_date = _latest_metadata_date(qrows_sorted)
        if publication_date:
            manifest_entry["date"] = publication_date
        by_level[level].append(manifest_entry)

    for level, entries in by_level.items():
        entries_sorted = sorted(entries, key=lambda e: e["id"])
        manifest_path = os.path.join(out_dir, level, "quizzes.json")
        os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
        manifest_text = json.dumps(entries_sorted, indent=2, ensure_ascii=False) + "\n"
        if _write_text_if_changed(manifest_path, manifest_text):
            counts["written"] += 1
        else:
            counts["unchanged"] += 1
        written_files.append(manifest_path)

    if stats is not None:
        stats.update(counts)
    return written_files, by_level


def _same_path(a, b):
    """True if `a` and `b` refer to the same file/directory on disk.
    Checked by normalized absolute path first (works even when `dst`
    doesn't exist yet, e.g. a first build into a fresh --out); falls back
    to os.path.samefile() for the hardlink/symlink case where two
    different-looking paths still resolve to one file."""
    if os.path.abspath(a) == os.path.abspath(b):
        return True
    try:
        return os.path.exists(a) and os.path.exists(b) and os.path.samefile(a, b)
    except OSError:
        return False


def copy_runtime_assets(src_root, out_dir):
    """Copy shared runtime + level shells + main hub verbatim. Agent 3 does not
    modify these — that is Agent 1 (already built) / Agent 4 (UX) territory.

    `--src-root` and `--out` are commonly THE SAME directory now (Agent 7:
    since the hand-authored runtime assets and the generated data files
    both live under `site/`, "rebuild in place" means pointing both flags
    at `site/`). Every copy here is skipped, not attempted-then-erroring,
    whenever source and destination already resolve to the same path —
    shutil.copytree/copy2 have no sensible behavior for copying a
    directory or file onto itself and previously raised `shutil.Error`
    for exactly this case, which broke the self-referential invocation
    entirely."""
    copied = []
    for rel in ["shared", "main", "placement", "courses", "course_content", "index.html", "sw.js", "manifest.json", "HANDOFF_5_AGENTS.md", "SCHEMA.md"]:
        src = os.path.join(src_root, rel)
        dst = os.path.join(out_dir, rel)
        if _same_path(src, dst):
            copied.append(f"{rel} (already in place, skipped)")
            continue
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        elif os.path.isfile(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
        copied.append(rel)
    for level in [l.lower() for l in LEVELS]:
        for fname in ["index.html", "dashboard.html"]:
            src = os.path.join(src_root, level, fname)
            dst = os.path.join(out_dir, level, fname)
            if _same_path(src, dst):
                copied.append(f"{level}/{fname} (already in place, skipped)")
                continue
            if os.path.isfile(src):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
                copied.append(f"{level}/{fname}")
    return copied


def write_report(path, input_path, row_count, errors, warnings, by_level, written_files):
    lines = []
    lines.append("# Mylingo Build Report")
    lines.append("")
    lines.append(f"- Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- Source: `{input_path}`")
    lines.append(f"- Rows processed: {row_count}")
    total_quizzes = len(by_level and [q for lvl in by_level.values() for q in lvl] or [])
    lines.append(f"- Quizzes generated (published only): {total_quizzes}")
    for level in sorted(by_level.keys()):
        lines.append(f"  - {level.upper()}: {len(by_level[level])} quizzes")
    lines.append(f"- Files written: {len(written_files)}")
    lines.append("")
    lines.append("## Errors (build-blocking)")
    if not errors:
        lines.append("None.")
    else:
        counts = defaultdict(int)
        for e in errors:
            counts[e.rule_id] += 1
        lines.append("| Rule | Count |")
        lines.append("|---|---|")
        for rule_id, c in sorted(counts.items()):
            lines.append(f"| {rule_id} | {c} |")
        lines.append("")
        lines.append("Details:")
        for e in errors:
            lines.append(f"- {e}")
    lines.append("")
    lines.append("## Warnings (non-blocking)")
    if not warnings:
        lines.append("None.")
    else:
        for w in warnings:
            lines.append(f"- {w}")
    lines.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def verify_output(out_dir):
    """Structural integrity check of the *generated* site JSON files.

    This is deliberately independent of `validate()` above: that function
    checks the master source (input) before generation; this checks the
    actual files sitting in `out_dir` (output) after generation, packaging,
    or a hand-edit. Catches: malformed JSON, manifests pointing at missing
    quiz files, orphaned quiz files not listed in any manifest, and the same
    per-question shape rules the client runtime enforces (2-9 answers,
    correctIndex in range, non-empty question text).

    Returns (errors, warnings) as lists of human-readable strings.
    """
    errors = []
    warnings = []

    referenced_files = set()  # root-relative paths every manifest claims to use

    for level in LEVELS:
        level_dir = os.path.join(out_dir, level.lower())
        manifest_path = os.path.join(level_dir, "quizzes.json")

        if not os.path.isdir(level_dir):
            warnings.append(f"{level}: level directory not found at {level_dir}, skipping")
            continue

        try:
            with open(manifest_path, encoding="utf-8") as f:
                manifest = json.load(f)
        except FileNotFoundError:
            errors.append(f"{level}: missing manifest {manifest_path}")
            continue
        except json.JSONDecodeError as e:
            errors.append(f"{level}: manifest is not valid JSON ({e})")
            continue

        if not isinstance(manifest, list):
            errors.append(f"{level}: manifest root must be a JSON array")
            continue

        manifest_ids = set()
        for entry in manifest:
            qid = entry.get("id") if isinstance(entry, dict) else None
            if not qid:
                errors.append(f"{level}: manifest entry missing 'id': {entry!r}")
                continue
            manifest_ids.add(qid)
            rel_file = entry.get("file") if isinstance(entry, dict) else None
            if not rel_file or not isinstance(rel_file, str):
                errors.append(f"{level}: manifest entry '{qid}' missing 'file'")
                continue
            quiz_path = os.path.join(out_dir, rel_file)
            if not os.path.isfile(quiz_path):
                errors.append(f"{level}: manifest references '{qid}' but "
                              f"{quiz_path} (from 'file': {rel_file!r}) does not exist")
                continue
            referenced_files.add(os.path.normpath(rel_file))
            try:
                with open(quiz_path, encoding="utf-8") as f:
                    quiz = json.load(f)
            except json.JSONDecodeError as e:
                errors.append(f"{level}/{qid}: quiz file is not valid JSON ({e})")
                continue

            questions = quiz.get("questions") if isinstance(quiz, dict) else None
            if not isinstance(questions, list) or not questions:
                errors.append(f"{level}/{qid}: no questions array, or it's empty")
                continue
            for qi, q in enumerate(questions, start=1):
                if not isinstance(q, dict) or not str(q.get("question", "")).strip():
                    errors.append(f"{level}/{qid} Q{qi}: missing question text")
                    continue
                answers = q.get("answers")
                qtype = str(q.get("question_type", "radio") or "radio").lower().replace("-", "_")
                text_like = qtype in {"text", "short_text", "fill_in_the_blank", "number", "date"}
                if text_like:
                    accepted = q.get("acceptedAnswers")
                    if not isinstance(accepted, list) or not accepted:
                        errors.append(f"{level}/{qid} Q{qi}: {qtype} question missing acceptedAnswers")
                elif qtype == "matching":
                    pairs = q.get("pairs") if isinstance(q.get("pairs"), list) else []
                    if len(pairs) < 2 or any(not isinstance(p, dict) or not str(p.get("left", "")).strip() or not str(p.get("right", "")).strip() for p in pairs):
                        errors.append(f"{level}/{qid} Q{qi}: matching question needs at least 2 complete pairs")
                elif qtype == "ranking":
                    items = q.get("items") if isinstance(q.get("items"), list) else []
                    order = q.get("correctOrder") if isinstance(q.get("correctOrder"), list) else items
                    if len(items) < 2 or len(order) != len(items) or set(map(str, order)) != set(map(str, items)):
                        errors.append(f"{level}/{qid} Q{qi}: ranking question needs items and a complete correctOrder")
                else:
                    if not isinstance(answers, list) or not (MIN_ANSWERS <= len(answers) <= MAX_ANSWERS):
                        errors.append(f"{level}/{qid} Q{qi}: needs {MIN_ANSWERS}-{MAX_ANSWERS} answers, found {len(answers) if isinstance(answers, list) else 'none'}")
                        continue
                    ci = q.get("correctIndex")
                    if not isinstance(ci, int) or not (1 <= ci <= len(answers)):
                        errors.append(f"{level}/{qid} Q{qi}: correctIndex {ci!r} out of range 1..{len(answers)}")

    # orphaned quiz files: content sitting under a topic/<level>/ folder that no
    # level manifest's 'file' field points to. Topic folders are top-level
    # (e.g. out_dir/grammar/b1/b1-001.json), not nested under out_dir/<level>/.
    known_topic_dirs = {"shared", "main", "placement"} | {l.lower() for l in LEVELS}
    if os.path.isdir(out_dir):
        for entry_name in sorted(os.listdir(out_dir)):
            topic_dir = os.path.join(out_dir, entry_name)
            if entry_name in known_topic_dirs or not os.path.isdir(topic_dir):
                continue
            for level_name in sorted(os.listdir(topic_dir)):
                level_subdir = os.path.join(topic_dir, level_name)
                if not os.path.isdir(level_subdir):
                    continue
                for fn in sorted(os.listdir(level_subdir)):
                    if not fn.endswith(".json"):
                        continue
                    rel = os.path.normpath(os.path.join(entry_name, level_name, fn))
                    if rel not in referenced_files:
                        warnings.append(f"orphan: {rel} exists but no manifest references it")

    return errors, warnings


def check_scale_budgets(out_dir):
    """Agent 66 — bounded, per-file resource-budget checks over an
    already-generated site directory.

    Each file is stat'd (and, for question counts, loaded and released)
    one at a time — this never holds the whole dataset in memory, mirroring
    the streaming approach the rest of the release gate already uses. It
    blocks release if a single quiz file or level manifest has grown into
    the kind of whole-dataset dump the scale-hardening risks warn about.
    """
    errors = []
    warnings = []
    out_path = Path(out_dir)
    if not out_path.is_dir():
        return errors, warnings

    known_topic_dirs = {"shared", "main", "placement"} | {l.lower() for l in LEVELS}

    for level_dir in sorted(p for p in out_path.iterdir() if p.is_dir()):
        manifest_path = level_dir / "quizzes.json"
        if not manifest_path.is_file():
            continue
        size = manifest_path.stat().st_size
        if size > MAX_MANIFEST_FILE_BYTES:
            errors.append(f"scale: {manifest_path} is {size} bytes, exceeds "
                          f"manifest budget of {MAX_MANIFEST_FILE_BYTES} bytes "
                          f"(shard the level manifest instead of growing one file)")
        elif size > MAX_MANIFEST_FILE_BYTES // 2:
            warnings.append(f"scale: {manifest_path} is {size} bytes, over half "
                             f"the manifest budget of {MAX_MANIFEST_FILE_BYTES} bytes")

    for entry in sorted(out_path.iterdir()):
        if entry.name in known_topic_dirs or not entry.is_dir():
            continue
        for level_dir in sorted(p for p in entry.iterdir() if p.is_dir()):
            for quiz_file in sorted(level_dir.glob("*.json")):
                size = quiz_file.stat().st_size
                if size > MAX_QUIZ_FILE_BYTES:
                    errors.append(f"scale: {quiz_file} is {size} bytes, exceeds "
                                  f"quiz-file budget of {MAX_QUIZ_FILE_BYTES} bytes")
                try:
                    with quiz_file.open(encoding="utf-8") as f:
                        quiz = json.load(f)
                except (OSError, json.JSONDecodeError):
                    continue  # already reported by verify_output
                questions = quiz.get("questions") if isinstance(quiz, dict) else None
                n = len(questions) if isinstance(questions, list) else 0
                if n > MAX_QUESTIONS_PER_QUIZ_FILE:
                    errors.append(f"scale: {quiz_file} has {n} questions, exceeds "
                                  f"per-file budget of {MAX_QUESTIONS_PER_QUIZ_FILE} "
                                  f"(split into more quizzes instead of one whole-dataset file)")

    return errors, warnings


def main():
    parser = argparse.ArgumentParser(description="Mylingo site generator")
    sub = parser.add_subparsers(dest="command", required=True)

    p_val = sub.add_parser("validate", help="Validate the master source, no output written")
    p_val.add_argument("--input", required=True)

    p_build = sub.add_parser("build", help="Validate and generate the site")
    p_build.add_argument("--input", required=True)
    p_build.add_argument("--out", required=True)
    p_build.add_argument("--src-root", default=None,
                          help="Path to Agent 1 starter root, to copy runtime assets from")
    p_build.add_argument("--report", default="BUILD_REPORT.md")
    p_build.add_argument("--force", action="store_true",
                          help="Write output even if validation errors were found (not recommended)")

    p_verify = sub.add_parser("verify-output",
                               help="Structural integrity check of already-generated site/ JSON "
                                    "(manifests, quiz files, cross-references) — does not read the master source")
    p_verify.add_argument("--out", required=True, help="Path to the generated site directory")

    p_gate = sub.add_parser("release-gate", help="Block release unless source, site output, offline packs, and release assets are valid")
    p_gate.add_argument("--input", required=True, help="Canonical master_source.csv")
    p_gate.add_argument("--site", required=True, help="Generated/deployable site directory")
    p_gate.add_argument("--report", default="RELEASE_GATE_REPORT.md")

    args = parser.parse_args()

    if args.command == "verify-output":
        errors, warnings = verify_output(args.out)
        for e in errors:
            print(f"ERROR   {e}")
        for w in warnings:
            print(f"WARNING {w}")
        print(f"\n{len(errors)} errors, {len(warnings)} warnings")
        sys.exit(1 if errors else 0)

    if args.command == "release-gate":
        counted_rows = _CountingIter(iter_rows_streaming(args.input))
        source_errors, source_warnings, quizzes = validate(counted_rows)
        output_errors, output_warnings = verify_output(args.site)
        offline_errors, offline_warnings = verify_offline_packs(args.site)
        scale_errors, scale_warnings = check_scale_budgets(args.site)
        asset_errors = []
        required_assets = ["sw.js", "manifest.json", "offline/packs.json"]
        for rel in required_assets:
            if not (Path(args.site) / rel).is_file():
                asset_errors.append(f"release: missing required asset {rel}")
        all_errors = [*source_errors, *output_errors, *offline_errors, *asset_errors, *scale_errors]
        all_warnings = [*source_warnings, *output_warnings, *offline_warnings, *scale_warnings]
        lines = [
            "# Mylingo Production Release Gate",
            "",
            f"- Offline pack schema: v{PACK_VERSION}",
            f"- Source rows: {counted_rows.count}",
            f"- Source quizzes: {len(quizzes)}",
            f"- Scale budgets: quiz file <= {MAX_QUIZ_FILE_BYTES} bytes, "
            f"<= {MAX_QUESTIONS_PER_QUIZ_FILE} questions/file; "
            f"manifest <= {MAX_MANIFEST_FILE_BYTES} bytes",
            f"- Result: {'PASS' if not all_errors else 'BLOCKED'}",
            "",
            "## Blocking errors",
        ]
        lines.extend([f"- {e}" for e in all_errors] or ["None."])
        lines += ["", "## Warnings"]
        lines.extend([f"- {w}" for w in all_warnings] or ["None."])
        Path(args.report).write_text("\n".join(lines) + "\n", encoding="utf-8")
        for e in all_errors:
            print(f"ERROR   {e}")
        for w in all_warnings:
            print(f"WARNING {w}")
        print(f"\nRelease gate: {'PASS' if not all_errors else 'BLOCKED'}; {len(all_errors)} errors, {len(all_warnings)} warnings")
        sys.exit(1 if all_errors else 0)

    counted_rows = _CountingIter(iter_rows_streaming(args.input))
    errors, warnings, quizzes = validate(counted_rows)
    row_count = counted_rows.count

    if args.command == "validate":
        for e in errors:
            print(f"ERROR   {e}")
        for w in warnings:
            print(f"WARNING {w}")
        print(f"\n{row_count} rows, {len(quizzes)} quizzes, "
              f"{len(errors)} errors, {len(warnings)} warnings")
        sys.exit(1 if errors else 0)

    if args.command == "build":
        if errors and not args.force:
            print(f"Build aborted: {len(errors)} validation error(s). "
                  f"Run 'validate' for details, or pass --force to override.", file=sys.stderr)
            write_report(args.report, args.input, row_count, errors, warnings, {}, [])
            sys.exit(1)

        os.makedirs(args.out, exist_ok=True)
        build_stats = {}
        written_files, by_level = build_site(quizzes, args.out, stats=build_stats)
        if args.src_root:
            copy_runtime_assets(args.src_root, args.out)
        offline_stats = {}
        offline_index, offline_records = write_offline_packs(args.out, stats=offline_stats)
        written_files.extend([str(offline_index), *[str(Path(args.out) / "offline" / "packs" / f"{r["id"]}.zip") for r in offline_records]])
        write_report(args.report, args.input, row_count, errors, warnings, by_level, written_files)
        print(f"Build complete: {len(written_files)} files in {args.out} "
              f"({build_stats.get('written', 0)} written, {build_stats.get('unchanged', 0)} unchanged)")
        print(f"Offline packs: {len(offline_records)} ({offline_index}) "
              f"({offline_stats.get('written', 0)} written, {offline_stats.get('unchanged', 0)} unchanged)")
        print(f"Report: {args.report}")


if __name__ == "__main__":
    main()
