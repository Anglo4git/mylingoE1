# Agent 168 Handoff — Dead Code Cleanup (Agent 167's carried-forward items 3–6)

## Context
Picked up `HANDOFF_AGENT_167.md` (258→275 tests, all passing; placement boundary-check flow fixed).
User asked specifically for the carried-forward cleanup items: `learner-state.js` unreferenced,
`gamification.js`'s dead "Malformed legacy backup." branch, the `RELEASE_IDENTITY.json` zip-naming
question, and the unused legacy `calculateNextInterval`. Investigated each before touching anything.

## Item 3 — `shared/js/learner-state.js`: investigated, NOT removed
It's true no HTML page loads this file (not in any `<script src>`, and — confirmed — not in
`offline/core-manifest.json` either, unlike every other shared/js module). But it is not dead:
`tests/run.js`'s "cross-module: stored data passes BOTH validators (Agent 159)" section uses it as
an *independent* second validator against what `skill-mastery.js` / `review-scheduler.js` actually
persist, specifically to catch drift between `gamification.js`'s own (duplicate) validators and a
second implementation. That test's own comment says it exists because Agent 159 found a real bug this
way (review-scheduler storing a `last_level` string gamification's validator rejected). Removing the
file would delete a working regression contract, not dead weight. Left in place. Re-labeling this item
closed: "verified intentional test-only contract, not dead code."

## Item 4 — `gamification.js`: removed the unreachable "Malformed legacy backup." branch
`normalizeBackup`'s legacy path always builds `sections: {progress, session, gamification}` as an
object literal — all three keys are always own-properties (even when `undefined`), so
`present.length` for a legacy backup is always exactly 3 and `present.length !== 3` can never be
true. A previous agent had already proven this in a test comment
(`tests/run.js`: "the 'Malformed legacy backup' branch is unreachable"). Removed the dead branch
(1 line) and simplified the now-redundant test comment. No behavior change (confirmed: same
273/274 pass count before/after this specific edit, isolated from the other change).

## Item 5 — Zip filename vs `RELEASE_IDENTITY.json` (v118): no code action
Re-confirmed this is a process/naming question, not a bug: `RELEASE_IDENTITY.json` declares itself
`"sourceOfTruth": true` with an explicit policy not to hardcode release tags elsewhere in
*application code*. The delivery zip's filename (encoding phase/agent#) is a separate build-artifact
convention, not application code, so nothing here violates that policy. Every agent since 157 has
correctly left this alone as "out of scope for a code fix" — confirmed and left as-is.

## Item 6 — `shared/js/review-scheduler.js`: removed unused legacy `calculateNextInterval`
Confirmed unused by the app: `recordAttempt` (the only caller of either interval function) calls
`calculateNextIntervalHours` exclusively; `calculateNextInterval` (the old day-granularity version)
was only ever called from its own test. Removed the function, its now-orphaned helper `accuracyBand`
(only caller was `calculateNextInterval`; `accuracyBandHours` is unrelated and still used/exported),
and both from the `MylingoReviewScheduler` export object. Removed the matching test block.

## Files changed
- `shared/js/gamification.js` — removed unreachable legacy-backup branch in `validateBackup`.
- `shared/js/review-scheduler.js` — removed `calculateNextInterval` and `accuracyBand`; removed both
  from the module's public export object.
- `tests/run.js` — removed the `calculateNextInterval` test block; trimmed the now-stale "unreachable
  branch" comment on the legacy-backup test (behavior of that test is unchanged).
- `offline/packs/core.zip` — rebuilt from `offline/core-manifest.json` (both edited JS files are
  precached), twice: once for the JS edits, once more after the `CACHE_VERSION` bump touched `sw.js`
  itself (also precached).
- `sw.js` — `CACHE_VERSION` bumped `mylingo-v11` → `v12` (two precached files changed content).

## Files NOT changed (and why)
- `shared/js/learner-state.js` — see item 3 above; kept as-is.
- `RELEASE_IDENTITY.json` — see item 5; no code issue exists.

## Tests: `tests/run.js` 275 → 274, all passing (`node tests/run.js`)
Net -1 test (removed the `calculateNextInterval`-only test; no other test count changes — the
legacy-backup test still runs, just with a trimmed comment). `node --check` clean on all three edited
JS files plus `sw.js`. Grepped repo-wide for `calculateNextInterval`, `accuracyBand`, and "Malformed
legacy backup" post-edit: zero remaining references outside this handoff.

## Current state
- App runs: yes (no HTML/behavior changes — pure removal of unreachable/unused code paths).
- Build: N/A (static site, no build step).
- Typecheck: N/A (no TS).
- Lint: N/A (no linter configured in repo).
- Tests: PASS — `node tests/run.js` → 274 passed, 0 failed.
- Known broken things: none introduced. Agent 167's list of open items (decisions, untested
  functions) is unchanged except items 3–6 above.

## Remaining / carried forward (from Agent 167, updated)
1. [DECISION] level-lock fail-open vs fail-closed.
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3. ~~`learner-state.js` unreferenced~~ — CLOSED: verified intentional (test-only cross-validation
   contract), not dead code. No action needed.
4. ~~`gamification.js` "Malformed legacy backup." dead code~~ — CLOSED: removed.
5. Zip filename vs `RELEASE_IDENTITY.json` (v118) — confirmed out-of-scope for a code fix; a release-
   process naming decision, not a bug.
6. ~~Legacy `calculateNextInterval` unused~~ — CLOSED: removed, along with its now-orphaned
   `accuracyBand` helper.
7. `main/practice.html` redirect stub — reviewed: this is a working, intentional redirect (post
   Agent 134 Practice-tab removal), not a defect. No action needed.
8. [PRODUCT] grammar-only recommendations / missing Reading, Listening catalog categories.
9. Still untested: `end()`, `load()`/lesson gate, other `render*` in quiz.html, `orientation.js`,
   `mastery-review-ui.js`, `app-shell.js`, `authoring-*`, `splash.js`, `offline-packs-ui.js`.

## Next agent — start here
1. If continuing cleanup/hardening: item 9 (test coverage) is the largest remaining bounded,
   non-product engineering task — `end()` in `shared/quiz.html` is the highest-value target (complex,
   many integrated subsystems, currently zero direct test coverage; the placement-pipeline test
   helper Agent 167 built for `renderPlacementResult` is the right pattern to extend).
2. Items 1, 2, 8 need a product decision before any code changes — flag to the user rather than
   guessing.

## Blockers
None.

## Assumptions made
- "Cleanup: remove dead code" was scoped to items 3–6 as named by the user, not a broader sweep —
  consistent with the smallest-safe-change convention every prior agent in this chain has followed.

## Artifacts produced
- `mylingo-v157-agent168-dead-code-cleanup.zip` — full project state after this turn.
- `HANDOFF_AGENT_168.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_168.md. You are Agent 169. Continue from 'Next agent — start here'."
