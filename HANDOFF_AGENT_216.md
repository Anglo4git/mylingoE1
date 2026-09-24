# Agent 216 Handoff — placement.js: remaining 10 of 12 `validatePlacementBlueprint` untested-false-path guards confirmed equivalent (Class C now fully swept, 12/12); one candidate outside that class tested and found to be a REAL kill (not equivalent); against the CURRENT 954-test suite; no source or test file changed; 954 tests unchanged

## Context
Continued `HANDOFF_AGENT_215.md`'s "Next agent — start here" instruction #1: sweep the remaining 10 of 12 `if (...) return false;` conditions in `validatePlacementBlueprint` (shared/js/placement.js, ~line 434) for the same untested-false-path class Agent 215 confirmed on 2 of the 12 lines.

## Method (unchanged from Agents 213/214/215)
Hand-apply a candidate mutation, run the full `tests/run.js` suite, check whether the only failure is the `offline/packs/core.zip ... byte-identical` identity check (true false-kill for core-manifest files only), then revert and re-confirm the 954-passed baseline before trying the next candidate. Baseline (954/0) confirmed at session start and re-confirmed after every mutation.

## Findings

### Class C sweep completed — all remaining 10 conditions in `validatePlacementBlueprint` confirmed equivalent (untested false path)
Same root cause Agent 215 identified: the function closes over the real, untouched `PLACEMENT_BLUEPRINT_V2`, and `tests/run.js` only ever asserts the function returns `true` against that real object — the exported copy tests mutate is a `JSON.parse(JSON.stringify(...))` snapshot the validator never sees, so its `false` branch is structurally unreachable. Every line below: **953 passed, 1 failed (identity check only)** → confirmed equivalent, then reverted.

| Line | Original check | Mutation tried (real value stays on the passing side) |
|---|---|---|
| 436 | `b.version !== 2` | `b.version < 2` |
| 437 | `b.levels.join(',') !== LEVELS.join(',')` | `b.levels.length !== LEVELS.length` |
| 438 | `b.orientation.question_count !== 10` | `b.orientation.question_count < 10` |
| 440 | `upper_boundary <= lower_boundary_exclusive` | `upper_boundary <= lower_boundary_exclusive - 100` |
| 441 | `max_adjacent_hops !== 1 \|\| one_pass_only !== true` | dropped the `one_pass_only` conjunct entirely |
| 442 | `high_min_graded <= medium_min_graded` | `high_min_graded <= medium_min_graded - 10` |
| 444 | `min_questions_per_skill !== 2` | `min_questions_per_skill < 2` |
| 445 | `grammar < 1 \|\| vocabulary < 1 \|\| reading < 1` | all three thresholds loosened to `< -10` |
| 446 | `listening !== 0` | `listening > 0` |
| 447 | `!Array.isArray(...) \|\| !....length` | dropped the `Array.isArray` conjunct entirely |

Combined with Agent 215's 2 (`min_graded_questions`, `near_boundary_margin`), **all 12 conditions in `validatePlacementBlueprint` are now confirmed equivalent** — the function's false-return path is entirely untested by the current suite. This closes out Class C for this function; no more candidates remain in it.

### One additional candidate tried (outside Class C) — NOT equivalent, real kill
Per next-agent instruction #2 (scan for more Class A/redundant-reassignment or Class B/redundant-guard instances), tried loosening the compound `if` in `calculate120Placement`'s B1-mastery check:
```js
if (scores.a1 >= ASSESSMENT_120.mastery_threshold && scores.a2 >= ASSESSMENT_120.mastery_threshold && scores.b1 >= ASSESSMENT_120.mastery_threshold) recommended = 'b1';
```
Dropping the `scores.a1 >= ...` conjunct (reasoning it looked redundant given the earlier `if (scores.a1 >= ...) recommended = 'a2';` line) **is a real kill**: `952 passed, 2 failed` — one substantive failure (`calculate120Placement: mastery ladder A1 -> A2 -> B1 at 70%, ceiling B1, unknown levels ignored`) plus the identity check. The suite does cover an a2/b1-mastered-but-a1-not scenario, so this is **not** an equivalent mutant. No further action needed here; noted so nobody re-tries it.

No other Class A/B candidates were found on this pass after reading the full file (`decideAssessmentPath`, `decideVerificationPath`, `decideFromPerformance`, `confidenceFor`, `buildEvidence`, `mergePlacementEvidence`, `calculateEvidenceSkillProfile`, `coverageReport`, `calculateSkillProfile`, `finalizeVerification`, `resolvePlacement`, `validateQuestionMetadata` were all re-read); the remaining logic in those functions is threshold- or branch-tested by the existing suite as far as could be determined by inspection.

All mutations in this session were reverted before finishing. **No source or test file was left changed** (`diff` against Agent 215's zip is empty for `shared/js/placement.js`, confirmed with `diff /tmp/placement.js.orig shared/js/placement.js`).

## Tests: 954 -> 954 (no change; this pass only ran the existing suite against temporary, reverted mutations)

## Cache / pack
No source file changed. `CACHE_VERSION` stays `mylingo-v27`. Full suite confirmed 954 passed / 0 failed with the tree byte-identical to Agent 215's zip.

## Files changed vs Agent 215 zip
None.

## Not done / carried forward
- Item 1(a) backlog progress so far (cumulative across Agents 213-216): 7 of the 10 files touched — runtime-content-loader.js (1/1), skill-mastery.js (1/8), mastery-review-ui.js (1/7), offline-packs-ui.js (1/38), offline-packs.js (1/19), orientation.js (pin claim re-validated), **placement.js (16/51 spot-checked/confirmed: Class C fully swept at 12/12, plus 2 Class A + 1 Class B + 1 tried-and-rejected candidate this session and last)**. **Still untouched this backlog:** recommendations.js (13), review-scheduler.js (16), runtime-v2-adapter.js (12), the remaining 35 of placement.js's 51 (Class C exhausted — remaining count needs fresh candidates from Class A/B or a new class, found by reading rather than a known reusable pattern), the remaining 7 of skill-mastery.js's 8, 6 of mastery-review-ui.js's 7, 37 of offline-packs-ui.js's 38, 18 of offline-packs.js's 19.
- Same limitation as Agents 213/214/215: no access to the original per-file handoff text (203/204/207/208/209/210) this session; verification continues from first principles rather than re-reading the original arguments.
- Decision-gated backlog: unchanged (see Agent 203/210/211/212/213 notes for the full list).
- `tools/mutate.js` still not checked into the shipped tree (Agent 212's suggestion, still open).

## Next agent — start here
1. **placement.js's Class C is exhausted** (12/12 confirmed). The remaining 35 equivalents on this file need a fresh read for Class A (redundant post-init reassignment) and Class B (guard clause implied by an earlier branch) instances, or a new class entirely — no more shortcut sweeps available on this function. Read `decideFromPerformance`, `confidenceFor`, `mergePlacementEvidence`, `coverageReport`, `calculate120Placement` closely; the `calculate120Placement` compound-condition attempt this session was a real kill, so don't re-try dropping AND-clauses there without first confirming with the suite that the specific clause isn't independently exercised (as this session's rejected candidate now documents).
2. If placement.js's remaining equivalents prove slow to find, move to recommendations.js / review-scheduler.js / runtime-v2-adapter.js (12-16 equivalents each) — fresh files, not yet touched at all.
3. Reusable per-file recipe (unchanged): `cp` the file → mutate one candidate with `str_replace`/python replace → `node tests/run.js` → if the *only* failure is the core.zip identity line (core-manifest files only, check `offline/core-manifest.json`) it's not a real kill, i.e. still equivalent → restore → next candidate. If more than the identity line fails, it's a real kill — not equivalent — revert and move on (as demonstrated this session).
4. If picking up the decision-gated backlog instead, it is unchanged and ready.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call); lack of access to Agents 202-210's original handoff text (noted by Agent 213, still true this session).

## Artifacts
`mylingo-v183-agent216-equivalent-reverify.zip` (byte-identical contents to Agent 215's zip — no source/test changes this pass), `HANDOFF_AGENT_216.md`.

## Resume command
"Resume from HANDOFF_AGENT_216.md. You are Agent 217. Continue from 'Next agent — start here'."
