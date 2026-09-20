# Agent 201 Handoff — skill-mastery.js + review-scheduler.js hardening, direct unit coverage, corrected mutation sweeps

## Context
Picked up `HANDOFF_AGENT_200.md` "Next agent — start here" item 2 (skill-mastery.js / review-scheduler.js, probing untrusted-storage shapes first). Baseline: 834 passed, 0 failed.
Sweeps use the CORRECTED kill criterion from Agent 200 (the core.zip identity FAIL is ignored; only other FAIL lines or a crash count).

## Bugs found + fixed (all from probing hostile stored data / odd inputs)
1. **"Infinity" counters (both modules).** `Math.floor(Number(x) || 0)` lets the string `"Infinity"` through as Infinity; `JSON.stringify` then writes it as `null` (silent data loss). skill-mastery `question_count` / `correct_count` / `attempt_count` / every `level_counts` value, and review-scheduler `consecutive_successes`, now go through `countOrZero()` (finite, non-negative integer, else 0).
2. **`timestamp` / `now` of null, '', '  ', false, [] meant 1970 (both modules).** `Number.isFinite(Number(x))` accepts anything whose `Number()` is 0. Same class as Agent 158's stored-value fix but on the INPUT side: `recordAttempt({timestamp: null})` stamped `last_review_at: 0` and `due_at` in 1970 (a review card "due since 1970"); `isDue(card, null)` / `getDueSkills(store, null)` compared against 0 so nothing was ever due. New `timeOrNow()`: only a real number or a non-blank numeric string counts; everything else -> `Date.now()`. An explicit `0` and numeric strings (`'5'`) are still honoured. (Callers were not audited for what they pass; quiz.html passes real timestamps, so this was latent.)
3. **review-scheduler card `last_accuracy` non-numeric ('abc', {}) became NaN** (serialised as null), which made `validateStore()` fail — and the learner-backup validator (`validateReviewScheduling`) rejects the WHOLE section on a failed store, so one odd card dropped all review data from a backup. Now `null`.

## Tests: 834 -> 846 (+12)
New section "skill-mastery.js + review-scheduler.js: untrusted counters / timestamps + direct unit coverage (Agent 201)" in `tests/run.js` (before the Agent 200 gamification section; own `vm` sandbox per module, cross-realm values compared through `JSON.parse(JSON.stringify(x))` — `deepStrictEqual` on sandbox arrays/objects fails on prototype identity). 12 tests: counter sanitising + JSON round trip; timestamp handling for both modules; recordAttempt eligibility rules (tagged, non-banner, boolean result, once-per-skill attempts, level/quiz-id normalisation and retention); mastery bands / confidence thresholds / export copies; store boundary (versions, shapes, throwing storage, validateStore, recordAndPersist); isDue / getDueSkills / getNextReview; card sanitiser rules (accuracy clamp/round, legacy days, hour caps, ids, levels); interval maths (all band edges, history reset, doubling + 30-day cap, streak bookkeeping, per-skill isolation); plus one "sweep survivors" test per module.

## Mutation sweeps (corrected criterion)
- skill-mastery.js: 94 mutants -> 86 killed, 8 equivalent survivors (after adding tests for 14 real survivors).
- review-scheduler.js: 138 mutants (+1 checked by hand, killed) -> 122 killed, 16 equivalent survivors (after adding tests for 26 real survivors).
Source files confirmed byte-identical to the fixed versions after every sweep (`diff` against a saved copy).

### Equivalent survivors (do not chase)
- skill-mastery.js: `masteryBand` clamp upper bound 90 (>=90 is already the top band); `if (!raw)` vs `typeof raw !== 'object'` in sanitizeSkill (primitives have no such props); `raw.level_counts` / `raw.skills` truthy-vs-object guards (a string yields keys like '0' that never normalise); `readStored` `if (!raw)` (JSON.parse(null) -> null -> empty store); recordAttempt `correctMap` object guard (a string yields non-boolean chars); question_type regex `[\s-]` vs `[\s]` (only compared to 'banner'); `validateStore` `s.version !== VERSION` (sanitiser always returns VERSION).
- review-scheduler.js: `normalizeLevel` `String(level)` vs the null guard ('null' isn't a level); `accuracyBandHours` clamp upper bound 95 and the unreachable `return 336` fallthrough; `sanitizeCard` `!raw` vs typeof guard; legacy-days clamp 100 vs 30 (hours are clamped to 720 right after); `raw.skills` guard; `readStored` `raw ?` guard; `calculateNextIntervalHours`: dropping `prior > 0` from the doubling condition (max(base,0)=base), and the redundant pair `min(720, ...)` inside the doubling vs the final `clamp(base, 6, 720)` (each alone is equivalent); `recordAttempt` correctMap guard and `if (!stats.total)` (total >= 1 always); `validateStore` hour / streak / accuracy range checks (the sanitiser already enforces them, and NaN is now null).

## Cache / pack
skill-mastery.js and review-scheduler.js are core-pack files -> `sw.js` `CACHE_VERSION` `mylingo-v22` -> `mylingo-v23` (pin test updated); `offline/packs/core.zip` rebuilt from ALL on-disk sources (same member order/metadata; `unzip -t` clean; identity test passes).

## Files changed vs Agent 200 zip
`shared/js/skill-mastery.js`, `shared/js/review-scheduler.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `HANDOFF_AGENT_201.md`.

## Not done / carried forward
- gamification.js backup/restore half (`validateBackup` / `buildBackup` / `restoreBackup` / `installBackupUi`, ~lines 209-690) has NOT been mutation-swept.
- Other core-pack modules swept in Agents 158-197 with the OLD (inflated) criterion still need re-verification: mastery-review-ui.js, recommendations.js, placement.js, orientation.js, offline-packs*.js, learner-state.js, runtime-* , safe-url.js, canonical-metadata.js, authoring-*.js, quiz-packer.js, splash.js, app-shell.js (check which are in `offline/core-manifest.json`; only core-pack files were affected by the false-kill effect — a non-core file's mutants are killed only by real tests, so its old sweep is sound).
- Decision-gated backlog unchanged: items 1, 2, 10, 17, 19, 21-29, 35. Pages' duplicate `readProgress` copies remain a refactor call.

## Next agent — start here
1. Decision-gated backlog above; if a product decision arrives, implement it and flip the pin in the same change.
2. Re-verify old sweeps on the core-pack modules listed above, highest-value first: `learner-state.js`, `mastery-review-ui.js`, `recommendations.js`, `placement.js`. Probe untrusted-storage shapes first (`null`, numbers, "Infinity", negatives, arrays, primitives inside objects, `timestamp: null`) — this has found a real bug in each of the last four files.
3. Sweep gamification.js's backup/restore half.
4. If a core-pack file changes: bump `CACHE_VERSION` (now `mylingo-v23`) and rebuild `offline/packs/core.zip` from ALL on-disk sources.
Sweep recipe: ignore the core.zip identity FAIL; chunk each run to finish within one tool call (<= ~45 mutants); `diff` the source against a saved copy after every chunk; re-check each survivor individually after adding a test.

## Blockers
Product decisions for the DECISION backlog; a real device for item 17.

## Artifacts
`mylingo-v175-agent201-mastery-review-hardening.zip`, `HANDOFF_AGENT_201.md`.

## Resume command
"Resume from HANDOFF_AGENT_201.md. You are Agent 202. Continue from 'Next agent — start here'."
