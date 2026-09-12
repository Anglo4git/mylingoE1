# Agent 66 — Scale release gates

## Status
COMPLETED

## Problem
Agents 48–65 hardened individual subsystems (authoring, storage, build,
QA, offline) against the 12,000×100 = 1,200,000-question scale target, and
Agent 65 added a benchmark harness that *measures* throughput. Nothing yet
*enforced* scale limits at release time: a regression that dumped a whole
level's dataset into one quiz file, let a level manifest grow unbounded,
or silently collapsed validation throughput would not fail CI.

## Changed
- `build.py`:
  - Added three named scale budgets: `MAX_QUESTIONS_PER_QUIZ_FILE` (300),
    `MAX_QUIZ_FILE_BYTES` (250,000), `MAX_MANIFEST_FILE_BYTES` (3,000,000).
    Sizing: the current 5-question sample quiz file is ~1.9 KB (~375
    bytes/question), so a 100-question production quiz is ~40 KB — the
    300-question / 250 KB budget leaves ~6x headroom before blocking. A
    2,000-quiz level manifest (12,000 quizzes ÷ 6 levels) with today's
    ~200-byte manifest entries is ~400 KB; the 3 MB budget leaves ~7x
    headroom while still catching a whole-corpus dump into one file.
  - Added `check_scale_budgets(out_dir)`: walks the already-generated site
    one file at a time (stats every quiz file and level manifest; loads
    each quiz file's JSON only long enough to count its `questions`, then
    releases it) and returns blocking errors/warnings. Never holds more
    than one file in memory, consistent with the streaming approach the
    rest of the release gate already uses.
  - Wired `check_scale_budgets` into the `release-gate` command: its
    errors/warnings are merged into the existing blocking-error list, and
    `RELEASE_GATE_REPORT.md` now prints the active budget values plus a
    PASS/BLOCKED result exactly like the other gate categories.
- `ci/release_gate.sh`: added a bounded scale-throughput regression check
  after the existing release gate. It re-runs Agent 65's harness
  (`scripts/scale_benchmark.py`, default 3,000 synthetic rows — no
  repository content touched, self-deleting temp fixture) and fails the
  script if `rows_per_second` drops below `MYLINGO_MIN_ROWS_PER_SEC`
  (default 500, deliberately far below any measured throughput so normal
  hardware/CI variance doesn't trip it — it exists to catch a
  quadratic-time or whole-dataset-in-memory regression, not to track
  day-to-day performance). Row count and floor are both env-overridable.
- `tests/unit/test_scale_release_gate.py`: focused coverage for
  `check_scale_budgets` — normal-sized site passes clean; a quiz file over
  the question-count budget is blocked; a quiz file over the byte budget
  is blocked; an oversized manifest is blocked; a missing site directory
  is a no-op rather than a crash.

## Verification
- New test file: 5/5 passed.
- Regression run of related suites (`test_build_streaming`,
  `test_incremental_build`, `test_incremental_offline_packs`,
  `test_metadata_date_contract`, `test_ranking_validation_semantics`,
  `test_scale_release_gate`, `test_scale_benchmark`): 30/30 passed.
- Full pipeline re-run against the actual dataset: `build.py build` →
  `verify-output` → `release-gate` all passed with 0 errors/0 warnings,
  and the release gate report shows the new "Scale budgets" line.
- Manually exercised the new `ci/release_gate.sh` throughput-check snippet
  standalone: 18,270 rows/sec on a 3,000-row synthetic run, correctly
  PASS against the 500 rows/sec floor.
- `python3 -m py_compile build.py` passed; `bash -n ci/release_gate.sh`
  passed.

## Limitation
No real-browser verification; this environment cannot run Playwright/CI
end-to-end, so the full `ci/release_gate.sh` script (which also runs
accessibility and quiz-flow E2E) was not executed start-to-finish — only
the new throughput-gate snippet was verified standalone, plus the Python
gate portions via direct `build.py` invocation. The byte/question budgets
are sized against the current small sample dataset's per-question cost;
if real production question payloads are meaningfully heavier (e.g. much
longer explanations or many more answer options per question), the budget
constants in `build.py` may need a one-line adjustment.
