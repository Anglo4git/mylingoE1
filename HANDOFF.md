# Mylingo Handoff

## Current milestone
06_CONTENT_QA_SCALE.md

## Status
COMPLETED

## Completed
- Separated orientation from measured placement with explicit `estimated_level`, `estimate_score`, `estimate_confidence`, and skill signals while keeping the legacy `level` field for backward compatibility.
- Added deterministic adaptive placement engine at `site/shared/js/placement.js`.
- Added centralized score bands: 90–100 Strong, 80–89 Secure, 60–79 Developing, 40–59 Weak, 0–39 Very weak.
- Added deterministic primary/secondary assessment path logic for estimate confidence and one-level adjacency protection.
- Added deterministic boundary checks: 85+ upper boundary, below 50 lower boundary, 50–84 stays at the assessed level; insufficient evidence is handled safely.
- Added confidence calculation from evidence quantity, completeness, boundary proximity, and conflicting signals.
- Added controlled placement question metadata: `skill`, `subskill`, `difficulty` 1–5, `cefr`, and `estimated_time_seconds` across all six canonical placement banks.
- Added safe skill-profile calculations; a skill needs at least two questions before a percentage is reported, otherwise `null` is used.
- Added primary → boundary-verification → final placement flow. A strong B1 result can launch a B2 boundary check; a weak B1 result can launch an A2 boundary check. Verification never skips more than one CEFR level.
- Added versioned localStorage persistence using `mylingo.assessment.v1`; malformed stored data is ignored safely. Pending boundary checks use `mylingo.assessment.pending.v1`.
- Added learner result presentation separating estimate, assessment, recommendation, confidence, strong areas, practice-next areas, and manifest-resolved next quizzes.
- Existing quiz and placement URLs remain valid; placement mode still uses `quiz=placement-001` with the level-specific placement JSON.
- Added the new placement engine to the service-worker precache without changing its strategy.
- Added unit coverage for all six levels, boundary decisions, confidence levels, malformed storage, skill precision, and metadata validation.

## Files changed
- `site/shared/js/orientation.js`
- `site/main/index.html`
- `site/shared/quiz.html`
- `site/sw.js`
- `site/SCHEMA.md`
- `site/placement/a1/placement-001.json`
- `site/placement/a2/placement-001.json`
- `site/placement/b1/placement-001.json`
- `site/placement/b2/placement-001.json`
- `site/placement/c1/placement-001.json`
- `site/placement/c2/placement-001.json`
- `tests/unit/placement-data.test.js`
- `tests/unit/placement-engine.test.js`

## Files added
- `site/shared/js/placement.js`
- `site/placement/PLACEMENT_ENGINE.md`
- `tests/unit/placement-engine.test.js`

## Files removed
- none

## Tests and verification
- `python3 -m py_compile build.py generation/generate.py` — passed.
- `node --check site/shared/js/placement.js` — passed.
- `node --check site/shared/js/orientation.js` — passed.
- Inline JavaScript syntax checks for `site/main/index.html` and `site/shared/quiz.html` — passed.
- Direct Node placement-engine behavioral checks — passed.
- Placement metadata audit for all six placement banks — passed.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-m5-final` — passed; 66 data files written.
- `python3 build.py verify-output --out /tmp/mylingo-m5-final` — passed; 0 errors, 0 warnings.
- `npm test` / Vitest — unavailable because `vitest` is not installed in `node_modules/.bin` in this package.
- Playwright E2E — unavailable because the Playwright executable/browser dependencies are not installed in this package.

## Known limitations
- The six published placement banks remain compact 10-question checks, so skill profiles only report skills represented by at least two tagged questions.
- Current production manifest data is primarily Grammar with limited Vocabulary/Writing coverage; recommendation resolution therefore uses categories that actually exist in the recommended-level manifest and may omit unavailable skills.
- Orientation confidence remains a product heuristic. It is an estimate signal, not a certified CEFR measurement.

## Decision rules
- Orientation high confidence: primary level is the estimate.
- Orientation medium/low confidence: primary level is the estimate and an adjacent secondary verification level is prepared.
- Primary assessment >=85%: upper boundary verification.
- Primary assessment <50%: lower boundary verification.
- Primary assessment 50–84%: no boundary verification.
- Fewer than 5 graded questions or incomplete attempt: insufficient evidence / low confidence.
- Skill percentage requires at least 2 questions for that skill.



## Milestone 6 completed

- Added `content_qa.py`, a deterministic, dependency-free content QA auditor separate from `build.py` validation.
- Added diagnostic and strict modes with configurable question/explanation/quiz-size thresholds.
- Added machine-readable JSON and CSV issue outputs plus a human-readable Markdown report.
- Added structural, content-alignment, duplication, linguistic-hygiene, answer-position-bias, and executable-content checks.
- Added normalized duplicate detection and pruned near-duplicate detection within level/category buckets.
- Added `tests/unit/test_content_qa.py` with 9 passing unit tests.
- Added `npm run audit` as a convenience wrapper; production remains a static site with no bundler requirement.
- Added `06_CONTENT_QA_SCALE.md` as the milestone contract.

## Milestone 6 validation

- `python3 tests/unit/test_content_qa.py -v` → **9/9 passed**.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v` → all discovered Python unit tests passed.
- `python3 content_qa.py --input master_source.csv --out-dir content_qa` → diagnostic audit completed; findings are review warnings only on the sparse starter dataset.
- `python3 build.py validate --input master_source.csv` → **60 rows, 60 quizzes, 0 errors, 0 warnings**.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent6-build` → passed.
- `python3 build.py verify-output --out /tmp/mylingo-agent6-build` → passed; **0 errors, 0 warnings**.

## Milestone 6 findings on current starter data

- The current source is intentionally sparse: **60 published rows / 60 one-question quizzes**.
- Diagnostic QA therefore reports underfilled-quiz warnings rather than blocking the starter dataset.
- Additional content review signals found: a few short questions/explanations, two possible answer-length clues, and one capitalization-shape inconsistency.
- Strict mode is intentionally expected to fail on the current one-question starter quizzes until production-sized quizzes are assembled.

## Files added by Agent 6

- `06_CONTENT_QA_SCALE.md`
- `content_qa.py`
- `content_qa/CONTENT_QA_REPORT.md`
- `content_qa/content_qa_report.json`
- `content_qa/content_qa_issues.csv`
- `tests/unit/test_content_qa.py`

## Files changed by Agent 6

- `package.json`
- `HANDOFF.md`

## Next task

Ready for the next milestone. Milestone 6 content-QA work is complete and handed off.

## Do not change
- Legacy quiz schema.
- Existing quiz routes.
- Existing manifest resolution behavior.
- Service-worker strategy.
- Generation pipeline behavior unless Milestone 6 explicitly requires it.

## Stop rule
Stop after Milestone 6 content-QA verification and handoff. Do not begin the next milestone in this package.

---

## Current milestone (update)
07_CONTENT_SCHEMA_V2.md

## Status
COMPLETED — see `AGENT_11_COMPLETION.md`

## Milestone 7 completed
- Added `date_added`/`date_updated` as optional, additive `master_source.csv`
  columns (ISO 8601), validated only when present in the source at all.
- Added `tag_vocabulary.json` as the controlled tag vocabulary source of
  truth and wired `content_qa.py` to check `quiz_tags`/`question_tags`
  against it (`CQ-T01`).
- Added `CQ-M01`/`CQ-M02`/`CQ-M03` for date presence/format/ordering in
  `content_qa.py`, and `V-H1`/`V-H2` (warning-only) in `build.py`.
- Added `07_CONTENT_SCHEMA_V2.md` as the milestone contract, including the
  enforcement split, acceptance criteria, and explicit non-goals (no
  `master_source.csv` backfill, no generation-pipeline wiring yet).
- Added 7 unit tests to `tests/unit/test_content_qa.py`; all pass.

## Milestone 7 validation
- `python3 build.py validate --input master_source.csv` → **60 rows, 60
  quizzes, 0 errors, 0 warnings** (unchanged).
- `python3 build.py build ...` / `verify-output` → unchanged, clean.
- `python3 content_qa.py --input master_source.csv --out-dir <tmp>` →
  identical summary/by_code to the committed baseline report; no new
  issues on current data.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v` → 16/16
  passed.

## Next task
Ready for the next milestone: wiring `generation/generate.py`/
`promote.py`/the authoring app to actually stamp `date_added`/
`date_updated`, per `07_CONTENT_SCHEMA_V2.md`'s handoff section.

## Do not change (Milestone 7 additions)
- The frozen 23-column `master_source.csv` shape — schema v2 fields are
  columns 24/25, optional, never required.
- `master_source.csv` itself — no backfill was performed.
- `build.py`'s existing error rule set — only new warnings were added.

## Stop rule
Stop after Milestone 7 verification and handoff. Do not begin
generation-pipeline wiring (the natural next milestone) in this package.

---

## Current milestone (update)
Build Pipeline v2 — see `AGENT_12_COMPLETION.md`

## Status
COMPLETED

## Milestone 8 (Agent 12) completed
- Wired `generation/generate.py` to stamp `date_added` (one shared UTC
  timestamp per run) on every newly generated row, whether it's a
  brand-new quiz or questions appended to an existing one. `date_updated`
  is left blank at creation.
- Wired `generation/promote.py` to stamp `date_updated` (one shared UTC
  timestamp per call) on rows that are actually promoted — `status` is a
  content-bearing field per `07_CONTENT_SCHEMA_V2.md`. Fixed a real latent
  bug in the same file: `write_master_csv()` hardcoded a 23-column
  fieldname list that was silently dropping `date_added`/`date_updated`
  from any row written back out.
- Extended `authoring/mylingo-admin.html`: `date_added`/`date_updated` now
  round-trip through import/export and render read-only in the grid; the
  explicit "Add row" action stamps `date_added`; `quiz_tags`/
  `question_tags` cells now offer tag-vocabulary-sourced autocomplete via
  an inline copy of `tag_vocabulary.json` (this app has no `fetch()`
  calls anywhere, so the vocabulary is embedded, not loaded).
- Added 24 new unit tests across `generation/test_generate.py` (17 new)
  and `generation/test_promote.py` (7 new) covering the stamping behavior,
  the write_master_csv regression, and non-backfill of pre-existing rows.

## Milestone 8 validation
- `python3 -m unittest discover -s generation -p 'test_*.py' -v` → 58/58
  passed.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v` → 16/16
  passed, unchanged.
- `python3 build.py validate --input master_source.csv` → 60 rows, 60
  quizzes, 0 errors, 0 warnings — unchanged (file not modified).
- `python3 build.py build ...` / `verify-output` → unchanged, clean.
- End-to-end CLI smoke test (temp copies only): generate → promote →
  validate → content_qa all confirmed the stamps land correctly and
  nothing pre-existing gets backfilled. Full detail in
  `AGENT_12_COMPLETION.md`.

## Next task
The manifest `date` field in `build.py` is still a fixed placeholder
(`BUILD.md` Known Issue #1) — now that the columns are actually populated
for new content, a future agent could decide whether the manifest should
source from them. This was deliberately left as an open product decision,
not assumed.

## Do not change (Milestone 8 additions)
- The frozen 23-column `master_source.csv` shape — schema v2 fields stay
  optional columns 24/25.
- `master_source.csv` itself — still no backfill.
- `build.py validate`'s and `content_qa.py`'s existing rule sets (both
  already existed from Milestone 7; nothing here added or changed a rule).

## Stop rule
Stop after Milestone 8 (Build Pipeline v2) verification and handoff. Do
not begin the manifest date-sourcing decision or any other new milestone
in this package.

---

## Current milestone (update)
Production Quiz Profiles — see `AGENT_16_COMPLETION.md` and
`08_PRODUCTION_QUIZ_PROFILES.md`

## Status
COMPLETED

## Milestone (Agent 16) completed
- Added `production_quiz_profiles.json`: 16 named level+category packing
  profiles (min/target/max size + title/description templates), plus 1
  explicitly `deferred` combination (B1/Writing) with rationale recorded.
- Wired `site/shared/js/quiz-packer.js`'s `packRows()` to accept an
  optional `profiles` array and apply a matching profile's bounds/
  templates per bucket, falling back to the caller's global options for
  any unmatched combination. Fully backward compatible with Agent 15
  callers that don't pass `profiles`.
- Wired both `authoring/mylingo-admin.html` `packRows()` call sites (Pack
  Quizzes button + raw-import auto-pack) to the new
  `PRODUCTION_QUIZ_PROFILES` inline copy (same inlining pattern as
  `TAG_VOCABULARY`, since this app has no `fetch()` calls).
- Added `tests/unit/production-quiz-profiles.test.js` and manual Node
  smoke coverage for config shape, backward compatibility, profile
  application, and deferred-bucket fallback.

## Milestone (Agent 16) validation
- Profile/packer/authoring smoke tests — all passed (see
  `AGENT_16_COMPLETION.md` for full detail).
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'` → 16/16
  passed, unchanged.
- `python3 -m unittest discover -s generation -p 'test_*.py'` → 58/58
  passed, unchanged.
- `python3 build.py validate --input master_source.csv` → 60 rows, 60
  quizzes, 0 errors, 0 warnings — unchanged.
- `python3 build.py build ...` / `verify-output` → 66 files, 0 errors, 0
  warnings — unchanged.

## Next task
Agent 17 could run a profile-driven repack over the ~400-question raw
dataset once ready, decide the fate of the deferred B1/Writing
combination, or surface profile bounds in a pack-preview UI before
commit. None of these are assumed or started by this milestone.

## Do not change (Agent 16 additions)
- `master_source.csv` — untouched, no backfill, no repack performed.
- The packer's no-`profiles` behavior — must stay identical to Agent 15.
- `build.py`/`content_qa.py` rule sets — untouched.

## Stop rule
Stop after Production Quiz Profiles verification and handoff. Do not
begin a raw-dataset repack or pack-preview UI in this package.

---

## Current milestone (update)
### 09_PLACEMENT_BLUEPRINT_V2.md

**Status: COMPLETED — see `AGENT_17_COMPLETION.md`**

Agent 17 formalized placement as a versioned, executable state machine while preserving the Agent 16 helper APIs and all existing placement routes. `resolvePlacement()` is now the runtime decision point used by `site/shared/quiz.html`.

### Agent 17 additions
- `PLACEMENT_BLUEPRINT_V2` runtime contract.
- `validatePlacementBlueprint()` invariant check.
- `resolvePlacement()` with explicit `action`, `reason`, `verification_level`, `recommended_level`, and `finality`.
- Primary boundary checks require sufficient evidence before routing.
- Verification is one-pass and cannot silently auto-chain to another CEFR level.
- `09_PLACEMENT_BLUEPRINT_V2.md` milestone specification.
- `tests/unit/placement-blueprint-v2.test.js`.

### Agent 17 validation
- Placement blueprint direct VM smoke — passed.
- JS syntax checks — passed.
- Python unit suite — 16/16 passed.
- Generation unit suite — 58/58 passed.
- `build.py validate` — 60 rows, 60 quizzes, 0 errors, 0 warnings.
- Production build — 66 data files.
- `verify-output` — 0 errors, 0 warnings.
- Vitest unavailable because it is not installed in the supplied `node_modules`.

### Next task
Expand the placement item-bank blueprint/authoring workflow (skill-balanced and difficulty-aware banks) while keeping the v2 learner state machine and route compatibility frozen.

### Stop rule
Stop after Placement Blueprint v2 verification and handoff. Do not repack `master_source.csv` or expand the published banks as part of this milestone.

---

## Current milestone (update)
### 10_SKILL_LEVEL_RECOMMENDATIONS.md

## Status
COMPLETED — see `AGENT_19_COMPLETION.md`

## Milestone 10 completed
- Added deterministic per-skill recommendation rules on top of Placement Blueprint v2.
- Added `site/shared/js/recommendations.js` with skill-specific target-level calculation, weakest-first ranking, sparse-skill protection, and manifest-backed quiz resolution.
- Added `10_SKILL_LEVEL_RECOMMENDATIONS.md` as the milestone contract.
- Updated `site/shared/quiz.html` to show skill-level recommendation links without altering overall placement decisions.
- Added the recommendation engine to the service-worker precache.
- Added `tests/unit/skill-level-recommendations.test.js` covering the recommendation contract and catalog resolution behavior.

## Milestone 10 validation
- New recommendation engine syntax check passed.
- Modified service-worker syntax check passed.
- All inline scripts in `site/shared/quiz.html` passed syntax validation.
- Direct VM smoke against the real six-level manifests passed.
- Python unit suite: **16/16 passed**.
- Content-QA unit suite: **16/16 passed**.
- `build.py validate`: **60 rows, 60 quizzes, 0 errors, 0 warnings**.
- Production data build: **66 files written**.
- `verify-output`: **0 errors, 0 warnings**.
- Vitest remains unavailable in the supplied offline package because `node_modules/.bin/vitest` is missing.

## Next task
Ready for the next milestone. Natural follow-on work is richer skill/category content coverage so more skill-level recommendations can resolve to concrete quizzes, plus E2E coverage once Playwright dependencies are installed.

## Do not change
- Placement Blueprint v2 decision state machine or thresholds.
- Existing placement URLs and canonical placement quiz IDs.
- Existing localStorage key names.
- Legacy quiz schema and manifest resolution behavior.

---

## Current milestone (update)
### 11_SKILL_MASTERY_DATA_MODEL.md

**Status: COMPLETED — see `AGENT_20_COMPLETION.md`**

Agent 20 added a cumulative, versioned skill-mastery store under `mylingo.skill-mastery.v1` and integrated best-effort recording into completed quizzes.

### Next task
Extend the mastery model into learner-facing mastery trends/progress surfaces or richer mastery-aware recommendations, while keeping Placement Blueprint v2 and the existing Skill-Level Recommendation contract frozen.

### Do not change
- Placement Blueprint v2 decision state machine or thresholds.
- Existing placement URLs and canonical placement quiz IDs.
- Existing localStorage key names.
- Legacy quiz schema and manifest resolution behavior.
- Existing score/gamification persistence behavior.

## Agent 21 — Review Scheduling MVP

Agent 21 added a separate deterministic review scheduler under `mylingo.review-scheduling.v1`.

- `site/shared/js/review-scheduler.js` records per-skill review intervals and due timestamps from completed learning quizzes.
- Base intervals are 1/3/7/14 days by latest skill accuracy (0–59 / 60–79 / 80–89 / 90–100%).
- Successful prior intervals can double up to 30 days; weak performance resets to 1 day.
- `getDueSkills()` and `getNextReview()` expose due-review information for a future learner-facing review queue.
- Placement assessments are excluded; existing placement, recommendation, mastery, scoring, and quiz-schema contracts remain unchanged.
- Scheduler is service-worker precached and covered by `tests/unit/review-scheduler.test.js`.

Next natural milestone: add a lightweight learner-facing Review Queue / “Due for review” surface that consumes `MylingoReviewScheduler.getDueSkills()` and resolves each skill to available manifest-backed quizzes without changing the scheduler contract.

---

## Agent 22 — Authoring Draft Autosave MVP

Agent 22 added a browser-local recovery layer for the standalone authoring app.

### Delivered
- Added `site/shared/js/authoring-draft-autosave.js` with versioned storage key
  `mylingo.authoring-draft.v1`.
- Added debounced autosave after grid edits and authoring operations.
- Added flush on `beforeunload`, `pagehide`, and document visibility changes.
- Added toolbar autosave status plus explicit `Restore Draft` and `Discard Draft`
  controls.
- Draft snapshots omit `__internalId` and rehydrate fresh internal IDs on restore.
- Malformed/wrong-version storage is ignored safely.
- LocalStorage quota/write failures do not interrupt authoring.
- Added `13_AUTHORING_DRAFT_AUTOSAVE_MVP.md` and unit coverage.

### Compatibility
- Exported CSV and production ZIP behavior unchanged.
- Canonical content dates unchanged.
- Existing quiz schema, validation, generation, placement, mastery, and review
  scheduling contracts unchanged.

### Verification
- `node --check site/shared/js/authoring-draft-autosave.js` — passed.
- `node --check tests/unit/authoring-draft-autosave.test.js` — passed.
- `node tests/unit/authoring-draft-autosave.test.js` — **4/4 passed**.
- Existing source validators remain unchanged and are rerun in Agent 22 package checks.

### Next task
Next natural milestone: learner-facing Review Queue / Due for Review surface.

---

## Agent 23 — Authoring Scale + Incremental Validation

Agent 23 fixed the authoring app's live-edit validation path, which
previously re-validated the entire dataset on every keystroke — cost grew
linearly with dataset size (measured ~48ms/keystroke at 400 quizzes /
4,000 rows, ~178ms at 1,600 quizzes / 16,000 rows), which does not scale to
the production target (~400 quizzes).

### Delivered
- Added `site/shared/js/authoring-validation.js`: the same validation rules
  (`getRowIssues`, `computeQuizGroupIssues`), ported verbatim, plus a
  stateful `createEngine()` that maintains a `quiz_id -> Set(internalId)`
  index and running summary counters incrementally instead of rescanning.
- `engine.onFieldChanged(internalId)` — the new live-edit hot path — only
  re-checks the edited row plus its quiz group (or both groups, if the
  edited field was `quiz_id` itself). Cost is O(rows in one quiz), not
  O(total rows). Measured: ~0.04–0.13ms per edit, flat across 100–1,600
  quizzes (previously ~12–178ms and growing).
- `engine.fullRecompute(rows)` remains for bulk operations (import, pack,
  bulk delete, undo/redo, initial load) — unchanged behavior, still O(total
  rows), which is fine since those paths already touch every row.
- `renderValidationPanel({ onlyQuizIds })` patches just the affected quiz
  row(s) in the validation table's DOM in place instead of clearing and
  rebuilding the whole `<tbody>` on every keystroke.
  `renderValidationPanel()` with no args still does the full rebuild, used
  by the same bulk-operation call sites as before.
- Added `14_AUTHORING_SCALE_INCREMENTAL_VALIDATION.md` (contract + before/
  after benchmark numbers) and
  `tests/unit/authoring-scale-incremental-validation.test.js` (10 tests:
  rule-level checks, engine equivalence between incremental building and a
  from-scratch `fullRecompute` across add/edit/quiz_id-move/delete
  sequences, summary-counter transitions, and a scale/cost sanity check).
- Updated `tests/unit/authoring-raw-import.test.js`'s "keeps the production
  quiz ceiling at 150 questions" test: the ceiling message it checks moved
  from `mylingo-admin.html` into the new module as part of this refactor,
  so the assertion now points at the module file. The `MAX_QUESTIONS_PER_QUIZ
  = 150` constant itself is unchanged and still declared in
  `mylingo-admin.html`.

### Compatibility
- Validation rules, messages, and evaluation order are unchanged (ported
  verbatim, including two pre-existing quirks that were not in scope to
  fix: the duplicate-question-number check reads `question_num` rather than
  `question_number`, and the category-consistency check reads `category`
  rather than `quiz_category`/`question_category`).
- Export, production ZIP, generation, placement, mastery, and review
  scheduling behavior unchanged. Export/pack call sites still call
  `computeValidation()` (now backed by `fullRecompute`) immediately before
  reading validation state, same as before.
- No grid virtualization / windowed row rendering — out of scope for this
  milestone (see Non-goals in the contract doc); this targets the
  validation hot path specifically, which runs on every keystroke
  regardless of how many rows are currently visible.

### Verification
- `node --check site/shared/js/authoring-validation.js` — passed.
- Inline JavaScript syntax check for `authoring/mylingo-admin.html`
  (extracted `<script>` content) — passed.
- `npx vitest run` — Vitest is installable in this environment (unlike the
  "unavailable" note in earlier handoffs — `npm install` succeeded here).
  Baseline before this milestone: 4 failed test files / 2 failed tests /
  133 passed (pre-existing, unrelated to authoring validation:
  `authoring-draft-autosave.test.js` and `session-resume.test.js` are
  broken suites, plus one pre-existing content-mismatch failure each in
  `authoring-raw-import.test.js` and `quiz-question-experience.test.js`).
  After this milestone: same 4 failed files / 2 failed tests / 143 passed
  — no regressions, 10 new tests passing.
- Manual Node equivalence checks (build-by-`onRowAdded` vs `fullRecompute`,
  and a mixed add/edit/quiz_id-move/delete sequence vs `fullRecompute`) —
  passed, matches the automated test coverage above.
- Manual Node benchmark across 100/400/1,600-quiz synthetic datasets
  confirming full-rescan cost grows linearly while incremental single-edit
  cost stays flat — see numbers in
  `14_AUTHORING_SCALE_INCREMENTAL_VALIDATION.md`.
- Not run: Playwright E2E (browser dependencies not installed) and a real
  in-browser typing/DOM-timing check (no browser available in this
  environment) — the DOM-patch logic in `renderValidationPanel` was
  reviewed carefully but only exercised indirectly (Node/vitest can't
  render actual DOM here); worth a manual once-over in a real browser
  before shipping.

### Next task
Grid virtualization / windowed rendering for the row grid itself would be
the natural follow-on if the ~400-quiz dataset also turns out to be slow to
*render* (not just to validate) — this milestone did not touch grid
rendering. Otherwise: a learner-facing Review Queue / "Due for review"
surface remains open from Agent 21's suggested next step.

### Do not change
- Placement Blueprint v2 decision state machine or thresholds.
- Existing placement URLs and canonical placement quiz IDs.
- Existing localStorage key names.
- Legacy quiz schema and manifest resolution behavior.
- Existing score/gamification persistence behavior.
- Validation rule semantics/messages (only the recomputation strategy
  changed in this milestone).

---

## Agent 24 — Offline Content Packs + Production Release Gate

**Status:** COMPLETED

### Added
- `offline_packs.py`
- `site/shared/js/offline-packs.js`
- `24_OFFLINE_CONTENT_PACKS_RELEASE_GATE.md`
- `tests/unit/offline-packs.test.js`
- Generated `site/offline/packs.json`
- Generated `site/offline/packs/{core,a1,a2,b1,b2,c1,c2}.zip`
- `AGENT_24_COMPLETION.md`

### Changed
- `site/sw.js`: cache version `mylingo-v3`; install now expands from `offline/packs.json`.
- `build.py`: normal builds now generate offline packs; fresh outputs now include `sw.js` and root `manifest.json`; added `release-gate` command.

### Verification
- Source validation: **60 rows / 60 quizzes / 0 errors / 0 warnings**.
- Build: **74 files written**.
- Output verification: **0 errors / 0 warnings**.
- Production release gate: **PASS**.
- Python unit tests: **16/16 passed**.
- JS syntax + direct offline API smoke checks: passed.
- Full Vitest command timed out in the environment; Playwright browser dependencies unavailable.

### Next task
Learner-facing Offline Content Pack UI or CI integration for the new `release-gate` command.

---

## Current milestone (Agent 25)
Offline Packs Learner UI — see `AGENT_25_COMPLETION.md`

## Status
COMPLETED

## Files added
- `site/shared/js/offline-packs-ui.js`
- `tests/unit/test_offline_packs_ui.py`
- `25_OFFLINE_PACKS_LEARNER_UI.md`
- `AGENT_25_COMPLETION.md`

## Files changed
- `site/shared/js/offline-packs.js`
- `site/shared/js/offline-packs-ui.js`
- `site/main/index.html`
- `site/a1/dashboard.html`
- `site/a2/dashboard.html`
- `site/b1/dashboard.html`
- `site/b2/dashboard.html`
- `site/c1/dashboard.html`
- `site/c2/dashboard.html`
- `site/sw.js`

## Next task
Continue with the next milestone using the frozen `mylingo.offline-packs.v1` contract. Recommended next step: integrate `build.py release-gate` into CI/deployment so production publishing is blocked automatically when the gate fails.

---

## Current milestone (Agent 26)
CI / Production Release Gate — COMPLETED

### Delivered
- `.github/workflows/release.yml` verifies pull requests and publishes only a freshly built, release-gated artifact to GitHub Pages on pushes to `main`.
- CI runs Python unit tests, content QA, JavaScript tests, a clean build, output verification, and `build.py release-gate` before deployment.
- `ci/release_gate.sh` provides local parity with the release sequence.
- `package.json` exposes `test:python`, `release:build`, and `release:gate` helpers.
- GitHub Pages deployment keeps the existing single-origin topology and publishes the complete verified site artifact.

### Validation
- Python unit tests: 22/22 passed.
- Source validation: 60 rows / 60 quizzes / 0 errors / 0 warnings.
- Fresh build: PASS.
- Output verification: 0 errors / 0 warnings.
- Production release gate: PASS / 0 errors / 0 warnings.
- Offline pack generation: 7 packs verified.
- JavaScript syntax checks: PASS.
- Workflow structure checks: PASS.

### Next task
Add automated accessibility auditing (axe/Lighthouse) to the same verification job and retain its report as a release artifact. Keep it non-blocking until the first clean baseline is established, unless the product explicitly promotes it to a hard release requirement.

---

## Current milestone (Agent 27)
Automated Accessibility Audit in the Release Pipeline — COMPLETED

### Delivered
- `tests/e2e/accessibility.spec.js` runs axe-core (WCAG 2.0/2.1 A+AA tags)
  against the main hub, a level index, a level dashboard, and all three
  quiz states (start / in-progress / completed) — six real rendered-DOM
  audit points, loaded from CDN so no new npm devDependency was needed.
- Runs inside the same CI job that gates production deploys
  (`.github/workflows/release.yml`), against the exact freshly built,
  release-gated artifact — and locally via `bash ci/release_gate.sh` or
  `npm run test:a11y`.
- Writes `ACCESSIBILITY_REPORT.md` + `accessibility_report.json`, retained
  as a workflow artifact on every run (pass or fail), written outside the
  Pages-deployed directory so the report itself never ships to production.
- Report-only by design: `MYLINGO_A11Y_BLOCKING` (default unset/`false`)
  means a violation finding never fails the pipeline, only a genuine
  tooling failure does. Flip it to `'true'` once a human has reviewed a
  real baseline and the product wants this as a hard gate.
- `playwright.config.js`'s webServer target is now overridable via
  `MYLINGO_SITE_DIR` (defaults to the checked-in `./site`, unchanged for
  local dev) so the audit — and the existing e2e suite, if ever added to
  CI — can point at the freshly built artifact instead of the working tree.
- `RELEASE_CHECKLIST.md` accessibility-audit item checked off with an
  accurate report-only description; added a dedicated checklist section.

### Validation
- Python unit tests: 22/22 passed, unchanged (no `.py` file touched).
- `generation/` unit tests: 58/58 passed, unchanged.
- Source validation: 60 rows / 60 quizzes / 0 errors / 0 warnings, unchanged.
- Spec/config syntax (`node --check`), `package.json`/workflow YAML parse,
  and `ci/release_gate.sh` shell syntax: all PASS.
- The pure Markdown-report-formatting function was extracted and unit
  tested in isolation against hand-built fake axe-core output.
- **Not executed**: a real `npx playwright test` run against an actual
  browser. This sandbox has no network access to install Playwright's
  Chromium (`npm` registry requests are rejected at the network layer),
  same limitation every prior CI-touching agent here has recorded.

### Next task
A human with CI access needs to merge this, let a real workflow run
happen, read the first genuine `ACCESSIBILITY_REPORT.md`, triage whatever
it finds, and decide whether to promote `MYLINGO_A11Y_BLOCKING` to `'true'`.
The deployment-topology decision (single-origin vs. six repos) remains the
other open, human-decision item.

## Do not change (Agent 27 additions)
- The report-only default (`MYLINGO_A11Y_BLOCKING` unset/`false`) —
  promoting it to a hard gate is a product decision for a human reviewing
  a real baseline, not something to default on in this package.
- `build.py release-gate`'s existing semantics — this milestone only adds
  a step after it, never changes what it checks.

## Stop rule
Stop after Agent 27 verification and handoff. Do not flip the
accessibility gate to blocking, and do not begin the deployment-topology
decision, in this package.
