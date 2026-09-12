# Agent 27 — Automated Accessibility Audit in the Release Pipeline

## Status
COMPLETED

## Scope

Agent 26's handoff (`HANDOFF.md`, `AGENT_26_COMPLETION.md`) named this
exact next step: automate the accessibility audit (axe/Lighthouse) inside
the same verification pipeline that already gates production deploys, and
retain its report as a release artifact — non-blocking until a clean
baseline exists, unless the product explicitly promotes it to a hard
requirement. The release checklist had carried this as an open, unchecked
item since the very first production checklist.

## Delivered

- `tests/e2e/accessibility.spec.js` — a new Playwright spec that runs
  **axe-core** (WCAG 2.0/2.1 A + AA rule tags) against real, rendered page
  states: the main hub, a level index, a level dashboard, and all three
  quiz states (start screen, in-progress question, completed results).
  Six audit points from three distinct HTML templates plus the dynamic
  quiz lifecycle, not just static markup.
- Writes two artifacts per run: `ACCESSIBILITY_REPORT.md` (human-readable,
  grouped by page with an impact-sorted table) and
  `accessibility_report.json` (full detail, machine-readable).
- **Report-only by design.** The test never fails on a violation finding —
  only a genuine tooling failure (page won't load, browser missing) fails
  it. An `MYLINGO_A11Y_BLOCKING=true` env var flips it to a hard gate
  (asserting zero critical/serious violations) once the product has a
  clean baseline and wants this enforced. This matches the handoff's
  explicit instruction, not an interpretation of it.
- `.github/workflows/release.yml` — added a Playwright-chromium install
  step and a new "Run automated accessibility audit" step in the existing
  `verify` job, positioned after the release gate so it audits the exact
  artifact that just passed it. The report is uploaded via the existing
  "Upload release reports" artifact step alongside `BUILD_REPORT.md`/
  `RELEASE_GATE_REPORT.md`.
- `ci/release_gate.sh` — the same audit step added for local/CI parity,
  runnable standalone as `bash ci/release_gate.sh` (unchanged invocation)
  or via the new `npm run test:a11y`.
- `playwright.config.js` — the webServer's static-file target is now
  `process.env.MYLINGO_SITE_DIR || './site'` instead of a hardcoded
  `'./site'`. This is what lets the accessibility audit (and, if ever
  enabled in CI, the existing `quiz-flow.spec.js`) point at the freshly
  built, release-gated artifact rather than the checked-in working tree —
  the same "verify exactly what ships" principle Agent 26 built the whole
  milestone around. Fully backward compatible: nobody sets this env var
  locally, so `npm run test:e2e` behaves identically to before.
- `package.json` — added `test:a11y` script.
- `RELEASE_CHECKLIST.md` — checked off the accessibility-audit item with
  an accurate description of its current (report-only) state, added an
  "Automated accessibility audit (Agent 27)" section, and updated the
  verdict paragraph.
- `HANDOFF.md` — this milestone's summary appended (see below).

## Why axe-core over Lighthouse

The handoff named both as acceptable ("axe/Lighthouse"). axe-core was
chosen because:
- It's the dedicated accessibility rule engine — Lighthouse's own
  accessibility category is itself powered by axe-core under the hood, so
  using axe-core directly gets the same rule set without the rest of
  Lighthouse's unrelated performance/SEO/PWA scoring.
- It integrates directly into the Playwright harness this project already
  has (`@playwright/test`, `tests/e2e/`), needing no new process-spawning
  or report-format bridging.
- It needs **no new npm dependency** — it's loaded from CDN at runtime via
  `page.addScriptTag()`, the same pattern `authoring/mylingo-admin.html`
  already uses for Tailwind, SheetJS, Tesseract, and JSZip. This matters
  concretely here: this sandbox has no network access to run `npm install`
  and regenerate `package-lock.json`, so any approach requiring a new
  devDependency (`@axe-core/playwright`, `lighthouse`, `chrome-launcher`)
  could not have been verified end-to-end in this environment at all.
  Lighthouse in particular typically wants its own Chrome-launching
  process and is heavier to wire into an existing Playwright-driven
  pipeline for comparatively little benefit here.

## Design decisions (why)

- **Runs once, on chromium only.** Accessibility findings are DOM/ARIA
  issues, not viewport-rendering issues — running the same rule engine
  twice (once per Playwright project) would just double report-writing
  and risk the two projects racing to write the same file. `test.skip()`
  based on `testInfo.project.name` keeps this to one run.
- **One test, six `test.step()`s, one report write at the end.** The
  project's `fullyParallel: true` config means separate `test()` blocks in
  one file can run in different worker processes, so any module-level
  array accumulating results across separate tests would silently lose
  data. Keeping all six audits inside a single test sidesteps that
  entirely — no cross-process state-sharing needed.
- **Report written outside `$BUILD_DIR`, not inside it.** The workflow's
  "Upload verified site artifact" step publishes the entirety of
  `$BUILD_DIR` to GitHub Pages. Writing the accessibility report inside
  that directory would have made it part of the live, public site. Both
  the CI workflow (`${{ runner.temp }}/mylingo-a11y-report`, a sibling of
  `mylingo-site`) and `ci/release_gate.sh` (`${BUILD_DIR}-a11y-report`, a
  sibling directory) write it outside on purpose.
- **A tooling failure still fails the step; a finding does not.** If the
  page never loads or the browser isn't installed, that's a silent gap in
  coverage worth surfacing loudly — different from "the audit ran and
  found problems we haven't triaged yet," which is exactly the situation
  the release checklist has been sitting in.

## Files changed

- `tests/e2e/accessibility.spec.js` (new)
- `.github/workflows/release.yml`
- `ci/release_gate.sh`
- `playwright.config.js`
- `package.json`
- `RELEASE_CHECKLIST.md`
- `HANDOFF.md`
- `AGENT_27_COMPLETION.md` (new, this file)

No Python file was touched. No change to quiz scoring, placement, mastery,
scheduling, authoring autosave, offline pack contracts, `master_source.csv`,
or any runtime JSON/manifest shape.

## Validation

- `node --check tests/e2e/accessibility.spec.js` and
  `node --check playwright.config.js`: PASS.
- `python3 -c "import json; json.load(open('package.json'))"`: PASS.
- `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/release.yml'))"`: PASS.
- `bash -n ci/release_gate.sh`: PASS.
- Extracted and unit-tested the pure `summarize()` report-formatting
  function in isolation against hand-built fake axe-core results (a page
  with zero violations, a page with a serious + a moderate violation) —
  confirmed the Markdown report renders correctly (impact-sorted table,
  correct totals, correct "no violations" branch).
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'`: 22/22
  passed, unchanged (no Python touched).
- `python3 -m unittest discover -s generation -p 'test_*.py'`: 58/58
  passed, unchanged.
- `python3 build.py validate --input master_source.csv`: 60 rows, 60
  quizzes, 0 errors, 0 warnings — unchanged.
- **Not executed**: an actual `npx playwright test tests/e2e/accessibility.spec.js`
  run against a real browser. This sandbox has no network access to run
  `npx playwright install --with-deps chromium` (confirmed: `npm`
  registry requests are rejected at the network layer here), and no
  Playwright browsers were already present. This is the same limitation
  every prior agent touching CI/Playwright in this project has recorded
  (`AGENT_26_COMPLETION.md`: "Full GitHub Actions hosted run: not executed
  in this environment"). The spec's logic was verified as thoroughly as
  possible without a browser: syntax, the report-formatting function in
  isolation, and structural review of the axe-core API usage
  (`axe.run(document, { runOnly: { type: 'tag', values: [...] } })` is
  axe-core's documented invocation shape).

## Handoff

- **Immediate next step for a human with CI access:** merge this, let a
  real workflow run happen, and read the first genuine
  `ACCESSIBILITY_REPORT.md`. Triage whatever it finds, then decide whether
  to flip `MYLINGO_A11Y_BLOCKING` to `'true'` in
  `.github/workflows/release.yml` (and locally in `ci/release_gate.sh` if
  wanted) once the baseline is clean or the remaining findings are
  accepted as known/tracked.
- The deployment-topology decision (`RELEASE_CHECKLIST.md`, `DEPLOYMENT.md`)
  remains the other open item — unrelated to this milestone, still
  requires a human product decision (single-origin vs. six repos).
- Real hosted execution of the whole CI workflow, the pre-existing
  `quiz-flow.spec.js` e2e suite, and this new accessibility spec all still
  need a networked environment to actually run for the first time — noted
  by every agent since this pipeline existed, still true here.

## Do not change

- Everything already listed in prior agents' "Do not change" sections
  (frozen CSV shape, runtime JSON/manifest shape, all `mylingo.*`
  localStorage schemas, existing validation/QA rule sets) — nothing here
  touches any of them.
- `build.py release-gate`'s existing semantics — this milestone only adds
  a step *after* it, never changes what it checks or how it's invoked.
- The report-only default. Don't flip `MYLINGO_A11Y_BLOCKING` to `true` in
  this package — that's an explicit product decision for a human reviewing
  a real baseline, not something to default on.

## Stop rule

Stop after Agent 27 verification and handoff. Do not flip the
accessibility gate to blocking, and do not begin the deployment-topology
decision, in this package.
