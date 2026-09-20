# Agent 202 Handoff — recommendations.js + mastery-review-ui.js: hardening, direct unit coverage, corrected mutation sweeps

## Context
Picked up `HANDOFF_AGENT_201.md` "Next agent — start here" item 2 (re-verify old sweeps of core-pack modules, probing untrusted shapes first). Baseline: 846 passed, 0 failed.
`learner-state.js` is NOT in `offline/core-manifest.json`, so its old sweep is sound (the core.zip false-kill only affects core-pack files) — skipped. Core-pack shared/js files: app-shell, canonical-metadata, course-progress, gamification, level-lock, mastery-review-ui, offline-packs-ui, offline-packs, orientation, placement, recommendations, review-scheduler, runtime-content-loader, runtime-v2-adapter, safe-url, skill-mastery, splash.
Sweeps use the corrected criterion (core.zip identity FAIL ignored).

## Bugs found + fixed
1. **recommendations.js** — `Number(counts[skill]) || 0` let a `skill_counts` value of the string `"Infinity"` through, so `recommendSkillLevels` returned `question_count: Infinity` (null once serialised). Non-finite counts are now 0 (the skill is skipped).
2. **mastery-review-ui.js `compute()`** — `now: null | '' | false | []` was taken as the epoch (`Number(null) === 0`), so nothing was ever "due". Agent 180 had PINNED this ("PINNED: null and \"\" are taken as the epoch"); that pin is FLIPPED here (same class as Agent 201's scheduler fix, which the UI bypassed by pre-coercing). Only a real number or a non-blank numeric string is an explicit time; anything else = `Date.now()`; explicit `0` and `'1000'` still honoured.
3. **mastery-review-ui.js render()** — the "Priority skill" KPI wrote `labelForSkill(summary.weakest)` UNESCAPED into innerHTML. Unreachable through `mount()` (skill names come from the sanitised store), but `compute()`/`render()` accept raw stores. Now `esc(...)`.

## Tests: 846 -> 851 (+5, plus the flipped Agent 180 test extended)
- New section "recommendations.js: direct unit coverage from a corrected mutation sweep (Agent 202)" (own vm sandbox): non-finite counts, exact CATEGORY_BY_SKILL / band labels / RULES and export copies, lower-neighbour-first catalog fallback, `resolveQuizPicks` grouping / dedupe / field carry-through (4 tests).
- Inside the Agent 180 mastery-review-ui section: one test covering all five escaped characters (via a plain-object target that keeps the raw markup), empty `{}` stores, null accuracy -> "limited evidence", missing `due_at` -> "now", due-row card, null-accuracy sort order, default confidence, title text; the `options.now` test now asserts the flipped behaviour (null / '' / '  ' / false / [] -> real clock; 0 and '1000' honoured).

## Mutation sweeps
- recommendations.js: 116 mutants -> 103 killed, 13 equivalent survivors.
- mastery-review-ui.js: 106 mutants -> 99 killed, 7 equivalent/degenerate survivors.
Sources confirmed byte-identical to the fixed versions after each chunk.

### Equivalent survivors (do not chase)
- recommendations.js: `normalizeLevel` `> 0` (a1 falls to the a1 default anyway) ; `validLevel` `String(level)` vs the null guard; the dead initial `label = 'Practice at your level'` (every score >= 60 reaches an else-if branch that overwrites it); `profile.skills` / `profile.skill_counts` truthy-vs-object guards (string/array/number have no such props); `score == null` guard (`numericScore(null)` is already null); `resolveQuizPicks` `typeof recommendation !== 'object'` (primitives yield no level -> no list); `Number(x) || 0` before the new finite check; `validateProfile` is a TAUTOLOGY — every recommendation `recommendSkillLevels` produces already has a known skill, a valid level, a finite score and question_count >= 2, so its `max_recommendations`, skill, level, score and count checks can never fail (it returns true for every input). Not changed; callers relying on it get no validation. Flag for a product/refactor decision.
- mastery-review-ui.js: `esc(null)` (never called with null), `bandLabel` `!skillData` (callers pass `{}`), `dueReason` `skillData &&` (callers pass `{}`), `compute` passing raw stores to `buildSummary` (it defaults them itself), `render` `compute(model || {})` (compute defaults itself), `level.toLowerCase()` (upper-cased right after), and a one-sided sort-comparator mutant (`compute-101`, engine-order dependent).

## Cache / pack
recommendations.js and mastery-review-ui.js are core-pack files -> `sw.js` `CACHE_VERSION` `mylingo-v23` -> `mylingo-v24` (pin test updated); `offline/packs/core.zip` rebuilt from ALL on-disk sources (same member order/metadata; `unzip -t` clean; identity test passes).

## Files changed vs Agent 201 zip
`shared/js/recommendations.js`, `shared/js/mastery-review-ui.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `HANDOFF_AGENT_202.md`.

## Not done / carried forward
- Core-pack modules still verified only with the OLD (inflated) criterion: placement.js (492 lines), orientation.js, offline-packs.js, offline-packs-ui.js, runtime-content-loader.js, runtime-v2-adapter.js, safe-url.js, canonical-metadata.js, app-shell.js, splash.js. gamification.js's backup/restore half (`validateBackup`/`buildBackup`/`restoreBackup`/`installBackupUi`, ~lines 209-690) is also unswept.
- Decision-gated backlog unchanged: items 1, 2, 10, 17, 19, 21-29, 35. New flag: `recommendations.validateProfile` is a tautology (above). Pages' duplicate `readProgress` copies remain a refactor call.

## Next agent — start here
1. Decision-gated backlog above; if a product decision arrives, implement it and flip the pin in the same change.
2. Continue the re-verification, highest value first: `placement.js` (scoring numbers users see), `safe-url.js` (security boundary), `runtime-content-loader.js` / `runtime-v2-adapter.js`, `orientation.js`, then gamification.js's backup half. Probe untrusted shapes first (`null`, numbers, "Infinity", negatives, arrays, primitives inside objects, `timestamp/now: null`) — this has found a real bug in each of the last five files.
3. If a core-pack file changes: bump `CACHE_VERSION` (now `mylingo-v24`) and rebuild `offline/packs/core.zip` from ALL on-disk sources.
Sweep recipe: ignore the core.zip identity FAIL; chunk each run to <= ~45 mutants per tool call; `diff` the source against a saved copy after every chunk; re-check each survivor individually; beware one-sided mutants of symmetric code (they can be inconsistent comparators and survive spuriously).

## Blockers
Product decisions for the DECISION backlog; a real device for item 17.

## Artifacts
`mylingo-v175-agent202-recommendations-review-ui-hardening.zip`, `HANDOFF_AGENT_202.md`.

## Resume command
"Resume from HANDOFF_AGENT_202.md. You are Agent 203. Continue from 'Next agent — start here'."
