# Agent 83 — Content QA: Course/Lesson/Journey Content Graph

## Scope
Quality-checked the full Course → Unit → Lesson → Exercise(quiz) graph:
`course_content/{courses,units,lessons}.json`, its `site/course_content/`
mirror, `master_source.csv` (60 quizzes / 300 question rows), every
level's built `site/{level}/quizzes.json` manifest, and every physical
quiz JSON file those manifests point at (`site/grammar|vocabulary|writing|
academic-english/**/*.json`).

## What already existed (reused, not re-derived)
`course_schema.py` (Agent 73) already enforces the structural contract in
isolation — duplicate IDs, dangling course/unit/lesson references, enum
values, `exercise_quiz_ids` existing in `master_source.csv`, duplicate
sibling `order`, revision-summary length, YouTube URL shape (`CC-E01`
through `CC-E10`, `CC-W01` through `CC-W05`). This agent's script
(`course_content_qa.py`) calls `course_schema.validate()` directly and
does not duplicate or weaken any of it, per the guardrail.

## New deliverable: `course_content_qa.py`
Added the cross-graph and cross-site checks from this handoff that a
single-directory schema check can't see, each with a `CQG-*` code:

| Code | Severity | Detects |
|---|---|---|
| `CQG-E01` | error | Same `quiz_id` listed more than once in one lesson's `exercise_quiz_ids` (duplicate/conflicting mapping). |
| `CQG-E02` | error | A lesson's referenced quiz is missing from the built `site/{level}/quizzes.json` manifest, or the manifest's `file` path doesn't exist on disk — drift between the CSV and the shipped site. |
| `CQG-E03` | error | A quiz's actual question count disagrees with either its manifest entry or its `master_source.csv` row count — content that bypasses the quality contract by disagreeing with the built site rather than the CSV. |
| `CQG-E04` | error | `site/course_content/*.json` has drifted out of sync with canonical `course_content/*.json` (stale course graph served to learners). |
| `CQG-E05` | error | A `lesson_id` is claimed by more than one unit's `lesson_ids` — the one shape that turns the course→unit→lesson tree into a graph capable of ambiguous/circular journey traversal (see disposition below). |
| `CQG-W01` | warning | A `published` quiz in `master_source.csv` that no lesson references (orphaned content). |
| `CQG-W02` | warning | A lesson's course level doesn't match the level of a quiz it references (wrong-level mapping). |
| `CQG-W03` | warning | A question's media reference uses an unsafe URI scheme (`javascript:`, `data:text/html`, `vbscript:`). |

Each check was validated against synthetic broken fixtures (one fault
injected at a time into a scratch copy of the real graph) before being
run against the real repository — see `test_course_content_qa_agent83.py`.

## Result on the real content
```
$ python3 course_content_qa.py --strict
# Course Content QA (Agent 83)

0 error(s), 0 warning(s), 0 info.
```
Also reconfirmed unchanged, pre-existing green baselines (not touched by
this agent):
- `python3 course_schema.py validate --content-dir course_content --master-source master_source.csv`: 0 errors, 0 warnings.
- `python3 build.py validate --input master_source.csv`: 300 rows, 60 quizzes, 0 errors, 0 warnings.
- `python3 content_qa.py --input master_source.csv --strict`: 0 errors, 7 warnings (same pre-existing non-blocking `CQ-D06` warnings Agent 81 already documented).

## Explicit disposition of every "MUST DETECT" item
| Item | Result |
|---|---|
| Broken course/unit/lesson/exercise references | Clean — `CC-E04`–`CC-E08` + new `CQG-E02` (site-level) all report 0. |
| Orphan lessons and quizzes | Clean — 0 orphan lessons (all 60 `lesson_id`s reachable from a unit); 0 orphan quizzes (all 60 published quizzes in `master_source.csv` referenced by exactly the lessons Agent 74 mapped). |
| Duplicate IDs | Clean — `CC-E01`, 0. |
| Duplicate/conflicting mappings | Clean — 0 duplicate `exercise_quiz_ids` within a lesson (`CQG-E01`); 0 lessons claimed by two units (`CQG-E05`). |
| Wrong level/category/topic | Clean — 0 level mismatches (`CQG-W02`); 0 category mismatches (`CC-W01`). |
| Empty or excessively long revision summaries | Clean — every lesson has a non-empty summary ≤400 chars (`CC-E02`/`CC-W02`, 0 findings). |
| Malformed YouTube URLs | **No data to check yet** — every lesson's `youtube_url` is currently `null` (no lesson has video content). `CC-W04` runs and would fire on the first malformed one; nothing to disposition beyond "checked, currently empty." |
| Missing required lesson fields | Clean — `CC-E02`, 0. |
| Circular journey references | **Structurally impossible today, verified, not just assumed.** The journey has no prerequisite/next-lesson graph — order is derived purely from `course.unit_ids` → `unit.order` → `lesson.order` at render time (see `journey.html`). The only way this schema could create a cycle is a lesson with two parents, which `CQG-E05` checks for directly and finds 0 instances. If a prerequisite graph is ever added, `CQG-E05`'s approach (single-parent-ownership check) should be extended to that new structure rather than assumed safe. |
| Unsafe or unusable presentation/media references | **No media content to check yet** — 0 of 60 lessons set `presentation_url`, and 0 of 360 questions across all 6 levels set an image/audio `media` field. `CQG-W03` scans every question's media URI scheme regardless and would fire on the first unsafe one (verified against a synthetic `javascript:` fixture); nothing to disposition beyond "checked, currently empty." |
| Content that bypasses existing quality contracts | Clean — `CQG-E02`/`CQG-E03` cross-check every lesson's referenced quiz against the *built* site (manifest + physical file), not just the CSV, and found 0 instances of CSV/site drift. |

## Guardrails honored
- Did not silently repair anything — every finding above is a detect-and-report check; the real dataset needed zero fixes.
- Did not touch `course_schema.py`, `content_qa.py`, `build.py`, or `master_source.csv` — the existing quality contracts are reused via `cs.validate()`, not re-implemented or loosened.
- No `site/**` or `course_content/**` data was modified.

## Files added
- `course_content_qa.py` — the QA script (run with `--strict` to fail CI on warnings too).
- `test_course_content_qa_agent83.py` — 10 tests: 1 regression guard against the real repo, 1 fixture-harness sanity check, 8 exercising each new `CQG-*` code via synthetic fixtures. All pass.
- `COURSE_CONTENT_QA_REPORT.md` — this report.

## Verification run
- `python3 -m unittest test_course_content_qa_agent83 -v`: 10/10 pass.
- `python3 -m unittest discover -s . -p 'test_*.py' -t .`: 119/119 pass (includes this agent's 10 new tests plus every pre-existing root-level and `generation/` suite — no regressions).
- `cd generation && python3 -m unittest discover`: 62/62 pass (untouched).

## Verdict
**No defects found in the shipped course/lesson/journey content graph.**
Every item in the "must detect" list was implemented as a real,
fixture-verified check (not asserted from inspection) and each currently
reports clean against the live 6-course / 19-unit / 60-lesson / 60-quiz /
300-question dataset. The two items with no current data to exercise
(YouTube URLs, media references) still run on every future quiz/lesson
addition via `course_content_qa.py`, so they remain load-bearing checks
rather than one-off audits.
