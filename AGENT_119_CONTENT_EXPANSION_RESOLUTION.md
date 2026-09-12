# AGENT 119 — Content Expansion Resolution (96/97 blocker)

## Environment disclosure
No network access, no browser. All checks below are the repo's own
scripts and `unittest` suites run directly on disk.

## Decision made

Agent 109/118 left one release blocker: hand-authored revision/mixed
lessons are schema-legal but conflicted with Agent 74's byte-for-byte
drift-guard test, and picking a resolution unilaterally was flagged as
out of scope for that pass. This agent makes and implements that
decision: **option (a)** — split "mechanical baseline" from "curated
additions" into two explicit, version-controlled inputs, composed
deterministically.

## What changed

- `curated_lessons.json` (new) — the curated additions, as data, not
  code. Two lessons, reusing only already-published quiz_ids:
  - `course-a2-unit-02-lesson-02` ("Everyday Vocabulary Review", Mixed,
    reuses `a2-010` + `a2-009`)
  - `course-c1-unit-04-lesson-03` ("Academic Writing Integration",
    Mixed, reuses `c1-005` + `c1-009` + `c1-004`)
  Both populate the previously-unused optional `revision.key_terms`,
  `revision.examples`, and `revision.estimated_minutes` fields.
- `apply_curated_content.py` (new) — composes `map_quiz_catalog.py`'s
  unchanged mechanical baseline with `curated_lessons.json`, then writes
  `course_content/{courses,units,lessons}.json`. This is now the single
  generation entrypoint; `map_quiz_catalog.py` itself is untouched and
  still works standalone (see new regression test).
- `test_course_content_mapping_agent74.py` — widened (not weakened) the
  drift guard: `test_shipped_content_matches_fresh_generation` now
  compares shipped content against a fresh run of the *composed*
  pipeline (baseline + curated) instead of the baseline alone. Added
  three new tests: the raw mapper is still deterministic/unchanged on
  its own; every curated addition reuses only published quiz_ids; no
  curated lesson_id collides with a baseline one.
- `course_content/{courses,units,lessons}.json` and their `site/`
  mirror — regenerated via `apply_curated_content.py` + `build.py build`.
  60 baseline lessons + 2 curated = 62 lessons, 19 units (unchanged
  count), 6 courses (unchanged). No existing course/unit/lesson record
  was altered — new lessons only appended to `lesson_ids`.

## Required coverage — verified

- More than one CEFR level: A2 and C1. ✓
- More than one course/category: `course-a2` (Vocabulary/Mixed) and
  `course-c1` (Academic English/Mixed). ✓
- Multiple units, multiple lessons: `course-a2-unit-02` (1→2 lessons),
  `course-c1-unit-04` (2→3 lessons). ✓
- Different exercise counts: 2 quizzes vs. 3 quizzes per lesson. ✓
- Optional revision content: `key_terms`/`examples`/`estimated_minutes`
  populated for the first time in this dataset. ✓
- Lesson completion/progress: no new progress system — these lessons
  flow through the existing single quiz-completion/progress path
  exactly like every other lesson (verified by
  `test_course_journey_integration_agent111.py`, unchanged and green).
- No duplicate quiz content: zero new quiz rows added to
  `master_source.csv`; both additions reuse existing published quizzes,
  enforced by a dedicated new test.

## Tests

- `python3 -m unittest discover -p "test_*.py"` (root + generation/):
  **128/128 OK** (was 125; +3 new tests).
- `python3 -m unittest discover -s tests/unit -p "test_*.py"`: **105/105 OK**.
- `python3 course_schema.py validate`: 0 errors, 0 warnings.
- `python3 course_content_qa.py`: 0/0/0.
- `python3 audit_course_mapping.py`: PASS, no orphans; 5 informational
  REUSED QUIZ notes (expected — both new lessons reuse existing quizzes).
- `python3 content_qa.py --strict`: 0 errors, 7 warnings (unchanged from
  baseline — no new warnings introduced), score 93/100.
- `node --check` on all `.js` files: clean.
- `python3 build.py build --src-root .` then `verify-output`: 0/0.
- `python3 build.py release-gate`: **PASS; 0 errors, 0 warnings.**

## Acceptance criteria (Agent 109's original list) — final status

| Criterion | Status |
|---|---|
| Every new course/unit/lesson validates | PASS |
| Every exercise reference resolves | PASS |
| No orphan lesson/course | PASS |
| No duplicate quiz content | PASS |
| Existing courses/routes unchanged | PASS — 0 diff outside additions |
| Additional course/lesson content exists | **PASS — shipped** |

AGENT: 119
STATUS: PASS
FILES CHANGED:
- `curated_lessons.json` (new)
- `apply_curated_content.py` (new)
- `test_course_content_mapping_agent74.py` (widened drift guard + 3 new tests)
- `course_content/units.json`, `course_content/lessons.json` (2 lessons appended, 2 unit lesson_ids extended; courses.json unchanged)
- `site/course_content/units.json`, `site/course_content/lessons.json` (rebuilt mirror)
- `AGENT_119_CONTENT_EXPANSION_RESOLUTION.md` (new, this file)
TESTS: see above
RESULTS: see above — all green, release-gate PASS
KNOWN LIMITATIONS:
- No network/browser in this environment: Playwright-dependent live
  checks remain unverified beyond their unit/static equivalents,
  consistent with every prior agent's disclosure since 106.
NEXT AGENT:
- 120 (final release gate re-run), now that the sole documented release
  blocker is resolved.
RELEASE BLOCKERS:
- None remaining that this environment can detect.
