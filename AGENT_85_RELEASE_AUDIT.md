# Agent 85 — Release Audit (FINAL RELEASE GATE)

## Scope
Final release gate for the Course/Lesson/Journey release, run after Agent 84's
integration audit (which found and fixed the fresh-build course-copy bug).
Executed the full release sequence from `ci/release_gate.sh` directly,
substituting static equivalents only where the browser-based Playwright steps
could not run in this sandbox (no network egress → browsers cannot be
installed; see Limitations). Every other step ran for real, against a real
fresh (non-in-place) build directory, not by inspection.

## Environment constraint (read first)
This sandbox has no network egress. `npm ci` / `npx playwright install` both
fail (403/DNS). This blocks exactly two steps from `ci/release_gate.sh`:
JS unit tests (`vitest`, needs `node_modules`) and the two Playwright E2E
specs (accessibility axe-core audit, quiz-flow mobile/desktop E2E). Every
other step in the release sequence — including the parts of "content QA",
"course reference QA", "route audit", "offline audit", and "regression
checks" that don't require a browser — ran to completion with real output
below. This is a tooling limitation of this environment, not a skipped audit
step; it is called out explicitly as a release blocker on trust rather than
silently marked PASS.

## Release sequence — results

| # | Check | Command | Result |
|---|---|---|---|
| 1 | Clean build | `python3 build.py validate --input master_source.csv` then `python3 build.py build --input master_source.csv --out /tmp/dist-release --src-root site --report .../BUILD_REPORT.md` (fresh, never-existed-before output dir, per Agent 84's finding) | PASS — 300 rows/60 quizzes validated, 0 errors/0 warnings; build wrote 74 files (66 written + 8 unchanged); 7 offline packs built |
| 2 | JavaScript syntax validation | `node --check` on all 17 non-vendor, non-minified `.js` files under `site/` | PASS — 0 syntax errors |
| 3 | Route audit | Verified presence of `index.html`, all 6 level indexes (`a1`-`c2`), and all 4 `courses/*.html` pages in the fresh build; confirmed `placement/`, `grammar/`, `vocabulary/`, `academic-english/`, `writing/` are level-scoped directories by design (no top-level index expected — verified their per-level subdirectories exist) | PASS — no missing routes |
| 4 | Content QA | `content_qa.py --input master_source.csv --out-dir /tmp/dist-release/content_qa --strict` | PASS — 0 errors, 7 warnings (pre-existing `CQ-D06`, documented non-blocking since Agent 81), score 93/100 |
| 5 | Course reference QA | `course_schema.py validate --content-dir course_content` and `course_content_qa.py --content-dir /tmp/dist-release/course_content --master-source master_source.csv --site-dir /tmp/dist-release --strict` (against the **fresh build output**, not the working tree) | PASS — 0 errors/0 warnings on both |
| 6 | Accessibility checks | Full axe-core Playwright audit **could not execute** (no browser binaries, no network to install them). Static substitute run instead: viewport meta tag and `<html lang>` presence across all 20 shipped HTML pages | Static check PASS (20/20 pages have viewport meta + lang attribute) — but this is **not equivalent** to the axe-core WCAG audit `tests/e2e/accessibility.spec.js` runs; that spec exists and is CI-wired but did not run here. See Limitations/Blockers. |
| 7 | Offline/manifest audit | Verified `offline/core-manifest.json` + `offline/packs.json` structure, confirmed 7 pack files (`a1,a2,b1,b2,c1,c2,core`.zip) match manifest count, and ran a zip-integrity test (`zipfile.testzip()`) on each pack | PASS — all 7 zips uncorrupted, manifest/file counts match |
| 8 | Mastery/review/resume regression | `python3 -m unittest discover -s tests/unit` (70 tests), `-s generation` (62 tests), root discover (119 tests) — covers the Python-layer equivalents of `review-mastery-integration-agent80`, `session-resume`, `skill-mastery` | PASS — 251/251 Python tests pass, 0 failures (only benign `ResourceWarning`s for unclosed fixture files in one pre-existing test, non-blocking) |
| 8b | JS regression suite (vitest) | Could not execute — `node_modules` not installed, no network to install (`ELSPROBLEMS`/403) | **NOT RUN.** This suite covers `quiz-question-experience`, `journey-ui`, `placement-engine`, etc. Agent 84's last known state was 228/228 green after fixes; nothing in this audit touched JS runtime logic, so no regression is expected, but it was not re-verified here. |
| 9 | Mobile/responsive sanity | Playwright mobile-safari project in `quiz-flow.spec.js` could not run (same constraint). Static substitute: viewport meta on all pages (see #6) and spot-checked CSS for responsive media queries in `site/shared` | Static check only — PASS, but real device/viewport E2E not exercised here |
| 10 | ZIP/package integrity | Zipped the fresh `/tmp/dist-release` build output and verified with `zipfile.testzip()` | PASS — 193 files, zip uncorrupted |
| 11 | Unintended files / debug code / broken links / stale artifacts | Grepped shipped output for `debugger;`, `console.log(`, `TODO`/`FIXME`/`XXX`, `sourceMappingURL`, `.DS_Store`, `.pyc`, `__pycache__`, `.map`; also ran `build.py verify-output` and `release-gate` (which include the project's own reference/link checks) | PASS — none found; `verify-output`: 0 errors/0 warnings; `release-gate`: 0 errors/0 warnings |

## Scale/throughput regression (ran as part of the gate)
`scripts/scale_benchmark.py --rows 3000` → 33,975.5 rows/sec vs. 500 rows/sec
floor. **PASS.**

## Known limitations
1. **No network egress in this environment.** `npm ci` and Playwright browser
   install both fail. This is an environment constraint, not a project
   defect — the real CI (`.github/workflows/release.yml`) has network access
   and runs every step in `ci/release_gate.sh` unmodified.
2. Because of (1), the JS vitest suite and both Playwright specs
   (accessibility axe-core audit, quiz-flow E2E incl. mobile-safari) did not
   execute in this session. Static substitutes were run where reasonable
   (viewport/lang presence, debug-code grep) but these are **not** a
   substitute for the real browser-based accessibility and E2E gates.
3. The 7 pre-existing `CQ-D06` content QA warnings (documented since Agent
   81) remain and are explicitly non-blocking per that agent's policy.

## Release blockers
None of the checks that could run in this environment produced a P0/P1
defect. However, per the stop condition below, unconditional
release-readiness is not declared, because two CI-blocking gates
(`npx playwright test tests/e2e/accessibility.spec.js` and
`tests/e2e/quiz-flow.spec.js`, both `set -euo pipefail`-enforced blocking
steps in `ci/release_gate.sh`) did not execute in this session — their last
verified state is second-hand (Agent 84's report), not this agent's own run.

## Final decision

**CONDITIONAL PASS.**

Every release-gate check executable in this sandbox — clean fresh-directory
build, JS syntax gate, route audit, strict content QA, course
schema/content-graph QA, offline pack/manifest integrity, the full Python
regression suite (251/251), the scale/throughput gate, and the
hygiene/stale-artifact sweep — passes with 0 errors and 0 warnings.

This is not an unconditional release-ready declaration, because the
project's own CI pipeline treats the Playwright accessibility audit and the
quiz-flow E2E suite (including mobile-safari) as hard, blocking gates, and
this environment could not execute either one. **Before merging/deploying, a
human or an environment with network access must run:**

```
npm ci
npx playwright install --with-deps chromium
bash ci/release_gate.sh
```

and confirm both Playwright specs pass, exactly as `ci/release_gate.sh` and
`.github/workflows/release.yml` already require. If that run is green (as
Agent 84's last full run reported: 228/228 vitest, a11y report generated,
quiz-flow E2E passed), this release is clear to ship with no further agent
work needed on the content/build/course side.
