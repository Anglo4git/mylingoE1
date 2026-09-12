# Milestone 08 — Production Quiz Profiles

## Goal

Give the Agent 15 packer (`site/shared/js/quiz-packer.js`) named,
per level+category packing rules instead of one global `minSize`/
`targetSize`/`maxSize` triple applied uniformly to every bucket, and use
that same config to drive consistent quiz titles/descriptions when the
packer creates a new quiz.

## What a profile is

A profile is a small config object keyed by `(level, quiz_category)`:

```json
{
  "id": "b2-writing",
  "level": "B2",
  "quiz_category": "Writing",
  "min_size": 5,
  "target_size": 8,
  "max_size": 12,
  "title_template": "${category} Practice",
  "description_template": "Practice ${category} at ${level} level."
}
```

Source of truth: `production_quiz_profiles.json` at the repo root.
`authoring/mylingo-admin.html` keeps an inline copy (`PRODUCTION_QUIZ_PROFILES`)
for the same reason it inlines `tag_vocabulary.json` — it is a standalone
offline HTML file with no `fetch()` calls anywhere.

## Where the profiles came from

`master_source.csv` originally had **17** level+category combinations;
16 were promoted to named profiles and **B1/Writing was deferred**, not
deleted. Agent 72's CQ-B07 CEFR/category coverage policy later added
A1/Vocabulary and A2/Vocabulary rows to `master_source.csv` (so A1/A2 are
no longer 100% Grammar), bringing the total to **19** combinations; Agent
81 added matching `a1-vocabulary`/`a2-vocabulary` profiles to close that
gap, for **18** named profiles + 1 deferred:

| Level | Categories with a profile |
|-------|----------------------------|
| A1 | Grammar, Vocabulary |
| A2 | Grammar, Vocabulary |
| B1 | Grammar, Vocabulary |
| B2 | Grammar, Vocabulary, Writing, Academic English |
| C1 | Grammar, Vocabulary, Writing, Academic English |
| C2 | Grammar, Vocabulary, Writing, Academic English |

**Rationale:** the original 16 combinations formed a clean, staged
pattern — Grammar-only at A1/A2, Grammar+Vocabulary added at B1, Writing
and Academic English introduced together starting at B2. B1/Writing was
the one outlier that broke that pattern (a single row, with no equivalent
B1/Academic-English row and no lower-level precedent), so it's listed
under `deferred` in `production_quiz_profiles.json` with the reasoning
recorded, rather than silently deleted or force-fit into a rule.
Existing B1/Writing rows are completely unaffected: they still validate,
build, and publish exactly as before — they just fall back to the global
packer defaults (`minSize`/`targetSize`/`maxSize` passed into `packRows()`)
instead of a named profile, the same as any other combination with no
matching profile. A1/A2 Vocabulary is a deliberate, policy-driven
exception to the old "Grammar-only at A1/A2" framing (see Agent 72 and
`quality_contract.json`'s `cefr_category_coverage` rule), not a drift —
so it gets a real profile, not a deferral.

## Sizing rationale

Bounds scale with proficiency level (larger, denser quizzes at higher
levels) and are additionally narrowed for the Writing category, since
Writing rows use effort-heavy types (`short_text`, `matching`, `ranking`
from the Agent 14 Rich Question Authoring MVP) rather than quick
multiple-choice:

- A1/A2: 5 / 10 / 15
- B1: 8 / 12 / 20
- B2/C1: 8–10 / 15 / 25
- C2: 10 / 15 / 30
- Writing (any level with a profile): 5 / 8 / 12

These are starting defaults, not hard product requirements — they can be
revised in `production_quiz_profiles.json` without touching packer code.

## What changed

- `site/shared/js/quiz-packer.js`: `packRows()` accepts an optional
  `profiles` array. For each level+category bucket, if a matching profile
  exists, its `min_size`/`target_size`/`max_size`/`title_template`/
  `description_template` override the function's global options; if not,
  behavior is byte-for-byte identical to Agent 15 (global options, the
  literal `Mixed ${category} Practice` title). The return value gains
  `profilesApplied` (array of profile IDs actually used in that call).
- `authoring/mylingo-admin.html`: both call sites of `packRows()` (the
  explicit **Pack Quizzes** button and the raw-import auto-pack path) now
  pass `PRODUCTION_QUIZ_PROFILES`. The Pack Quizzes toast reports which
  profile IDs were applied.
- `production_quiz_profiles.json` added at the repo root as the
  governance source of truth, mirroring the `tag_vocabulary.json` pattern.

## Non-goals (this milestone)

- No changes to `master_source.csv`'s frozen 23-column shape or any
  existing row.
- No changes to `build.py`, `content_qa.py`, or the generation pipeline.
  Profiles govern *packing/authoring-time* grouping only; they do not
  gate publication.
- No backfill or repacking of the current 60 one-question production
  quizzes — this milestone ships the profile config and packer wiring;
  actually running a repack over the full ~400-question raw dataset is a
  deliberate, separate content operation for a future agent or the team,
  not something this milestone performs automatically.
- B1/Writing is deferred, not removed, resolved, or auto-promoted.

## Acceptance criteria

- `production_quiz_profiles.json` parses as valid JSON and contains
  exactly 18 profiles plus one deferred entry (updated by Agent 81 to
  match Agent 72's A1/A2 Vocabulary coverage policy).
- `packRows()` with no `profiles` option behaves identically to Agent 15
  (regression-safe for existing callers/tests).
- `packRows()` with `profiles` supplied applies the matching profile's
  bounds/templates per bucket and reports `profilesApplied`.
- A level+category combination with no matching profile still packs
  correctly using the caller's global fallback options.
- `master_source.csv` validation/build/verify-output remain unchanged
  (0 errors, 0 warnings, 60/60 quizzes).
