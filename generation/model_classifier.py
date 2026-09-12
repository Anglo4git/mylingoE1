#!/usr/bin/env python3
"""
Model-backed CEFR level / topic classifier — Agent 5.

Agent 4 left every quiz-bookkeeping field to be inferred from raw question
content via a deterministic keyword heuristic (`infer_level`,
`infer_quiz_category`, `infer_title` in `generate.py`), and explicitly asked
for it to be replaced by "a stronger model-backed classifier behind the same
`derive_raw_metadata()` interface, while keeping the same raw-question
contract." This module is that replacement.

Contract preserved
-------------------
`generate.py`'s `derive_raw_metadata(row, question_text, answers,
correct_index) -> (level, quiz_category, title)` keeps its exact signature
and return shape. Explicit author-supplied hints (a valid `level` column, a
valid `question_tags`/`quiz_category` value) still win outright — this
module is only ever consulted for whatever piece(s) a row did *not* supply,
exactly as Agent 4's heuristic was.

What changed
------------
Instead of matching question text against a fixed keyword list, missing
fields are classified by asking an Anthropic model to read the question and
its answers and choose from the same fixed vocabularies (CEFR levels A1-C2;
quiz categories Grammar/Vocabulary/Writing/Academic English) — semantic
understanding instead of substring matching. That means questions the
keyword list never anticipated (paraphrases, non-English-looking edge
cases, topics with no obvious trigger words) still get sensible metadata.

Design choices, and why
------------------------
- **Batched, not per-row.** `generate.py` pre-collects every row that
  actually needs classification (see `derive_raw_metadata_prewarm`) and
  sends them to the model in chunks of `MYLINGO_CLASSIFIER_BATCH_SIZE`
  (default 25) in one request each, instead of one HTTP round-trip per
  question. A 2,000-row batch is a few dozen requests, not 2,000.
- **Cached.** Every classification (or fallback) is cached in-process by a
  hash of the normalized question content, so calling
  `derive_raw_metadata()` directly (as the existing unit tests, and any
  external caller, already do) is a cache hit after the prewarm pass, and
  identical raw content is never classified twice even across separate
  `generate()` calls in the same process — this is what keeps
  `test_determinism_same_input_same_output` valid under a model backend.
- **Never fails loud.** No API key, a network error, a timeout, a rate
  limit, or a malformed/missing response for a given question all fall
  back to Agent 4's original deterministic heuristic for *that question
  only* (`heuristic_fallback`, injected by `generate.py` so this module
  never needs to import `generate.py` back). A batch that partially
  succeeds keeps its successful entries and falls back only the failed
  ones. The pipeline must never crash or stall because a model call
  failed — bad/no network is a degraded mode, not an outage.
- **Off by default in tests/CI.** The backend is auto-selected:
  `MYLINGO_CLASSIFIER_BACKEND=model` forces the model, `=heuristic` forces
  the old deterministic path, and the default `auto` uses the model only
  when `ANTHROPIC_API_KEY` is set in the environment. Unit tests never set
  that key, so `python3 -m unittest ...` never touches the network, costs
  nothing, and stays deterministic — while a production run with the key
  set gets model-backed classification automatically, with zero config.
- **Title consistency across a batch matters.** `generate.py` groups
  questions into quizzes by exact-string `(level, category, title)`
  match. A classifier that spells the same topic two different ways
  across two batches ("Present Simple" vs. "Simple Present") would
  fragment one topic into two tiny quizzes. To limit that, every batch
  request includes the topic titles already in use for that level in
  `--existing` (and titles already minted earlier in the same run) as
  "reuse this exact spelling if it fits" context.
- **Known limitation, stated plainly:** unlike the byte-for-byte
  determinism `build.py` guarantees, a model-backed classification of
  genuinely new content is not guaranteed to be identical between two
  *separate* runs of `generate.py` days apart (temperature is 0, which
  helps a lot, but is not a formal guarantee for an LLM). Content that
  has already been classified once and lives in `--existing` is
  unaffected — `generate.py` matches it by its already-fixed `(level,
  category, title)`, and the classifier is never consulted for it again.

Agent 6 addition: topic descriptions
-------------------------------------
Agent 5 explicitly scoped this module to level/category/title only and
left one-line `description` generation as a described-but-undone
extension. Agent 6 added it as a *second*, independent entry point —
`describe_batch()` / `describe_one()` — rather than folding it into
`classify_batch()`, because it answers a different question at a
different granularity: `classify_batch()` is per-*question* (every
question needs its own level/category/title), while a description is
per-*topic-group* (`level`, `quiz_category`, `title`) — every question in
"A1 Grammar Present Simple" shares one description. It gets its own cache
(`_DESCRIPTION_CACHE`, keyed on the group, not on question content) so a
topic is described once per run no matter how many of its questions come
through, instead of once per question. Same "never fails loud" contract
as `classify_batch()`: no key / network error / malformed response falls
back to a caller-supplied heuristic for that group only (`generate.py`
passes the original `"Practice {title}."` string), recorded in
`STATS["description_fallback"]`, and never crashes the pipeline.
"""

import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from collections import namedtuple

Classification = namedtuple("Classification", ["level", "quiz_category", "title"])

DEFAULT_MODEL = "claude-haiku-4-5-20251001"
DEFAULT_BATCH_SIZE = 25
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_RETRIES = 2
API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

# In-process cache: cache_key -> Classification. Deliberately module-level
# (not per-classifier-instance) so a single `generate.py` process run never
# classifies the same question content twice, which is what keeps
# `derive_raw_metadata()` cheap to call directly (as the unit tests do) and
# keeps a single run's output deterministic even under the model backend.
_CACHE = {}

# Separate in-process cache for group-level descriptions (keyed by
# level/category/title, not by question content — see describe_batch()).
# Kept apart from _CACHE because it answers a different question ("what's
# a one-line description of this topic?") than _CACHE does ("what's this
# question's level/category/title?"), even though both back
# `generate.py`'s single pass over a raw batch.
_DESCRIPTION_CACHE = {}

# Running stats for the current process, surfaced by generate.py's report
# so a human can see how much of a batch was actually model-classified vs.
# fell back to the heuristic (e.g. because there was no API key, or the
# model call failed).
STATS = {
    "fully_specified": 0, "cache_hit": 0, "model_classified": 0, "heuristic_fallback": 0,
    "description_cache_hit": 0, "description_model": 0, "description_fallback": 0,
    "errors": [],
}


def reset_stats():
    STATS["fully_specified"] = 0
    STATS["cache_hit"] = 0
    STATS["model_classified"] = 0
    STATS["heuristic_fallback"] = 0
    STATS["description_cache_hit"] = 0
    STATS["description_model"] = 0
    STATS["description_fallback"] = 0
    STATS["errors"] = []


def _env_backend():
    return os.environ.get("MYLINGO_CLASSIFIER_BACKEND", "auto").strip().lower()


def _api_key():
    return os.environ.get("ANTHROPIC_API_KEY", "").strip()


def model_backend_active():
    """Whether a real model call would be attempted right now.

    `auto` (the default) means: use the model if a key is present, and
    silently behave exactly like Agent 4's heuristic otherwise, so this
    project runs with zero configuration in an environment with no key
    (like CI) and picks up model-backed classification automatically the
    moment `ANTHROPIC_API_KEY` is set, with no code or flag change.
    """
    backend = _env_backend()
    if backend == "heuristic":
        return False
    if backend == "model":
        return True
    return bool(_api_key())


def _model_name():
    return os.environ.get("MYLINGO_CLASSIFIER_MODEL", DEFAULT_MODEL).strip()


def _batch_size():
    try:
        return max(1, int(os.environ.get("MYLINGO_CLASSIFIER_BATCH_SIZE", DEFAULT_BATCH_SIZE)))
    except ValueError:
        return DEFAULT_BATCH_SIZE


def _timeout_seconds():
    try:
        return max(1, int(os.environ.get("MYLINGO_CLASSIFIER_TIMEOUT", DEFAULT_TIMEOUT_SECONDS)))
    except ValueError:
        return DEFAULT_TIMEOUT_SECONDS


def _max_retries():
    try:
        return max(0, int(os.environ.get("MYLINGO_CLASSIFIER_MAX_RETRIES", DEFAULT_MAX_RETRIES)))
    except ValueError:
        return DEFAULT_MAX_RETRIES


def cache_key(question_text, answers, correct_index):
    h = hashlib.sha256()
    h.update(str(question_text).strip().lower().encode("utf-8"))
    h.update(b"\x1f")
    h.update("\x1f".join(str(a).strip().lower() for a in answers).encode("utf-8"))
    h.update(b"\x1f")
    h.update(str(correct_index).encode("utf-8"))
    return h.hexdigest()


def _chunk(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def _build_prompt(chunk, levels, categories, known_titles):
    lines = [
        "You are classifying English-language quiz questions for a language-learning "
        "site, matching an existing fixed taxonomy exactly.",
        "",
        f"Allowed CEFR levels (choose exactly one): {', '.join(levels)}",
        f"Allowed categories (choose exactly one): {', '.join(categories)}",
        "",
        "For each question, also choose a short, stable topic title (1-4 words, "
        "Title Case, e.g. \"Present Simple\", \"Phrasal Verbs\", \"Passive Voice\"). "
        "Questions that test the same grammar point or vocabulary theme MUST get "
        "the exact same title string, so quizzes on the same topic group together.",
    ]
    if known_titles:
        lines.append(
            "These topic titles are already in use in this dataset — reuse one "
            "verbatim (exact spelling and capitalization) whenever a question fits "
            "it, instead of inventing a near-duplicate: " + "; ".join(sorted(known_titles))
        )
    lines += [
        "",
        "Respond with ONLY a JSON array, no prose, no markdown code fence. One "
        "object per question, in this exact shape:",
        '[{"index": 0, "level": "A1", "quiz_category": "Grammar", "title": "Present Simple"}, ...]',
        "",
        "Questions:",
    ]
    for item in chunk:
        answers = item["answers"]
        correct = answers[item["correct_index"] - 1] if 1 <= item["correct_index"] <= len(answers) else ""
        entry = {
            "index": item["index"],
            "question_text": item["question_text"],
            "answers": answers,
            "correct_answer": correct,
        }
        if item.get("known_category"):
            entry["category_hint"] = item["known_category"]
        if item.get("known_title"):
            entry["title_hint"] = item["known_title"]
        lines.append(json.dumps(entry, ensure_ascii=False))
    return "\n".join(lines)


def _strip_code_fence(text):
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
    return text.strip()


def _call_model_api(prompt, max_tokens):
    api_key = _api_key()
    body = json.dumps({
        "model": _model_name(),
        "max_tokens": max_tokens,
        "temperature": 0,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=body,
        method="POST",
        headers={
            "content-type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": ANTHROPIC_VERSION,
        },
    )
    last_err = None
    for attempt in range(_max_retries() + 1):
        try:
            with urllib.request.urlopen(req, timeout=_timeout_seconds()) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            text = "".join(
                block.get("text", "") for block in payload.get("content", [])
                if block.get("type") == "text"
            )
            return text
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code == 429 or e.code >= 500:
                time.sleep(min(2 ** attempt, 8))
                continue
            raise
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last_err = e
            time.sleep(min(2 ** attempt, 8))
            continue
    raise RuntimeError(f"model classifier: giving up after retries: {last_err}")


def _parse_model_response(text, chunk):
    text = _strip_code_fence(text)
    parsed = json.loads(text)  # let malformed JSON raise; caller catches it
    if not isinstance(parsed, list):
        raise ValueError("model response was not a JSON array")
    by_index = {}
    valid_indices = {item["index"] for item in chunk}
    for entry in parsed:
        if not isinstance(entry, dict):
            continue
        idx = entry.get("index")
        if idx not in valid_indices:
            continue
        level = str(entry.get("level", "")).strip().upper()
        category = str(entry.get("quiz_category", "")).strip()
        title = str(entry.get("title", "")).strip()
        if not (level and category and title):
            continue
        by_index[idx] = Classification(level=level, quiz_category=category, title=title)
    return by_index


def _classify_chunk_via_model(chunk, levels, categories, known_titles):
    """Returns {index: Classification} for whichever items the model
    successfully classified with a value from the allowed vocabularies.
    Anything missing from the return value is left for the caller to
    fall back to the heuristic for."""
    prompt = _build_prompt(chunk, levels, categories, known_titles)
    max_tokens = min(4096, 200 + 80 * len(chunk))
    try:
        text = _call_model_api(prompt, max_tokens)
        results = _parse_model_response(text, chunk)
    except Exception as e:  # noqa: BLE001 - any failure here is a soft fallback, not a crash
        STATS["errors"].append(str(e))
        return {}
    # Discard any result outside the allowed vocabularies rather than trust
    # the model blindly — those items fall back to the heuristic below.
    clean = {}
    levels_set, categories_set = set(levels), set(categories)
    for idx, c in results.items():
        if c.level in levels_set and c.quiz_category in categories_set and c.title:
            clean[idx] = c
        else:
            STATS["errors"].append(f"index {idx}: model returned out-of-vocabulary result {c}")
    return clean


def classify_batch(items, levels, categories, known_titles=(), heuristic_fallback=None):
    """Classify a batch of raw questions.

    items: list of dicts with keys `question_text`, `answers`,
        `correct_index`, and optionally `known_category` / `known_title`
        (an already-resolved value that should simply be echoed back
        rather than inferred — mirrors `derive_raw_metadata`'s hint
        precedence).
    heuristic_fallback: callable(question_text, answers, correct_index,
        known_category, known_title) -> (level, category, title), used
        whenever the model is unavailable or fails for a given item.
        Required in practice (generate.py always supplies Agent 4's
        original heuristic here); classify_batch will raise if it's
        needed and missing.

    Returns a list of Classification, same order/length as `items`.
    """
    n = len(items)
    keys = [cache_key(it["question_text"], it["answers"], it["correct_index"]) for it in items]
    results = [None] * n

    # 1. Cache hits first — zero network cost for repeated content.
    to_resolve = []
    for i in range(n):
        cached = _CACHE.get(keys[i])
        if cached is not None:
            results[i] = _apply_known_overrides(cached, items[i])
            STATS["cache_hit"] += 1
        else:
            to_resolve.append(i)

    # 2. Model classification for the rest, chunked, only if the backend
    #    is actually active — otherwise skip straight to the heuristic
    #    without attempting any network call.
    if to_resolve and model_backend_active():
        running_known_titles = set(known_titles)
        for chunk_indices in _chunk(to_resolve, _batch_size()):
            chunk = [
                {
                    "index": i,
                    "question_text": items[i]["question_text"],
                    "answers": items[i]["answers"],
                    "correct_index": items[i]["correct_index"],
                    "known_category": items[i].get("known_category"),
                    "known_title": items[i].get("known_title"),
                }
                for i in chunk_indices
            ]
            model_results = _classify_chunk_via_model(chunk, levels, categories, running_known_titles)
            for i in chunk_indices:
                if i in model_results:
                    c = model_results[i]
                    _CACHE[keys[i]] = c
                    results[i] = _apply_known_overrides(c, items[i])
                    running_known_titles.add(c.title)
                    STATS["model_classified"] += 1

    # 3. Anything still unresolved (heuristic-only backend, model
    #    unavailable, or a failed/partial batch) falls back to Agent 4's
    #    deterministic heuristic, one item at a time.
    for i in range(n):
        if results[i] is None:
            if heuristic_fallback is None:
                raise RuntimeError("model classifier: no result and no heuristic_fallback provided")
            item = items[i]
            level, category, title = heuristic_fallback(
                item["question_text"], item["answers"], item["correct_index"],
                item.get("known_category"), item.get("known_title"),
            )
            c = Classification(level=level, quiz_category=category, title=title)
            _CACHE[keys[i]] = c
            results[i] = c
            STATS["heuristic_fallback"] += 1

    return results


def _apply_known_overrides(classification, item):
    """A cached/model classification only ever fills gaps: an explicit
    author-supplied hint on this particular row always wins, even if the
    cached classification (from different row with identical question
    content) disagrees."""
    return Classification(
        level=item.get("known_level") or classification.level,
        quiz_category=item.get("known_category") or classification.quiz_category,
        title=item.get("known_title") or classification.title,
    )


def classify_one(question_text, answers, correct_index, known_level=None,
                  known_category=None, known_title=None, levels=(), categories=(),
                  known_titles=(), heuristic_fallback=None):
    """Convenience single-item entry point — what `derive_raw_metadata()`
    calls directly. Cheap when the prewarm pass already populated the
    cache; otherwise makes (at most) a single-item model call."""
    item = {
        "question_text": question_text,
        "answers": answers,
        "correct_index": correct_index,
        "known_level": known_level,
        "known_category": known_category,
        "known_title": known_title,
    }
    return classify_batch([item], levels, categories, known_titles, heuristic_fallback)[0]


def description_cache_key(level, quiz_category, title):
    h = hashlib.sha256()
    h.update(str(level).strip().upper().encode("utf-8"))
    h.update(b"\x1f")
    h.update(str(quiz_category).strip().lower().encode("utf-8"))
    h.update(b"\x1f")
    h.update(str(title).strip().lower().encode("utf-8"))
    return h.hexdigest()


def _build_description_prompt(chunk):
    lines = [
        "You are writing short topic descriptions for quizzes on an "
        "English-language-learning site.",
        "",
        "For each topic below, write ONE short sentence (no more than about "
        "12 words) describing what a learner will practice. Be specific to "
        "the topic and the sample question — don't just mechanically restate "
        "the title (e.g. prefer something like \"Master when to use -ing "
        "verb forms after prepositions.\" over \"Practice Gerunds.\").",
        "",
        "Respond with ONLY a JSON array, no prose, no markdown code fence. One "
        "object per topic, in this exact shape:",
        '[{"index": 0, "description": "..."}, ...]',
        "",
        "Topics:",
    ]
    for item in chunk:
        entry = {
            "index": item["index"],
            "level": item["level"],
            "category": item["quiz_category"],
            "title": item["title"],
            "sample_question": item["sample_question"],
        }
        lines.append(json.dumps(entry, ensure_ascii=False))
    return "\n".join(lines)


def _parse_description_response(text, chunk):
    text = _strip_code_fence(text)
    parsed = json.loads(text)  # let malformed JSON raise; caller catches it
    if not isinstance(parsed, list):
        raise ValueError("model response was not a JSON array")
    by_index = {}
    valid_indices = {item["index"] for item in chunk}
    for entry in parsed:
        if not isinstance(entry, dict):
            continue
        idx = entry.get("index")
        if idx not in valid_indices:
            continue
        desc = str(entry.get("description", "")).strip()
        if desc:
            by_index[idx] = desc
    return by_index


def _describe_chunk_via_model(chunk):
    """Returns {index: description} for whichever items the model
    successfully described. Anything missing is left for the caller to
    fall back to the heuristic for."""
    prompt = _build_description_prompt(chunk)
    max_tokens = min(2048, 100 + 40 * len(chunk))
    try:
        text = _call_model_api(prompt, max_tokens)
        return _parse_description_response(text, chunk)
    except Exception as e:  # noqa: BLE001 - any failure here is a soft fallback, not a crash
        STATS["errors"].append(str(e))
        return {}


def describe_batch(items, heuristic_fallback=None):
    """Generate one-line topic descriptions for a batch of quiz groups.

    items: list of dicts with keys `level`, `quiz_category`, `title`, and
        `sample_question` (one representative question_text from that
        group, used only as context to make the description concrete).
    heuristic_fallback: callable(level, quiz_category, title) -> a
        description string, used whenever the model is unavailable or
        fails for a given item. Required in practice (generate.py always
        supplies the generic "Practice {title}." fallback here);
        describe_batch will raise if it's needed and missing.

    Returns a list of description strings, same order/length as `items`.

    Unlike `classify_batch` (keyed per-question), this is keyed per
    `(level, quiz_category, title)` — every question in the same topic
    group shares one description, so appending more questions to an
    already-described topic within the same run is a cache hit, not a
    second, potentially-differently-worded, model call.
    """
    n = len(items)
    keys = [description_cache_key(it["level"], it["quiz_category"], it["title"]) for it in items]
    results = [None] * n

    to_resolve = []
    for i in range(n):
        cached = _DESCRIPTION_CACHE.get(keys[i])
        if cached is not None:
            results[i] = cached
            STATS["description_cache_hit"] += 1
        else:
            to_resolve.append(i)

    if to_resolve and model_backend_active():
        for chunk_indices in _chunk(to_resolve, _batch_size()):
            chunk = [
                {
                    "index": i,
                    "level": items[i]["level"],
                    "quiz_category": items[i]["quiz_category"],
                    "title": items[i]["title"],
                    "sample_question": items[i]["sample_question"],
                }
                for i in chunk_indices
            ]
            model_results = _describe_chunk_via_model(chunk)
            for i in chunk_indices:
                if i in model_results:
                    _DESCRIPTION_CACHE[keys[i]] = model_results[i]
                    results[i] = model_results[i]
                    STATS["description_model"] += 1

    for i in range(n):
        if results[i] is None:
            if heuristic_fallback is None:
                raise RuntimeError("model classifier: no description result and no heuristic_fallback provided")
            item = items[i]
            desc = heuristic_fallback(item["level"], item["quiz_category"], item["title"])
            _DESCRIPTION_CACHE[keys[i]] = desc
            results[i] = desc
            STATS["description_fallback"] += 1

    return results


def describe_one(level, quiz_category, title, sample_question, heuristic_fallback=None):
    """Convenience single-group entry point — what `generate.py`'s
    `derive_group_description()` calls directly. Cheap when a prior
    prewarm pass already populated the cache for this
    (level, quiz_category, title)."""
    item = {
        "level": level,
        "quiz_category": quiz_category,
        "title": title,
        "sample_question": sample_question,
    }
    return describe_batch([item], heuristic_fallback=heuristic_fallback)[0]
