# Agent 43 — Core quiz E2E in CI

## Status
DONE

## Files changed
- `ci/release_gate.sh` — added a blocking `npx playwright test tests/e2e/quiz-flow.spec.js` run (both `chromium` and `mobile-safari` projects) against the freshly built, release-gated artifact, right after the existing report-only accessibility check.
- `package.json` — added `test:e2e:core` script for local convenience (same pattern as `test:a11y`).

## Files added
- `.github/workflows/release.yml` — **not present in the handoff package received** (only docs referencing it were). Reconstructed from `26_CI_PRODUCTION_RELEASE_GATE.md`'s documented contract, `ci/release_gate.sh`, and prior agents' completion notes describing edits to it. A `verify` job runs unit tests, content QA, installs Playwright browsers (Chromium + WebKit, explicit step), then runs `ci/release_gate.sh` (build → verify-output → release-gate → a11y report-only → **core E2E, blocking**); a `deploy` job publishes to Pages only after `verify` passes on `main`. **A human must diff this against the real file before merging** — treat it as a faithful reconstruction, not a guaranteed match.

## Checks run
- `bash -n ci/release_gate.sh` — PASS.
- `python3 -c "import json; json.load(open('package.json'))"` — PASS.
- `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"` — PASS.
- Did **not** claim or attempt a real `npx playwright test` run — no network access to install Playwright/browsers in this sandbox (same limitation every prior CI-touching agent recorded). Not run.

## Known limitation
The reconstructed workflow file is unverified against a real GitHub Actions run and against whatever the actual file in the repo contains.

## Next agent
Get a human to merge this, let a real CI run happen, confirm the core E2E step genuinely blocks on a deliberate failure, then proceed to Agent 44 (accessibility release gate).
