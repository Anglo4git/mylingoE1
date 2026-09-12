# Agent 4 — Browser / E2E Recovery Completion

## Status
PARTIAL — E2E test infrastructure and deterministic test defects were repaired, but a full Playwright browser run could not be executed in this sandbox because the Playwright dependency/browser installation was unavailable.

## Mission
Make the browser test suite executable against the release artifact and remove test-side false failures without changing unrelated production behavior.

## Mini-Audit
### Scope
- `playwright.config.js`
- `tests/e2e/quiz-flow.spec.js`
- `tests/e2e/accessibility.spec.js`
- `tests/e2e/quiz-renderer-coverage-agent113.spec.js`
- `ci/release_gate.sh`
- `package.json` / `package-lock.json`

### Findings
- **E2E-F001 — High:** core/a11y tests used exact accessible name `Start Quiz`, while production renders `Start quiz`; renderer coverage already used the correct case-insensitive locator. This would cause deterministic locator failures.
- **E2E-F002 — High:** `a1-001` contains 5 questions, but core and accessibility tests treated it as a single-question quiz and expected results after the first answer. The test comment was therefore stale and the result assertion was unreachable after only one `#next`.
- **E2E-F003 — Environment blocker:** this sandbox has no usable installed Playwright package/browser. `npm ci` could not complete because dependency installation stalled in the restricted environment, and no local Playwright binary was available. System Chromium exists but did not complete a headless page run in this environment, so it was not treated as Playwright evidence.

## Changes Made
- `tests/e2e/quiz-flow.spec.js`
  - changed `Start Quiz` locators to case-insensitive `/Start quiz/i`.
  - introduced `QUESTION_COUNT = 5` for the canonical `a1-001` fixture.
  - changed quiz completion tests to answer all five known `goes` questions before asserting results.
  - tightened the answer locator to `^goes$` to avoid accidental partial matches.
- `tests/e2e/accessibility.spec.js`
  - changed `Start Quiz` locators to `/Start quiz/i`.
  - introduced the same five-question completion contract.
  - completed all five questions before the completed-results axe audit and bottom-nav restoration assertion.

No production application files were changed.

## Tests / Checks
- `node --check tests/e2e/quiz-flow.spec.js` — PASS
- `node --check tests/e2e/accessibility.spec.js` — PASS
- `node --check tests/e2e/quiz-renderer-coverage-agent113.spec.js` — PASS
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'` — PASS (105 tests)
- `python3 scripts/verify_release_identity.py` — PASS (v118)
- `node scripts/lint.js` — FAIL due to pre-existing/upstream Agent 3 additions:
  - `scripts/coverage_gate.mjs`: 3 `console.log` findings
  - `scripts/typecheck_contract.mjs`: 1 `console.log` finding
  These files are outside Agent 4 ownership and were not modified.
- Full `npx playwright test` — NOT RUN / BLOCKED because Playwright dependencies were not available locally.

## CI Infrastructure Assessment
`playwright.config.js` correctly targets the deployable tree through `MYLINGO_SITE_DIR`, defaults to `site/`, and starts a static server on port 4173. The release workflow separately installs Chromium and WebKit before invoking the release gate. `ci/release_gate.sh` runs the accessibility suite and blocking core quiz-flow suite against the same freshly built `dist-release` artifact.

## Exit Gate
- [x] E2E config inspected
- [x] Critical deterministic test-side failures identified
- [x] Locator mismatch fixed
- [x] Five-question completion contract fixed
- [x] E2E test files syntax-checked
- [ ] Playwright suite actually passes in this sandbox — blocked by unavailable dependency/browser installation
- [ ] Release E2E gate independently proven green — requires CI or an environment with npm registry access and Playwright browsers

## Remaining Risks
1. Full browser execution remains the highest-priority verification gap.
2. Agent 3's newly added lint scripts currently trigger Agent 2's dependency-free lint gate; Agent 3 should repair those `console.log` findings rather than Agent 4 crossing ownership.
3. CI should run the actual Playwright install + E2E sequence before release readiness is declared.

## Exact Next Task
Run `npm ci`, `npx playwright install --with-deps chromium webkit`, then:
- `npx playwright test tests/e2e/quiz-flow.spec.js`
- `npx playwright test tests/e2e/accessibility.spec.js --project=chromium`

Capture Playwright version, browser versions, test counts, pass/fail/skip counts, and failure traces/screenshots if any.
