# FINAL_CONSISTENCY_REPORT — Agent 81 (Final Integration + Consistency Gate)

## Verdict: **READY**
(with one pre-existing, non-blocking browser-verification gap — see below)

## Scope
Integrator pass only. No new features, no content generation, no QA weakening.
Re-ran every canonical gate from `ci/release_gate.sh` by hand (this sandbox has
no path to `cdn.playwright.dev`/browser binaries, so each non-browser stage was
run individually with the exact same commands/flags the script uses), audited
cross-agent consistency, and fixed the one real drift found.

## Gates re-run and results

| Gate | Command | Result |
|---|---|---|
| Schema/row validation | `python3 build.py validate --input master_source.csv` | **PASS** — 300 rows, 60 quizzes, 0 errors, 0 warnings |
| JS syntax gate | `node --check` on all 16 non-vendor `site/**/*.js` | **PASS** — 16/16 |
| Strict content QA | `python3 content_qa.py --input master_source.csv --strict` | **PASS** — 0 errors, 0 *blocking* warnings, exit 0 (see Known non-blocking item) |
| Clean build (scratch dir) | `python3 build.py build --input master_source.csv --out <scratch> --src-root site` | **PASS** — 74 files, deterministic |
| Drift check (self-build) | `python3 build.py build --out site --src-root site` | **PASS** — 0 written / 66 unchanged, 0 written / 9 packs unchanged → checked-in `site/` matches source exactly |
| Determinism (2nd independent build) | diff of two independent scratch builds | **PASS** — JSON layer byte-identical; pack `.zip` bytes differ only by member mtimes (pre-existing, documented by Agent 80, not source drift) |
| Output verification | `python3 build.py verify-output --out <scratch>` | **PASS** — 0 errors, 0 warnings |
| Release gate | `python3 build.py release-gate --input master_source.csv --site <scratch>` | **PASS** — 0 errors, 0 warnings |
| Python unit tests | `unittest discover` (root) + `generation/` | **PASS** — 80/80 + 62/62 |
| JS unit tests | `npx vitest run` | **PASS** — 209/209 (28/28 files) — **1 was failing before this agent's fix; see below** |
| Scale throughput regression | `scripts/scale_benchmark.py --rows 3000` | **PASS** — 26,768.8 rows/sec vs. 500 rows/sec floor (≈45s projected for 1.2M rows) |
| Accessibility E2E (axe-core) | `playwright test accessibility.spec.js` | **NOT RUN** — sandbox has no network path to `cdn.playwright.dev` (403, host not in allowlist). Confirmed environment-blocked, not a wiring defect (same finding as Agents 79/80). |
| Core quiz-flow E2E | `playwright test quiz-flow.spec.js` | **NOT RUN** — same browser-binary limitation |

## Consistency issue found and fixed
**`production_quiz_profiles.json` / `authoring/mylingo-admin.html` were stale
against `master_source.csv`.** Agent 72's CQ-B07 CEFR/category coverage policy
added `A1/Vocabulary` and `A2/Vocabulary` rows to `master_source.csv` (raising
19 total level+category combinations) but never updated Agent 16's profiles
config, its inline authoring-app mirror, or the test asserting the combo count
(hardcoded to 17). This caused a real, reproducible `vitest` failure
(`expected 19 to be 17`).

**Fix (4 files, no behavior change to content/QA):**
- `production_quiz_profiles.json` — added `a1-vocabulary`/`a2-vocabulary`
  profiles (same bounds as the sibling Grammar profiles) + a `_decision_log`
  entry explaining the change.
- `authoring/mylingo-admin.html` — added the same two entries to its inline
  `PRODUCTION_QUIZ_PROFILES` mirror so the standalone offline authoring app
  doesn't silently diverge from the canonical JSON.
- `tests/unit/production-quiz-profiles.test.js` — updated the hardcoded
  17/16 → 19/18 assertions to match current source data.
- `08_PRODUCTION_QUIZ_PROFILES.md` — corrected the narrative/table and
  acceptance criteria to describe 18 profiles + 1 deferred (was 16 + 1).

This is documentation/config catch-up for an already-shipped, already-tested
content policy (Agent 72) — it does not change `master_source.csv`, QA
severity, or CI blocking behavior. Re-ran the full non-browser gate sequence
and both Python/JS unit suites after the fix; all pass (table above reflects
post-fix state).

## Known non-blocking item carried forward (not fixed by this agent)
`content_qa.py --strict` reports **7 CQ-D06 warnings** (within-quiz
near-duplicate stem/answer/correct-answer signatures in `b2-007`, `c1-007`,
`c1-010`, `c2-002`, `c2-004`, `c2-007`, `c2-010`). These do **not** block
`--strict` (exit 0) because Agent 73, who introduced CQ-D06, explicitly left
it out of Agent 76's `STRICT_BLOCKING_CODES` set, tuning it "warning-only" and
noting a future agent could promote it once the flagged rows are resolved.
Per this agent's integrator-only mandate ("no new features," "never weaken
QA," minimal production-file changes), rewriting quiz content to eliminate
near-duplicates is out of scope for a consistency gate — it is a content-editing
task, not an integration/consistency bug. Flagging explicitly rather than
silently passing it through:
- **Not a regression** — present since Agent 73, unchanged by any agent since.
- **Not silently hidden** — visible in every `content_qa.py` run's warning
  count and report.
- **Bounded** — 7 items out of 300 rows / 60 quizzes, all previously
  hand-verified as genuine (not false positives) by Agent 73.

## Confirmed intact: Agents 48–67 scale safeguards
- Deterministic answer-position rebalancing (`sha256(quiz_id:question_number)`
  seed) — unaffected; `quality_contract.json` rules unchanged.
- Offline pack manifest/dependency graph — `packs.json`, `core-manifest.json`
  resolve correctly in the fresh build; 7/7 packs built.
- Scale-throughput floor — re-verified at 3,000-row synthetic scale (see table).
- No mass content generation was performed at any point in this pass.

## Package cleanliness
- Exactly one live authoring app (`authoring/mylingo-admin.html`); no
  duplicate/reference copies in the shipped tree.
- `.gitignore` correctly excludes `/dist-release/`, `/dist-release-a11y-report/`,
  `/content_qa/`, `/RELEASE_GATE_REPORT.md`, `__pycache__/`, `node_modules/`.
- No stale `dist-release/`, root `content_qa/`, or `RELEASE_GATE_REPORT.md`
  present in the delivered tree (confirmed absent both before and after this
  pass; scratch build/QA output for this audit was written to `/tmp`, never
  to the package).

## Exact remaining blocker for a real CI run (not this sandbox)
The two Playwright specs (`accessibility.spec.js`, `quiz-flow.spec.js`) must
run in an environment with network access to Playwright's browser CDN (e.g.
GitHub Actions `ubuntu-latest`, as already wired in `.github/workflows/release.yml`
per Agent 79). Everything those specs depend on (fresh build, release gate,
JS/Python tests) is verified green in this pass; only the browser-execution
step itself is unverified here.

## Next dependency
None — Agent 81 is the final integrator. Next action is a real CI run (GitHub
Actions) to execute the two browser-dependent Playwright gates against this
verified artifact.
