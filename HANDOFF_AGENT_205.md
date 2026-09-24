# Agent 205 Handoff — gamification.js backup/restore validator hardening; app-shell.js / splash.js / runtime-content-loader.js re-verified clean

## Context
Picked up `HANDOFF_AGENT_204.md` "Next agent — start here" item 2: continue re-verification, highest value first — `app-shell.js`, `splash.js`, then `gamification.js`'s backup half, then `runtime-content-loader.js`. Baseline 921 passed, 0 failed. Now **922 passed, 0 failed**.

## Files reviewed with no bug found
- `app-shell.js` — pure DOM/nav-building code (script URL, `location.pathname`, tab config). No JSON parsing or untrusted-shape input; nothing to hardening-sweep.
- `splash.js` — pure DOM/timing code (script URL, `sessionStorage` flag). Same: no untrusted data shape.
- `runtime-content-loader.js` — already probed clean by Agent 203 (`levelOf`/`load` already guard with `String(value||'')`, `typeof entry.file !== 'string'`, etc.). Re-checked with `null`/array/boolean/own-`toString` manifest entries and reserved-name ids; no new issue found.

## Bug found + fixed

### gamification.js — backup/restore section validators
`validProgressEntry`, `validateGamification`, `validateSkillMastery`, `validateReviewScheduling`, `validatePlacement`, `validatePlacementPending`, `validateOrientation`, and `normalizeBackup`'s schema-version check all gated numeric fields with a bare `Number(x)`. `Number(true)` / `Number([5])` / `Number([])` are `1` / `5` / `0`, so an **uploaded backup file** (the one real untrusted-JSON entry point into this module, via `installBackupUi`'s file reader -> `JSON.parse` -> `restoreBackup`) could carry a boolean or a single-item/empty array in place of any numeric field — `xpTotal`, `best`, `question_count`, `score`, the schema `version` itself, etc. — and still pass validation. `restoreBackup` then wrote that exact non-numeric value straight into `localStorage` via `JSON.stringify(value)`, corrupting the live learner state (e.g. `xpTotal` becoming the array `[999999999]`, which `getState()`'s own `Number(v)` coercion then reads back as a "valid" `999999999`).

This is the identical bug class Agent 204 found and fixed in `runtime-v2-adapter.js` and `canonical-metadata.js`. Fixed with a `strictNum(value)` helper (only a real number or a non-blank numeric string counts; everything else — including arrays and booleans — becomes `NaN`, which every existing `isFiniteNumber(...)` / `Number.isInteger(...)` check downstream already rejects) and applied it everywhere `Number(x)` was gating a backup-restore field.

Not touched (out of this file's scope, same bug pattern present but flagged, not fixed): `learner-state.js`'s `validateProgress`/`validateGamification`/`validateSkillMastery`/`validateReviewScheduling`/`validatePlacement` use the identical bare-`Number(x)` pattern. This module validates state already sitting in `localStorage` (not a direct file-upload boundary), so it's lower urgency than the backup-import path, but it's the same class of bug and worth a pass.

## Tests: 921 -> 922 (+1)
New test in the existing "gamification.js: backup / restore (Agent 159)" section: `validateBackup / restoreBackup: a boolean or single-item array standing in for a number is rejected, not silently coerced (Agent 205 fix)` — covers `xpTotal`, `streak`, `progress.best`/`attempts` (including the `Number([])===0` in-range trap), `skillMastery.question_count`/`correct_count`, `reviewScheduling.interval_days`, `placement.score`, `placementPending.primary_score`, `orientation.answers` entries, the backup envelope's own `version` field, and an end-to-end `restoreBackup` check that a poisoned `xpTotal` array never reaches storage.

## Mutation sweep (same criterion as Agent 203/204: core.zip identity FAIL ignored, any other FAIL / stderr / crash / timeout = killed)
Single-file sweep of `gamification.js` only (operators: `===`/`!==`/`==`/`!=`/`<`/`<=`/`>`/`>=` swaps, `true`/`false` flips, `Math.max`/`min` swaps; syntax-checked with `vm.Script` before running; each mutant run under a hard OS-level `timeout -k 5 20` in addition to the node-side timeout, after an earlier attempt without the OS-level timeout stalled indefinitely on a hung child process).
- gamification.js: **293 runnable mutants -> 293 killed, 0 survived.** No equivalent/dead mutants to record for this file.

Not swept this pass (no untrusted-shape bug found, but not mutation-tested either — they don't process untrusted data shapes so a mutation sweep would mostly measure DOM-wiring/CSS-string coverage rather than validation logic): `app-shell.js`, `splash.js`, `runtime-content-loader.js`.

## Cache / pack
`gamification.js` is a core-pack file -> `sw.js` `CACHE_VERSION` `mylingo-v26` -> `mylingo-v27` (pin test updated); `offline/packs/core.zip` rebuilt from ALL on-disk sources (same member order / metadata; `unzip -t` clean; identity test passes).

## Files changed vs Agent 204 zip
`shared/js/gamification.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `HANDOFF_AGENT_205.md`.

## Not done / carried forward
- `learner-state.js`: same bare-`Number(x)` coercion bug class as the one fixed here, in `validateProgress`/`validateGamification`/`validateSkillMastery`/`validateReviewScheduling`/`validatePlacement` — not yet fixed. Lower urgency than the backup-import path (reads back its own `localStorage`, not a direct upload boundary) but genuinely the same defect.
- `gamification.js`'s non-backup half (the pure XP/streak functions and the `getState`/`recordSession`/`reset` storage-backed API, lines ~1-215) was not re-swept this pass; only the backup/restore section (~217-700) was in scope and covered.
- Carried forward unchanged from Agent 204: decision-gated backlog (items 1, 2, 10, 17, 19, 21-29, 35 from Agent 203's list); `normalizeQuestion`/`normalizeQuiz`/`normalizeHierarchy` throwing on any single malformed question (product/refactor call); Pages' duplicate `readProgress` copies (refactor call); observations left alone (`calculateSkillProfile` unanswered-as-0%, `resolvePlacement`/`calculateResult` treating `complete: 0 | null | 'false'` as complete, `normalizeLevel(' b1')` is A1, `readStored` not range-checking score, `validatePlacementBlueprint`/`recommendations.validateProfile` tautologies).
- Still verified only with the OLD (inflated) criterion, or not swept at all: `app-shell.js`, `splash.js` (reviewed, no untrusted-shape surface — probably don't need a sweep, but flagging since they haven't had one), `gamification.js`'s non-backup half, `learner-state.js` (new item, see above).

## Next agent — start here
1. `learner-state.js`: apply the same `strictNum`-style fix as this pass's `gamification.js` fix to `validateProgress`/`validateGamification`/`validateSkillMastery`/`validateReviewScheduling`/`validatePlacement`, then mutation-sweep the file.
2. `gamification.js`'s non-backup half (`calculateXp`, `daysBetween`, `updateStreak`, `todayStr`, `safeGet`/`safeSet`, `migrateRewardLedger`, `getState`, `recordSession`, `reset`) — probe untrusted shapes first (see recipe below), then mutation-sweep it (the backup/restore half is now fully covered; this half isn't).
3. Decision-gated backlog above; if a product decision arrives, implement it and flip the pin in the same change.
4. If a core-pack file changes: bump `CACHE_VERSION` (now `mylingo-v27`) and rebuild `offline/packs/core.zip` from ALL on-disk sources (python `zipfile`, same member order, keep each `ZipInfo` date/compress type/attrs).

Sweep recipe (same shape as Agent 203/204's, with one addition): copy the tree to a private worker dir and mutate only there; generate mutants from the source with comments/string contents masked (operator flips, numeric ±1, string suffix, `if(cond)` -> true/false, `.trim()`/case-fold removal, `Math.max`/`min`/`trunc`/`floor` swaps); syntax-check each mutant with `vm.Script` before running it; run `node tests/run.js` per mutant and count a mutant as SURVIVED only when the summary reads `N passed, 1 failed` (the identity FAIL) or `N passed, 0 failed`. Validate the runner with an unmutated control first — abort if the control doesn't pass clean. **New this pass:** wrap each per-mutant test run in a hard OS-level `timeout -k <grace> <seconds> node tests/run.js` in addition to (not instead of) `execFileSync`'s own `timeout` option — a bare node-side timeout on an execFileSync call stalled indefinitely on one mutant during this pass with no forward progress for 8+ minutes and had to be killed by hand; the OS-level `timeout` wrapper resolved it and the re-run completed cleanly (293/293 killed, ~9s/mutant). Long sweeps: `(setsid nohup node sweep.js ... &)` survives between tool calls (plain `&` does not), but does NOT survive past the end of an agent turn/response — budget to finish within one turn or expect to lose progress on re-launch. Log progress every N mutants to the log file so a stall is visible immediately rather than discovered after a long silent wait.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call).

## Artifacts
`mylingo-v178-agent205-gamification-backup-hardening.zip`, `HANDOFF_AGENT_205.md`.

## Resume command
"Resume from HANDOFF_AGENT_205.md. You are Agent 206. Continue from 'Next agent — start here'."
