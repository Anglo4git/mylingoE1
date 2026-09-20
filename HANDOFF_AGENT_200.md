# Agent 200 Handoff — gamification.js untrusted-state hardening + CORRECTED mutation sweeps (gamification, course-progress, level-lock)

## Context
Picked up `HANDOFF_AGENT_199.md` item 2 (probe untrusted storage on the next file). Baseline: 815 passed, 0 failed.

## IMPORTANT correction to Agent 198 / 199 mutation numbers
`offline/packs/core.zip` identity test ("core.zip contains exactly the manifest files, byte-identical to source") FAILS for EVERY mutant of a core-pack file, so a sweep that counts "any failing test" as a kill reports 100% regardless of coverage. The "29/29" (level-lock.js, Agent 198) and "84/84" (course-progress.js, Agent 199) figures were therefore inflated. This turn's sweeps exclude that one test from the kill criterion and count only OTHER `FAIL` lines (or a crash). Re-run results:
- course-progress.js: 84 mutants -> 77 killed, 7 equivalent survivors (see below) after adding 3 tests this turn.
- level-lock.js: 69 mutants -> 65 killed, 4 equivalent survivors after adding 1 test (exact LEVEL_LABEL text, load-guard keeps an existing global, exact "unlocks once you reach it" copy, invalid data-level node fully skipped, static locked card -> position:relative).
- gamification.js: 105 mutants -> 97 killed, 8 equivalent survivors.
**Sweep recipe for future agents:** the sweep script must (a) ignore the core.zip identity FAIL, (b) run in chunks that finish inside one tool call (a killed/backgrounded process leaves the source MUTATED - always `diff` against a saved copy), (c) re-check each survivor individually after adding a test.

## Bugs found + fixed (gamification.js; all from probing a hand-corrupted `mylingo.gamification.v1`)
1. A ledger entry that is a primitive/array (`5`, `"abc"`, `true`, `[1]`) made `recordSession()` throw a strict-mode TypeError on `entry.bestScore = ...`. Now `isPlainObject` guard: treated as a missing entry (a fresh completion record replaces it and pays once; a stored `null` already behaved this way).
2. A counter stored as the string `"Infinity"` survived `Number()`; `JSON.stringify` then wrote it back as `null`, silently wiping the XP total. New `nonNegFinite()` in `getState()` (xpTotal / streak / longestStreak): non-finite or negative -> 0.
3. Negative stored `bestScore` / `improvementBonusXp` inflated the improvement gain or lifted the 20-XP cap (a bonus of -100 allowed 45 XP); a stored bonus above the cap gave a negative `remaining`. Both now go through `nonNegFinite`.
(Also from Agent 199, unchanged here: course-progress.js `progress()` collapses non-objects to `{}`.)

## Tests: 815 -> 834 (+19)
- New section "gamification.js: untrusted stored state + direct unit coverage (Agent 200)" (own `new Function` load per test, fresh storage): getState counter shapes / garbage JSON / throwing storage / history slice / legacy ledger rebuild; primitive ledger entries; "Infinity"; negative counters and ledger fields; improvement branch (string bestScore, equal/lower repeats, improvement-capped, accumulation to the cap); reward identity (trim, default version, blank version, version 2 pays again, blank id / zero total, non-object meta); placement mode; streak-day flags; history cap (checked right after the write); throwing storage + summary field set + reset shape; pure helpers (calculateXp, daysBetween incl. a child node under 3 TZs, updateStreak, todayStr); negative legacy score.
- +3 course-progress tests (rounding not floor, 179/200 = 89.5% completes, courses with non-"published" status skipped, lesson without exercise_quiz_ids does not throw), +1 level-lock test (above).

## Equivalent survivors (no test can distinguish them; do not chase)
- course-progress.js: `read()` fallback variants (`catch -> null`, `|| 'null'`, `read(PROGRESS_KEY, null)`) - `progress()` now normalises non-objects; `read(session, {})` default - `{}` has no status; `fetchAllLessons`/`resolveHomepageState` `String(base)` and fetchAllLessons' default base (only ever called with a string).
- level-lock.js: `String(level || '')` vs `String(level)`; `if(!raw)` guard in read() (JSON.parse(null)/'' -> null/throws -> null); `v && v.level` (TypeError caught -> null); `write()`'s `source || 'manual'` (never called without a source).
- gamification.js: `Math.round` vs `Math.floor` in daysBetween (UTC midnights are exact); `|| '{}'` vs `|| 'null'` in safeGet; migrate `>=` vs `>` (equal score, identical entry); `nonNegFinite` `n >= 0` vs `> 0`; `meta || {}` vs the typeof guard; `Math.max(0, total)` on questionTotal; `ledger = state.rewardLedger` (getState always returns an object); `rewardKey` called with a blank id.

## Cache / pack
gamification.js is a core-pack file -> `sw.js` `CACHE_VERSION` `mylingo-v21` -> `mylingo-v22` (pin test updated); `offline/packs/core.zip` rebuilt from ALL on-disk sources (same member order/metadata, `unzip -t` clean, identity test passes).

## Files changed vs Agent 199 zip
`shared/js/gamification.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `HANDOFF_AGENT_200.md`. (`course-progress.js` and `level-lock.js` unchanged this turn.)

## Not done / carried forward
- gamification.js backup/restore half (validators, `buildBackup`/`restoreBackup`, `installBackupUi`, lines ~209-690) has NOT been mutation-swept; only XP/streak/ledger (lines 21-205) was.
- Not yet swept with the corrected criterion: `skill-mastery.js`, `review-scheduler.js`, and the other core-pack modules Agents 158-197 swept with the old (inflated) criterion - worth re-verifying any that live in the core pack.
- Decision-gated backlog unchanged: items 1, 2, 10, 17, 19, 21-29, 35. Consolidating the pages' duplicate `readProgress` copies remains a refactor call.

## Next agent - start here
1. Decision-gated backlog as above; implement + flip pins if a decision arrives.
2. Re-run earlier sweeps' target files with the corrected criterion (start with skill-mastery.js / review-scheduler.js), probe untrusted-storage shapes first (`null`, numbers, "Infinity", negatives, arrays, primitive values inside objects) - that has found a real bug in each of the last two files.
3. Sweep gamification.js's backup/restore half.
4. If a core-pack file changes: bump `CACHE_VERSION` (now `mylingo-v22`) and rebuild core.zip from ALL on-disk sources.

## Blockers
Product decisions for the DECISION backlog; a real device for item 17.

## Artifacts
`mylingo-v175-agent200-gamification-hardening.zip`, `HANDOFF_AGENT_200.md`.

## Resume command
"Resume from HANDOFF_AGENT_200.md. You are Agent 201. Continue from 'Next agent — start here'."
