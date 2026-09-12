# Mylingo — Final Release Checklist (Agent 5)

## Content & generator
- [x] `master_source.csv` validates with 0 errors, 0 warnings (60/60 quizzes).
- [x] Regenerating from source produces byte-identical output to what's in `site/`.
- [x] All six manifests cross-check cleanly against their quiz files (no dangling
      references, no duplicate IDs, no out-of-range answers).

## Functional
- [x] All 60 sample quizzes (6 levels × 10) load, play, and complete correctly.
- [x] Error states verified: missing quiz id, 404, malformed JSON, invalid schema,
      network failure + retry.
- [x] Refresh mid-quiz recovers cleanly.
- [x] Dashboards correctly reflect real progress data per level.
- [x] Placement-mode recommendation logic verified at both ladder ends (A1 floor,
      C2 ceiling) — does not suggest a level that doesn't exist.

## UX / accessibility / mobile
- [x] Keyboard-only quiz completion works (number keys + arrow keys + Enter).
- [x] Focus management verified on question change, completion, and errors.
- [x] Mobile emulation (iPhone 13 viewport): no horizontal overflow, touch targets ≥44px.
- [x] Automated accessibility audit (axe-core) — now runs inside the same
      CI verification job that gates production deploys, against the
      exact freshly built artifact. **Report-only for now**: it never
      fails the pipeline on its own; findings are retained as a workflow
      artifact (`ACCESSIBILITY_REPORT.md`/`accessibility_report.json`) so
      a first clean baseline can be established before promoting it to a
      hard gate (`MYLINGO_A11Y_BLOCKING=true`). See `AGENT_27_COMPLETION.md`.

## Links & navigation
- [x] All internal links across all 14 HTML files resolve (0 broken links) — verified
      under the single-origin layout the codebase is currently structured for.

## Deployment (see DEPLOYMENT.md for full detail)
- [ ] **Decision required:** single-origin deployment (recommended, no changes needed)
      vs. six separate repos (requires one of two documented mitigations first).
- [ ] If six repos chosen: update `main/index.html` links from relative paths to real
      deployed URLs before going live.
- [ ] Confirm HTTPS via GitHub Pages default settings.

## Content scaling (beyond the 60-sample starter, for future work — not blocking this release)
- [ ] Add `date_added`/`date_updated` columns to the master source (currently a fixed
      placeholder — flagged since Agent 3).
- [ ] Agree on a controlled category/tag vocabulary before scaling past 60 quizzes
      (flagged since Agent 3 — not validated against a closed set yet).
- [ ] If image/audio questions are wanted, extend `master_source.csv` + `build.py`
      schema — the runtime already supports optional `imageUrl`/`imageAlt` per question.

---

## Verdict: **READY WITH WARNINGS**

Everything that can be tested against the current 60-sample starter passed with zero
functional failures. The only open items are (1) a deployment-topology decision that
takes minutes to make but must be made *before* deploying to six separate repos, and
(2) reviewing the first automated accessibility audit baseline (now running in CI,
report-only) and deciding whether to promote it to a hard release gate. Nothing in
the code itself is blocking release.

## CI / production publishing (Agent 26)
- [x] GitHub Actions workflow builds from `master_source.csv` into a fresh deploy directory.
- [x] CI runs Python unit tests, content QA, JavaScript tests, output verification, and `release-gate` before publishing.
- [x] GitHub Pages deployment consumes only the verified artifact produced by the gate.
- [x] Production deployment is restricted to pushes on `main`; pull requests run verification only.
- [x] Release reports are retained as workflow artifacts for failed or successful verification runs.

## Automated accessibility audit (Agent 27)
- [x] `tests/e2e/accessibility.spec.js` runs axe-core (WCAG 2.0/2.1 A+AA rule tags)
      against the main hub, a level index, a level dashboard, and all three quiz
      states (start / in-progress / completed) — real rendered DOM, not static markup.
- [x] Runs against the exact freshly built, release-gated artifact (not the
      working tree) via the same CI job that gates production deploys, and locally
      via `bash ci/release_gate.sh` / `npm run test:a11y`.
- [x] `ACCESSIBILITY_REPORT.md` (human-readable) and `accessibility_report.json`
      (full detail) are retained as workflow artifacts on every run, pass or fail.
- [x] Report-only by design (`MYLINGO_A11Y_BLOCKING` unset/`false`): a violation
      finding never fails the pipeline; a tooling failure (browser missing, page
      failed to load) still does. Set `MYLINGO_A11Y_BLOCKING=true` once a clean
      baseline is established and the product wants this as a hard gate.
- [ ] **Human follow-up required:** review the first `ACCESSIBILITY_REPORT.md`
      produced by an actual CI run and triage any findings — this could not be
      executed against a real browser in the agent's sandbox (see `AGENT_27_COMPLETION.md`).

## Accessibility

- Browser axe audit is release-blocking for critical/serious findings.
- Moderate/minor findings remain report-only unless `MYLINGO_A11Y_BLOCKING_MODERATE_MINOR=true` is explicitly enabled.
- The release gate requires both accessibility report files; a missing browser result is **not verified** and fails the gate.
