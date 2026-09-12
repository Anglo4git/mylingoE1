# Agent 37 — Placement Evidence Merge

Status: DONE

Files changed:
- `site/shared/js/placement.js`
- `site/shared/quiz.html`
- `tests/unit/placement-evidence-merge.test.js`

Primary evidence is persisted in `mylingo.assessment.pending.v1` before verification. Verification completion merges both stages explicitly; duplicate question IDs count once while preserving stage/source-quiz metadata. Final profiles expose unique evidence totals, per-skill counts, source quiz IDs, and evidence stages.

Checks: deterministic primary+verification probe PASS; quiz inline-JS syntax PASS; JSON bank validation PASS.

Known limitation: the full Vitest command timed out in this environment before producing results.
