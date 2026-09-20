# Agent 165 Handoff — placement.js Decision Engine + saveAssessmentResult Under Test; 2 Defects Fixed

## Context
Picked up `HANDOFF_AGENT_164.md`: "`saveAssessmentResult` is the riskiest remaining piece
(placement evidence merging)". `placement.js` had **4 tests total** (all about the 120-question
confidence threshold), so the whole decision engine behind it was untested. The working tree
matched the Agent 164 zip exactly this time (verified by diff before starting).

## Defects found and fixed (1 file: `shared/js/placement.js`)
1. **`scoreBand()` had holes between bands.** Bands were tested with `n >= min && n <= max`, but
   the ceilings are `89.999 / 79.999 / 59.999 / 39.999`, so any score strictly between a ceiling
   and the next band's floor (e.g. **89.9995**, 79.9995, 59.9995, 39.9995) matched nothing and
   fell through to the LAST band — "Very weak" for a near-top score. Fix: bands are ordered
   high→low, so a lower-bound test alone is correct. Verified over 0–100 in 0.0005 steps
   (6 mismatches → 0). **Scope note:** every in-app caller passes a rounded integer percentage
   (`Math.round(score/graded*100)`), and I checked that no ratio `c/n` with `n ≤ 40` lands in a
   hole, so learners cannot hit this today; it is a latent correctness bug for any non-integer
   caller.
2. **`buildEvidence()` silently dropped a graded answer whose question id was blank/whitespace.**
   The id was `String(q.id || fallback).trim()`, so `'  '` (truthy) trimmed to `''` and hit
   `if (!questionId) return out`. A missing id falls back to `quizId:index`; a whitespace id now
   does too. Effect of the bug: that answer vanished from `evidence`, the skill profile and
   `evidence_question_count`. No shipped question has a blank id — again authored-content
   protection.

## Tests: `tests/run.js` 197 → 223, all passing (`node tests/run.js`)
- **placement.js (19):** `scoreBand` (boundaries, clamping, junk, sweep with no gaps);
  `normalizeLevel`/`adjacentLevel`; `decideAssessmentPath`; `decideVerificationPath`;
  `decideFromPerformance`; `finalizeVerification`; `confidenceFor` (low/medium/high table incl.
  the ±5 caution zones — note: everything ≥80 or <55 is at best *medium* by design, "boundary
  results are medium"); `buildEvidence`; `mergePlacementEvidence` (duplicates never inflate
  totals, first correctness wins, quiz ids/stages/skill unioned, legacy shapes, junk entries);
  both skill profiles (≥2 items to report); `coverageReport` (grammar minimum is **4**,
  banners excluded, `writing_or_usage` compound rule, listening reported unavailable);
  `calculate120Placement` mastery ladder; `calculateResult` (also pins that it reports the
  display **label** `'Developing'` while `resolvePlacement` reports the **key** `'developing'`);
  `resolvePlacement` primary and verification stages (one verification only, edge signals never
  chain); `readStored`/`writeStored` (corrupt/wrong-shape/unknown-level/non-numeric rejected,
  throwing or missing storage); `validateQuestionMetadata`; blueprint self-validation and
  exported-copy isolation; and **every shipped placement bank** (valid metadata; all six
  10-question banks meet the coverage blueprint).
- **quiz.html `saveAssessmentResult` (7), run for real** (function lifted out of the file into a
  `vm` sandbox with the real `placement.js`, same extractor approach as Agent 164): inert
  outside placement mode / without placement.js / without data; primary mid-score final and
  persisted under `mylingo.assessment.v1`; boundary scores request exactly one adjacent
  verification while keeping the assessed level; estimate precedence (anchor param → stored
  orientation → quiz level); verification merges pending primary evidence with **no double
  counting** (10+10=20), reports both stages/quiz ids, **consumes** the pending record, and
  surfaces a second boundary as an edge instead of chaining; corrupt/missing pending record
  survived; the 120-question path recommends from the mastery ladder, not the score band.
- **Mutation-checked, each fails only its own tests:** scoreBand reverted → 1; whitespace-id
  handling reverted → 1; merge double-counting → 2; verification edge chaining upward → 2;
  pending-record clear removed → 1; 120 ladder gate loosened → 1.
- Harness: the vm function extractor (regex-literal aware) is now duplicated in two sections of
  `run.js` (Agent 164's and this one's, each inside its own IIFE). Hoisting it to the top-level
  helpers is a safe cleanup, deliberately not done to keep this change reviewable.

## Verification
- **Real Chromium end-to-end** (`no-store` server): completed a `mode=placement&anchor=b1`
  placement quiz by picking option 1 throughout → stored `mylingo.assessment.v1` =
  `{recommended: b1, score: 40, band: Weak, confidence: medium, verification_level: a2,
  evidence: 10, reason: lower_boundary}`, the "Final placement … Boundary check recommended at
  A2" panel rendered, zero page errors — exactly what the unit tests predict for a 40% primary
  score. `node --check` on touched files; `core.zip` rebuilt (suite-enforced), 90 files.
- **`CACHE_VERSION` bumped `mylingo-v8` → `v9`** (`placement.js` is precached and changed).

## Observed, deliberately not changed
- `coverageReport().meets_blueprint` / `claimable_cefr_evidence` are computed but **consumed by
  nothing in the app**; and the shipped `placement-120.json` has **no reading items** so it
  fails the blueprint (`missing: ['reading']`). No product impact today, but if a "claimable
  evidence" badge is ever shown, the 120 bank needs reading items first.
- `readStored` accepts `score: null` (`Number(null) === 0` is finite). Harmless today.
- `calculateResult.score_band` (label) vs `resolvePlacement.score_band` (key) inconsistency is
  pinned by a test rather than changed — the UI reads neither directly.

## Rules carried forward (still enforced by tests)
- Any edit to a file in `offline/core-manifest.json` requires rebuilding
  `offline/packs/core.zip` (zip exactly the manifest paths, deflate, manifest order); bump
  `CACHE_VERSION` in `sw.js` (now `v9`) when a precached file changes.
- New local script/stylesheet on a precached page → both `core-manifest.json` and the `core`
  pack in `packs.json`. `offline_packs.py` (the stated generator) is not in this zip.
- vm-sandbox tests must return JSON clones (cross-realm prototypes break `deepStrictEqual`).

## Remaining / carried forward
1. **[DECISION] level-lock fail-open vs fail-closed** (diagnostic warn stays until decided).
2. **[PRODUCT] Back button on the quiz results screen?**
3. **`learner-state.js` still unreferenced** — wire in or delete with its tests.
4. **`gamification.js` "Malformed legacy backup." message still dead code.**
5. **Zip filename vs `RELEASE_IDENTITY.json` (v118) still unreconciled** (naming convention).
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) still unused.
7. `main/practice.html` is a redirect stub, intentionally not precached.
8. **Still untested:** the DOM half of quiz.html (`render*`, `end()`, `load()`/lesson gate,
   `renderPlacementResult` text), `recommendations.js` beyond the audit scenario (it consumes
   the placement profile — natural next target), `orientation.js`, `mastery-review-ui.js`,
   `app-shell.js`, `authoring-*`, `splash.js`, `offline-packs-ui.js`.
