# Agent 167 Handoff — Placement Results Screen Under Test; 3 Defects Fixed; Boundary-Check Flow Verified End to End

## Context
Picked up `HANDOFF_AGENT_166.md`, whose named next target was `placementContinue` + `renderPlacementResult`, then
`renderSuggestions`. The extracted zip matched the Agent 166 handoff exactly (258 tests, all passing).

## Defects found and fixed (1 file: `shared/quiz.html`)
1. **Every lower-boundary check was unreachable (reachable today).** `resolvePlacement` asks for a lower-boundary
   check whenever the primary score is < 50% (A2–C2). `placementContinue` hid the button whenever pct < 60, so the
   panel said "Boundary check recommended at A1." with no way to start it. Reproduced in real Chromium (A2 at 20%).
   Fix: `needsCheck` (primary stage + a verification level different from the assessed level) bypasses the 60% gate.
   The plain "Continue" keeps its 60% gate (product decision, unchanged).
2. **The pending boundary-check record was never written.** `quiz.html` reads `mylingo.assessment.pending.v1` in the
   verification stage and `gamification.js` validates/backs it up, but no code wrote it, so the check ran without the
   primary answers (`primary_score` null). `saveAssessmentResult` (primary path) now writes
   `{version:1, estimated_level, primary_level, verification_level, primary_score, primary_quiz_id, primary_evidence,
   timestamp}` when a check is recommended, and clears a stale record otherwise. It passes `GAM.validateBackup`.
3. **Evidence ids collided across stages (would have surfaced the moment #2 was fixed).** The runtime adapter drops
   question ids and every placement bank is `placement-001`, so evidence ids were `placement-001:<i>` in BOTH stages;
   `mergePlacementEvidence` treats equal ids as one item and keeps the first correctness, so the verification answers
   would have been replaced by the primary ones. Ids are now scoped by the bank's level (`a2:placement-001:0`).
   Agent 165's merge tests used distinct quiz ids and seeded ids, so they never exercised the real shape.

## Tests: `tests/run.js` 258 → 275, all passing (`node tests/run.js`)
New section "quiz.html placement results screen … (Agent 167)": a real-page pipeline helper (bank JSON → real
adapter → real `saveAssessmentResult`); every level × every score of the shipped banks (panel text, button, link
target and verification bank always agree); lower-boundary sweep; verification-stage and null-profile behaviour; URL
params match what quiz.html reads; `renderPlacementResult` on real profiles, thresholds, 120-question copy; pending
record shape + backup validator; stale-record clearing; two-stage flow with 20 distinct evidence ids and both stages'
answers counted; `renderSuggestions` (cap 3, distinct, escaping/encoding, once-only fetch guard, failing load, every
link exists in the real manifests).
Mutation-checked (each fails only its own tests): gate reverted → 2; id scoping removed → 1; stale-clear removed → 1;
title unescaped → 1; practice threshold changed → 1; verification re-check allowed → 1; suggestion loop guard removed →
suite hangs (detected). Pending-writer removal was not a clean mutant (it broke syntax); the pending tests fail without it.

## Verification
- Real Chromium (390×844, no-store server): A2 20% → "Continue to A1 check" → verification → A1, 20 graded questions;
  A2 90% → "Continue to B1 check" → B1, 20 graded; C2 30% → "Continue to C1 check" → C1 (High), 20 graded. Pending
  record consumed each time; no page errors.
- `node --check`; **`CACHE_VERSION` bumped `mylingo-v10` → `v11`** (`quiz.html` is precached); `core.zip` rebuilt from
  `core-manifest.json` (90 files, manifest order, deflate); offline reconciliation tests pass.

## Observed, deliberately not changed
- Plain "Continue" hides below 60%, including after a failed verification (still the Back-button product question).
- A skill at 70–79% appears in neither "Strong areas" (≥80) nor "Practice next" (<70); the recommendations engine
  calls 60–79 "developing".
- Heading says "Final placement" while a boundary check is still pending.
- `renderPlacementResult` throws if `recommended_level` / `confidence` is missing (nothing produces that today).
- `renderSuggestions` shuffles with `sort(()=>Math.random()-0.5)` (biased, harmless for picking 3).
- Verification profile `assessment_quiz_ids` is now `['placement-001','placement-001']`-style input (both stages share
  an id); check `calculateResult` de-duplication if this list is ever shown.

## Rules carried forward
Same as Agent 166: editing a `core-manifest.json` file requires rebuilding `offline/packs/core.zip` and bumping
`CACHE_VERSION` (now `v11`); vm-sandbox tests must return JSON clones; drive the placement quiz by clicking
**Start quiz**, then `button.option[data-index=N]` (1-based), then `#next`.

## Remaining / carried forward
1. [DECISION] level-lock fail-open vs fail-closed.  2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3. `learner-state.js` unreferenced.  4. `gamification.js` "Malformed legacy backup." dead code.
5. Zip filename vs `RELEASE_IDENTITY.json` (v118).  6. Legacy `calculateNextInterval` unused.
7. `main/practice.html` redirect stub.  8. [PRODUCT] grammar-only recommendations / missing Reading, Listening catalog categories.
9. Still untested: `end()`, `load()`/lesson gate, other `render*` in quiz.html, `orientation.js`,
   `mastery-review-ui.js`, `app-shell.js`, `authoring-*`, `splash.js`, `offline-packs-ui.js`.
