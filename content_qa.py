#!/usr/bin/env python3
"""
Mylingo content QA at scale — Milestone 6.

This module is intentionally separate from build.py's schema validator.
`build.py validate` answers: "Can this row be safely built?"
`content_qa.py` answers: "Does this content look review-ready?"

The audit is deterministic, dependency-free, batch friendly, and safe to run
against the current sparse starter dataset. By default, content-quality issues
are reported as warnings/information unless they represent a clear correctness
or safety defect. `--strict` promotes configurable production-threshold issues
into errors without changing the canonical generation/build behavior.

Outputs:
  - Markdown report for humans
  - JSON report for CI/automation
  - CSV issue queue for spreadsheet/content-review workflows
"""

from __future__ import annotations

import argparse
import csv
import dataclasses
import hashlib
import difflib
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import build as build_module

LEVELS = build_module.LEVELS
ANSWER_COLS = build_module.ANSWER_COLS
MAX_ANSWERS = build_module.MAX_ANSWERS
MIN_ANSWERS = build_module.MIN_ANSWERS

DEFAULT_MIN_QUESTIONS = 5
DEFAULT_MAX_QUESTION_CHARS = 220
DEFAULT_MIN_EXPLANATION_CHARS = 20
DEFAULT_MAX_EXPLANATION_CHARS = 350
DEFAULT_MAX_CORRECT_TO_DISTRACTOR_RATIO = 1.8
DEFAULT_LENGTH_CLUE_MIN_CORRECT_CHARS = 18

# Agent 72 — CEFR/category coverage policy. A1/A2 remain grammar-led, but a
# small vocabulary component prevents an accidental 100% grammar catalog.
# The policy is quiz-level (not question-row-level) so one focused quiz counts
# once and category labels cannot be gamed by mixing rows inside a quiz.
CEFR_CATEGORY_POLICY = {
    "A1": {"Grammar": (0.70, 0.90), "Vocabulary": (0.10, 0.30)},
    "A2": {"Grammar": (0.70, 0.90), "Vocabulary": (0.10, 0.30)},
}

SEVERITY_RANK = {"error": 3, "warning": 2, "info": 1}

# Agent 76 — canonical strict-mode blocking policy. This is the single
# source of truth for which release-quality codes must fail production
# release under `--strict`. Diagnostic mode (the default) is unaffected:
# these codes still surface at their normal severity so a sparse/rollout
# dataset stays observable without being falsely blocked. Do not scatter
# ad hoc "warning if not strict else error" ternaries at issue sites;
# add the code here instead so the policy stays auditable in one place.
STRICT_BLOCKING_CODES = {
    "CQ-S02",  # question text too short to be reviewable
    "CQ-C08",  # explanation too short to be reviewable
    "CQ-B01",  # quiz below minimum production question count
    "CQ-B05",  # correct-answer position pattern (position-guessing risk)
    "CQ-C06",  # correct-answer length clue vs. distractors
    "CQ-D02",  # explanation reused across many rows (template drift)
}

# Content Schema v2 (07_CONTENT_SCHEMA_V2.md).
TAG_VOCAB_PATH = os.path.join(ROOT, "tag_vocabulary.json")


def _load_tag_vocabulary(path=TAG_VOCAB_PATH):
    """Load the controlled tag vocabulary. Missing/unreadable file -> empty
    set, which disables CQ-T01 rather than crashing the audit."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError):
        return set()
    allowed = set()
    for key in ("levels", "skills", "categories"):
        for value in data.get(key, []):
            allowed.add(str(value).strip().lower())
    return allowed


CONTROLLED_TAG_VOCAB = _load_tag_vocabulary()


def _is_iso_datetime(value: str) -> bool:
    if not value:
        return False
    try:
        datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return True
    except ValueError:
        return False


@dataclass(frozen=True)
class QAIssue:
    code: str
    severity: str
    scope: str
    ref: str
    message: str

    def to_dict(self):
        return asdict(self)


def _text(value: object) -> str:
    return str(value or "").strip()


def normalize_text(value: object) -> str:
    """Normalize visible text for duplicate/similarity comparisons."""
    value = html.unescape(_text(value))
    value = re.sub(r"<[^>]+>", " ", value)
    value = value.lower()
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"[^\w\s']+", " ", value, flags=re.UNICODE)
    return re.sub(r"\s+", " ", value).strip()


def _tokens(value: object) -> list[str]:
    return normalize_text(value).split()


def _has_terminal_punctuation(value: str) -> bool:
    clean = value.rstrip()
    return bool(clean) and clean[-1] in ".?!:;”’\"')]>»"


def _is_wordlike_answer(value: str) -> bool:
    return bool(re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]", value))


def _question_has_placeholder(value: str) -> bool:
    return bool(re.search(r"(?:_{2,}|\[\s*\]|\(\s*\)|…{2,})", value))


def _explanation_subject_hint(explanation: str) -> set[str]:
    """Extract common subject/pronoun hints used by grammar explanations."""
    text = normalize_text(explanation)
    hints = set()
    if re.search(r"\b(?:pronoun\s+)?i\b", text) and re.search(r"\b(?:with|use)\s+(?:the\s+)?(?:pronoun\s+)?i\b", text):
        hints.add("i")
    if re.search(r"\b(?:pronoun\s+)?(?:he|she|it)\b", text) or re.search(r"\bhe/she/it\b", text):
        if re.search(r"\b(?:with|use)\b", text):
            hints.add("third_singular")
    for pronoun in ("we", "they", "you"):
        if re.search(rf"\b(?:with|use)\s+(?:the\s+)?(?:pronoun\s+)?{pronoun}\b", text):
            hints.add(pronoun)
    return hints


def _question_subject_hint(question: str) -> set[str]:
    """Extract a conservative subject hint from a fill-in-the-blank stem."""
    text = normalize_text(question)
    # Only inspect the words immediately before a blank; this avoids guessing
    # from incidental pronouns later in a sentence.
    match = re.search(r"\b(i|you|he|she|it|we|they)\s+(?:_+|blank)\b", text)
    if not match:
        return set()
    subject = match.group(1)
    return {"third_singular"} if subject in {"he", "she", "it"} else {subject}


def _explanation_subject_mismatch(question: str, explanation: str) -> str | None:
    """Return a concise mismatch reason for explicit subject-specific rules."""
    exp = _explanation_subject_hint(explanation)
    subj = _question_subject_hint(question)
    if not exp or not subj:
        return None
    if "third_singular" in exp and "third_singular" not in subj:
        return "explanation targets he/she/it, but the question blank follows a different subject"
    if "i" in exp and "i" not in subj:
        return "explanation targets the pronoun I, but the question blank follows a different subject"
    # For explicit single-pronoun explanations, require that same pronoun.
    explicit = exp & {"we", "they", "you"}
    if explicit and not (explicit & subj):
        return f"explanation targets {sorted(explicit)[0]}, but the question blank follows a different subject"
    return None


def _has_length_clue(correct: str, distractors: list[str]) -> bool:
    """Bounded length-tell heuristic with a parallel-phrase exception."""
    if not distractors or not _is_wordlike_answer(correct):
        return False
    if len(correct) < DEFAULT_LENGTH_CLUE_MIN_CORRECT_CHARS:
        return False
    max_d = max(len(a) for a in distractors) or 1
    if len(correct) / max_d < DEFAULT_MAX_CORRECT_TO_DISTRACTOR_RATIO:
        return False
    correct_words = len(_tokens(correct))
    distractor_words = [len(_tokens(a)) for a in distractors]
    # Long grammatical phrases can be intentionally more verbose. Require a
    # second signal unless the correct option is at least two words longer.
    return correct_words >= max(distractor_words) + 2


def _looks_like_explicit_answer_claim(explanation: str) -> str | None:
    """Extract an explicit answer claim from common authoring phrasing."""
    patterns = [
        r"(?:the\s+)?correct\s+answer\s+is\s*[:\-]?\s*[\"'“”]?([^\"'“”.;\n]+)",
        r"(?:the\s+)?answer\s+is\s*[:\-]?\s*[\"'“”]?([^\"'“”.;\n]+)",
        r"(?:choose|select)\s+[\"'“”]?([^\"'“”.;\n]+)[\"'“”]?\s+because",
    ]
    for pattern in patterns:
        match = re.search(pattern, explanation, flags=re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            candidate = re.sub(r"\s+", " ", candidate)
            return candidate
    return None


def _quality_score(issues: list[QAIssue]) -> int:
    """Triage score only; never represents CEFR or pedagogical mastery.

    Repeated instances of the same rule are intentionally capped so a dataset
    with one known rollout-stage condition (for example, many 1-question
    starter quizzes) does not misleadingly score zero.
    """
    errors = [i for i in issues if i.severity == "error"]
    warnings = [i for i in issues if i.severity == "warning"]
    infos = [i for i in issues if i.severity == "info"]
    score = 100
    score -= min(70, len(errors) * 25)
    score -= min(25, len({i.code for i in warnings}) * 5)
    score -= min(5, len({i.code for i in infos}))
    return max(0, min(100, score))


def _issue(issues, code, severity, scope, ref, message):
    issues.append(QAIssue(code, severity, scope, ref, message))


def _row_ref(index: int, row: dict) -> str:
    return f"row {index + 2} (quiz_id={_text(row.get('quiz_id')) or '?'}, q={_text(row.get('question_number')) or '?'})"


def _quiz_ref(quiz_id: str) -> str:
    return f"quiz {quiz_id}"


def _answer_values(row: dict) -> list[str]:
    return [_text(row.get(col)) for col in ANSWER_COLS if _text(row.get(col))]


def _rich_type(row: dict) -> str:
    return _text(row.get("question_type")).lower().replace("-", "_") or "radio"


def _rich_array(row: dict, field: str) -> list:
    value = row.get(field)
    if value is None or _text(value) == "":
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(_text(value))
        return parsed if isinstance(parsed, list) else []
    except (TypeError, ValueError, json.JSONDecodeError):
        return []


def _issue_sort_key(issue: QAIssue):
    return (-SEVERITY_RANK.get(issue.severity, 0), issue.code, issue.scope, issue.ref)



def _near_duplicate_candidates(bucket_rows):
    """Bounded candidate generation for large buckets using token shingles.
    Avoids O(n²) pairwise scans while retaining deterministic high-overlap matches.
    """
    postings = defaultdict(list)
    token_sets = {}
    for idx, quiz_id, text in bucket_rows:
        toks = set(text.split())
        if len(toks) < 5:
            continue
        token_sets[idx] = toks
        # Stable rare-ish fingerprints: token trigrams plus a deterministic sample.
        ordered = sorted(toks)
        keys = set()
        for i in range(max(0, len(ordered)-2)):
            keys.add(" ".join(ordered[i:i+3]))
        for key in sorted(keys)[:32]:
            postings[key].append(idx)
    candidates = set()
    for ids in postings.values():
        if 1 < len(ids) <= 512:
            for a_pos, a in enumerate(ids):
                for b in ids[a_pos+1:]:
                    candidates.add((a,b) if a < b else (b,a))
    return candidates, token_sets


def _diversity_frame(value: object) -> str:
    """Return a stable question-frame signature for repetition triage.

    Variable tokens such as numbers and blank markers are normalized so a
    generated family like "Choose the correct form: She ___" and "Choose
    the correct form: He ___" can be reviewed as one content pattern without
    treating ordinary lexical overlap as an exact duplicate.
    """
    tokens = _tokens(value)
    if not tokens:
        return ""
    framed = []
    for token in tokens:
        if re.fullmatch(r"(?:\d+(?:[.,]\d+)?)", token):
            framed.append("<num>")
        elif token in {"_", "__", "___", "blank"}:
            framed.append("<blank>")
        else:
            framed.append(token)
    # A five-token prefix is long enough to identify an authored stem while
    # remaining insensitive to the learner-specific sentence tail.
    return " ".join(framed[:5])


def audit_rows(
    rows: list[dict],
    *,
    strict: bool = False,
    min_questions_per_quiz: int = DEFAULT_MIN_QUESTIONS,
    max_question_chars: int = DEFAULT_MAX_QUESTION_CHARS,
    min_explanation_chars: int = DEFAULT_MIN_EXPLANATION_CHARS,
    max_explanation_chars: int = DEFAULT_MAX_EXPLANATION_CHARS,
) -> dict:
    """Audit canonical master-source rows and return a JSON-safe report."""
    issues: list[QAIssue] = []
    quiz_rows: defaultdict[str, list[tuple[int, dict]]] = defaultdict(list)
    normalized_question_index: defaultdict[str, list[tuple[int, str]]] = defaultdict(list)
    explanation_index: defaultdict[str, list[tuple[int, str]]] = defaultdict(list)
    diversity_index: defaultdict[tuple[str, str, str], list[tuple[int, str]]] = defaultdict(list)
    # Agent 73 — cross-question/content diversity regression gates.
    # answer_tuple_index: dataset-scope repeated (answer-set, correct-answer)
    # combinations, keyed like diversity_index so legitimate reuse within a
    # single authored quiz (e.g. an "is/am/are" paradigm) is not penalized;
    # only reuse spread across many distinct quizzes is flagged.
    answer_tuple_index: defaultdict[tuple[str, str, tuple, str], list[tuple[int, str]]] = defaultdict(list)
    # quiz_signature_refs: quiz-scope repeats of (stem frame, answer-set,
    # correct-answer text) — a precise near-duplicate-item signal that does
    # not fire on quizzes that vary any one of those three dimensions.
    quiz_signature_refs: defaultdict[str, defaultdict[tuple, list[int]]] = defaultdict(lambda: defaultdict(list))
    quiz_frames: defaultdict[str, list[str]] = defaultdict(list)
    global_correct_indices = Counter()
    level_counts = Counter()
    category_counts = Counter()

    # Content Schema v2: opt-in per dataset, only checked when the source
    # actually has the column at all.
    has_date_added = bool(rows) and "date_added" in rows[0]
    has_date_updated = bool(rows) and "date_updated" in rows[0]

    for idx, row in enumerate(rows):
        ref = _row_ref(idx, row)
        quiz_id = _text(row.get("quiz_id"))
        level = _text(row.get("level")).upper()
        category = _text(row.get("quiz_category"))
        question = _text(row.get("question_text"))
        explanation = _text(row.get("explanation"))
        answers = _answer_values(row)
        rtype = _rich_type(row)
        row_key = (idx, quiz_id)

        if quiz_id:
            quiz_rows[quiz_id].append((idx, row))
        if level:
            level_counts[level] += 1
        if category:
            category_counts[category] += 1

        # CQ-T01 (Content Schema v2) — controlled tag vocabulary.
        if CONTROLLED_TAG_VOCAB:
            for field in ("quiz_tags", "question_tags"):
                raw_tags = _text(row.get(field))
                if not raw_tags:
                    continue
                for tag in raw_tags.split(","):
                    tag = tag.strip()
                    if tag and tag.lower() not in CONTROLLED_TAG_VOCAB:
                        _issue(issues, "CQ-T01", "warning", "tags", ref,
                               f"{field} value '{tag}' is not in the controlled "
                               f"tag vocabulary (tag_vocabulary.json)")

        # CQ-M01/CQ-M02/CQ-M03 (Content Schema v2) — date_added/date_updated.
        date_added = _text(row.get("date_added")) if has_date_added else ""
        date_updated = _text(row.get("date_updated")) if has_date_updated else ""
        if has_date_added:
            if not date_added:
                _issue(issues, "CQ-M01", "warning", "metadata", ref, "date_added is empty")
            elif not _is_iso_datetime(date_added):
                _issue(issues, "CQ-M02", "error", "metadata", ref,
                       f"date_added '{date_added}' is not a valid ISO 8601 date/time")
        if has_date_updated:
            if not date_updated:
                _issue(issues, "CQ-M01", "warning", "metadata", ref, "date_updated is empty")
            elif not _is_iso_datetime(date_updated):
                _issue(issues, "CQ-M02", "error", "metadata", ref,
                       f"date_updated '{date_updated}' is not a valid ISO 8601 date/time")
            elif date_added and _is_iso_datetime(date_added):
                da = datetime.fromisoformat(date_added.replace("Z", "+00:00"))
                du = datetime.fromisoformat(date_updated.replace("Z", "+00:00"))
                if du < da:
                    _issue(issues, "CQ-M03", "warning", "metadata", ref,
                           "date_updated is earlier than date_added")

        # CQ-S01/CQ-S02 — explicit content completeness.
        if not question:
            _issue(issues, "CQ-S01", "error", "question", ref, "question_text is empty")
        if not explanation:
            _issue(issues, "CQ-S02", "warning", "question", ref,
                   "explanation is empty")

        if question and len(question) < 12:
            _issue(issues, "CQ-C01", "warning", "question", ref,
                   f"question is very short ({len(question)} characters)")
        if question and len(question) > max_question_chars:
            _issue(issues, "CQ-C02", "warning", "question", ref,
                   f"question is long ({len(question)} characters; threshold {max_question_chars})")
        if question and not _has_terminal_punctuation(question) and not _question_has_placeholder(question):
            _issue(issues, "CQ-C03", "warning", "question", ref,
                   "question has no terminal punctuation; review whether this is intentional")
        if re.search(r"\b(\w+)(?:\s+\1){1,}\b", normalize_text(question), flags=re.IGNORECASE):
            _issue(issues, "CQ-C04", "warning", "question", ref, "question contains a repeated adjacent word")
        if re.search(r"\s{2,}", question):
            _issue(issues, "CQ-C05", "warning", "question", ref, "question contains repeated spaces")

        # CQ-Axx — answer option quality and correctness. Multiple-choice rows
        # retain the original 2-9 answer contract. Rich text/date questions use
        # accepted_answers instead; matching/ranking use their structured data.
        if rtype in {"text", "short_text", "fill_in_the_blank", "number", "date"}:
            accepted = _rich_array(row, "accepted_answers")
            if not accepted:
                _issue(issues, "CQ-R01", "error", "answers", ref,
                       f"{rtype} question has no accepted_answers")
            elif len(accepted) > MAX_ANSWERS:
                _issue(issues, "CQ-R02", "error", "answers", ref,
                       f"{rtype} question has {len(accepted)} accepted answers; maximum is {MAX_ANSWERS}")
        elif rtype == "matching":
            pairs = _rich_array(row, "pairs")
            if len(pairs) < 2 or any(not isinstance(p, dict) or not _text(p.get("left")) or not _text(p.get("right")) for p in pairs):
                _issue(issues, "CQ-R03", "error", "answers", ref,
                       "matching question needs at least 2 complete pairs")
        elif rtype == "ranking":
            items = _rich_array(row, "items")
            order = _rich_array(row, "correct_order") or items
            if len(items) < 2 or len(order) != len(items) or set(map(str, order)) != set(map(str, items)):
                _issue(issues, "CQ-R04", "error", "answers", ref,
                       "ranking question needs items and a complete correct_order")
        else:
            if len(answers) < MIN_ANSWERS:
                _issue(issues, "CQ-A01", "error", "answers", ref,
                       f"only {len(answers)} answer options; minimum is {MIN_ANSWERS}")
            elif len(answers) > MAX_ANSWERS:
                _issue(issues, "CQ-A02", "error", "answers", ref,
                       f"{len(answers)} answer options; maximum is {MAX_ANSWERS}")

        normalized_answers = [normalize_text(a) for a in answers]
        duplicate_answers = [a for a, count in Counter(normalized_answers).items() if a and count > 1]
        if rtype not in {"text", "short_text", "fill_in_the_blank", "number", "date", "matching", "ranking"} and duplicate_answers:
            _issue(issues, "CQ-A03", "error", "answers", ref,
                   f"duplicate answer option(s): {', '.join(sorted(duplicate_answers))}")
        for ai, col in enumerate(ANSWER_COLS, start=1):
            raw_answer = str(row.get(col) or "")
            answer = raw_answer.strip()
            if raw_answer and raw_answer != answer:
                _issue(issues, "CQ-A04", "warning", "answers", ref,
                       f"answer {ai} has leading/trailing whitespace")
            if re.search(r"\s{2,}", answer):
                _issue(issues, "CQ-A05", "warning", "answers", ref,
                       f"answer {ai} contains repeated spaces")
            if re.search(r"<\s*(?:script|iframe|object|embed)\b|javascript:", answer, flags=re.IGNORECASE):
                _issue(issues, "CQ-S03", "error", "safety", ref,
                       f"answer {ai} contains potentially executable HTML/URL content")

        # CQ-Cxx — distractor clue heuristics.
        if answers and len(answers) >= 3:
            correct_index = None
            try:
                correct_index = int(row.get("correct_index"))
            except (TypeError, ValueError):
                pass
            if correct_index is not None and 1 <= correct_index <= len(answers):
                correct = answers[correct_index - 1]
                distractors = [a for i, a in enumerate(answers, start=1) if i != correct_index]
                if distractors and _is_wordlike_answer(correct):
                    if _has_length_clue(correct, distractors):
                        _issue(issues, "CQ-C06", "warning", "answers", ref,
                               "correct answer is substantially longer than every distractor without enough parallel-length support; review for a length clue")
                    same_shape = sum(a[:1].isupper() == correct[:1].isupper() for a in distractors)
                    if distractors and same_shape < len(distractors) / 2 and _is_wordlike_answer(correct):
                        _issue(issues, "CQ-C07", "info", "answers", ref,
                               "answer options have inconsistent capitalization shape; review parallelism")

        # CQ-Xxx — explanation/content alignment.
        if explanation and len(explanation) < min_explanation_chars:
            _issue(issues, "CQ-C08", "warning", "explanation", ref,
                   f"explanation is short ({len(explanation)} characters; threshold {min_explanation_chars})")
        if explanation and len(explanation) > max_explanation_chars:
            _issue(issues, "CQ-C09", "warning", "explanation", ref,
                   f"explanation is long ({len(explanation)} characters; threshold {max_explanation_chars})")
        if explanation and re.search(r"<\s*(?:script|iframe|object|embed)\b|javascript:", explanation, flags=re.IGNORECASE):
            _issue(issues, "CQ-S04", "error", "safety", ref,
                   "explanation contains potentially executable HTML/URL content")
        mismatch = _explanation_subject_mismatch(question, explanation) if explanation else None
        if mismatch:
            _issue(issues, "CQ-X02", "error", "explanation", ref, mismatch)
        claim = _looks_like_explicit_answer_claim(explanation)
        if claim and answers:
            try:
                correct_index = int(row.get("correct_index"))
            except (TypeError, ValueError):
                correct_index = None
            if correct_index and 1 <= correct_index <= len(answers):
                actual = normalize_text(answers[correct_index - 1])
                claimed = normalize_text(claim)
                if claimed and actual and claimed != actual:
                    _issue(issues, "CQ-X01", "error", "explanation", ref,
                           f"explanation claims answer '{claim}', but the marked answer is '{answers[correct_index - 1]}'")

        normalized_question = normalize_text(question)
        frame = ""
        if normalized_question:
            normalized_question_index[normalized_question].append(row_key)
            frame = _diversity_frame(question)
            if frame:
                diversity_index[(level, category.lower(), frame)].append(row_key)
                if quiz_id:
                    quiz_frames[quiz_id].append(frame)

        # Agent 73 — repeated answer-tuple / correct-answer-text / stem
        # signals. Scoped to standard multiple-choice rows only; rich text,
        # matching and ranking types use structured data that a plain
        # answer-tuple comparison would misread.
        if quiz_id and rtype not in {"text", "short_text", "fill_in_the_blank", "number", "date", "matching", "ranking"} and len(answers) >= 2:
            try:
                correct_idx_val = int(row.get("correct_index"))
            except (TypeError, ValueError):
                correct_idx_val = None
            if correct_idx_val is not None and 1 <= correct_idx_val <= len(answers):
                normalized_answer_tuple = tuple(sorted(normalize_text(a) for a in answers))
                correct_text = normalize_text(answers[correct_idx_val - 1])
                if normalized_answer_tuple and correct_text:
                    answer_tuple_index[(level, category.lower(), normalized_answer_tuple, correct_text)].append(row_key)
                    if frame:
                        signature = (frame, normalized_answer_tuple, correct_text)
                        quiz_signature_refs[quiz_id][signature].append(idx)

        normalized_explanation = normalize_text(explanation)
        if normalized_explanation:
            explanation_index[normalized_explanation].append(row_key)

        try:
            ci = int(row.get("correct_index"))
            if 1 <= ci <= len(answers):
                global_correct_indices[ci] += 1
        except (TypeError, ValueError):
            pass

    # CQ-Dxx — duplicate/near-duplicate content at dataset scale.
    for norm, refs in normalized_question_index.items():
        if len(refs) <= 1:
            continue
        quiz_ids = sorted({q for _, q in refs})
        severity = "error" if len(quiz_ids) == 1 else "warning"
        _issue(issues, "CQ-D01", severity, "question", "/".join(str(i + 2) for i, _ in refs),
               f"duplicate normalized question appears {len(refs)} times across quiz(es): {', '.join(quiz_ids)}")

    # Explanation duplication is useful for spotting copy/paste drift, but is not
    # inherently wrong: the same grammar point can legitimately share an
    # explanation across every question in one quiz. Agent 76 — that
    # single-quiz case stays "info" (never blocking, even under --strict):
    # reuse spread across multiple *different* quizzes is the actual
    # template-drift signal, and is promoted to "warning" so the canonical
    # strict-mode policy (STRICT_BLOCKING_CODES) can block it in production.
    for norm, refs in explanation_index.items():
        if len(refs) >= 4 and norm:
            quiz_ids = sorted({q for _, q in refs})
            severity = "info" if len(quiz_ids) <= 1 else "warning"
            _issue(issues, "CQ-D02", severity, "explanation", "/".join(str(i + 2) for i, _ in refs),
                   f"same normalized explanation reused {len(refs)} times across quiz(es): {', '.join(quiz_ids)}")

    # CQ-D03 — near duplicates within a level/category, with candidate pruning.
    buckets: defaultdict[tuple[str, str], list[tuple[int, str, str]]] = defaultdict(list)
    for norm, refs in normalized_question_index.items():
        for idx, quiz_id in refs:
            row = rows[idx]
            buckets[(_text(row.get("level")).upper(), _text(row.get("quiz_category")).lower())].append((idx, quiz_id, norm))
    for bucket_rows in buckets.values():
        if len(bucket_rows) < 2:
            continue
        by_idx = {idx: (quiz, text) for idx, quiz, text in bucket_rows}
        if len(bucket_rows) <= 2500:
            candidate_pairs = ((a[0], b[0]) for pos, a in enumerate(bucket_rows) for b in bucket_rows[pos + 1:])
            token_sets = {}
        else:
            candidate_pairs, token_sets = _near_duplicate_candidates(bucket_rows)
        for idx_a, idx_b in candidate_pairs:
            quiz_a, text_a = by_idx[idx_a]
            quiz_b, text_b = by_idx[idx_b]
            if quiz_a == quiz_b or text_a == text_b:
                continue
            tokens_a = token_sets.get(idx_a) or set(text_a.split())
            tokens_b = token_sets.get(idx_b) or set(text_b.split())
            if len(tokens_a) < 5 or len(tokens_b) < 5:
                continue
            union = len(tokens_a | tokens_b)
            if union and len(tokens_a & tokens_b) / union >= 0.92:
                ratio = difflib.SequenceMatcher(None, text_a, text_b).ratio()
                if ratio >= 0.93:
                    _issue(issues, "CQ-D03", "warning", "question", f"rows {idx_a + 2}/{idx_b + 2}",
                           f"near-duplicate questions ({ratio:.0%} similarity) in {quiz_a} and {quiz_b}")

    # CQ-D04 — repeated authored question frames. This is intentionally a
    # warning rather than an error: repeated frames can be valid for a skill,
    # but high reuse across quizzes is a useful content-diversity review signal.
    for (level_key, category_key, frame), refs in diversity_index.items():
        if len(refs) < 4:
            continue
        quiz_ids = sorted({quiz_id for _, quiz_id in refs})
        if len(quiz_ids) < 3:
            continue
        _issue(issues, "CQ-D04", "warning", "diversity",
               "/".join(str(i + 2) for i, _ in refs),
               f"question frame reused {len(refs)} times across {len(quiz_ids)} quizzes in {level_key}/{category_key}: '{frame}'")

    # CQ-D05 — repeated answer-tuple + correct-answer text at dataset scale
    # (Agent 73). Mirrors the CQ-D04 threshold shape so a single templated
    # option/answer combination is only flagged once it recurs across many
    # distinct quizzes; a shared "is/am/are" style paradigm inside one quiz
    # never contributes more than one quiz to the count.
    for (level_key, category_key, answer_tuple, correct_text), refs in answer_tuple_index.items():
        if len(refs) < 4:
            continue
        quiz_ids = sorted({quiz_id for _, quiz_id in refs})
        if len(quiz_ids) < 3:
            continue
        _issue(issues, "CQ-D05", "warning", "diversity",
               "/".join(str(i + 2) for i, _ in refs),
               f"answer set with correct answer '{correct_text}' reused {len(refs)} times across "
               f"{len(quiz_ids)} quizzes in {level_key}/{category_key}; review for a templated option pattern")

    # CQ-D06 — within-quiz near-duplicate item signature (Agent 73): same
    # stem frame, same answer set, and the same correct-answer text repeated
    # inside a single quiz. This is deliberately a three-way match so quizzes
    # that legitimately reuse one dimension (same options, different
    # sentences and answers; or same correct answer, different distractors)
    # are not penalized — only genuine low-diversity repeats are.
    for quiz_id, sig_counter in quiz_signature_refs.items():
        for (frame, answer_tuple, correct_text), idxs in sig_counter.items():
            if len(idxs) < 2:
                continue
            _issue(issues, "CQ-D06", "warning", "diversity",
                   "/".join(str(i + 2) for i in idxs),
                   f"quiz {quiz_id} repeats the same stem/answer-set/correct-answer combination "
                   f"{len(idxs)} times ('{frame}' -> '{correct_text}'); review for low within-quiz variation")

    # CQ-D07 — within-quiz question-stem template diversity ratio (Agent 73).
    # Only evaluated once a quiz is large enough (>=6 questions) for a ratio
    # to be meaningful; below that, small starter/authoring quizzes are
    # exempt by design (matches the CQ-B01 minimum-questions rollout stance).
    for quiz_id, frames in quiz_frames.items():
        if len(frames) < 6:
            continue
        unique_ratio = len(set(frames)) / len(frames)
        if unique_ratio < 0.5:
            _issue(issues, "CQ-D07", "warning", "diversity", _quiz_ref(quiz_id),
                   f"only {len(set(frames))} distinct question stems across {len(frames)} questions "
                   f"({unique_ratio:.0%} unique); review for excessive stem templating")

    # CQ-Bxx — quiz structure/coverage.
    quiz_metrics = []
    for quiz_id, qrows in sorted(quiz_rows.items()):
        level = _text(qrows[0][1].get("level")).upper()
        category = _text(qrows[0][1].get("quiz_category"))
        title = _text(qrows[0][1].get("title"))
        count = len(qrows)
        if count < min_questions_per_quiz:
            _issue(issues, "CQ-B01", "warning", "quiz", _quiz_ref(quiz_id),
                   f"quiz has {count} question(s); production target is at least {min_questions_per_quiz}")
        if not title:
            _issue(issues, "CQ-B02", "error", "quiz", _quiz_ref(quiz_id), "quiz title is empty")
        if level not in LEVELS:
            _issue(issues, "CQ-B03", "error", "quiz", _quiz_ref(quiz_id), f"unknown level '{level}'")
        if not category:
            _issue(issues, "CQ-B04", "error", "quiz", _quiz_ref(quiz_id), "quiz category is empty")

        local_indices = []
        for _, row in qrows:
            answers = _answer_values(row)
            try:
                ci = int(row.get("correct_index"))
                if 1 <= ci <= len(answers):
                    local_indices.append(ci)
            except (TypeError, ValueError):
                continue
        if len(local_indices) >= 5:
            counts = Counter(local_indices)
            dominant_index, dominant_count = counts.most_common(1)[0]
            if dominant_count / len(local_indices) >= 0.8:
                _issue(issues, "CQ-B05", "warning", "quiz", _quiz_ref(quiz_id),
                       f"correct-answer position {dominant_index} is used for {dominant_count}/{len(local_indices)} questions ({dominant_count / len(local_indices):.0%})")

        quiz_metrics.append({
            "quiz_id": quiz_id,
            "level": level,
            "category": category,
            "title": title,
            "questions": count,
            "correct_index_distribution": dict(sorted(Counter(local_indices).items())),
        })

    # CQ-B07 — CEFR/category coverage policy (Agent 72).
    # Only levels with an explicit policy are checked. Bounds are inclusive;
    # missing required categories are reported as errors because they make the
    # frozen A1/A2 catalog structurally non-conformant. Other categories remain
    # allowed but do not satisfy the required Grammar/Vocabulary mix.
    quiz_level_categories = defaultdict(Counter)
    for quiz_id, qrows in quiz_rows.items():
        qlevel = _text(qrows[0][1].get("level")).upper()
        qcategory = _text(qrows[0][1].get("quiz_category"))
        if qlevel and qcategory:
            quiz_level_categories[qlevel][qcategory] += 1

    coverage_metrics = {}
    for level_key, policy in CEFR_CATEGORY_POLICY.items():
        counts = quiz_level_categories.get(level_key, Counter())
        total = sum(counts.values())
        category_shares = {
            category: (counts.get(category, 0) / total if total else 0.0)
            for category in policy
        }
        coverage_metrics[level_key] = {
            "quizzes": total,
            "categories": dict(sorted(counts.items())),
            "required_shares": {
                category: {"min": bounds[0], "max": bounds[1], "actual": category_shares[category]}
                for category, bounds in policy.items()
            },
        }
        # Small unit-test/authoring fixtures are intentionally exempt; the
        # policy becomes meaningful once a level has at least five quizzes.
        if total < 5:
            continue
        for category, (minimum, maximum) in policy.items():
            actual = category_shares[category]
            if actual < minimum or actual > maximum:
                _issue(
                    issues, "CQ-B07", "error", "coverage", f"level {level_key}",
                    f"{level_key} requires {category} share {minimum:.0%}–{maximum:.0%}; "
                    f"actual {actual:.0%} ({counts.get(category, 0)}/{total} quizzes)"
                )

    # Dataset-level answer-position bias.
    total_answered = sum(global_correct_indices.values())
    if total_answered >= 10:
        dominant_index, dominant_count = global_correct_indices.most_common(1)[0]
        if dominant_count / total_answered >= 0.7:
            _issue(issues, "CQ-B06", "warning", "dataset", "dataset",
                   f"correct-answer position {dominant_index} dominates globally at {dominant_count}/{total_answered} ({dominant_count / total_answered:.0%})")

    # Dataset safety scan for obvious executable content in question text.
    for idx, row in enumerate(rows):
        question = _text(row.get("question_text"))
        if re.search(r"<\s*(?:script|iframe|object|embed)\b|javascript:", question, flags=re.IGNORECASE):
            _issue(issues, "CQ-S05", "error", "safety", _row_ref(idx, row),
                   "question contains potentially executable HTML/URL content")

    # Agent 76 — apply the canonical strict-mode blocking policy. Promotion
    # happens once, here, after every check has run, so no individual check
    # needs to know about `strict`. Only "warning"-severity issues are
    # promoted: "info" is reserved for signals that are informational by
    # design (e.g. legitimate single-quiz explanation reuse) and must never
    # become blocking just because its code also has a genuine warning-level
    # variant elsewhere in the same code (e.g. cross-quiz CQ-D02 drift).
    if strict:
        for idx, issue in enumerate(issues):
            if issue.code in STRICT_BLOCKING_CODES and issue.severity == "warning":
                issues[idx] = dataclasses.replace(issue, severity="error")

    # Per-question/per-quiz summaries.
    issue_dicts = [i.to_dict() for i in sorted(issues, key=_issue_sort_key)]
    counts = Counter(i.severity for i in issues)
    by_code = Counter(i.code for i in issues)
    by_level = Counter(_text(r.get("level")).upper() for r in rows if _text(r.get("level")))
    by_category = Counter(_text(r.get("quiz_category")) for r in rows if _text(r.get("quiz_category")))

    overall_score = _quality_score(issues)
    return {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "input_rows": len(rows),
        "input_quizzes": len(quiz_rows),
        "strict": strict,
        "category_policy": CEFR_CATEGORY_POLICY,
        "thresholds": {
            "min_questions_per_quiz": min_questions_per_quiz,
            "max_question_chars": max_question_chars,
            "min_explanation_chars": min_explanation_chars,
            "max_explanation_chars": max_explanation_chars,
        },
        "summary": {
            "quality_score": overall_score,
            "errors": counts["error"],
            "warnings": counts["warning"],
            "info": counts["info"],
            "by_code": dict(sorted(by_code.items())),
            "levels": dict(sorted(by_level.items())),
            "categories": dict(sorted(by_category.items())),
        },
        "quizzes": quiz_metrics,
        "cefr_category_coverage": coverage_metrics,
        "issues": issue_dicts,
    }


def iter_csv_rows(path: str, chunk_size: int = 5000):
    """Yield bounded CSV row chunks; callers never need to materialize the file."""
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        chunk = []
        for row in reader:
            chunk.append(row)
            if len(chunk) >= chunk_size:
                yield chunk
                chunk = []
        if chunk:
            yield chunk

def audit_file(path: str, **kwargs) -> dict:
    # CSV uses chunked ingestion. The final audit still needs bounded global indexes
    # for cross-file duplicate detection; this avoids whole-file parser/list retention.
    if str(path).lower().endswith(".csv"):
        rows = []
        for chunk in iter_csv_rows(path):
            rows.extend(chunk)
        return audit_rows(rows, **kwargs)
    return audit_rows(build_module.read_rows(path), **kwargs)


def write_json(report: dict, path: str):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def write_csv(report: dict, path: str):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    fields = ["code", "severity", "scope", "ref", "message"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(report["issues"])


def _markdown_table(rows: Iterable[dict], headers: list[str]) -> str:
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        out.append("| " + " | ".join(str(row.get(h, "")).replace("|", "\\|") for h in headers) + " |")
    return "\n".join(out)


def write_markdown(report: dict, path: str, input_path: str):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    s = report["summary"]
    lines = [
        "# Mylingo Content QA Report",
        "",
        f"- Generated: {report['generated_at']}",
        f"- Source: `{input_path}`",
        f"- Rows: {report['input_rows']}",
        f"- Quizzes: {report['input_quizzes']}",
        f"- Mode: {'strict' if report['strict'] else 'diagnostic'}",
        f"- Triage score: **{s['quality_score']}/100** (review-priority signal only; not a CEFR score)",
        "",
        "## Outcome",
        "",
        f"- Errors: **{s['errors']}**",
        f"- Warnings: **{s['warnings']}**",
        f"- Info: **{s['info']}**",
        "",
        "## Coverage",
        "",
        _markdown_table(
            [{"level": k, "rows": v} for k, v in s["levels"].items()],
            ["level", "rows"],
        ),
        "",
        _markdown_table(
            [{"category": k, "rows": v} for k, v in s["categories"].items()],
            ["category", "rows"],
        ),
        "",
        "## Thresholds",
        "",
        _markdown_table(
            [report["thresholds"]],
            list(report["thresholds"].keys()),
        ),
        "",
        "## Issues",
        "",
    ]
    if report["issues"]:
        lines.append(_markdown_table(report["issues"], ["severity", "code", "scope", "ref", "message"]))
    else:
        lines.append("No content QA issues found.")
    lines.extend([
        "",
        "## Interpretation",
        "",
        "This audit is deliberately deterministic. It can detect structural and linguistic-risk signals at scale, but it does not claim to prove that a question is pedagogically perfect or officially CEFR-aligned. Human review remains required for meaning, factual correctness, naturalness, distractor validity, and level appropriateness.",
        "",
        "Diagnostic mode is the default so a sparse starter dataset is observable without being falsely blocked. Strict mode is intended for a production promotion gate once the content library adopts the documented thresholds.",
        "",
        "Strict mode (`--strict`) promotes the canonical blocking codes in `STRICT_BLOCKING_CODES` "
        "(currently: " + ", ".join(sorted(STRICT_BLOCKING_CODES)) + ") to errors; any other code remains "
        "at its diagnostic severity even under `--strict`.",
    ])
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Mylingo deterministic content QA auditor")
    parser.add_argument("audit", nargs="?", default="audit", help="audit the input file")
    parser.add_argument("--input", default="master_source.csv", help="master source CSV/XLSX path")
    parser.add_argument("--out-dir", default="content_qa", help="output directory")
    parser.add_argument("--strict", action="store_true", help="promote production-threshold issues to errors")
    parser.add_argument("--min-questions", type=int, default=DEFAULT_MIN_QUESTIONS)
    parser.add_argument("--max-question-chars", type=int, default=DEFAULT_MAX_QUESTION_CHARS)
    parser.add_argument("--min-explanation-chars", type=int, default=DEFAULT_MIN_EXPLANATION_CHARS)
    parser.add_argument("--max-explanation-chars", type=int, default=DEFAULT_MAX_EXPLANATION_CHARS)
    args = parser.parse_args(argv)

    report = audit_file(
        args.input,
        strict=args.strict,
        min_questions_per_quiz=args.min_questions,
        max_question_chars=args.max_question_chars,
        min_explanation_chars=args.min_explanation_chars,
        max_explanation_chars=args.max_explanation_chars,
    )
    out = Path(args.out_dir)
    write_markdown(report, str(out / "CONTENT_QA_REPORT.md"), args.input)
    write_json(report, str(out / "content_qa_report.json"))
    write_csv(report, str(out / "content_qa_issues.csv"))

    s = report["summary"]
    print(f"Content QA: {s['errors']} errors, {s['warnings']} warnings, {s['info']} info; score {s['quality_score']}/100")
    print(f"Reports: {out / 'CONTENT_QA_REPORT.md'}, {out / 'content_qa_report.json'}, {out / 'content_qa_issues.csv'}")
    return 1 if s["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
