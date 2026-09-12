# Agent 38 — Placement Coverage Blueprint

Status: DONE

Files changed:
- `site/shared/js/placement.js`
- `site/shared/quiz.html`
- `site/placement/{a1,a2,b1,b2,c1,c2}/placement-001.json`
- `09_PLACEMENT_BLUEPRINT_V2.md`
- `scripts/placement_coverage_report.mjs`
- `package.json`
- `tests/unit/placement-coverage.test.js`

Blueprint minimums are grammar >=4, vocabulary >=1, reading >=1, plus >=1 writing/usage item. Listening is explicitly unavailable in the current shipped banks. All six 10-question banks meet the blueprint without increasing test length. `npm run placement:coverage` is the machine-readable gate.

Checks: coverage report PASS for all six levels; deterministic blueprint validation PASS.

Known limitation: listening coverage remains intentionally absent until language-audio placement assets are available.
