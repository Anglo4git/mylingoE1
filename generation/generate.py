#!/usr/bin/env python3
"""
Mylingo generation layer — Agent 2.

Takes RAW question content (the shape a content author or an automated
question generator actually produces — one row per question, with no
quiz_id, no title, no question_number, no status) and derives the canonical
23-column `master_source.csv` shape Agent 1 froze, so the authoring app and
`build.py` never need to know a question was generated.

Why this exists
----------------
Looking at the real inputs this project already has:

  data structure orientation for auditoring/
    "### a sample of the dataset i have about 400 quizzes.tsv"
    "##what the system shoud genrate automatically to avoid human errors.tsv"

...the raw content a human/automation produces has exactly these columns:

    question_text, question_category, question_tags, explanation,
    correct_index, answer_1..answer_9

`question_tags` already encodes "{quiz_category},{level}" (e.g.
"Grammar,A1") — that is the ONLY place level/category information lives in
the raw row. Everything else the master source needs (quiz_id, title,
description, quiz_category, quiz_tags, version, status, question_number) is
exactly the set of fields the second file says "the system should generate
automatically to avoid human errors" — because they are bookkeeping, not
content, and bookkeeping typed by hand is where typos/mismatches (wrong
level prefix, non-contiguous question numbers, inconsistent metadata across
a quiz) come from. Those are the exact things `build.py`'s V-A3/V-A4/V-G1
rules catch after the fact; this script prevents them before the fact.

Design
------
1. Parse + canonicalize each raw row. Authors may provide only the raw
   question payload (`question_text`, answers, `correct_index`, and optionally
   `explanation`). Any missing bookkeeping metadata is inferred automatically.
   When supplied, explicit `level`/`quiz_category`/`question_category`/tags are
   still honored as hints.
2. Group accepted rows by (level, title) — title is the raw row's
   `question_category`, e.g. "Present Simple" — matching the authoring app's
   MIN/MAX questions-per-quiz rule (5-150).
3. Reuse an existing quiz (by level+title match) if present in
   `--existing`, appending new questions at the next question_number, so
   regenerating never renumbers or renames unrelated rows (deterministic
   `question_id = quiz_id + '-q' + question_number`, same derivation
   `build.py` already uses).
4. Otherwise mint a new quiz_id: next unused `{level}-{NNN}` for that level.
5. Groups under MIN_QUESTIONS are held as "pending" (not written) rather
   than emitted as an under-filled quiz that would fail the authoring app's
   own validation.
6. Before writing anything, the *combined* row set (existing + newly
   generated) is run back through `build.py`'s own `validate()` — the same
   function the build and CI path use — so this script can never produce a
   master_source.csv that build.py would reject. Any generated quiz that
   fails is pulled back out and reported as rejected, never silently
   dropped.
7. Content Schema v2 (07_CONTENT_SCHEMA_V2.md): every row this script
   mints gets `date_added` stamped with one shared UTC timestamp for the
   run. `date_updated` is left blank at creation — see `promote.py` and
   the authoring app for where an existing row actually gets edited.
   Pre-existing rows passed in via `--existing` are carried through
   untouched, including their `date_added`/`date_updated` values (or lack
   of them) if the source file predates schema v2 — this script never
   backfills history it doesn't have.

Usage
-----
    python3 generation/generate.py \\
        --raw generation/fixtures/raw_questions_sample.csv \\
        --existing master_source.csv \\
        --out master_source.generated.csv \\
        --report generation/GENERATION_REPORT.md \\
        --rejects generation/REJECTED_ROWS.csv \\
        --metadata-out generation/GENERATION_METADATA.csv \\
        --status draft
"""

import argparse
import csv
import io
import hashlib
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import build as build_module  # noqa: E402  (reuse the single source of truth)
from answer_position import rebalance_quiz_rows
import model_classifier  # noqa: E402  (Agent 5: model-backed CEFR/topic classification)

LEVELS = build_module.LEVELS
VALID_STATUS = build_module.VALID_STATUS
ANSWER_COLS = build_module.ANSWER_COLS
MIN_ANSWERS = build_module.MIN_ANSWERS
MAX_ANSWERS = build_module.MAX_ANSWERS

# Content Schema v2 (07_CONTENT_SCHEMA_V2.md): optional, appended columns.
# Reused from build.py so both sides of the contract never drift apart.
DATE_COLUMNS = build_module.SCHEMA_V2_DATE_COLUMNS

MIN_QUESTIONS_PER_QUIZ = 5
MAX_QUESTIONS_PER_QUIZ = 150

CANONICAL_COLUMNS = [
    "quiz_id", "level", "title", "description", "quiz_category", "quiz_tags",
    "version", "status", "question_number", "question_text",
    "question_category", "question_tags", "explanation", "correct_index",
] + ANSWER_COLS + DATE_COLUMNS

# Canonical quiz_category values the site's topic folders actually use
# (site/grammar, site/vocabulary, site/writing, site/academic-english).
# Raw content is matched against this case-insensitively so "grammar",
# "GRAMMAR", " Grammar " all resolve to the one canonical spelling that
# build.py's topic_slug() will fold into the right folder.
CATEGORY_ALIASES = {
    "grammar": "Grammar",
    "vocabulary": "Vocabulary",
    "vocab": "Vocabulary",
    "writing": "Writing",
    "academic english": "Academic English",
    "academic-english": "Academic English",
    "academic": "Academic English",
}

LEGACY_FIELD_MAP = {
    "prompt": "question_text",
    "question_num": "question_number",
    "category": "question_category",
}


class GenerationIssue:
    __slots__ = ("stage", "ref", "reason")

    def __init__(self, stage, ref, reason):
        self.stage = stage
        self.ref = ref
        self.reason = reason

    def __str__(self):
        return f"[{self.stage}] {self.ref}: {self.reason}"


def read_raw_rows(path):
    """Read raw content rows. Supports .csv and .tsv (delimiter sniffed)."""
    with open(path, newline="", encoding="utf-8") as f:
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t")
        except csv.Error:
            dialect = csv.excel
        return list(csv.DictReader(f, dialect=dialect))


def normalize_legacy_fields(row):
    """Accept the earlier prototype's field names, same boundary philosophy
    as the authoring app's legacy import (see authoring/README.md)."""
    out = dict(row)
    for legacy, canonical in LEGACY_FIELD_MAP.items():
        if legacy in out and canonical not in out:
            out[canonical] = out.pop(legacy)
    if "option_0" in out:
        legacy_answers = [out.pop(f"option_{i}") for i in range(4) if f"option_{i}" in out]
        for i, val in enumerate(legacy_answers, start=1):
            out.setdefault(f"answer_{i}", val)
        if "correct_index" in out:
            try:
                out["correct_index"] = str(int(out["correct_index"]) + 1)  # 0-based -> 1-based
            except (TypeError, ValueError):
                pass
    return out


def canonicalize_category(raw_value):
    key = str(raw_value or "").strip().lower()
    return CATEGORY_ALIASES.get(key)


def canonicalize_level(raw_value):
    val = str(raw_value or "").strip().upper()
    return val if val in LEVELS else None




def _text_lower(value):
    return str(value or "").strip().lower()


def infer_quiz_category(question_text):
    """Best-effort deterministic category inference for raw-only authoring."""
    text = _text_lower(question_text)
    writing_markers = ("write an", "write a", "rewrite", "email", "paragraph", "essay", "letter", "formal message")
    academic_markers = ("academic", "research", "thesis", "cohesion", "citation", "paraphrase", "argument", "formal register")
    vocab_markers = ("synonym", "antonym", "closest meaning", "closest word", "meaning of", "definition of", "word that means", "vocabulary")
    grammar_markers = ("grammatically", "correct form", "tense", "subject-verb", "put the words in order", "word order", "article", "preposition", "modal", "plural", "comparative", "superlative", "passive voice", "conditional", "reported speech", "___")
    if any(m in text for m in writing_markers):
        return "Writing"
    if any(m in text for m in academic_markers):
        return "Academic English"
    if any(m in text for m in vocab_markers):
        return "Vocabulary"
    if any(m in text for m in grammar_markers):
        return "Grammar"
    return "Vocabulary"


def infer_title(question_text, category=None):
    """Map common raw-question patterns to a stable quiz topic title."""
    text = _text_lower(question_text)
    patterns = [
        (("present continuous", "present progressive"), "Present Continuous"),
        (("present simple", "simple present", "every day", "every morning", "on saturdays"), "Present Simple"),
        (("past continuous", "past progressive"), "Past Continuous"),
        (("past simple", "simple past", "last year", "yesterday"), "Past Simple"),
        (("future simple", "will", "going to"), "Future Forms"),
        (("irregular", "past form", "past tense"), "Irregular Verbs"),
        (("synonym", "closest synonym", "closest meaning"), "Synonyms"),
        (("antonym", "opposite meaning"), "Antonyms"),
        (("article", " a ", " an ", " the "), "Articles"),
        (("preposition", "in / on / at", "at / on / in"), "Prepositions"),
        (("comparative", "superlative"), "Comparatives & Superlatives"),
        (("modal", "should", "must", "can", "could"), "Modal Verbs"),
        (("conditional", "if \"", "if you"), "Conditionals"),
        (("passive", "passive voice"), "Passive Voice"),
        (("reported speech", "indirect speech"), "Reported Speech"),
        (("word order", "put the words in order"), "Word Order"),
        (("punctuation", "comma", "apostrophe", "full stop", "question mark"), "Punctuation"),
        (("phrasal verb", "phrasal verbs"), "Phrasal Verbs"),
        (("collocation", "collocations"), "Collocations"),
    ]
    for needles, title in patterns:
        if any(n in text for n in needles):
            return title
    if category == "Writing":
        return "Writing Practice"
    if category == "Academic English":
        return "Academic English"
    return "General Practice"


def infer_level(question_text, answers, title=None, category=None):
    """Best-effort CEFR inference, stabilized by the inferred topic."""
    topic = _text_lower(title)
    topic_levels = {
        "present simple": "A1",
        "be: am/is/are": "A1",
        "articles": "A1",
        "plural nouns": "A1",
        "there is / there are": "A1",
        "irregular verbs": "A1",
        "past simple": "A2",
        "present continuous": "A2",
        "future forms": "A2",
        "synonyms": "A2",
        "antonyms": "A2",
        "prepositions": "A2",
        "comparatives & superlatives": "A2",
        "phrasal verbs": "B1",
        "collocations": "B1",
        "word order": "B1",
        "reported speech": "B1",
        "passive voice": "B1",
        "conditionals": "B1",
        "punctuation": "B1",
    }
    if topic in topic_levels:
        return topic_levels[topic]

    text = _text_lower(question_text)
    words = [w for w in text.replace("/", " ").split() if w]
    abstract_markers = ("however", "although", "whereas", "despite", "consequently", "nevertheless", "implication", "evaluate", "justify", "hypothesis", "sustainable", "significant")
    advanced_markers = ("notwithstanding", "albeit", "insofar", "intrinsic", "subsequent", "counterargument", "nuance", "mitigate", "corroborate", "paradigm")
    intermediate_markers = ("because", "although", "unless", "while", "since", "already", "yet", "instead", "rather")
    joined = " ".join(_text_lower(a) for a in answers)
    if any(m in text for m in advanced_markers) or len(words) >= 28:
        return "C1"
    if any(m in text for m in abstract_markers) or len(words) >= 22:
        return "B2"
    if any(m in text for m in intermediate_markers) or len(words) >= 16:
        return "B1"
    if len(words) <= 12 and any(m in text or m in joined for m in ("go", "be", "have", "happy", "big", "home", "school", "food")):
        return "A1"
    if len(words) <= 16:
        return "A2"
    return "B1"


def infer_explanation(question_text, answers, correct_index):
    """Generate a safe generic explanation when raw input omits one."""
    answer = answers[correct_index - 1]
    return f'The correct answer is "{answer}".'



def infer_generation_metadata(question_text, title, category, level, answers, correct_index):
    text = _text_lower(question_text)
    objective = f"Practice {title} at {level} level."
    if category == "Vocabulary":
        objective = f"Develop vocabulary knowledge of {title.lower()} through context and meaning."
    elif category == "Grammar":
        objective = f"Use {title} accurately in context."
    elif category == "Writing":
        objective = f"Produce appropriate written language for {title.lower()}."
    elif category == "Academic English":
        objective = f"Apply academic English conventions related to {title.lower()}."

    difficulty = level
    if any(m in text for m in ("synonym", "closest meaning", "true or false")):
        distractor_strategy = "semantic-confusion"
    elif any(m in text for m in ("correct form", "tense", "grammatically", "word order", "article", "preposition")):
        distractor_strategy = "grammar-contrast"
    elif len(answers) >= 5:
        distractor_strategy = "plausible-alternatives"
    else:
        distractor_strategy = "contrastive-options"

    template_base = "".join(ch.lower() if ch.isalnum() else "-" for ch in title).strip("-") or "general"
    template_id = f"auto-{category.lower().replace(' ', '-')}-{template_base}"
    seed = int(hashlib.sha256(question_text.encode("utf-8")).hexdigest()[:8], 16)
    return {
        "template_id": template_id,
        "seed": seed,
        "learning_objective": objective,
        "difficulty": difficulty,
        "distractor_strategy": distractor_strategy,
        "source_reference": "raw-input",
    }


def _explicit_hints(row):
    """Extract whatever level/category/title a raw row already supplies
    (as valid, canonical values), without inferring anything. Returns
    (known_level, known_category, known_title) — any of which may be
    None if not supplied or not valid, meaning it still needs
    classification (model-backed or heuristic).

    This is exactly Agent 4's original precedence: an explicit `level`
    column beats a level folded into `question_tags`; an explicit
    `quiz_category`/`question_category`/tags-derived category beats
    inference; a `question_category` value that ISN'T itself a known
    top-level category (e.g. "Present Simple" rather than "Grammar") is
    treated as an author-supplied title, not something to infer.
    """
    explicit_level = canonicalize_level(row.get("level"))
    tags_raw = str(row.get("question_tags", "") or "").strip()
    tag_parts = [p.strip() for p in tags_raw.split(",") if p.strip()]
    tag_level = canonicalize_level(tag_parts[-1]) if len(tag_parts) >= 2 else canonicalize_level(tag_parts[0] if tag_parts else None)
    known_level = explicit_level or tag_level

    known_category = (canonicalize_category(row.get("quiz_category")) or
                       canonicalize_category(row.get("question_category")) or
                       (canonicalize_category(tag_parts[0]) if tag_parts else None))

    raw_topic = str(row.get("question_category", "") or "").strip()
    known_title = raw_topic if (raw_topic and canonicalize_category(raw_topic) is None) else None

    return known_level, known_category, known_title


def _heuristic_classify(question_text, answers, correct_index, known_category, known_title):
    """Agent 4's original deterministic cascade, used as the fallback
    whenever the model classifier is unavailable or fails for a given
    question. Kept as the single source of truth for the heuristic so
    `model_classifier.py` never has to duplicate or import it back."""
    category = known_category or infer_quiz_category(question_text)
    title = known_title or infer_title(question_text, category)
    level = infer_level(question_text, answers, title=title, category=category)
    return level, category, title


def derive_raw_metadata(row, question_text, answers, correct_index, known_titles=()):
    """Fill in whatever level/category/title a raw row didn't already
    supply. Behind this unchanged interface, Agent 5 replaced Agent 4's
    keyword-heuristic-only inference with a model-backed classifier (see
    `model_classifier.py`) that falls back to that same heuristic when the
    model is unavailable or fails — see that module's docstring for the
    full design rationale.
    """
    known_level, known_category, known_title = _explicit_hints(row)
    if known_level and known_category and known_title:
        model_classifier.STATS["fully_specified"] += 1
        return known_level, known_category, known_title

    result = model_classifier.classify_one(
        question_text, answers, correct_index,
        known_level=known_level, known_category=known_category, known_title=known_title,
        levels=LEVELS, categories=sorted(set(CATEGORY_ALIASES.values())),
        known_titles=known_titles, heuristic_fallback=_heuristic_classify,
    )
    return result.level, result.quiz_category, result.title


def derive_raw_metadata_prewarm(raw_items, known_titles=()):
    """Batch-classify every item in `raw_items` up front so the per-row
    `derive_raw_metadata()` calls in the main parse loop become cache
    lookups instead of one HTTP round-trip per question. Purely a
    performance optimization — correctness does not depend on calling
    this first, `derive_raw_metadata()` works standalone (e.g. in unit
    tests) with or without a prior prewarm.

    `raw_items` is a list of (row, question_text, answers, correct_index)
    tuples for rows that have already passed basic shape validation.
    """
    to_classify = []
    for row, question_text, answers, correct_index in raw_items:
        known_level, known_category, known_title = _explicit_hints(row)
        if known_level and known_category and known_title:
            continue  # fully specified; derive_raw_metadata won't need the classifier
        to_classify.append({
            "question_text": question_text,
            "answers": answers,
            "correct_index": correct_index,
            "known_level": known_level,
            "known_category": known_category,
            "known_title": known_title,
        })
    if not to_classify:
        return
    model_classifier.classify_batch(
        to_classify, LEVELS, sorted(set(CATEGORY_ALIASES.values())),
        known_titles=known_titles, heuristic_fallback=_heuristic_classify,
    )


def _heuristic_description(level, quiz_category, title):
    """Agent 2's original generic description, used as the fallback
    whenever the model describer is unavailable or fails for a given
    topic group. Also used directly (no model call at all) for the
    synthetic "Mixed {category} Practice" pools, since there's no single
    real topic there for a description to be specific about."""
    return f"Practice {title}."


def derive_group_description(level, category, title, sample_question):
    """One-line description for a brand-new topic group (`level`,
    `category`, `title`). Behind this interface, Agent 6 added
    model-backed description generation (see `model_classifier.py`) that
    falls back to Agent 2's generic `"Practice {title}."` when the model
    is unavailable or fails.

    Only ever called for NEW quizzes. Appending questions to an existing
    quiz reuses that quiz's already-committed description unchanged (see
    `generate()`) — every row in a quiz must show the same description,
    and an existing quiz's description was fixed the run it was created.
    """
    return model_classifier.describe_one(
        level, category, title, sample_question,
        heuristic_fallback=_heuristic_description,
    )


def derive_group_descriptions_prewarm(new_groups):
    """Batch-describe every brand-new (level, category, title) group up
    front, mirroring `derive_raw_metadata_prewarm()`'s rationale: a run
    creating dozens of new topics does a handful of chunked model calls
    instead of one per topic. `new_groups` is an iterable of
    (level, category, title, sample_question) tuples. Purely a
    performance optimization — `derive_group_description()` works
    standalone with or without a prior prewarm."""
    items = [
        {"level": level, "quiz_category": category, "title": title, "sample_question": sample_question}
        for level, category, title, sample_question in new_groups
    ]
    if not items:
        return
    model_classifier.describe_batch(items, heuristic_fallback=_heuristic_description)


def parse_raw_row(row, rownum, known_titles=()):
    """Convert raw question content into the normalized internal shape.

    Raw-only input is intentional: `quiz_id`, title, description, level,
    categories/tags, version, status and question_number are all generated
    when the caller did not provide them.
    """
    row = normalize_legacy_fields(row)
    ref = f"raw row {rownum}"

    question_text = str(row.get("question_text", "") or "").strip()
    if not question_text:
        return None, GenerationIssue("parse", ref, "missing question_text")

    try:
        correct_index = int(row.get("correct_index"))
    except (TypeError, ValueError):
        return None, GenerationIssue("parse", ref, "correct_index must be an integer")

    answers = []
    gap = False
    for col in ANSWER_COLS:
        val = str(row.get(col, "") or "").strip()
        if val == "":
            gap = True
            continue
        if gap:
            return None, GenerationIssue("parse", ref, f"gap in answer columns before '{col}'")
        answers.append(val)
    if not (MIN_ANSWERS <= len(answers) <= MAX_ANSWERS):
        return None, GenerationIssue(
            "parse", ref, f"{len(answers)} answers provided; need {MIN_ANSWERS}-{MAX_ANSWERS}")
    if len(answers) != len(set(a.lower() for a in answers)):
        return None, GenerationIssue("parse", ref, "duplicate answer options within this question")
    if not (1 <= correct_index <= len(answers)):
        return None, GenerationIssue(
            "parse", ref, f"correct_index {correct_index} out of range for {len(answers)} answer(s)")

    level, category, title = derive_raw_metadata(row, question_text, answers, correct_index,
                                                  known_titles=known_titles)
    explanation = str(row.get("explanation", "") or "").strip() or infer_explanation(question_text, answers, correct_index)

    generated = {
        "level": level,
        "title": title,
        "quiz_category": category,
        "quiz_tags": f"{category},{level}",
        "question_text": question_text,
        "question_category": category,
        "question_tags": f"{category},{level}",
        "explanation": explanation,
        "correct_index": correct_index,
        "answers": answers,
        "_source_ref": ref,
        "_generation_meta": infer_generation_metadata(question_text, title, category, level, answers, correct_index),
    }
    return generated, None


def load_existing(existing_path):
    """Index the current master_source.csv: (level, title-lower) -> quiz info,
    plus the highest numeric suffix already used per level, so new quiz_ids
    never collide with what's already published/drafted."""
    by_group = {}
    max_seq = defaultdict(int)
    rows = []
    if existing_path and os.path.isfile(existing_path):
        rows = build_module.read_rows(existing_path)
        by_quiz = defaultdict(list)
        for r in rows:
            by_quiz[str(r.get("quiz_id", "")).strip()].append(r)
        for quiz_id, qrows in by_quiz.items():
            first = qrows[0]
            level = str(first.get("level", "")).strip().upper()
            title = str(first.get("title", "")).strip()
            category = str(first.get("quiz_category", "")).strip()
            nums = [int(r["question_number"]) for r in qrows
                    if str(r.get("question_number", "")).strip().isdigit()]
            by_group[(level, category.lower(), title.lower())] = {
                "quiz_id": quiz_id,
                "title": title,
                "version": first.get("version"),
                "status": str(first.get("status", "")).strip(),
                "description": str(first.get("description", "")).strip(),
                "next_question_number": (max(nums) + 1) if nums else 1,
            }
            suffix = quiz_id.split("-")[-1]
            if suffix.isdigit():
                max_seq[level] = max(max_seq[level], int(suffix))
    return rows, by_group, max_seq


def allocate_quiz_id(level, max_seq):
    max_seq[level] += 1
    return f"{level.lower()}-{max_seq[level]:03d}"


def chunk(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def build_rows_for_group(level, title, questions, quiz_id, start_number, version, status,
                          description, date_added):
    """Build canonical rows for a brand-new or appended-to quiz.

    `date_added` (Content Schema v2, 07_CONTENT_SCHEMA_V2.md) is stamped
    once, at row creation, on every row this function mints — whether it's
    a new quiz or new questions appended to an existing one, both of which
    are genuinely new rows in `master_source.csv`'s sense. `date_updated`
    is left blank: nothing about generation counts as an "edit" of a row
    that didn't exist before, and the contract reserves that field for a
    later content-bearing change (promotion, an authoring-app save, a
    manual CSV edit).
    """
    out_rows = []
    for offset, q in enumerate(questions):
        qnum = start_number + offset
        row = {
            "quiz_id": quiz_id,
            "level": level,
            "title": title,
            "description": description,
            "quiz_category": q["quiz_category"],
            "quiz_tags": q["quiz_tags"],
            "version": version,
            "status": status,
            "question_number": qnum,
            "question_text": q["question_text"],
            "question_category": q["question_category"],
            "question_tags": q["question_tags"],
            "explanation": q["explanation"],
            "correct_index": q["correct_index"],
            "date_added": date_added,
            "date_updated": "",
        }
        for i, col in enumerate(ANSWER_COLS):
            row[col] = q["answers"][i] if i < len(q["answers"]) else ""
        out_rows.append(row)
    return out_rows


def generate(raw_rows, existing_path, default_status, now=None):
    existing_rows, by_group, max_seq = load_existing(existing_path)
    known_titles = {info["title"] for info in by_group.values() if info.get("title")}

    # Content Schema v2: one shared creation timestamp for every row this
    # run mints, so a single `generate.py` invocation reads as one
    # provenance event rather than a slightly-different timestamp per row.
    # `now` is injectable (real callers never pass it) so tests can assert
    # exact determinism of everything else without fighting the wall clock.
    date_added = now or datetime.now(timezone.utc).isoformat()

    model_classifier.reset_stats()
    # Prewarm the classifier cache in one batched pass (instead of one
    # model call per row) before the row-by-row parse below, which will
    # then hit that cache. See derive_raw_metadata_prewarm()'s docstring.
    prewarm_candidates = []
    for idx, raw in enumerate(raw_rows, start=2):  # +1 header, +1 1-index
        normalized = normalize_legacy_fields(raw)
        text = str(normalized.get("question_text", "") or "").strip()
        try:
            correct_index = int(normalized.get("correct_index"))
        except (TypeError, ValueError):
            continue  # will be rejected with a proper reason in the real parse pass below
        answers = [str(normalized.get(col, "") or "").strip() for col in ANSWER_COLS]
        answers = [a for a in answers if a]
        if text and answers:
            prewarm_candidates.append((normalized, text, answers, correct_index))
    derive_raw_metadata_prewarm(prewarm_candidates, known_titles=known_titles)

    issues = []
    accepted = []
    for idx, raw in enumerate(raw_rows, start=2):  # +1 header, +1 1-index
        parsed, issue = parse_raw_row(raw, idx, known_titles=known_titles)
        if issue:
            issues.append(issue)
        else:
            accepted.append(parsed)

    groups = defaultdict(list)
    for q in accepted:
        groups[(q["level"], q["quiz_category"], q["title"])].append(q)

    # Prewarm descriptions for every group that will become a BRAND-NEW
    # quiz (not an append to an existing one — see derive_group_description's
    # docstring for why appends never get a fresh description, and not a
    # too-small topic that will be pooled into a "Mixed X Practice" quiz
    # under a synthetic title the model is never asked about — see
    # `_heuristic_description`'s docstring). One batched pass here means a
    # run minting dozens of new topics costs a handful of model calls, not
    # one per topic.
    new_group_candidates = []
    for (level, category, title), questions in groups.items():
        key = (level, category.lower(), title.lower())
        if key not in by_group and len(questions) >= MIN_QUESTIONS_PER_QUIZ:
            new_group_candidates.append((level, category, title, questions[0]["question_text"]))
    derive_group_descriptions_prewarm(new_group_candidates)

    new_rows = []
    pending = []  # (level, title, questions, reason)
    generated_quiz_ids = []
    small_pools = defaultdict(list)  # (level, category) -> [(title, question)]

    # Existing quizzes are always preferred. Raw-only new content is first
    # grouped by inferred topic, while small topics are pooled by level/category
    # so a batch with enough total raw questions still produces valid 5-150 item
    # quizzes instead of creating dozens of underfilled quiz records.
    for (level, category, title), questions in groups.items():
        key = (level, category.lower(), title.lower())
        existing_group = by_group.get(key)

        if existing_group:
            quiz_id = existing_group["quiz_id"]
            start = existing_group["next_question_number"]
            room = MAX_QUESTIONS_PER_QUIZ - (start - 1)
            if room <= 0:
                pending.append((level, title, questions,
                                 f"existing quiz '{quiz_id}' is already at the "
                                 f"{MAX_QUESTIONS_PER_QUIZ}-question ceiling"))
                continue
            existing_texts = {
                str(r.get("question_text", "")).strip().lower()
                for r in existing_rows if str(r.get("quiz_id", "")).strip() == quiz_id
            }
            unique_questions = []
            for q in questions:
                text_key = q["question_text"].strip().lower()
                if text_key in existing_texts:
                    issues.append(GenerationIssue("parse", q["_source_ref"],
                        f"duplicate question_text already exists in quiz '{quiz_id}'; skipped"))
                    continue
                existing_texts.add(text_key)
                unique_questions.append(q)
            take, rest = unique_questions[:room], unique_questions[room:]
            if not take and not rest:
                continue
            new_rows.extend(build_rows_for_group(
                level, existing_group["title"], take, quiz_id, start,
                existing_group["version"], existing_group["status"],
                existing_group["description"] or _heuristic_description(
                    level, existing_group.get("category", category), existing_group["title"]),
                date_added))
            generated_quiz_ids.append(quiz_id)
            if rest:
                pending.append((level, title, rest,
                                 f"overflow past existing quiz '{quiz_id}''s "
                                 f"{MAX_QUESTIONS_PER_QUIZ}-question ceiling"))
            continue

        if len(questions) >= MIN_QUESTIONS_PER_QUIZ:
            group_description = derive_group_description(
                level, category, title, questions[0]["question_text"])
            full_batches = len(questions) // MAX_QUESTIONS_PER_QUIZ
            for batch in chunk(questions[:full_batches * MAX_QUESTIONS_PER_QUIZ], MAX_QUESTIONS_PER_QUIZ):
                quiz_id = allocate_quiz_id(level, max_seq)
                new_rows.extend(build_rows_for_group(
                    level, title, batch, quiz_id, 1, 1, default_status, group_description,
                    date_added))
                generated_quiz_ids.append(quiz_id)
            remainder = questions[full_batches * MAX_QUESTIONS_PER_QUIZ:]
            if remainder:
                # A remainder that ALREADY clears the 5-question floor on its
                # own (the common case: any brand-new topic with fewer than
                # MAX_QUESTIONS_PER_QUIZ questions never fills a "full"
                # 150-question batch above, so it always lands here) becomes
                # its own quiz under its own real title. Only a remainder
                # that's too small by itself (a genuine overflow tail, e.g.
                # 153 questions -> one full 150 batch + 3 left over) gets
                # pooled with other topics below, since 3 alone can't become
                # a valid quiz.
                #
                # Bug fixed by Agent 6: before this, EVERY remainder (which,
                # for the overwhelming majority of real topics — anything
                # under MAX_QUESTIONS_PER_QUIZ questions — is the entire
                # group) was unconditionally routed into `small_pools` and
                # relabeled "Mixed {category} Practice" on write-out, even
                # when it was a single, well-formed, already-valid topic
                # quiz on its own. That silently discarded every inferred
                # topic title for any topic with 5-149 questions ever since
                # Agent 4 raised the per-quiz ceiling from 10 to 150 without
                # updating this branch to match — the existing tests didn't
                # catch it because they only asserted row/quiz_id counts,
                # never the resulting title. See generation/README.md's
                # "Fixed: topic titles were being discarded" section.
                if len(remainder) >= MIN_QUESTIONS_PER_QUIZ:
                    quiz_id = allocate_quiz_id(level, max_seq)
                    new_rows.extend(build_rows_for_group(
                        level, title, remainder, quiz_id, 1, 1, default_status, group_description,
                        date_added))
                    generated_quiz_ids.append(quiz_id)
                else:
                    small_pools[(level, remainder[0]["quiz_category"])].extend((title, q) for q in remainder)
        else:
            small_pools[(level, questions[0]["quiz_category"])].extend((title, q) for q in questions)

    # Pack topic remainders into 5-150 question quizzes by level/category.
    # The title is generated as a stable "Mixed <category> Practice" label,
    # making the bookkeeping deterministic without requiring author metadata.
    for (level, category), items in sorted(small_pools.items()):
        i = 0
        while i + MIN_QUESTIONS_PER_QUIZ <= len(items):
            take = items[i:i + MAX_QUESTIONS_PER_QUIZ]
            if len(items) - i < MAX_QUESTIONS_PER_QUIZ:
                take = items[i:i + MAX_QUESTIONS_PER_QUIZ]
                if len(take) < MIN_QUESTIONS_PER_QUIZ:
                    break
            title = f"Mixed {category} Practice"
            quiz_id = allocate_quiz_id(level, max_seq)
            questions_only = [q for _, q in take]
            new_rows.extend(build_rows_for_group(
                level, title, questions_only, quiz_id, 1, 1, default_status,
                _heuristic_description(level, category, title), date_added))
            generated_quiz_ids.append(quiz_id)
            i += len(take)
        if i < len(items):
            remaining = [q for _, q in items[i:]]
            topic_names = sorted(set(t for t, _ in items[i:]))
            title = topic_names[0] if len(topic_names) == 1 else f"Mixed {category} Practice"
            pending.append((level, title, remaining,
                             f"only {len(remaining)} question(s) remain in this level/category "
                             f"batch; needs at least {MIN_QUESTIONS_PER_QUIZ}"))

    # Deterministic position balancing protects newly generated quizzes.\n    new_rows = rebalance_quiz_rows(new_rows)\n\n    # Second-layer safety net: validate the COMBINED row set with build.py's
    # own validator before anything is written. If a newly generated quiz
    # fails, pull just that quiz back out (existing rows must never fail —
    # if they do, that's a bug in this script, not a content problem).
    combined = existing_rows + new_rows
    val_errors, val_warnings, _ = build_module.validate(combined)

    bad_quiz_ids = set()
    for e in val_errors:
        for qid in generated_quiz_ids:
            if qid in e.ref:
                bad_quiz_ids.add(qid)

    preexisting_ids = {str(r.get("quiz_id", "")).strip() for r in existing_rows}
    regressions = [e for e in val_errors
                   if not any(qid in e.ref for qid in generated_quiz_ids)
                   and any(pid in e.ref for pid in preexisting_ids)]
    if regressions:
        raise RuntimeError(
            "generate.py produced a row set where PRE-EXISTING rows fail "
            "validation — this indicates a bug in generate.py, not bad raw "
            "content. Aborting without writing anything. First issue: "
            f"{regressions[0]}")

    if bad_quiz_ids:
        rejected_rows = [r for r in new_rows if r["quiz_id"] in bad_quiz_ids]
        new_rows = [r for r in new_rows if r["quiz_id"] not in bad_quiz_ids]
        for r in rejected_rows:
            issues.append(GenerationIssue(
                "post-validate", f"quiz {r['quiz_id']} q{r['question_number']}",
                "generated quiz failed build.py validate(); withheld from output"))
        relevant_val_errors = [e for e in val_errors if any(qid in e.ref for qid in bad_quiz_ids)]
    else:
        relevant_val_errors = []

    final_new_rows = [r for r in new_rows if r["quiz_id"] not in bad_quiz_ids]

    return {
        "existing_rows": existing_rows,
        "new_rows": final_new_rows,
        "issues": issues,
        "pending": pending,
        "post_validate_errors": relevant_val_errors,
        "accepted_count": len(accepted),
        "raw_count": len(raw_rows),
        "classifier_stats": dict(model_classifier.STATS),
        "classifier_backend": "model" if model_classifier.model_backend_active() else "heuristic",
        "date_added": date_added,
    }


def write_master_csv(path, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CANONICAL_COLUMNS, extrasaction="ignore")
        w.writeheader()
        for r in sorted(rows, key=lambda r: (r["quiz_id"], int(r["question_number"]))):
            w.writerow(r)


def write_rejects_csv(path, issues):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["stage", "ref", "reason"])
        for i in issues:
            w.writerow([i.stage, i.ref, i.reason])


def write_metadata_csv(path, new_rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["question_id", "template_id", "seed", "learning_objective",
                     "target_item", "difficulty", "distractor_strategy",
                     "source_reference", "generation_status", "generated_at"])
        now = datetime.now(timezone.utc).isoformat()
        for r in new_rows:
            qid = f"{r['quiz_id']}-q{int(r['question_number']):02d}"
            meta = r.get("_generation_meta", {})
            w.writerow([
                qid,
                meta.get("template_id", ""),
                meta.get("seed", ""),
                meta.get("learning_objective", ""),
                r.get("title", ""),
                meta.get("difficulty", ""),
                meta.get("distractor_strategy", ""),
                meta.get("source_reference", "raw-input"),
                "generated",
                now,
            ])


def write_report(path, result):
    lines = ["# Mylingo Generation Report", "",
             f"- Generated: {datetime.now(timezone.utc).isoformat()}",
             f"- Raw rows read: {result['raw_count']}",
             f"- Raw rows accepted at parse stage: {result['accepted_count']}",
             f"- Raw rows rejected at parse stage: "
             f"{sum(1 for i in result['issues'] if i.stage == 'parse')}",
             f"- Quizzes/questions withheld after build.py validate(): "
             f"{sum(1 for i in result['issues'] if i.stage == 'post-validate')}",
             f"- New rows written: {len(result['new_rows'])}",
             f"- Topics pending (not enough content yet): {len(result['pending'])}",
             f"- date_added stamped on new rows (Content Schema v2): {result.get('date_added', '')}",
             ""]

    stats = result.get("classifier_stats", {})
    lines.append("## Level/topic classification (Agent 5: model-backed)")
    lines.append(f"- Backend used this run: {result.get('classifier_backend', 'heuristic')}")
    lines.append(f"- Rows fully specified by author (no classification needed): "
                 f"{stats.get('fully_specified', 0)}")
    lines.append(f"- Rows classified by the model: {stats.get('model_classified', 0)}")
    lines.append(f"- Rows classified by cache reuse (identical content already seen this run): "
                 f"{stats.get('cache_hit', 0)}")
    lines.append(f"- Rows classified by deterministic heuristic fallback: "
                 f"{stats.get('heuristic_fallback', 0)}")
    lines.append("")
    lines.append("## Topic descriptions (Agent 6: model-backed)")
    lines.append(f"- New topic groups described by the model: "
                 f"{stats.get('description_model', 0)}")
    lines.append(f"- New topic groups described by cache reuse (same topic, "
                 f"already described this run): {stats.get('description_cache_hit', 0)}")
    lines.append(f"- New topic groups described by deterministic fallback: "
                 f"{stats.get('description_fallback', 0)}")
    if stats.get("errors"):
        lines.append(f"- Classifier errors this run ({len(stats['errors'])}), heuristic fallback used:")
        for err in stats["errors"][:20]:
            lines.append(f"  - {err}")
        if len(stats["errors"]) > 20:
            lines.append(f"  - ... and {len(stats['errors']) - 20} more")
    lines.append("")

    lines.append("## Pending topics (held back, not written)")
    if not result["pending"]:
        lines.append("None.")
    else:
        for level, title, questions, reason in result["pending"]:
            lines.append(f"- {level} / \"{title}\": {len(questions)} question(s) — {reason}")
    lines.append("")

    lines.append("## Rejected raw rows")
    if not result["issues"]:
        lines.append("None.")
    else:
        for i in result["issues"]:
            lines.append(f"- {i}")
    lines.append("")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    p = argparse.ArgumentParser(description="Mylingo generation layer: raw content -> master_source rows")
    p.add_argument("--raw", required=True, help="Raw content CSV/TSV (question_text, question_category, "
                                                  "question_tags, explanation, correct_index, answer_1..9)")
    p.add_argument("--existing", default=None, help="Existing master_source.csv to append into (optional)")
    p.add_argument("--out", required=True, help="Path to write the combined canonical master_source.csv")
    p.add_argument("--report", default="generation/GENERATION_REPORT.md")
    p.add_argument("--rejects", default=None, help="Optional path to write rejected raw rows as CSV")
    p.add_argument("--metadata-out", default=None, help="Optional path to write GENERATION_METADATA.csv")
    p.add_argument("--status", default="draft", choices=sorted(VALID_STATUS),
                   help="Status assigned to brand-new quizzes (default: draft, so nothing "
                        "auto-publishes without review)")
    args = p.parse_args()

    raw_rows = read_raw_rows(args.raw)
    result = generate(raw_rows, args.existing, args.status)

    write_master_csv(args.out, result["existing_rows"] + result["new_rows"])
    write_report(args.report, result)
    if args.rejects:
        write_rejects_csv(args.rejects, result["issues"])
    if args.metadata_out:
        write_metadata_csv(args.metadata_out, result["new_rows"])

    print(f"Raw rows: {result['raw_count']} | accepted: {result['accepted_count']} | "
          f"new rows written: {len(result['new_rows'])} | pending topics: {len(result['pending'])} | "
          f"rejected: {len(result['issues'])}")
    print(f"Master source written to {args.out}")
    print(f"Report written to {args.report}")


if __name__ == "__main__":
    main()
