# Mylingo Milestone 7 — Content Schema v2 Contract

## Objective

Give the content pipeline two things it needs to scale from a 60-row starter
set toward the hundreds/thousands of quizzes described in the raw authoring
notes, **without breaking the frozen v1 contract**:

1. **Provenance timestamps** — `date_added` / `date_updated` per row, so
   content age, staleness, and "what changed recently" become answerable
   questions instead of tribal knowledge.
2. **A controlled tag vocabulary** — a bounded, reviewable list that
   `quiz_tags` / `question_tags` values are checked against, so free-text tag
   drift (typos, near-duplicate synonyms, one-off categories) is caught as a
   review signal instead of silently fragmenting search/filter behavior as
   the dataset grows.

This is explicitly a **v2 contract**, not a v1 replacement. Agent 1's rule —
`master_source.csv` stays frozen at its 23 canonical columns
(`site/SCHEMA.md`, `authoring/README.md`, `generation/GENERATION_METADATA_SCHEMA.md`)
— is still in force. Schema v2 adds two **optional, appended** columns and one
**non-blocking** semantic check layered on top of that frozen shape. It does
not renumber, rename, reorder, or require any of the existing 23 columns.

## Why this needed a contract instead of a quiet column add

Three prior artifacts already assume the 23-column shape is load-bearing:

- `authoring/mylingo-admin.html`'s canonical row model.
- `generation/generate.py` / `generation/promote.py`'s output shape.
- `build.py validate` / `build.py build`'s column access.

Any change here has to be additive-and-optional at the source level, or it
silently breaks one of those three. This contract exists so the next agent
touching authoring, generation, or build doesn't have to rediscover that
constraint from scratch.

## Schema v2 field contract

### `date_added` (new, optional column)

- ISO 8601 date or date-time string (`2026-09-07` or
  `2026-09-07T12:00:00Z`/`+00:00` are both valid).
- Set once, at row creation, by whichever surface creates the row
  (authoring app, `generation/generate.py`, or a manual CSV edit).
  **Immutable after that** — nothing in this contract updates `date_added`
  on a later edit.
- Absent column, or an absent/empty value in a present column, is valid.
  Schema v2 is opt-in per dataset, not retroactively required for v1 rows.

### `date_updated` (new, optional column)

- Same ISO 8601 format rules as `date_added`.
- Set whenever a row's content-bearing fields change (question text,
  answers, explanation, correct index, category, tags, level, status).
  Cosmetic/no-op re-saves are not required to bump it.
- When both fields are present and parseable, `date_updated` should not be
  earlier than `date_added`. This is a review signal, not a build blocker
  (see severities below) — deterministic backfills and clock skew happen.

### Controlled tag vocabulary

- Source of truth: `tag_vocabulary.json` at the repo root. It groups
  allowed values into `levels`, `skills`, and `categories`, mirroring the
  enums `build.py` (`LEVELS`) and `site/SCHEMA.md` (Milestone 5 `skill`)
  already use, plus the existing four production category names
  (`Grammar`, `Vocabulary`, `Writing`, `Academic English`).
- Matching is case-insensitive, per comma-separated tag, against the union
  of all three groups. `quiz_tags` and `question_tags` are both checked.
- The vocabulary is deliberately seeded with a few reserved-but-unused
  growth categories (`Reading`, `Listening`, `Speaking`, `Pronunciation`,
  `Idioms`, `Business English`, `Exam Prep`) anticipated from the raw
  ~400-quiz sample referenced in the authoring-orientation notes, so early
  scale-up content doesn't immediately generate review noise.
- Extending the vocabulary is a deliberate, logged edit to
  `tag_vocabulary.json` (see its `_added_log`), not something any pipeline
  step does automatically. Automatic tag *invention* stays out of scope for
  this milestone.

## What is explicitly out of scope

- No change to the runtime quiz JSON shape (`site/shared/quiz.html`
  continues to receive exactly what it receives today). `date_added` /
  `date_updated` / vocabulary conformance are authoring/QA-side metadata,
  not learner-facing fields, until a future milestone decides otherwise
  (e.g. a "recently added" badge).
- No retroactive backfill of `date_added`/`date_updated` on the 60 existing
  starter rows. `master_source.csv` is left byte-for-byte as Agent 10 left
  it; this milestone adds tooling support for the columns, it does not add
  the columns to the current file.
- No change to `quiz_tags`/`question_tags` free-text storage format — tags
  remain a comma-separated string column. Vocabulary conformance is a
  review signal layered on top, not a new storage type or a foreign-key
  constraint.
- No automatic tag normalization/rewriting of existing content.
- No changes to `generation/GENERATION_METADATA.csv`'s existing columns —
  that file already has `generated_at`; it is a natural place for a future
  agent to *populate* `date_added` for generated rows, but wiring
  `generate.py`/`promote.py` to actually stamp the two new master-source
  columns is left as follow-on work (see Handoff below), since it touches
  the generation pipeline that this milestone's "do not change" list
  protects unless explicitly required.

## Enforcement split (keeps the Milestone 6 separation of concerns)

Per `06_CONTENT_QA_SCALE.md`: `build.py validate` answers "can this be
safely generated," `content_qa.py` answers "is this review-ready." Schema
v2 checks are split the same way:

| Layer | Check | Rule | Severity |
|---|---|---|---|
| `build.py validate` | `date_added` present but not valid ISO 8601 | `V-H1` | warning |
| `build.py validate` | `date_updated` present but not valid ISO 8601 | `V-H2` | warning |
| `content_qa.py` | tag value not in controlled vocabulary | `CQ-T01` | warning |
| `content_qa.py` | `date_added`/`date_updated` column present but value empty | `CQ-M01` | warning |
| `content_qa.py` | `date_added`/`date_updated` present but not valid ISO 8601 | `CQ-M02` | error |
| `content_qa.py` | `date_updated` earlier than `date_added` | `CQ-M03` | warning |

Format validity (`V-H1`/`V-H2`/`CQ-M02`) is a real defect and stays a
warning in `build.py` (build must not silently break on it — dates are not
yet build-consumed) and an error in `content_qa.py --strict` context isn't
forced either, deliberately: this is new tooling and shouldn't retroactively
gate promotion the first time it ships. Tag-vocabulary and staleness checks
(`CQ-T01`, `CQ-M01`, `CQ-M03`) are always warnings — informational review
signals, never promotion blockers, consistent with Milestone 6's severity
philosophy ("warning" = strong review signal, not a stop-ship condition).

All four checks are **inert on the current `master_source.csv`**: it has no
`date_added`/`date_updated` columns (so `V-H1`/`V-H2`/`CQ-M01`/`CQ-M02`/`CQ-M03`
never fire) and its 10 existing tag values (`A1`–`C2`, `Grammar`,
`Vocabulary`, `Writing`, `Academic English`) are all already in
`tag_vocabulary.json` (so `CQ-T01` never fires either).

## Deliverables

1. `tag_vocabulary.json` — the controlled vocabulary source of truth.
2. `build.py` — optional-column ISO 8601 format checks (`V-H1`, `V-H2`),
   only evaluated when the corresponding column is present in the source
   file at all.
3. `content_qa.py` — `CQ-T01` (vocabulary), `CQ-M01`/`CQ-M02`/`CQ-M03`
   (date presence/format/ordering), loading `tag_vocabulary.json`.
4. `site/SCHEMA.md` — this contract linked from the canonical schema doc.
5. `tests/unit/test_content_qa.py` — coverage for the new rules.
6. This document.

## Acceptance criteria

- `python3 build.py validate --input master_source.csv` remains **60 rows,
  60 quizzes, 0 errors, 0 warnings** — unchanged from Agent 10's baseline.
- `python3 build.py build ...` / `verify-output` remain clean.
- `python3 content_qa.py --input master_source.csv --out-dir content_qa`
  produces the same finding set as before this milestone (no new `CQ-T01`/
  `CQ-M0x` issues on current data).
- A fixture row with `date_added`/`date_updated` columns present and valid
  produces zero new issues.
- A fixture row with a malformed date produces `V-H1`/`V-H2` (build) and
  `CQ-M02` (content QA).
- A fixture row with a tag outside `tag_vocabulary.json` produces `CQ-T01`.
- A fixture row where `date_updated` predates `date_added` produces
  `CQ-M03`.
- Existing Milestone 6 tests continue to pass unmodified.

## Handoff / next milestone candidates

- Wire `generation/generate.py` to stamp `date_added` (and `promote.py` /
  authoring saves to stamp `date_updated`) automatically for new/edited
  rows, once this contract is accepted — deliberately not done in this
  milestone, which only adds the tooling that reads/validates the columns.
- Extend `authoring/mylingo-admin.html` to surface `date_added`/
  `date_updated` as read-only fields and to offer tag autocomplete sourced
  from `tag_vocabulary.json`.
- Decide whether `date_added` should ever reach the runtime manifest (e.g.
  a "new this week" filter) — out of scope here by design.
- The other items still open from Agent 10's handoff (real Vitest
  execution, accessibility audit, deployment-topology decision) remain
  open and unrelated to this milestone.
