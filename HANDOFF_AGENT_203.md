# Agent 203 Handoff — placement.js + safe-url.js + orientation.js: untrusted-shape hardening, direct unit coverage, corrected mutation sweeps

## Context
Picked up `HANDOFF_AGENT_202.md` "Next agent — start here" item 2 (re-verify old sweeps of core-pack modules, probing untrusted shapes first): `placement.js` (scoring numbers users see), `safe-url.js` (security boundary), then `orientation.js`. Baseline 851 passed, 0 failed. Now **877 passed, 0 failed**.
`runtime-content-loader.js` was probed only (no untrusted-shape bug; see "Not done").

## Bugs found + fixed
### placement.js
1. `adjacentLevel(level, direction)`: a string direction concatenated (`'b1' + '1'` -> `'21'` -> C2); missing / NaN / fractional directions indexed `LEVELS` out of range (`undefined`). Only a finite number moves (truncated to whole steps); everything else stays put.
2. `graded_questions` (resolvePlacement / calculateResult / confidenceFor / decideFromPerformance): `Infinity` / `"Infinity"` passed `Number(x) || 0`, giving "high" confidence and `Infinity` in the result (null once serialised); negatives were kept. New `count()`: finite and > 0 else 0 (calculateResult falls back to the non-banner question count).
3. `calculateResult().timestamp`: `Infinity` / negatives stored. Finite > 0 (or numeric string) else `Date.now()`.
4. Stage: it is the URL parameter `?stage=`. `resolvePlacement` treated ANY non-"primary" stage as verification (a boundary score finished as `verification_upper_edge` instead of asking for the boundary check) and `buildEvidence` stamped the junk value on every evidence entry / `evidence_stages`. Now only `verification` (any case) is verification; anything else is primary. `mergePlacementEvidence` keeps only real stages.
5. `mergePlacementEvidence`: `byId = {}` made ids like `constructor` / `toString` / `__proto__` "already seen" -> TypeError (or prototype rewiring); now a null-prototype map. Also: question id `0` was dropped, `quiz_ids: [null]` became the string `"null"`, stages/skills were not cleaned, a duplicate first sighting was not de-duplicated. New helpers `idString` / `skillOf` / `normalizeStage` / `unique`.
6. `calculate120Placement`: `bands['__proto__']` / `['constructor']` was truthy, so a bank row with such a level wrote `total = NaN` onto `Object.prototype`. Levels are now checked against the three real bands (and only string `placement_level` / `cefr`); banners are no longer graded; only a real `true` is correct.
7. `calculateSkillProfile`: null map threw; truthy non-booleans (`"false"`, `1`) counted as correct (buildEvidence only trusts booleans); banners carrying a skill were counted.
8. Banner detection is one shared `typeOf()` (lower-case, separators folded) for the graded-count fallback, buildEvidence, coverageReport, calculateSkillProfile and calculate120Placement (the fallback compared the RAW type, so `"BANNER"` was graded).
9. `readStored`: `Number(null|''|false|[])` is 0, so a record with a null / blank / boolean score read back as valid. Score must now be a real number or non-blank numeric string (finite).
10. `validateQuestionMetadata`: `true`, `[30]`, `['grammar']`, `['a1']` passed through `Number()` / `String()`. skill / cefr must be strings; difficulty / time real numbers or numeric strings.
11. `calculateResult(null|undefined)` returned `complete: undefined` (key lost in JSON); now a boolean (`false` for no input). `assessment_quiz_ids` are cleaned (strings / numbers, trimmed, blanks dropped).
12. Percentages (`score`, `primary_score`, `verification_score`): new `pct()`: real number / numeric string, junk 0, out-of-range and `Infinity` clamp (unchanged for finite values, `true` / `[95]` are now 0 instead of 1 / 95).

### safe-url.js
13. `isSafeMediaUrl`: the URL parser removes every ASCII tab / CR / LF and strips leading + trailing C0 controls and spaces, so `'/\t/evil.com'`, `'/\n/evil.com'`, `'\u0001//evil.com'`, `'/\t\\evil.com'` resolved off-host (protocol-relative) while slipping past the module's own `//` / backslash block. The scheme and `//` checks now run on the same text the parser sees (the URL itself is still parsed from the raw string). `isSafeRedirect` needed no change (probed: only `./` and `../` prefixes, nothing resolves off-origin).

### orientation.js
14. `answerValue`: `true` / `false` / `[]` / `[2]` were answers (Number() gave 1 / 0 / 0 / 2). Only a real number or non-blank numeric string is an answer now.
15. `levelFromScore(NaN | undefined | junk)` returned `undefined` (`LEVELS[NaN]`); junk is 0 (A1).
16. `writeState(undefined | function)` stored the string `"undefined"` and returned true; now returns false and writes nothing.

## Tests: 851 -> 877 (+26)
New sections (each in its own `vm` context; cross-realm values compared via JSON):
- "placement.js: untrusted shapes + direct unit coverage from a corrected mutation sweep (Agent 203)" — adjacentLevel, percentages, graded counts, banner normalisation, calculateResult(null), timestamp, stage, reserved-name ids + prototype-pollution checks (in the vm realm's own `Object.prototype`), id / quiz-id / stage / skill cleaning, buildEvidence, calculateSkillProfile, calculate120Placement, readStored, validateQuestionMetadata, exact thresholds (evidence 5, 85 / 50, 2-decimal rounding, verification edges), finalizeVerification, coverageReport, evidence de-duplication, exported constants / blueprint / API surface.
- "safe-url.js + orientation.js: untrusted shapes (Agent 203)" — parser-normalised protocol-relative forms (each also asserted to REALLY resolve off-host), non-strings, redirect prefixes, unparseable URLs, CommonJS branch; orientation answers, levelFromScore, writeState, and a SHA-256 pin of the whole QUESTIONS text (change the copy -> update the hash in the same change).
- `sw.js` pin test updated to `mylingo-v25`.

## Mutation sweeps (corrected criterion: core.zip identity FAIL ignored, any other FAIL / stderr / crash / timeout = killed)
Sweeps ran on a COPY of the tree in `/tmp/sweep` (never mutate the real source; a killed process cannot leave it mutated).
- placement.js: 713 mutants -> 625 killed first pass; the 88 survivors were re-run after the new tests -> 51 survivors, all equivalent / dead (below).
- safe-url.js: 41 mutants -> 37 killed, 4 equivalent.
- orientation.js: 178 mutants; 63 in the QUESTIONS literal (now covered by the hash pin, not swept individually); 115 swept -> 98 killed, 17 survivors (6 first-question strings killed by the pin afterwards, 11 equivalent).

### Equivalent / dead survivors (do not chase)
- placement.js: ~36 in `validatePlacementBlueprint` (its guards check module constants that are always valid — a TAUTOLOGY like `recommendations.validateProfile`; flag for a product / refactor call); `normalizeLevel` `>= 0` (a1 falls to the a1 default); `count()` `n > 0` vs `>= 0` (0 either way); `scoreBand` loop bound and the unreachable last-band fallback (min 0 always matches); verification `reason` line `85 -> 84` (only reachable inside the `>= 85 || < 50` block); `typeOf` default `'radio'`, `decideAssessmentPath` default `'medium'` and `!== 'high'` string, `margin` `'clear'` (only compared to one literal); `readStored` `!raw` and `!value ||` guards (every path returns null); `'use strict'`.
- safe-url.js: the dead `!parsed.protocol || raw.charAt(0) === '/'` branch (protocol is never empty; a `/`-prefixed value always resolves to https) x2, the base URL string, `'use strict'`.
- orientation.js: `placementUrl` `>= 0` / `0 -> 1` (a1 is the default anyway); `confidence` `ratio < 0.2` / `> 0.85` (scores are multiples of 0.25 over MAX 42, so the exact ratios are unreachable); `levelFromScore` clamp upper bound and NaN -> 1 (the outer `Math.min` / A1 band absorb them); `recommendation` clamp upper bound and `MAX_SCORE ? :` guard; `raw === null` skip (adds 0 anyway); `'null'` parse default; `'use strict'`.

## Cache / pack
placement.js, safe-url.js, orientation.js are core-pack files -> `sw.js` `CACHE_VERSION` `mylingo-v24` -> `mylingo-v25` (pin test updated); `offline/packs/core.zip` rebuilt from ALL on-disk sources (same member order / metadata; `unzip -t` clean; identity test passes).

## Files changed vs Agent 202 zip
`shared/js/placement.js`, `shared/js/safe-url.js`, `shared/js/orientation.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `HANDOFF_AGENT_203.md`.

## Not done / carried forward
- Core-pack modules still verified only with the OLD (inflated) criterion: offline-packs.js, offline-packs-ui.js, runtime-content-loader.js (probed only: no untrusted-shape bug; contrived cache-key collision — id `'x|'` + explicitFile `'y'` shares the key of id `'x'` + explicitFile `'|y'`, not reachable from shipped callers), runtime-v2-adapter.js (351 lines), canonical-metadata.js, app-shell.js, splash.js. gamification.js's backup/restore half (`validateBackup` / `buildBackup` / `restoreBackup` / `installBackupUi`, ~lines 209-690) is also unswept.
- Observations left alone (product calls): `calculateSkillProfile` (the calculateResult fallback when there is no evidence) scores unanswered questions as 0% instead of null; `resolvePlacement` / `calculateResult` treat `complete: 0 | null | 'false'` as complete (only an explicit `false` is incomplete); `normalizeLevel(' b1')` is A1 (pinned by Agent 165); `readStored` does not range-check the score; `validatePlacementBlueprint` and `recommendations.validateProfile` are tautologies.
- Decision-gated backlog unchanged: items 1, 2, 10, 17, 19, 21-29, 35. Pages' duplicate `readProgress` copies remain a refactor call.

## Next agent — start here
1. Decision-gated backlog above; if a product decision arrives, implement it and flip the pin in the same change.
2. Continue the re-verification, highest value first: `runtime-v2-adapter.js`, `canonical-metadata.js`, `offline-packs.js` / `offline-packs-ui.js`, then gamification.js's backup half, then app-shell.js / splash.js. Probe untrusted shapes first (`null`, numbers, "Infinity", negatives, arrays, booleans and primitives inside objects / arrays, ids named `constructor` / `__proto__`, URL-parameter-sourced strings, `timestamp/now: null`) — this has found a real bug in each of the last six files.
3. If a core-pack file changes: bump `CACHE_VERSION` (now `mylingo-v25`) and rebuild `offline/packs/core.zip` from ALL on-disk sources (python `zipfile`, same member order, keep each `ZipInfo` date / compress type / attrs).
Sweep recipe: copy the tree to `/tmp/sweep` and mutate only there; generate mutants from the source with comments / string contents masked (operator flips, `&&`/`||`, `true`/`false`, numeric +-1, string suffix, `if(cond)` -> true/false); run `node tests/run.js` per mutant, kill the child as soon as a non-core.zip `FAIL` line appears, and count a mutant as SURVIVED only when the summary reads `N passed, 1 failed` (the identity FAIL). Validate the runner with an unmutated control first. Long sweeps: `(setsid nohup node sweep.js ... &)` survives between tool calls (plain `&` does not). Re-check each survivor individually after adding a test; beware one-sided mutants of symmetric code.

## Blockers
Product decisions for the DECISION backlog; a real device for item 17.

## Artifacts
`mylingo-v176-agent203-placement-safe-url-orientation-hardening.zip`, `HANDOFF_AGENT_203.md`.

## Resume command
"Resume from HANDOFF_AGENT_203.md. You are Agent 204. Continue from 'Next agent — start here'."
