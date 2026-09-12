# AGENT 116 — Regression / System Contract Audit

## Mission
Verify that work through Agent 115 did not damage or fork any existing MYLINGO
system (learner state, quiz/scoring, offline, authoring, content pipeline),
and that the Course → Unit → Lesson → Quiz → Learner-state chain remains a
single coherent system.

## Method / evidence
All checks below were executed directly against the package contents in this
environment (no network, no browser — consistent with the documented
environment limitation from Agent 106/115).

1. **Full existing test suite** — `python3 -m unittest discover -s tests/unit
   -p 'test_*.py'`: **105/105 pass**, 0 failures/errors.
2. **JS syntax gate** — `node --check` on every `.js` file in the repository
   (55 files, not just `site/`): **0 syntax errors**.
3. **Content QA** — `python3 content_qa.py --input master_source.csv`:
   **0 errors, 7 warnings, 62 info, score 93/100** (matches the improving
   trend recorded in `LATEST_AUDIT_INPUT.md`; no regression in error count).
4. **Master source validation** — `python3 build.py validate --input
   master_source.csv`: **300 rows, 60 quizzes, 0 errors, 0 warnings**.
5. **Data-integrity chain (Course → Unit → Lesson → Quiz)**:
   - 6 courses, 19 units, 60 lessons.
   - 0 orphan unit→course references, 0 orphan lesson→unit references.
   - All 60 `exercise_quiz_ids` referenced by lessons resolve to an entry in
     a per-level `quizzes.json` manifest (0 missing).
   - 60/60 manifest quiz IDs are unique across all level manifests —
     **0 cross-manifest duplicate quiz IDs** (no forked quiz content).
6. **Learner-state model** — inspected `gamification.js`,
   `skill-mastery.js`, `placement.js`, `review-scheduler.js`,
   `course-progress.js`:
   - Each concern (progress, gamification, skill mastery, review
     scheduling, placement, orientation) owns exactly one
     `localStorage` key (`mylingo.skill-mastery.v1`,
     `mylingo.assessment.v1`, `mylingo.review-scheduling.v1`, etc.).
   - The multi-session export/import path in `gamification.js`
     (`keyBySection`) enumerates all of these under one map — a single
     coherent backup/restore surface, not parallel/forked stores.
   - No second implementation of scoring (`correctIndex`/`correct_index`)
     found outside `authoring-validation.js` and `runtime-v2-adapter.js`;
     no second quiz engine found outside `quiz-packer.js` +
     `shared/quiz.html`'s existing runtime.
7. **Offline/service worker** — `sw.js` precache is documented and
   implemented as sourced only from `offline/core-manifest.json` (single
   source of truth, no second manifest); `offline/packs.json` and the six
   level `.zip` packs plus `core.zip` are present and match the existing,
   already-tested (`test_offline_core_package_integrity.py`,
   `test_incremental_offline_packs.py`) contract — both passing in (1).
8. **Package integrity** — extracted the original handoff zip fresh and
   diffed its file list against the audited working copy: **426/426 source
   files present, 0 removed, 0 renamed**. The only deltas were transient
   `__pycache__/*.pyc` byproducts of running the Python test suite, which
   were deleted before repackaging.

## Findings
- **No regressions** in legacy functionality were found: existing test
  suite, content QA, master-source validation, and data-integrity checks
  all pass at the same or better levels than the last recorded state.
- **No forked systems** were found: quiz system, scoring system, progress
  system, mastery system, and learner-state model each remain single,
  canonical implementations referenced consistently across the codebase.
- **No source files were changed** by this audit — this was a read-only
  verification pass, so there is nothing to regress.

## Known limitations (carried forward, not resolved by this agent)
- No real browser is available in this environment (no network for
  Playwright/vitest, no `node_modules`), so this audit could not execute
  `test:e2e`/`test:a11y` or otherwise exercise the UI live. This mirrors the
  limitation already recorded by Agents 106 and 115 and is **not** treated
  as a pass for those checks — it is reported as untested here, consistent
  with rule 10/11 of the master handoff (never claim browser verification
  without an actual browser).
- axe-core remains unavailable for the same reason (network disabled, not
  bundled).

## Acceptance criteria status
- No forked quiz/scoring/progress/mastery/learner-state system: **PASS**
  (verified above).
- No regression in legacy functionality: **PASS** for everything
  executable in this environment (105/105 tests, JS syntax, content QA,
  master-source validation, data-integrity chain, package integrity);
  **NOT VERIFIED** for live-browser behavior (pre-existing, documented
  environment limitation, not a new gap introduced by this agent).

FILES CHANGED: `AGENT_116_SYSTEM_REGRESSION.md` (new) — no `site/` or other
source changed.

NEXT AGENT: 117 — Release Candidate Forensic Audit.
