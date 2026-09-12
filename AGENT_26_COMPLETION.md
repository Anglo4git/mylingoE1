# Agent 26 — CI / Production Release Gate

## Status
COMPLETED

## Delivered
- Added `.github/workflows/release.yml` for pull-request verification and gated GitHub Pages production deployment.
- CI builds a fresh deployable site from `master_source.csv` instead of publishing the checked-in working tree.
- CI executes Python unit tests, content QA, JavaScript tests, output verification, and the existing `build.py release-gate` before any deployment.
- The deployment job can run only after the verification job succeeds and only on pushes to `main`.
- Added `ci/release_gate.sh` to provide local/CI parity for the release sequence.
- Added `npm run release:build`, `npm run release:gate`, and `npm run test:python` scripts.
- Added `.nojekyll` to the generated Pages artifact.
- Added CI/release-gate milestone documentation and release-checklist entries.

## Compatibility
- Existing quiz routes, schemas, placement, skill mastery, review scheduling, authoring autosave, and offline pack contracts remain unchanged.
- Existing `build.py release-gate` semantics remain unchanged; Agent 26 only makes them an enforced publishing boundary.

## Validation
- Local release script: PASS.
- Source validation: 60 rows / 60 quizzes / 0 errors / 0 warnings.
- Content QA: completed successfully on the starter dataset.
- Fresh build: PASS.
- Output verification: 0 errors / 0 warnings.
- Production release gate: PASS with 0 errors / 0 warnings.
- Python unit tests: 22/22 passed.
- Node syntax checks: PASS.
- Full GitHub Actions hosted run: not executed in this environment; workflow syntax was reviewed structurally.

## Handoff
Next useful milestone: automated accessibility auditing (axe/Lighthouse) inside the same verification job, because the release checklist has carried that warning since the initial production checklist.
