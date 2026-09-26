# A2_QA_REPORT.md
# Produced by: A2 Agent 7 (QA), immediately after A2 Agent 6 (Technical
# Integrator). Per MASTER_A2_HANDOFF.md §13.

## 1. AUTOMATED TESTS

`node tests/run.js`: **968 passed, 2 failed**.

The 2 failures are pre-existing and unrelated to A2 content — confirmed
by running the identical suite against an untouched copy of the
original uploaded zip before any A2 integration work began:
- "publish directory (Agent 16): tools/build-dist.js ships exactly the
  runtime files..." — a packaging/CI check comparing the repo to a
  `dist/` build output that isn't part of this content deliverable.
- "CI workflow + dotfiles (Agent 22)..." — checks for `.github/` and
  `.gitignore` inside a packaged zip; not applicable to a content-only
  handoff.

Both were already failing in the baseline before this pass touched
anything; neither is affected by any A2 lesson, quiz, or content-index
change made here.

One integration-caused failure was caught and fixed during this pass
(not present in the final run): quiz questions were briefly generated
with 0-based `correctIndex` values before a fix brought every new
question in line with the 1-based convention every existing quiz in
the app already uses. Caught by "every shipped quiz payload
normalizes... satisfies the radio invariants" and "EVERY shipped quiz...
passes quiz.html validate()" before this handoff.

## 2. STRUCTURAL VERIFICATION

- `course-a2` now has 54 lessons (11 original + 43 new), across 3
  units: Grammar (22), Vocabulary (20), Functional Language (12, new
  unit).
- Every lesson in `course_content/units.json` for `course-a2` has
  exactly one matching entry in `course_content/lessons.json`, and
  vice versa — no orphaned or dangling lesson IDs.
- Every `exercise_quiz_ids` entry and every `lesson_quiz_id` referenced
  by an A2 lesson resolves to a real entry in `a2/quizzes.json`, which
  in turn points at a real, parseable JSON file.
- `course_content/lessons/a2.json` (the per-level cache file some pages
  load in preference to the monolithic `lessons.json`) was stale before
  this pass (still only 11 lessons) and has been regenerated to match.
- `offline/packs/core.zip` and `offline/core.zip` were rebuilt so the
  files listed in `offline/core-manifest.json` are byte-identical to
  the live repo again (they had gone stale the moment
  `course_content/*.json` and `a2/quizzes.json` changed).

## 3. CONTENT SPOT CHECKS

- Every quiz question across the 54 exercise-quiz files (grammar +
  vocabulary + functional) has exactly one `correctIndex` in range
  1..len(answers), matching every pre-existing quiz in the app.
- The merged Preferences lesson
  (`course-a2-unit-03-lesson-07`) carries a note in its `body_content`
  explaining the merge, for anyone auditing the content later.
- The 2 revised off-syllabus lessons and 3 extended partial-grammar
  lessons are marked `version: 2` and carry a `revision.note` (or, for
  the off-syllabus ones, an explicit note) explaining what changed and
  why, so the change is traceable without re-reading this file.

## 4. NOT COVERED BY THIS QA PASS

- No manual/visual walkthrough of the lesson player or quiz UI was
  performed (no browser available in this environment) — automated
  tests exercise the rendering logic against this exact content, but a
  human should still spot-check a few new lessons in the actual app
  before wide release.
- No re-review of pedagogical quality beyond what A2 Agent 4 (Content
  Auditor) already did on the drafts; nothing about lesson wording was
  changed except the additions described in A2_INTEGRATION_NOTES.md.

## 5. RECOMMENDATION

No blocking defects. Safe to proceed to A2_FINAL_HANDOFF.md.
