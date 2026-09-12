# Agent 84 — Integration Audit

## Scope
Audited the full learner journey after the Course/Lesson/Journey
implementation (Agents 73–83): Placement → level recommendation → course →
journey → lesson revision → exercises → feedback → mastery/review → resume,
and direct practice (Level → category/topic → optional revision →
exercises). Checked dashboards, quiz routes/engine, progress/mastery/review,
multi-session resume, offline, authoring, generation, content QA,
accessibility markup, mobile layout, legacy route/schema compatibility, and
state/navigation duplication — by running the project's own verification
suites (not by inspection alone) and by performing one real fresh-directory
production build, since that is the one condition none of Agents 73–83's
"0 drift" self-checks exercised (see Defect 1).

## Pass/fail matrix

| Area | Result | Evidence |
|---|---|---|
| Placement → recommendation → course → journey → lesson → exercises → resume | PASS | `placement-engine`, `placement-blueprint-v2`, `journey-ui`, `session-resume`, `review-mastery-integration-agent80` vitest suites (all green) |
| Direct practice (Level → category/topic → revision → exercises) | PASS | `quiz-question-experience`, `quiz-grouping-packing`, `quiz-manifest-paths` vitest suites |
| Existing dashboards | PASS | `homepage-agent79`, `production-quiz-profiles` suites; manifests present per level in build output |
| Quiz routes / quiz engine | PASS | `quiz-question-experience`, `graded-question-consistency` (fixed, see Defect 2), `runtime-content-loader`, `runtime-v2-adapter` |
| Progress / mastery / review | PASS | `skill-mastery`, `mastery-review-ui`, `review-scheduler`, `review-mastery-integration-agent80`, `skill-level-recommendations` |
| Multi-session resume | PASS | `session-resume` (fixed, see Defect 2) |
| Offline | PASS | `offline-packs`, `test_offline_packs_ui.py`, `test_offline_core_package_integrity.py`; offline pack build succeeds (7 packs) |
| Authoring | PASS | `authoring-raw-import`, `authoring-draft-autosave`, `authoring-scale-incremental-validation`, `authoring-pagination`, `rich-question-authoring` |
| Generation | PASS | `generation/` suite, 62/62 |
| Content QA | PASS | `content_qa.py --strict`: 0 errors, 7 pre-existing non-blocking `CQ-D06` warnings (documented by Agent 81); `course_schema.py`: 0/0; `course_content_qa.py --strict` (Agent 83): 0/0/0 |
| Accessibility (markup-level, static) | PASS (regression tests only) | `tests/e2e/accessibility.spec.js` exists and is wired into CI, but could not execute here — see Limitation below |
| Mobile behavior | PASS (regression tests only) | `quiz-flow.spec.js` covers mobile-safari viewport/touch; could not execute here — see Limitation below |
| Legacy routes/schema compatibility | PASS | Legacy `mylingo.session.v1` key still read and migrated (`LEGACY_SESSION_KEY` in `quiz.html`); frozen `current`/`totalQuestions` progress schema still uses raw question count intentionally (Agent 83/prior handoffs); no removed routes found |
| No duplicated state / conflicting navigation | PASS | Session keys are versioned and namespaced (`mylingo.sessions.v2`, `mylingo.sessions.v3.*`, legacy `mylingo.session.v1`) with no collisions found across `quiz.html` / `course-progress.js` |
| **Fresh (non-in-place) production build** | **FAIL → FIXED** | See Defect 1 |
| Full JS test suite (`npx vitest run`) | FAIL → FIXED (228/228) | See Defect 2 |
| Full Python test suite | PASS | 119/119 (root discover) + 70/70 (`tests/unit`) + 62/62 (`generation/`) |
| Scale/throughput regression gate | PASS | `scripts/scale_benchmark.py --rows 3000`: 35,730 rows/sec (floor: 500 rows/sec) |

## Defects

### Defect 1 — CRITICAL — Course/Lesson/Journey feature silently dropped from real release builds
**Owner at time of introduction:** predates Agent 84; the copy-list in
`build.py` was never updated when Agents 73–81 added `site/courses/` and
`site/course_content/`.
**Root cause:** `copy_runtime_assets()` in `build.py` copies a hardcoded
list of top-level paths (`shared`, `main`, `placement`, plus a few files)
from `--src-root` into `--out`. This list predates the course feature and
was never extended to include `courses/` or `course_content/`.
**Why every prior "0 drift" check missed it:** every self-verification
since Agent 73 rebuilt with `--src-root site --out site` — source and
destination are the *same directory*, so the missing copy was a silent
no-op (the files were already sitting there from source control, not from
the copy step). The real CI pipeline (`ci/release_gate.sh`, invoked by
`.github/workflows/release.yml`) builds into a **fresh** `dist-release`
directory. Reproducing that exact condition here (`build.py build
--src-root site --out /tmp/dist-release2`, a directory that did not
previously exist) surfaced the bug immediately: `courses/` and
`course_content/` were entirely absent from the output.
**Impact if shipped:** every real production release would have been
missing the entire Course/Lesson/Journey feature — no `/courses/` pages,
no course graph data — while every other page (levels, quizzes, offline,
placement) shipped normally. This is caught as a hard build failure
today only because `offline_packs.py`'s core-manifest step (Agent 24)
happens to require those exact paths; if that coincidence didn't exist,
this would have shipped with **0 errors and 0 warnings** reported by
`verify-output`, which has no awareness of `courses/`/`course_content/` at
all.
**Fix:** added `"courses", "course_content"` to the copy list in
`copy_runtime_assets()` (`build.py`, one line).
**Verification:** fresh-directory build now produces
`courses/{index,course,lesson,journey}.html` and
`course_content/{courses,units,lessons}.json` in the output; `verify-output`
and `release-gate` both PASS (0 errors, 0 warnings) against that fresh
build.
**Regression test added:** `tests/unit/test_agent84_build_copies_course_content.py`
— builds into a real fresh temp directory (never the source tree) and
asserts every course/journey asset is present. This is the one test in the
suite that specifically exercises the fresh-directory case; every prior
build-related test builds in place.
**Recommendation for future agents:** any new top-level directory added
under `site/` for a hand-authored (non-generated) feature must be added to
`copy_runtime_assets()`'s list in the same change, and verified with a
build into a directory that is *not* `site` itself — in-place builds do
not exercise the copy step.

### Defect 2 — MINOR — Two stale literal-source-string test assertions
**Root cause:** two vitest tests (`tests/unit/session-resume.test.js`,
`tests/unit/graded-question-consistency.test.js`) assert on exact
substrings of `site/shared/quiz.html`. Two prior, unrelated, functionally
correct edits changed the underlying source without updating these
assertions:
- The Start/Resume button label copy changed from `'Start Over'`/
  `'Start Quiz'` (Title Case) to `'Start over'`/`'Start quiz'` (sentence
  case), consistent with the rest of the UI's button copy.
- The question counter update (`$('counter').textContent=...`) was
  wrapped in the `setTextSmooth()` helper (a fade/pop animation utility
  used elsewhere in the same file) instead of a direct assignment.
Neither change altered behavior in a way the audit's "must check" list
cares about; both are legitimate UX/consistency refinements. The tests
were just never updated to match, so `npx vitest run` reported 2 failed /
226 passed instead of a true 228/228 baseline — a false-negative signal
that would erode trust in the suite over time if left unfixed.
**Fix:** updated both assertions to the current, correct source strings.
No application code changed for this defect.
**Verification:** `npx vitest run` → 228/228 passed (32/32 files).

## Guardrails honored
- No silent repair of ambiguous content — both defects are unambiguous
  (a build step dropping an entire directory; test assertions describing
  code that no longer exists) and are documented above with full root
  cause, not just patched over.
- Did not touch `content_qa.py`, `course_schema.py`, `course_content_qa.py`,
  `master_source.csv`, or any `site/**` data — the one-line `build.py` fix
  only adds missing paths to an existing copy list; the checked-in `site/`
  tree was not modified (in-place builds were already correct, which is
  exactly what masked the bug).
- Existing quality contracts (Agents 24, 26, 27, 69–83 gates) were re-run,
  not re-implemented or loosened.

## Verification run (final)
- `python3 -m unittest discover -s . -p 'test_*.py' -t .`: **119/119 pass**.
- `cd generation && python3 -m unittest discover`: **62/62 pass**.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'`: **70/70 pass**
  (includes the new Agent 84 regression test).
- `npx vitest run`: **228/228 pass** (32/32 files).
- `python3 build.py validate --input master_source.csv`: 300 rows, 60
  quizzes, 0 errors, 0 warnings.
- `python3 content_qa.py --input master_source.csv --strict`: 0 errors, 7
  pre-existing non-blocking warnings, score 93/100.
- `python3 course_schema.py validate`: 0 errors, 0 warnings.
- `python3 course_content_qa.py --strict`: 0 errors, 0 warnings, 0 info.
- `node --check` on all 17 shipped `site/**/*.js`: 17/17 pass.
- **Fresh-directory build** (`--src-root site --out <new dir>`) →
  `verify-output` → `release-gate`: **PASS, 0 errors, 0 warnings** (was
  BLOCKED with 4 errors before the Defect 1 fix).
- `python3 scripts/scale_benchmark.py --rows 3000`: 35,730.1 rows/sec
  (floor: 500 rows/sec) — PASS.

## Limitation (unchanged from Agents 79–81)
`npx playwright install chromium` fails in this sandbox: `403 Host not in
allowlist: cdn.playwright.dev`. `tests/e2e/accessibility.spec.js` and
`tests/e2e/quiz-flow.spec.js` (mobile-viewport/touch-target and screen-reader
checks) are wired into `ci/release_gate.sh` and CI but cannot be executed in
this environment. Every non-browser-dependent gate those specs sit
downstream of (build, release gate, unit tests) is verified green above.

## Files changed
- `build.py` — added `"courses", "course_content"` to
  `copy_runtime_assets()`'s copy list (Defect 1 fix).
- `tests/unit/session-resume.test.js` — updated one stale assertion
  (Defect 2 fix).
- `tests/unit/graded-question-consistency.test.js` — updated one stale
  assertion (Defect 2 fix).

## Files added
- `tests/unit/test_agent84_build_copies_course_content.py` — regression
  test for Defect 1: rebuilds into a real fresh temp directory (not
  `site`) and asserts `courses/` and `course_content/` survive.
- `AGENT_84_INTEGRATION_AUDIT.md` — this report.

## Verdict
**READY**, with one real production-blocking defect found and fixed during
this audit (Defect 1) and the JS test suite restored to a true 228/228
green baseline (Defect 2). All critical learner-journey paths, content QA,
generation, authoring, offline, and legacy-compatibility checks pass. The
two browser-dependent gates (accessibility, mobile E2E) remain wired into
CI and blocking-by-design but unexecutable in this sandbox — same
documented environment limitation as Agents 79–81, not a new finding.

## Next task
A human with CI access should merge this and let a real GitHub Actions run
execute the two Playwright-dependent gates against the now-fixed build
output — this is the first time those gates will run against a build that
actually contains `courses/`/`course_content/`, since every prior CI run
would have hit Defect 1 and been blocked before reaching them (or, before
the offline-packs coincidence existed, could theoretically have shipped
without the feature — see Defect 1). No further audit-scope work is
pending.

## Do not change (Agent 84 additions)
- `copy_runtime_assets()`'s expanded list — do not revert to the
  pre-course-feature list.
- `test_agent84_build_copies_course_content.py` — this is the only test
  in the suite that exercises a real fresh-directory build; do not modify
  it to build in place, which would silently defeat its purpose.
