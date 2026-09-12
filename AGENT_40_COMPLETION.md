# Agent 40 — Mastery/Review Dashboard Completion

## DONE
Implemented the learner-facing mastery and due-review dashboard layer using the existing skill-mastery and review-scheduler stores.

## Files changed
- `site/shared/js/mastery-review-ui.js` — new read-only dashboard UI module.
- `site/{a1,a2,b1,b2,c1,c2}/dashboard.html` — mount the shared module on all six level dashboards.
- `tests/unit/mastery-review-ui.test.js` — focused fixture/priority tests.
- `AGENT_40_COMPLETION.md`

## What changed
- Added compact “Today’s Review” panel with due count, due skills, mastery summary, priority skill, and next recommended action.
- New learners receive an actionable empty state instead of blank sections.
- Due rows use `MylingoReviewScheduler.getDueSkills()` and mastery rows use `MylingoSkillMastery` data; no duplicate scheduling/storage logic was added.
- All six dashboards use the same shared UI module and existing visual tokens.

## Checks
- `node --check` for the new UI + related modules: PASS.
- Direct Node fixture assertions for empty state, due-priority selection, mastery labels, and recommendation logic: PASS.
- Extracted inline dashboard scripts for all six level dashboards: PASS syntax check.
- All six level dashboards remain byte-identical after the patch.
- Vitest could not run because `node_modules` is absent in the supplied backup; an `npm ci` attempt did not complete in the environment.

## Known limitation
The UI links the recommended action to the existing level practice index because the current quiz route has no supported skill-filter route; it does not invent a new query contract.

## Next agent
Continue with the next named handoff (Agent 41) without changing the mastery/review storage contracts.
