# Agent 16 Completion — Production Quiz Profiles

## Delivered

Agent 16 adds a named, per level+category "production profile" layer on
top of the Agent 15 packer, so quiz-packing bounds and metadata templates
no longer have to be one global setting applied to every bucket.

### Profile config
- Added `production_quiz_profiles.json` at the repo root: 16 named
  profiles (one per production level+category combination) plus one
  explicitly `deferred` combination (B1/Writing), each with a documented
  rationale in `_decision_log`.
- Added `08_PRODUCTION_QUIZ_PROFILES.md` as the milestone contract: what a
  profile is, exactly where the 16 came from (17 combos exist in
  `master_source.csv` today; B1/Writing was deferred, not deleted), the
  sizing rationale (bounds scale with CEFR level; Writing gets a smaller
  bound everywhere because its rows are effort-heavy `short_text`/
  `matching`/`ranking` types from Agent 14, not quick multiple-choice),
  and explicit non-goals.

### Packer wiring
- `site/shared/js/quiz-packer.js`: `packRows()` now accepts an optional
  `profiles` array. Per level+category bucket, a matching profile's
  `min_size`/`target_size`/`max_size`/`title_template`/
  `description_template` override the call's global options; buckets with
  no matching profile fall back to the global options exactly as before.
  The return value gains `profilesApplied`.
- Fully backward compatible: calling `packRows()` without a `profiles`
  option is byte-for-byte identical to Agent 15's behavior (verified by
  test and manual smoke run).

### Authoring UI
- `authoring/mylingo-admin.html`: added an inline
  `PRODUCTION_QUIZ_PROFILES` copy (same pattern as the existing
  `TAG_VOCABULARY` inline copy, since this app has no `fetch()` calls).
  Both `packRows()) call sites — the explicit **Pack Quizzes** button and
  the raw-import auto-pack path — now pass the profiles. The Pack Quizzes
  toast reports which profile IDs were actually applied.

### Tests
- Added `tests/unit/production-quiz-profiles.test.js`: validates the
  profile config shape/count, confirms it covers exactly the 17
  `master_source.csv` combinations minus the one deferred combination,
  confirms backward compatibility with no `profiles` option, confirms
  profile bounds/templates are applied when supplied, and confirms
  fallback behavior for the deferred B1/Writing bucket.
- Manual Node smoke run of the same scenarios (Vitest remains unavailable
  in this offline workspace, same as prior agents) — all passed.

## Verification

- Profile config smoke: 16 profiles, 1 deferred, all 17
  `master_source.csv` combinations covered — **passed**.
- Packer backward-compatibility smoke (no `profiles` option) — **passed**,
  identical output to Agent 15.
- Packer profile-applied smoke (A1/Grammar → `a1-grammar` bounds/title) —
  **passed**.
- Packer deferred-bucket fallback smoke (B1/Writing, no profile) —
  **passed**, behaves like any other unmatched bucket.
- `node --check site/shared/js/quiz-packer.js` — **passed**.
- Authoring inline JavaScript syntax check (all 7 `<script>` blocks) —
  **passed**.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'` — **16/16
  passed**, unchanged.
- `python3 -m unittest discover -s generation -p 'test_*.py'` — **58/58
  passed**, unchanged.
- `python3 build.py validate --input master_source.csv` — **60 rows, 60
  quizzes, 0 errors, 0 warnings**, unchanged.
- `python3 build.py build ...` / `verify-output` — **66 files written, 0
  errors, 0 warnings**, unchanged.

## Files added
- `production_quiz_profiles.json`
- `08_PRODUCTION_QUIZ_PROFILES.md`
- `tests/unit/production-quiz-profiles.test.js`
- `AGENT_16_COMPLETION.md`

## Files changed
- `site/shared/js/quiz-packer.js`
- `authoring/mylingo-admin.html`
- `HANDOFF.md`

## Do not change
- `master_source.csv` — not touched, no backfill, no repack performed.
- The frozen packer contract for callers that don't pass `profiles`.
- `build.py`/`content_qa.py` rule sets — untouched; profiles are an
  authoring/packing-time concern only.

## Handoff

Agent 17 can build on this in a few directions, none assumed by this
milestone:
- Actually running a profile-driven repack over the ~400-question raw
  dataset once it's ready to be promoted into `master_source.csv`.
- Deciding whether/how to resolve the deferred B1/Writing combination
  (scale it up to a profile, or formally retire it).
- Surfacing `profilesApplied`/profile bounds in the pack-preview UI
  Agent 15 flagged as a natural next step, so authors can see which
  profile will govern a bucket before committing the pack.
