# Agent 67 — Final integration + consistency gate

## Status
COMPLETED

## Problem
Agents 48–66 hardened individual scale/storage/build/QA subsystems and Agent
66 enforced scale budgets at release time, but every one of those agents'
completion reports carries the same limitation: no working JS test runner was
available in their environment, so `npm test` (vitest) was never actually
executed — only `node --check` syntax validation and hand-written source
assertions. Nothing had verified that the pieces changed across 48–66 (and a
few pre-existing files exercised by the same test files) were still mutually
consistent.

## What I did differently
`npm install` and `npx vitest run` both work in this environment (the
network allowlist includes the npm registry). This closes a verification gap
every prior agent in this cycle explicitly flagged as unavailable to them —
I ran the full suite for the first time in this cycle and treated the
results as the actual final consistency gate.

## Findings and fixes
Full first run: **63/63 Python tests passed, 197/209 vitest tests passed (8
files failed).** Triaged each failure against the 48–66 changelog before
touching anything, to avoid scope creep into pre-existing, unrelated issues.

Fixed (all in `tests/unit/`, plus one product file):
- **`test_offline_packs_ui.py`** (Python) — asserted the pre-cycle-detection
  `installPack(dep);` call shape; Agents 59/61 changed it to
  `installPack(dep, null, dependencyStack)` for cycle safety. Updated the
  assertion to match the shipped, correct implementation.
- **`progress-backup.test.js`** — the round-trip test still read back the
  retired `mylingo.sessions.v2` blob key. Agent 50's sharding migration
  intentionally deletes that key on restore and writes
  `mylingo.sessions.v3.*` shards instead. Updated the test to verify via
  `buildBackup()` (how production code reads sessions back), matching the
  pattern already used by this file's other sharding tests.
- **`session-resume.test.js`** — a genuine parse error (an unescaped `'`
  inside a single-quoted string literal) plus two `it()` blocks left outside
  the `describe()` block, together made the whole file fail to load under
  Vite/Vitest even though `node --check` didn't catch the quoting bug in CJS
  mode. Fixed the string escaping, closed the blocks inside one `describe`,
  and updated three assertions that referenced the store shape from before
  the v3 sharding migration (`sessions:{}` → `const sessions={};`, etc.) to
  match the current source.
- **`gamification.test.js`** — a copy-pasted `quizId: 'legacy-004'` was
  reused across two `recordSession` calls in the same test, tripping the
  anti-XP-farming reward dedupe (Agent 45) and making a correct "reset
  streak after a missed day" assertion fail. Fixed the duplicate id.
- **`authoring-draft-autosave.test.js`** — was written as a bare
  Node/`assert` script (predating vitest availability), so `vitest run`
  registered zero tests for it and reported the file as a failed suite.
  Rewrote it as a `describe`/`it` suite with the same four assertions,
  unchanged in substance.
- **`mastery-review-ui.test.js`** — constructed a `JSDOM` instance without
  `runScripts: 'dangerously'`, so `getInternalVMContext()` threw. Added the
  option; no assertions changed.
- **`quiz-question-experience.test.js`** and **`authoring-raw-import.test.js`**
  — two stale source-assertion strings (one that no longer matched a
  refactored `correctIndexes(q, answers)` call, one where a comment had
  wrapped across a line break). Updated both to the exact current text.
- **`site/shared/js/review-scheduler.js`** — the one real product-code fix.
  `calculateNextIntervalHours` mapped *any* accuracy under 40% to a flat
  6-hour band, regardless of history. That's correct for a skill with no
  track record, but it meant a skill that already had a mature interval and
  streak, then completely bombed one review, got the same aggressive 6-hour
  same-day loop as a brand-new weak skill instead of the intended one-day
  reset (`review-scheduler.test.js`'s "resets weak performance to a one-day
  review" case). Added a `hadHistory` check (prior interval or streak > 0)
  so the 6-hour band only applies to skills with no history; skills with
  history reset to 24 hours on a sub-40% result, matching the day-based
  `calculateNextInterval` twin function's existing behavior.

## Not fixed (documented, left for a future agent)
- `review-scheduler.js`'s hour-based vs day-based interval functions
  (`calculateNextIntervalHours` / `calculateNextInterval`) are still two
  separate implementations of overlapping logic; this agent made their
  weak-performance behavior consistent but did not consolidate them into
  one function, since that's a larger refactor than a focused fix.
- No other cross-subsystem contract mismatches were found in the areas the
  mission's known-risk list calls out (offline pack dependency graph vs.
  LRU eviction, authoring pagination vs. incremental validation, streaming
  build vs. `validate()`'s shared contract) — I checked
  `evictIfNeeded`/`installPack`'s interaction specifically (a pack's
  dependency is always re-touched during install/`isInstalled`, which
  protects it from LRU eviction) and it holds up.

## Files changed
- `tests/unit/test_offline_packs_ui.py`
- `tests/unit/progress-backup.test.js`
- `tests/unit/session-resume.test.js`
- `tests/unit/gamification.test.js`
- `tests/unit/authoring-draft-autosave.test.js`
- `tests/unit/mastery-review-ui.test.js`
- `tests/unit/quiz-question-experience.test.js`
- `tests/unit/authoring-raw-import.test.js`
- `site/shared/js/review-scheduler.js`

## Verification
- `python3 -m pytest tests/unit -q`: **63/63 passed**.
- `npx vitest run`: **28/28 files, 209/209 tests passed** (was 20/28 files,
  197/209 tests on the first run before fixes).
- `node --check` on every touched/production JS file plus a syntax sweep
  (via Node's `--check`) of all JS files touched across agents 48–66 and
  the inline `<script>` block in `authoring/mylingo-admin.html`: all clean.
- Full pipeline re-run: `build.py build` → `verify-output` → `release-gate`
  (`--input master_source.csv --site site`): **0 errors, 0 warnings, PASS**,
  including Agent 66's "Scale budgets" line in `RELEASE_GATE_REPORT.md`.
- `bash -n ci/release_gate.sh`: clean.
- `node_modules/` was installed only to run the existing, already-declared
  `devDependencies` (no new dependency was added to `package.json`), and was
  removed again afterward — consistent with rule 12 (avoid new
  dependencies) and keeping the deliverable dependency-free at rest.

## Limitation
No real-browser verification (Playwright/E2E) was run — that requires a
browser binary this environment doesn't provide, same limitation every
agent in 48–66 reported. Everything that *can* run headlessly (Python
suite, JS unit suite via jsdom, the full Python build/QA/release-gate
pipeline, JS/shell syntax checks) now runs clean, which was not true before
this pass.
