# Agent 17 Completion — Placement Blueprint v2

## Delivered

Agent 17 adds an explicit, executable Placement Blueprint v2 on top of the Agent 16 placement engine.

### Blueprint contract
- Added `09_PLACEMENT_BLUEPRINT_V2.md` with the learner flow, evidence thresholds, one-level boundary policy, confidence rules, skill-reporting minimum, persistence keys, compatibility constraints, and non-goals.
- Added `MylingoPlacement.PLACEMENT_BLUEPRINT_V2` as a versioned runtime contract.
- Added `validatePlacementBlueprint()` to guard the key invariants at runtime/tests.

### Decision state machine
- Added `resolvePlacement()` to make placement decisions explicit and machine-readable.
- Primary stage uses the existing 85% upper / below-50% lower boundary policy, but now requires at least 5 graded questions and completion before a boundary check can be requested.
- Verification is deliberately one-pass. A verification score at 85%+ or below 50% does not auto-chain into another CEFR level; it returns the verified level with an explicit edge signal.
- Existing placement helper APIs (`decideFromPerformance`, `finalizeVerification`, etc.) remain available for compatibility.

### Runtime integration
- Updated `site/shared/quiz.html` to use `resolvePlacement()` for both primary and verification placement completion.
- The existing localStorage keys and placement URLs remain unchanged.
- The existing six 10-question placement banks remain unchanged; no source-content repack was performed.

### Tests
- Added `tests/unit/placement-blueprint-v2.test.js` covering blueprint validation, middle-band completion, both boundary directions, insufficient evidence, and the no-cascade verification rule.
- Direct Node VM smoke test — passed.
- `node --check site/shared/js/placement.js` — passed.
- `node --check site/shared/js/orientation.js` — passed.
- All inline JavaScript blocks in `site/shared/quiz.html` — passed syntax check.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'` — 16/16 passed.
- `python3 -m unittest discover -s generation -p 'test_*.py'` — 58/58 passed.
- `python3 build.py validate --input master_source.csv` — 60 rows, 60 quizzes, 0 errors, 0 warnings.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent17-build` — 66 data files written.
- `python3 build.py verify-output --out /tmp/mylingo-agent17-build` — 0 errors, 0 warnings.
- Vitest could not be executed because `node_modules/.bin/vitest` is not installed in the supplied package, matching the package's prior offline limitation.

## Files added
- `09_PLACEMENT_BLUEPRINT_V2.md`
- `tests/unit/placement-blueprint-v2.test.js`
- `AGENT_17_COMPLETION.md`

## Files changed
- `site/shared/js/placement.js`
- `site/shared/quiz.html`
- `HANDOFF.md`

## Do not change
- Existing placement URLs and the six canonical placement quiz IDs.
- Existing localStorage key names.
- Legacy placement helper behavior unless a future milestone explicitly supersedes it.
- `master_source.csv`; no backfill/repack was performed.

## Addendum — Evidence/Confidence formalization

The "Evidence and confidence" section of the blueprint doc described a near-boundary confidence buffer (scores close to but not past the 85/50 boundaries stay capped at medium confidence) that only existed as hardcoded numbers inside `confidenceFor()`, with no direct test coverage of confidence outcomes.

- `PLACEMENT_BLUEPRINT_V2.confidence` now publishes `near_boundary_margin: 5` alongside the existing `high_min_graded`/`medium_min_graded`, so the buffer is a versioned, inspectable contract value instead of a magic number.
- `confidenceFor()` was refactored to compute its bands from `PLACEMENT_BLUEPRINT_V2.confidence`/`primary_assessment` instead of literal thresholds. This is a pure refactor — behavior is identical for every previously-passing case (verified below).
- `validatePlacementBlueprint()` now also checks `high_min_graded > medium_min_graded` and `near_boundary_margin >= 0`.
- `09_PLACEMENT_BLUEPRINT_V2.md` now spells out the low/medium/high bands explicitly, including the near-boundary caution zone (80–84.99% and 50–54.99%) and clarifies that it only affects confidence, never the recommended level.
- Added 12 new tests to `tests/unit/placement-blueprint-v2.test.js`: the published buffer values, each confidence band (high, medium via low evidence, medium via near-upper buffer, medium via near-lower buffer, medium at both boundaries, low via incomplete, low via insufficient evidence, low via conflicting signals), and confidence surfaced through `resolvePlacement()` at all three stages (primary, verification, insufficient-evidence).

### Addendum validation
- Node VM smoke test exercising every new case plus the three pre-existing `placement-engine.test.js` confidence assertions (`confidenceFor({score:90,graded_questions:3})` → low, `{score:72,graded_questions:10}` → high, `{score:88,graded_questions:10}` → medium) — all passed, confirming no behavior change from the refactor.
- `node --check site/shared/js/placement.js` — passed.
- `node --check site/shared/js/orientation.js` — passed.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'` — 16/16 passed.
- `python3 -m unittest discover -s generation -p 'test_*.py'` — 58/58 passed.
- `python3 build.py validate --input master_source.csv` — 60 rows, 60 quizzes, 0 errors, 0 warnings.
- `site/shared/quiz.html` was not changed — it only reads `.confidence` off the result object, and that field's shape (`'low' | 'medium' | 'high'`) is unchanged.
- Vitest still could not be executed (`node_modules/.bin/vitest` not installed in this package), same known limitation as the base milestone.

## Handoff

The next milestone can expand item-bank coverage and authoring support against the v2 state contract. In particular, richer banks can use the blueprint's skill and difficulty metadata without changing the learner-facing state machine.
