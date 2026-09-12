# AGENT 109 — Content Expansion Foundation

## Environment disclosure (read first)

This agent ran with **no network access** and **no real browser**. Nothing
below claims browser verification or live axe-core output. Everything
reported here was produced by running the repo's own scripts
(`course_schema.py`, `map_quiz_catalog.py`, `audit_course_mapping.py`,
`content_qa.py`, `course_content_qa.py`, `build.py`) and its stdlib
`unittest` suites directly on disk. `pytest` could not be installed
(`pip install pytest` fails with no network), so tests were run via
`python3 -m unittest` instead — all three course-layer test modules
(`test_course_schema_agent73`, `test_course_content_mapping_agent74`,
`test_course_content_qa_agent83`) support this and ran clean (39/39 `OK`).

## Mission (per master handoff)

Complete the missing Agent 96 work: expand the course catalog with a small,
representative set of additional courses/units/lessons, reusing existing
quiz content, without duplicating questions.

## What was actually investigated

1. **Baseline validation.** Ran `course_schema.py validate` and
   `course_content_qa.py` against the shipped `course_content/`:
   **0 errors, 0 warnings** on both. `audit_course_mapping.py`: PASS, no
   orphans, no broken references. This confirms v108 is a clean starting
   point, not a package I need to first repair.

2. **Checked for spare quiz content to expand into.** `master_source.csv`
   has exactly 60 published quizzes, and `course_content/lessons.json` has
   exactly 60 lessons, each referencing exactly one quiz, 1:1, with **zero
   unused quiz IDs**. There is no surplus published quiz content sitting
   unmapped that a new lesson could point to.

3. **Confirmed reuse is schema-legal.** `COURSE_SCHEMA.md` explicitly
   states a quiz may be referenced by more than one lesson and that reuse
   "is not itself a validation issue." So a new "revision/mixed" lesson
   that re-points to an already-used quiz_id (no new quiz rows, no
   duplicated questions) is structurally valid content expansion.

4. **Built and tested exactly that**, as a trial: two new lessons —
   `course-a2-unit-02-lesson-02` ("Everyday Vocabulary Review", Mixed,
   reusing `a2-010`/`a2-009`) and `course-c1-unit-04-lesson-03` ("Academic
   Writing Integration", Mixed, reusing `c1-005`/`c1-009`/`c1-004`) — both
   populating the previously-unused optional `revision.examples`,
   `key_terms`, and `estimated_minutes` fields (0 of 60 shipped lessons
   currently use them). Rebuilt `site/` from source
   (`build.py build --src-root .`) so `site/course_content` mirrored the
   change. Result: `course_schema.py validate` → 0/0,
   `course_content_qa.py` → 0/0/0, `audit_course_mapping.py` → PASS with
   5 informational "REUSED QUIZ" notes (not warnings/errors).

## The actual blocker found

Running the full existing test suite against that trial content surfaced a
real, pre-existing regression gate that the trial content fails:

`test_course_content_mapping_agent74.py::test_shipped_content_matches_fresh_generation`
asserts, byte-for-byte, that `course_content/{courses,units,lessons}.json`
must equal a **fresh, from-scratch run** of `map_quiz_catalog.py`'s
deterministic 1-quiz-per-lesson mapper. That mapper's own docstring says
plainly: *"Richer revision authoring (explanations, examples, key_terms)
is explicitly out of scope for this mapping pass."* It was written by
Agent 74 as a drift guard — to catch accidental hand-edits of
mechanically-generated content — not to permit curated additions on top of
it. Any lesson that isn't exactly "one quiz, one lesson, summary reused
verbatim from the quiz description" fails this test by design.

So: hand-authored revision/mixed lessons (the kind of thing 109's mission
actually asks for) are schema-legal but **architecturally incompatible**
with the existing Agent 74 drift-guard test as written. Making them
coexist requires one of:

- **(a)** Changing `test_shipped_content_matches_fresh_generation` (and
  probably `map_quiz_catalog.py`'s contract/docstring) to distinguish
  "mechanically generated baseline" from "curated additions layered on
  top" — a real, reviewable architecture decision, not a one-line fix.
- **(b)** Extending `map_quiz_catalog.py` itself to deterministically emit
  the new revision/mixed lessons, so "fresh generation" and "shipped"
  stay identical — keeps the invariant but means the generator, not a
  human, is the source of truth for which reuse-lessons exist.
- **(c)** Deciding new lessons must reference genuinely new quiz IDs
  (real content authoring, out of scope for a small sample expansion pass
  and for this offline environment).

None of these is safe to pick unilaterally in one pass without visibility
into why Agent 74 froze that contract that tightly. Silently weakening an
existing regression test to make new content "pass" is exactly the kind
of anti-skip failure the 109-118 plan is designed to catch, so I did not
do it.

## Decision made this pass

**Reverted the trial content.** `course_content/` and `site/course_content/`
were regenerated back to the exact `map_quiz_catalog.py` output
(60 courses/units/lessons, matching v108 byte-for-byte) so the full test
suite is green again (39/39 `OK`) and the package ships in a verified-clean
state rather than a known-broken or silently-inconsistent one. No content
files differ from v108. This report is the only new file.

## Acceptance criteria — actual status

| Criterion | Status |
|---|---|
| Every new course/unit/lesson validates | N/A — no new records shipped this pass |
| No orphan lesson/course | Unaffected — still PASS on shipped v108 content |
| No duplicate quiz content | Confirmed possible without duplication (trial used reuse, not dupes) |
| Existing courses/routes unchanged | Confirmed — full revert, 0 diff from v108 |
| Additional course/lesson content exists | **Not shipped.** Blocked on the decision above. |

AGENT: 109
STATUS: FAIL (mission not completed — real architectural blocker identified, not skipped)
FILES CHANGED:
- AGENT_109_CONTENT_EXPANSION.md (new, this file)
- No other files differ from MYLINGO_v108_RELEASE_PACKAGE_AUDIT.zip
TESTS:
- `python3 course_schema.py validate --content-dir course_content --master-source master_source.csv`
- `python3 course_content_qa.py` (Agent 83 course content QA)
- `python3 audit_course_mapping.py`
- `python3 content_qa.py --input master_source.csv` (unchanged, regression check only)
- `python3 -m unittest test_course_schema_agent73 test_course_content_mapping_agent74 test_course_content_qa_agent83`
- `node --check` on every `.js` file under the repo
RESULTS:
- All of the above: clean/PASS on the final (reverted) state — 0 errors, 39/39 unit tests OK.
- Trial expansion (since reverted) also validated 0/0 on the schema/QA/orphan scripts, but failed
  `test_shipped_content_matches_fresh_generation` — see blocker above.
KNOWN LIMITATIONS:
- No network access in this environment: could not install pytest (ran suites via stdlib unittest
  instead, which the repo's own test modules support), could not fetch axe-core, could not run a
  real browser. No claim of browser or axe-core verification is made anywhere in this report.
- Agent 110's "content_qa_release_gate style" quiz-bank coverage work is downstream of 109 and was
  not started, since 109 has no new lessons for it to cover yet.
NEXT AGENT:
- 109 again (re-scoped), with an explicit human decision on (a)/(b)/(c) above, OR restart at 110
  only if the decision is "no course-layer content expansion this cycle" and 96/97 gets formally
  marked out-of-scope for this release rather than silently dropped.
RELEASE BLOCKERS:
- 96/97 content expansion remains genuinely incomplete. Do not let a later agent mark it PASS
  without resolving the drift-guard conflict documented above.
