# Agent 206 Handoff — learner-state.js validator hardening (same bug class as Agent 205); learner-state.js + gamification.js non-backup half both fully mutation-swept, 0 survivors

## Context
Picked up `HANDOFF_AGENT_205.md` "Next agent — start here" items 1 and 2. Baseline 922 passed, 0 failed. Now **932 passed, 0 failed**.

## Bug found + fixed

### learner-state.js — `validateProgress`, `validateGamification`, `validateSkillMastery`, `validateReviewScheduling`, `validatePlacement`
Same bug class Agent 205 found and fixed in `gamification.js`'s backup/restore validators, flagged but not fixed in Agent 205's "Not done / carried forward". All five validators gated numeric fields with bare `Number(x)`. `Number(true)` / `Number([5])` / `Number([])` are `1` / `5` / `0`, so a boolean or a single-item/empty array in place of any numeric field (`xpTotal`, `best`, `question_count`, `interval_days`, `score`, the `skillMastery`/`reviewScheduling` `version` field, ...) passed validation. Unlike `gamification.js`'s backup-import path, this module validates state already sitting in `localStorage` — not a direct file-upload boundary — so any future direct-write bug, or state corrupted by another module, would have been rubber-stamped straight back out through `readLocal` instead of being rejected.

Fixed with the identical `strictNum(value)` helper (only a real number or a non-blank numeric string counts; everything else — arrays and booleans included — becomes `NaN`, which every existing `finite(...)` / `Number.isInteger(...)` check downstream already rejects) and applied it everywhere `Number(x)` was gating a validated field.

## Files reviewed with no bug found
- `gamification.js`'s non-backup half (`calculateXp`, `daysBetween`, `updateStreak`, `todayStr`, `safeGet`/`safeSet`, `migrateRewardLedger`, `rewardKey`, `nonNegFinite`, `getState`, `recordSession`, `reset` — lines ~1-215, flagged unswept by Agent 205). Already hardened by Agent 200's earlier pass: every read from storage goes through `nonNegFinite` (clamps non-finite/negative to 0), `Array.isArray`, or `isPlainObject` before use. The `Number(x)`-style coercions here are intentional graceful-degradation (garbage → 0) on values that are never used as a pass/fail validation gate, not the same bug class as the backup-restore validators — this is not an import boundary, so treating unusual shapes as "0" rather than rejecting outright is the correct behavior, not a hole. No bug found. Now also mutation-swept (see below) to back that up with evidence rather than just judgment.

## Tests: 922 -> 932 (+10)
All new tests added to the existing "learner-state.js (Agent 159)" section, targeted at closing every gap the mutation sweep below found (see next section for how each maps to a specific survivor):
- `validators: a boolean or single-item/empty array standing in for a number is rejected, not silently coerced (Agent 206 fix)` — the direct regression test for the fix itself, covering `best`, `attempts`, `totalQuestions`, `lastAccess`, `xpTotal`, `streak`, `longestStreak`, both `version` fields, `question_count`, `correct_count`, `interval_days`, `interval_hours`, `score`, plus confirming a real numeric string and rejecting a whitespace-only string (`Number('   ')` is `0`, which `.trim()` inside `strictNum` guards against).
- `validateProgress: every 0-lower-bound field accepts exactly 0`
- `validateProgress: every field also rejects a value that fails only its lower bound, and only its upper bound` (inclusive-boundary + single-clause-failure coverage for `latest`/`best`/`current`/`totalQuestions`/`attempts`)
- `validateProgress: level is case-insensitive and the FIRST level ("a1") validates, not just later ones`
- `validateProgress: a non-numeric string field is rejected outright`
- `validateProgress: MAX_KEYS boundary accepts exactly 1000 entries`
- `validateGamification: 0-lower and inclusive-upper bounds ..., and a non-string lastActiveDate is rejected even though it may have a short .length`
- `validateSkillMastery / validateReviewScheduling: 0-lower and inclusive-upper bounds, exactly SKILLS.length (6) skill keys, and accuracy rejects on either bound alone`
- `validatePlacement: score accepts the inclusive 0 and 100 bounds`
- `parse: a valid-JSON string of exactly 250000 chars is not treated as oversize`

## Mutation sweep (same criterion as Agent 203/204/205: core.zip identity FAIL ignored for core-pack files, any other FAIL / stderr / crash / timeout = killed)
Ran in two passes per file: generate → sweep → (if survivors) add targeted tests → regenerate → re-sweep to confirm.

- **learner-state.js** (not a core-pack file, no identity-FAIL exclusion needed): first pass **150 runnable mutants → 104 killed, 46 survived**. All 46 survivors were genuine test-coverage gaps, not equivalent mutants — boundary values (`<=`/`>=`/`<`/`>` sites with no exact-boundary test on either side), redundant-looking `||`/`&&` chains with no single-clause-failure test, a `level('a1')` index-0 case never exercised (existing tests only used `'a2'`/`'b1'`), and `.trim()`/`.toLowerCase()` removal inside `strictNum`/`level`/`skill` with no whitespace-only / uppercase test to catch it. Added the 10 tests above, one test deliberately covering several survivors at once where a single input value kills multiple mutated operators (documented case-by-case while diagnosing, not carried into this file). Regenerated mutants against the updated source and re-swept: **150 runnable mutants → 150 killed, 0 survived.**
- **gamification.js, lines 1-216 only (the non-backup half Agent 205 flagged as unswept; core-pack file, identity-FAIL exclusion active)**: **66 runnable mutants → 66 killed, 0 survived.** No test additions needed — this half was already fully covered by the existing test suite.

Sweep tooling (not committed — lives outside the app tree, same as prior agents' recipe): a syntax-checked (`vm.Script`) single-operator-flip generator (`===`/`!==`/`<`/`<=`/`>`/`>=`/`||`/`&&` swaps, `true`/`false` flips, `Math.max`/`min` swaps, `.trim()`/`.toLowerCase()` removal — comments and string literals masked out of candidate sites) plus a new optional line-range filter so a specific section of a larger file can be swept in isolation without disturbing already-covered sections; and a runner that restores the original file at the end regardless of outcome, wraps each per-mutant `node tests/run.js` in `timeout -k 5 <seconds>`, and — new this pass — accepts an `--ignore-core-zip-identity` flag so core-pack-file sweeps don't need a bespoke result-parsing pass: a summary of exactly `N passed, 1 failed` is only treated as a non-kill when that one failure is by name the core.zip identity test, everything else (any other single failure, or more than one) counts as killed. Ran via `(setsid nohup node run_sweep.js ... &)` per the existing recipe; both sweeps completed within their launching turn.

## Cache / pack
No core-pack file changed this pass (`learner-state.js` is not in `offline/core-manifest.json`; `gamification.js` was reviewed and mutation-swept but not modified). `sw.js` `CACHE_VERSION` stays `mylingo-v27`; `offline/packs/core.zip` untouched and still passes its byte-identity test.

## Files changed vs Agent 205 zip
`shared/js/learner-state.js`, `tests/run.js`, `HANDOFF_AGENT_206.md`.

## Not done / carried forward
- Decision-gated backlog (items 1, 2, 10, 17, 19, 21-29, 35 from Agent 203's list, carried unchanged since): `normalizeQuestion`/`normalizeQuiz`/`normalizeHierarchy` throwing on any single malformed question (product/refactor call); Pages' duplicate `readProgress` copies (refactor call); observations left alone (`calculateSkillProfile` unanswered-as-0%, `resolvePlacement`/`calculateResult` treating `complete: 0 | null | 'false'` as complete, `normalizeLevel(' b1')` is A1, `readStored` not range-checking score, `validatePlacementBlueprint`/`recommendations.validateProfile` tautologies).
- Still not mutation-swept at all: `app-shell.js`, `splash.js` (Agent 205 judged these have no untrusted-shape surface worth a sweep — pure DOM/nav-building code, no JSON parsing).
- `runtime-content-loader.js`: re-verified clean by Agent 205, not re-swept this pass (out of this pass's scope).

## Next agent — start here
1. Everything Agent 205 and this pass identified as needing hardening or a sweep is now done. No specific file is flagged as the obvious next target — the next agent should pick a re-verification target using the same highest-value-first logic Agent 204/205 used (a file that handles untrusted input shapes and hasn't had a *mutation-tested* pass yet, not just a manual review), or work the decision-gated backlog if a product decision has arrived.
2. If a core-pack file changes: bump `CACHE_VERSION` (currently `mylingo-v27`) and rebuild `offline/packs/core.zip` from ALL on-disk sources (python `zipfile`, same member order, keep each `ZipInfo` date/compress type/attrs).
3. Decision-gated backlog above; if a product decision arrives, implement it and flip the pin in the same change.

Sweep recipe (same shape as Agent 203/204/205's, with one addition): copy the tree to a private worker dir and mutate only there; generate mutants from the source with comments/string contents masked (operator flips, `true`/`false` flips, `Math.max`/`min` swaps, `.trim()`/`.toLowerCase()` removal); syntax-check each mutant with `vm.Script` before running it; run `node tests/run.js` per mutant and count a mutant as SURVIVED only when the summary reads `N passed, 1 failed` (the identity FAIL, core-pack files only) or `N passed, 0 failed`. Validate the runner with an unmutated control first — abort if the control doesn't pass clean. **New this pass:** the generator now accepts an optional `<startLine>-<endLine>` argument to restrict mutation sites to one section of a larger file (useful when only part of a file needs (re-)sweeping, as with `gamification.js`'s non-backup half here); the runner now accepts `--ignore-core-zip-identity` and checks the failing test's name directly (`FAIL - offline/packs/core.zip contains exactly the manifest files, byte-identical to source`) rather than assuming any single failure is the identity one — a real bug that happens to produce exactly one other failure will still be counted as killed correctly. Wrap each per-mutant test run in `timeout -k <grace> <seconds> node tests/run.js` (an OS-level timeout, not just `execFileSync`'s own) — Agent 205 hit an indefinite stall without this. Long sweeps: `(setsid nohup node sweep.js ... &)` survives between tool calls (plain `&` does not), but does NOT survive past the end of an agent turn/response — budget to finish within one turn or expect to lose progress on re-launch; both sweeps this pass (150-mutant and 66-mutant) completed comfortably within a turn at ~4s/mutant of this now-932-test suite. Log progress every N mutants (and always on a survivor) to the log file so a stall or a real gap is visible immediately.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call).

## Artifacts
`mylingo-v179-agent206-learner-state-validator-hardening.zip`, `HANDOFF_AGENT_206.md`.

## Resume command
"Resume from HANDOFF_AGENT_206.md. You are Agent 207. Continue from 'Next agent — start here'."
