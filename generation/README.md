# Mylingo generation layer

Turns raw question content into canonical `master_source.csv` rows, so the
authoring app and `build.py` never see a second question shape.

## Why this exists

The project already had two real examples of what "raw content" looks like,
under `data structure orientation for auditoring/`:

- `"### a sample of the dataset i have about 400 quizzes.tsv"` — one row per
  question: `question_text, question_category, question_tags, explanation,
  correct_index, answer_1..answer_9`. No `quiz_id`, no `title`, no
  `question_number`, no `status`.
- `"##what the system shoud genrate automatically to avoid human errors.tsv"`
  — exactly those missing fields: `quiz_id, level, title, description,
  quiz_category, quiz_tags, version, status, question_number,
  question_category`.

In other words: a person (or an upstream question generator) is good at
writing question content and bad at hand-typing bookkeeping like `a1-001`,
keeping question numbers contiguous, or keeping `quiz_category` consistent
with a level prefix across every row of a quiz. Those are exactly the things
`build.py`'s `V-A3` / `V-A4` / `V-G1` rules exist to catch — this script
prevents them before they're ever written to `master_source.csv`.

Legacy raw files may carry level/category in `question_tags`, but raw-only
authoring no longer requires any metadata. The minimum author payload is
`question_text`, `correct_index`, and two or more contiguous answer columns.
Level, quiz category, topic/title, tags, description, IDs, numbering, version,
status, explanation, and generation-side metadata are derived automatically.
Supplied metadata is treated only as a hint when it is valid.

## Usage

```
python3 generation/generate.py \
    --raw path/to/raw_content.csv \
    --existing master_source.csv \
    --out master_source.csv \
    --report generation/GENERATION_REPORT.md \
    --rejects generation/REJECTED_ROWS.csv \
    --metadata-out generation/GENERATION_METADATA.csv \
    --status draft
```

- `--raw`: the raw content file (CSV or TSV, delimiter auto-detected). Minimum columns are `question_text`, `correct_index`, `answer_1`, `answer_2`; `answer_3..answer_9`, `explanation`, topic/category, level, tags and all quiz bookkeeping are optional.
- `--existing`: current `master_source.csv`. Omit for a from-scratch batch.
- `--out`: where the combined (existing + newly generated) canonical rows
  are written. Safe to point at the same path as `--existing` once you're
  happy with a dry run's report.
- `--status`: status assigned to brand-new quizzes. **Defaults to `draft`,
  not `published`** — nothing this script generates goes live without a
  human explicitly promoting it through the authoring app, even though the
  worked example in the orientation files jumps straight to `published`.
- `--rejects` / `--metadata-out`: optional side files (see below).

Run `python3 generation/generate.py --help` for the full flag list.

## What it does

1. **Parse + canonicalize** every raw row. `question_tags` is split into
   category and level; both are matched case-insensitively against known
   values (`Grammar`, `Vocabulary`, `Writing`, `Academic English`; `A1`-`C2`)
   and rewritten to the canonical spelling. Rows with an unrecognized
   category/level, an out-of-range `correct_index`, duplicate answers, an
   answer-column gap, or a missing required field are rejected here with a
   specific reason — never silently dropped.
2. **Group** accepted rows by `(level, title)`, where `title` is the raw
   row's `question_category` (e.g. `"Present Simple"`). This matches the
   authoring app's own 5-150-questions-per-quiz rule.
3. **Reuse or mint a quiz_id.** If a quiz with that `(level, title)` already
   exists in `--existing`, new rows are appended starting at its next
   `question_number` — existing rows, their `quiz_id`, `status`, and
   `version` are never touched. Otherwise a new `{level}-{NNN}` id is
   allocated (next unused number for that level).
4. **Hold under-filled topics as pending** (reported, not written) instead
   of emitting a quiz with fewer than 5 questions that the authoring app
   would reject anyway. A topic with more than 150 questions is chunked
   into full 150-question quizzes, each keeping the topic's own inferred
   title; a genuine leftover tail that's still under 5 by itself is pooled
   with other small topics into a "Mixed {category} Practice" quiz instead
   of being held pending forever (see Agent 6 fix below for the case this
   used to wrongly fall into).
5. **Validate the combined output** by calling `build.py`'s own `validate()`
   — the same function `build.py validate`/`build.py build` use — on
   existing + newly generated rows together. Any newly generated quiz that
   fails is pulled back out and reported; this script raises loudly instead
   of writing anything if a *pre-existing* row somehow starts failing
   (that would mean a bug in this script, not bad input data).

Only after all of that does it write `--out`.

## Files this produces

- The updated `master_source.csv` (still exactly the 23 canonical columns —
  see `authoring/README.md`).
- `GENERATION_REPORT.md`: counts, pending topics, and every rejection with
  its reason.
- `REJECTED_ROWS.csv` (optional): the raw rows that didn't make it in, for
  re-submission after a fix.
- `GENERATION_METADATA.csv` (optional): non-canonical machine-authoring
  metadata (learning objective, difficulty, distractor strategy, etc.) kept
  entirely separate from `master_source.csv` — see
  `GENERATION_METADATA_SCHEMA.md`.

## Fixtures

`generation/fixtures/raw_questions_sample.csv` is a representative raw batch
covering: a topic large enough for a full quiz, a topic at exactly the
5-question floor, a topic that overflows past 10 and gets chunked, a topic
too small and held pending, 2-answer and 9-answer questions, all four quiz
categories, and five deliberately broken rows (bad level, bad category,
missing explanation, out-of-range `correct_index`, duplicate answers) to
exercise rejection.

## Review / promotion workflow

`generate.py` writes new quizzes as `status=draft` on purpose — nothing
goes live without an explicit decision. `promote.py` is that decision,
made as an auditable batch command instead of a hand-edit in the authoring
app:

```
# see what's waiting for review
python3 generation/promote.py list --input master_source.csv

# promote specific quizzes
python3 generation/promote.py promote --input master_source.csv \
    --out master_source.csv --quiz-id a1-011 a2-011 \
    --report generation/PROMOTION_REPORT.md

# promote everything eligible in one level/category (explicit opt-in required)
python3 generation/promote.py promote --input master_source.csv \
    --out master_source.csv --level A1 --category Grammar --all-draft \
    --report generation/PROMOTION_REPORT.md
```

- Eligible source statuses: `draft`, `in_review`, `approved`. Already
  `published` or `retired` quizzes are reported as skipped, not touched.
- Before writing anything, each targeted quiz's promotion is checked against
  `build.py`'s own `validate()` on the *post-promotion* row set. A quiz that
  would fail is `blocked` and left untouched; it never blocks other quizzes
  promoted in the same run.
- `--quiz-id` promotes exactly those ids. `--all-draft` (with optional
  `--level`/`--category` filters) is required if you want to promote in
  bulk — this is a deliberate safety rail against accidentally promoting
  everything with a bare `promote` call.
- `--bump-version` optionally increments each promoted quiz's `version`;
  off by default.
- Idempotent: promoting an already-published quiz again is a no-op (`skipped`).

## Level/topic classification (Agent 5)

Agent 4's raw-only inference for level/category/title started as a
deterministic keyword heuristic. Agent 5 replaced it with a model-backed
classifier (`generation/model_classifier.py`) behind the exact same
`derive_raw_metadata()` interface, so nothing about the raw-question
contract above changed — only how the *missing* pieces get filled in.

- **Zero config to try it**: set `ANTHROPIC_API_KEY` in the environment and
  re-run `generate.py`; classification switches from heuristic to
  model-backed automatically. No key set (e.g. in CI) → heuristic, exactly
  as before Agent 5.
- **Explicit hints still win outright.** A valid `level` column, or a valid
  category in `quiz_category`/`question_category`/`question_tags`, is never
  second-guessed by the model — it's only ever consulted for what a row
  didn't supply, same as Agent 4's heuristic.
- **Batched, not per-row.** `generate.py` classifies every row that needs
  it in one pass of chunked requests (`MYLINGO_CLASSIFIER_BATCH_SIZE`,
  default 25 questions/request) before the main parse loop, and caches
  every result in-process, so re-classifying identical content (including
  across the two internal passes over the same raw file) never costs a
  second API call.
- **Never blocks the pipeline.** Any classifier problem — no key, a
  network error, a timeout, a rate limit, a malformed or out-of-vocabulary
  model response — falls back to Agent 4's original deterministic
  heuristic for that question, is recorded, and does not stop the run.
- **Env vars**: `MYLINGO_CLASSIFIER_BACKEND` (`auto` default / `model` /
  `heuristic`), `MYLINGO_CLASSIFIER_MODEL` (default
  `claude-haiku-4-5-20251001`), `MYLINGO_CLASSIFIER_BATCH_SIZE` (default
  25), `MYLINGO_CLASSIFIER_TIMEOUT` (seconds, default 30),
  `MYLINGO_CLASSIFIER_MAX_RETRIES` (default 2).
- `GENERATION_REPORT.md` now includes a "Level/topic classification"
  section: how many rows were fully author-specified, model-classified,
  reused from cache, or fell back to the heuristic, plus any classifier
  errors encountered.
- **Known limitation**: unlike `build.py`'s byte-for-byte determinism, two
  *separate* runs classifying genuinely new content are not formally
  guaranteed to agree (temperature is 0, which helps a lot, but that's not
  a hard guarantee for an LLM). Content already committed to
  `master_source.csv` is unaffected on re-runs — it's matched by its
  already-fixed `(level, category, title)` and the classifier is never
  consulted for it again.
- The browser authoring app (`authoring/mylingo-admin.html`) keeps its own
  client-side heuristic for instant offline preview while typing/pasting;
  `generate.py` (server-side, at true generation/build time) is the
  system of record and is what actually gets model-backed classification.

## Fixed: topic titles were being discarded (Agent 6)

**This was a real bug, not a hypothetical.** Since Agent 4 raised the
per-quiz ceiling from 10 to 150 questions, the chunking logic that decides
whether a new topic gets its own quiz was written as:

```python
full_batches = len(questions) // MAX_QUESTIONS_PER_QUIZ   # MAX = 150
...                                                        # emits full_batches quizzes, real title kept
remainder = questions[full_batches * MAX_QUESTIONS_PER_QUIZ:]
if remainder:
    small_pools[...].extend(...)                          # ALWAYS pooled, title discarded
```

For any brand-new topic with fewer than 150 questions — i.e. essentially
every real topic — `full_batches` is `0`, so `remainder` is the *entire*
group, and it was unconditionally dumped into the small-topic pool and
relabeled `"Mixed {category} Practice"` on write-out, discarding the
correctly-inferred real title every time. Confirmed against this project's
own fixture: a "5 question, fully-hinted, brand-new topic" round trip
before this fix wrote a quiz titled `"Mixed Grammar Practice"`; the raw
content's actual topic name (`"Irregular Verbs"`, `"Synonyms"`, `"Word
Order"`, etc. in `generation/fixtures/raw_questions_sample.csv`) never
reached `master_source.csv`. Existing tests didn't catch it because they
asserted row counts and quiz-id counts, never the resulting title.

Fixed: a remainder is only pooled into a mixed-topic quiz when it's too
small to be a valid quiz **on its own** (fewer than 5 questions — the
genuine overflow-tail case, e.g. a 153-question topic's leftover 3). Any
remainder that already clears the 5-question floor by itself — which, for
any topic under 150 questions, is the whole group — becomes its own quiz
under its own real title, exactly as every prior handoff already believed
it did.

## Topic descriptions (Agent 6)

Every new quiz's `description` was, until now, always the generic
`"Practice {title}."` (Agent 2's original placeholder). Agent 6 extended
the model-backed approach from the section above — via a second,
independent entry point in `generation/model_classifier.py`,
`describe_batch()`/`describe_one()` — to write a real one-line description
for every brand-new topic.

- **Per-topic-group, not per-question.** Unlike level/category/title
  classification (one call answers many questions), a description is
  generated once per `(level, quiz_category, title)` group and shared by
  every question in it — appending more questions to that topic within
  the same run is a cache hit, not a second, possibly differently-worded,
  description.
- **Existing quizzes keep their existing description**, unchanged, when
  new questions are appended to them — every row in a quiz must show the
  same description, and an existing quiz's was already fixed the run it
  was created.
- **The synthetic "Mixed {category} Practice" pools never call the
  model** — there's no single real topic there for a description to be
  specific about, so they always get the generic
  `"Practice Mixed {category} Practice."` fallback text directly, with no
  network call attempted.
- Same zero-config activation, batching, caching, and graceful-fallback
  contract as the level/category/title classifier above (same env vars;
  see `model_classifier.py`'s module docstring, "Agent 6 addition"
  section, for the full design rationale).
- `GENERATION_REPORT.md` gained a "Topic descriptions" section alongside
  the existing classification one.

## Tests

```
python3 -m unittest generation.test_generate generation.test_promote -v
```

47 tests total: `test_generate.py` (36) covers canonicalization, per-row
rejection reasons, grouping/chunking/pending behavior, append-without-
renumbering across repeated runs, the `build.py validate()` safety net,
the model-backed level/category/title classifier's batching/caching/
hint-precedence/fallback behavior, and the model-backed description
generator's batching/caching/per-existing-quiz-no-op/mixed-pool-skip/
fallback behavior (all via a mocked model call — no test ever touches the
network). `test_promote.py` (11) covers status filtering, the
block-one-without-blocking-others behavior, version bumping, and
idempotency.

## Verified round trip

```
python3 generation/generate.py --raw generation/fixtures/raw_questions_sample.csv \
    --existing master_source.csv --out /tmp/master_source.generated.csv \
    --report /tmp/GENERATION_REPORT.md
python3 build.py validate --input /tmp/master_source.generated.csv
python3 build.py build --input /tmp/master_source.generated.csv --out /tmp/site_test --src-root .
python3 build.py verify-output --out /tmp/site_test
```

Result: 83 rows / 63 quizzes / 0 errors / 0 warnings at `validate`; clean
`build`; 0 errors / 0 warnings at `verify-output`. "Present Simple" (A1)
correctly appended into the existing `a1-001` at question 2 onward,
preserving its `published` status; three brand-new topics were minted as
new `draft` quizzes **under their real inferred titles** ("Irregular
Verbs", "Synonyms", "Word Order" — see the Agent 6 bug-fix section above
for why this needed re-verifying, not just re-trusting the row/quiz
counts); two under-filled topics were correctly held pending.

Extending that round trip through promotion:

```
python3 generation/promote.py list --input master_source.generated.csv
# a1-011  A1  draft  5q  Grammar     Irregular Verbs
# a2-011  A2  draft  5q  Vocabulary  Synonyms
# b1-011  B1  draft  6q  Grammar     Word Order

python3 generation/promote.py promote --input master_source.generated.csv \
    --out master_source.generated.csv --quiz-id a1-011 a2-011
# a1-011: promoted, a2-011: promoted; b1-011 left untouched

python3 build.py build --input master_source.generated.csv --out /tmp/site --src-root .
# 68 files written — the two promoted quizzes are live, b1-011 (still draft) is not
```
