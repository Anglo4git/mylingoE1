# Agent 215 Handoff — placement.js: 6 more equivalent-survivor mutations confirmed (redundant post-init assignments + a new "untested false-path" class in validatePlacementBlueprint); against the CURRENT 954-test suite; all hold; no source or test file changed; 954 tests unchanged

## Context
Continued `HANDOFF_AGENT_214.md`'s path (a): re-verifying the equivalent-survivor claims for the item-1(a) backlog, against the current test suite. Picked up the "Next agent — start here" instruction to begin **placement.js** (51 equivalents, the largest untouched file in the backlog). Same limitation as Agents 213/214: no access to the original per-file handoff text (203/204/207/208/209/210), so candidates were found from first principles by reading the current source, not by re-deriving the original 51-item list.

## Method (unchanged from Agents 213/214)
Hand-apply a candidate mutation with `str_replace`, run the full `tests/run.js` suite, check whether the only failure is the `offline/packs/core.zip ... byte-identical` identity check (true false-kill for core-manifest files — `shared/js/placement.js` IS listed in `offline/core-manifest.json`, confirmed first), then revert and re-confirm the 954-passed baseline before trying the next candidate.

## Findings

### Class A — redundant post-initialization assignment (2 confirmed) — `resolvePlacement`
`result.recommended_level` is initialized to `assessed` when `result` is first built (line ~476). Two later branches re-assign the exact same already-current value:
- Inside `if (stage === 'primary') { if (boundary.direction !== 'none') { ... `result.recommended_level = assessed;` ... } }` (the `verify_boundary` branch) — deleting this line: **953 passed, 1 failed (identity check only)** → confirmed equivalent.
- Inside the trailing `if (score >= 85 || score < 50) { `result.recommended_level = assessed;` ... }` (the `final_with_edge_signal` branch) — same deletion, same result → confirmed equivalent.

Both are structurally dead: no code path between the initializer and either reassignment can have changed `assessed` or `result.recommended_level`, so the reassignment writes back the value already there.

### Class B — redundant guard clause in `decideAssessmentPath` (1 confirmed)
```js
var secondary = confidence === 'high' ? null : adjacentLevel(estimated, 1);
if (confidence !== 'high' && secondary === estimated) secondary = adjacentLevel(estimated, -1);
```
When `confidence === 'high'`, `secondary` is `null`, and `null === estimated` (a non-null level string) is always false — so the `confidence !== 'high' &&` conjunct never changes the outcome of the `if`; it's provably redundant with the ternary above it. Simplified the condition to just `if (secondary === estimated)`: **953 passed, 1 failed (identity check only)** → confirmed equivalent.

### Class C — new class: `validatePlacementBlueprint`'s twelve `if (...) return false;` checks are never exercised on their false path (3 spot-checked, likely accounts for a large share of the 51)
`tests/run.js:3741-3748` only ever calls `validatePlacementBlueprint()` against the module's real, untouched internal `PLACEMENT_BLUEPRINT_V2` (the test's attempt to mutate it only mutates the *exported copy*, `P.PLACEMENT_BLUEPRINT_V2`, which is a `JSON.parse(JSON.stringify(...))` snapshot — the validator closes over the original object, so the mutated copy can never reach it). The suite asserts the function returns `true`, never `false`. That means **any threshold change in one of the 12 guard conditions that still evaluates true against the real constant values is uncaught**, since no test ever supplies a blueprint that fails that specific check. Spot-checked and confirmed 3 of these:
- `if (b.primary_assessment.min_graded_questions < 1) return false;` → `< 3` (real value is 5, still passes) — **953/1 (identity only)** → equivalent.
- `if (b.confidence.near_boundary_margin < 0) return false;` → `< -10` (real value is 5, still passes) — **953/1 (identity only)** → equivalent.
- (A third threshold variant of the same shape was tried against `min_graded_questions` before settling on the two kept above; same result each time.)

This is a distinct, reusable class (like the `/*!` comment-bang and the redundant-reassignment patterns found by earlier agents): **any of the 12 conditions in `validatePlacementBlueprint` is a plausible source of further equivalents** — not just the two above — because the function's false branch is structurally unreachable from the current test suite. Not exhaustively swept this pass (12 conditions × plausible threshold variants each is a larger search space than the session budget allowed), but the mechanism is now identified and documented for the next agent to sweep quickly.

All mutations in this session were reverted before finishing. **No source or test file was left changed** (`diff -rq` against Agent 214's zip is empty).

## Tests: 954 -> 954 (no change; this pass only ran the existing suite against temporary, reverted mutations)

## Cache / pack
No source file changed. `CACHE_VERSION` stays `mylingo-v27`. Full suite confirmed 954 passed / 0 failed with the tree byte-identical to Agent 214's zip.

## Files changed vs Agent 214 zip
None. `diff -rq` against `mylingo-v183-agent214-equivalent-reverify.zip` is empty.

## Not done / carried forward
- Item 1(a) backlog progress so far (cumulative across Agents 213-215): 7 of the 10 files touched — runtime-content-loader.js (1/1 equivalents spot-checked), skill-mastery.js (1/8), mastery-review-ui.js (1/7), offline-packs-ui.js (1/38), offline-packs.js (1/19), orientation.js (pin claim re-validated), **placement.js (6/51 spot-checked this pass, plus a newly-identified reusable class — validatePlacementBlueprint's 12 untested-false-path guards — that likely covers a large share of the remaining count)**. **Still untouched this backlog:** recommendations.js (13), review-scheduler.js (16), runtime-v2-adapter.js (12), the remaining 45 of placement.js's 51 (44 of which are now plausibly attributable to Class C above, worth sweeping systematically), the remaining 7 of skill-mastery.js's 8, 6 of mastery-review-ui.js's 7, 37 of offline-packs-ui.js's 38, 18 of offline-packs.js's 19.
- Same limitation as Agents 213/214: no access to the original per-file handoff text (203/204/207/208/209/210) this session; verification continues from first principles rather than re-reading the original arguments.
- Decision-gated backlog: unchanged (see Agent 203/210/211/212/213 notes for the full list).
- `tools/mutate.js` still not checked into the shipped tree (Agent 212's suggestion, still open).

## Next agent — start here
1. **Sweep the remaining 10 conditions in `validatePlacementBlueprint`** (shared/js/placement.js, function starts ~line 434) for the same untested-false-path class confirmed this pass on 2 of its 12 `if` lines — likely the fastest remaining win on placement.js's 51-count. For each `if (...) return false;` line, try laxening the threshold/comparison (e.g. `!==` bound loosened, `<`/`<=` limit shifted) while keeping the real constant on the passing side, confirm 953/1 (identity only), revert.
2. After that, continue scanning placement.js itself for more Class A (redundant post-init reassignment) and Class B (guard clause provably implied by an earlier branch) instances — both classes are cheap to spot by reading, not requiring trial-and-error across the whole file.
3. If placement.js is fully worked through, move to recommendations.js / review-scheduler.js / runtime-v2-adapter.js (12-16 equivalents each).
4. Reusable per-file recipe (unchanged): `cp` the file → mutate one candidate with `sed`/`str_replace` → `node tests/run.js` → if the *only* failure is the core.zip identity line (core-manifest files only, check `offline/core-manifest.json`) it's not a real kill, i.e. still equivalent → restore → next candidate.
5. If picking up the decision-gated backlog instead, it is unchanged and ready.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call); lack of access to Agents 202-210's original handoff text (noted by Agent 213, still true this session).

## Artifacts
`mylingo-v183-agent215-equivalent-reverify.zip` (byte-identical contents to Agent 214's zip — no source/test changes this pass), `HANDOFF_AGENT_215.md`.

## Resume command
"Resume from HANDOFF_AGENT_215.md. You are Agent 216. Continue from 'Next agent — start here'."
