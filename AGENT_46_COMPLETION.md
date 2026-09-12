# Agent 46 — Content Architecture v2 Bridge

**DONE**

## Files changed
- `site/shared/js/runtime-v2-adapter.js` — additive hierarchy normalizer and single-activity flattener; explicit `question_type` stays first-class in source hierarchy while legacy `radio` remains omitted from learner payloads.
- `site/SCHEMA.md` — documented Course → Unit → Lesson → Activity → Question bridge and compatibility boundary.
- `tests/fixtures/content-architecture-v2-fixture.json` — one activity containing radio + ranking questions.
- `tests/unit/runtime-v2-adapter.test.js` — hierarchy/flatten regression coverage.

## Checks
- `node --check site/shared/js/runtime-v2-adapter.js` — PASS
- Direct Node VM bridge + legacy compatibility check — PASS
- Fixture JSON validation — PASS
- Vitest focused test — BLOCKED: `vitest` dependency is unavailable in the packaged environment.

## Limitation
Browser/Vitest execution was not available; this is documented rather than bypassed.

## Next agent
Agent 47 should run the final consistency gate and fix only cross-contract mismatches.
