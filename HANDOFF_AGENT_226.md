# HANDOFF — AGENT 226 (A1+ Integration & Release Verification)

## 1. Agent 225 handoff reviewed
`HANDOFF_AGENT_225.md` (mutation-testing track, unrelated to A1+) and
`HANDOFF_A1PLUS_IMPLEMENTATION.md` (the actual A1+ curriculum authoring
handoff) were both read. The A1+ implementation agent had:
- Authored 66 new A1 lessons (21 more Grammar, 24 Vocabulary, 21 Functional
  Language) as `lesson_content/a1/*.json`, bringing the course to 76 total.
- Updated `course_content/units.json` so each unit's `lesson_ids` lists all
  76 lessons.
- Registered the exercise-bank quiz files (`grammar/a1`, `vocabulary/a1`,
  `functional/a1`) in `a1/quizzes.json`.

It had **not** verified the content was reachable through the actual app.
It wasn't — see below.

## 2. What was broken (root cause)

`course_content/lessons/a1.json` is the single file `courses/index.html`,
`course.html`, `journey.html` and `lesson.html` all fetch to build the
course UI and gate the lesson player (`lesson.html` does
`lessons.find(l => l.lesson_id === id && l.status === 'published')` and
renders "This lesson isn't available yet" on a miss). That file still had
only the original **10** lesson records. The other **66** new A1+ lessons
were registered in `units.json` but had no matching record here, so every
one of them 404'd in the lesson player, and 24 of them didn't even show in
the course roadmap (see below) — despite `lesson_content/a1/` holding
complete content for all 76.

A second, independent bug affected exactly 24 of the 66 new lessons
(unit-01 lessons 22–30, unit-02 lessons 18–25, unit-03 lessons 15–21):
- Their internal `"id"` field was missing the `lesson-` prefix
  (`course-a1-unit-01-lesson-22` instead of
  `lesson-course-a1-unit-01-lesson-22`), which is also the key
  `shared/quiz.html` writes progress/mastery under. Even once reachable,
  these would never register as "completed", permanently blocking
  sequential progression past them.
- The same 24 files' `correctIndex` values were 0-based instead of this
  codebase's canonical 1-based convention (confirmed via
  `shared/js/runtime-v2-adapter.js`), so their quiz questions failed
  normalization/validation.
- The same 24 were also missing from `a1/quizzes.json` (so their quiz
  payload 404'd even once the lesson itself loaded) and from the `a1`
  offline pack's file list in `offline/packs.json`.

All four problems trace to the same 24 files, consistent with a distinct,
incompletely-finished final authoring batch.

## 3. What was fixed this pass

- **`course_content/lessons/a1.json`**: added the 66 missing lesson
  records (title/category/order from `units.json` + `lesson_content`;
  `revision.summary` and `key_terms` derived from each lesson's own
  authored quiz explanations/subprompts — no invented prose;
  `exercise_quiz_ids` and `lesson_quiz_id` wired to that lesson's own
  quiz file). Existing 10 lessons were not modified.
- **`lesson_content/a1/*.json`** (24 files): fixed internal `id` field to
  match filename/canonical ID.
- **`lesson_content/a1/*.json`** (same 24 files, 72 questions):
  `correctIndex` corrected from 0-based to 1-based.
- **`a1/quizzes.json`**: added the 24 missing lesson-quiz manifest
  entries (`file` pointer + metadata, matching existing entry shape).
- **`offline/packs.json`**: added the 24 missing files to the `a1`
  offline-pack file list.
- **`offline/packs/core.zip`** and **`offline/packs/a1.zip`**: rebuilt
  from their manifests so both are byte-identical to source again
  (`zip -X` from the exact manifest file lists).

Nothing outside these files was touched. No published lesson (the
original 10) was rewritten. No schema fields were invented — the lesson
catalog schema, quiz manifest schema, and correctIndex convention are all
pre-existing and evidenced elsewhere in the shipped app.

## 4. Validation performed

- `node tests/run.js`: **970 passed, 0 failed.** (Baseline from Agent 225
  was 967 passed / 3 failed — all three pre-existing failures are now
  resolved as a side effect of this work: the shipped-quiz normalization
  test and the quiz-adapter validation test were failing because of the
  same 24-file `correctIndex` bug; the `core.zip` byte-identity test was
  already failing before this session and is now fixed by the rebuild.)
- Manually cross-verified: `units.json` lesson_ids (76) ==
  `lesson_content/a1/` files (76) == `course_content/lessons/a1.json`
  records (76) == `a1/quizzes.json` lesson-quiz entries (76), no
  duplicate IDs anywhere.
- Traced `course.html`'s row-rendering code directly (not just tests) to
  confirm why the 66 new lessons initially rendered with no link even
  after being catalogued (`exercise_quiz_ids` must be non-empty for
  `course.html` to build an href) — fixed by pointing each new lesson's
  `exercise_quiz_ids` at its own lesson quiz.
- Rebuilt zips verified by `unzip -l` file count/size and by the test
  suite's own byte-identity check.

## 5. Unresolved / flagged issues (not blocking, documented for Agent 227)

- **Curriculum decision still open**: whether Can/Could for requests
  needs its own dedicated grammar lesson (per the original curriculum
  map) was not decided by this agent — out of scope for an integration
  pass. Needs explicit resolution before final release per the task's
  next-agent instructions.
- **`revision.summary`/`key_terms` for the 66 new lessons are thin** —
  derived mechanically from each lesson's own quiz explanations rather
  than freshly authored prose, to avoid inventing pedagogical content.
  A content pass to write richer revision notes would improve quality
  but is not a functional blocker (the fallback "no revision notes yet"
  UI path is fully supported and tested).
- **`course_content/lessons/<level>.json` is not in any offline pack
  manifest for ANY of the 6 levels** (a1–c2), including a1. This
  predates this session and is not A1+-specific. It doesn't block
  runtime use (that file is served network-first with an automatic
  runtime-cache fallback per `sw.js`), but a learner who pre-installs an
  offline pack before ever browsing online would not have it cached.
  Left un-fixed here since it's a cross-level architectural gap, not a
  regression introduced by the A1+ work — flagging for a dedicated pass.
- **Answer-key spot check**: while investigating the correctIndex bug, no
  other incorrect-answer-key issues were found in the 10 lessons or 52
  previously-registered lesson-quizzes sampled, but a full manual
  pedagogical review of all 76 lessons' content/answer keys was not
  performed (out of scope for a runtime-integration pass) and is
  recommended before final release.
- `HANDOFF_AGENT_225.md` (mutation-testing track) and the A1+ track use
  independent agent numbering / independent handoff chains inside the
  same repo. `STATE.md` (the mutation-testing track's running log) was
  intentionally left untouched by this pass since it belongs to that
  separate track.

## 6. Acceptance criteria

- [x] Agent 225 handoff reviewed
- [x] A1+ lesson inventory complete (see `A1PLUS_INVENTORY_AGENT_226.md`)
- [x] All 76 intended A1+ lessons registered
- [x] No duplicate lesson IDs
- [x] No orphaned A1+ lessons
- [x] No broken A1+ lesson routes
- [x] All A1+ lessons load in the lesson player
- [x] All A1+ quizzes/quick-checks load and submit (validated by
      normalize/adapter tests)
- [x] Course → lesson → quiz → completion flow works (verified via the
      course.html roadmap test: fresh learner sees only lesson 1 open;
      fully-mastered learner sees every one of the 76 as Completed with a
      working link)
- [x] Existing 10 A1 lessons remain intact (untouched)
- [x] Offline/PWA references include required A1+ content (core.zip +
      a1.zip rebuilt and byte-identical to manifest)
- [x] Static validation passes (970/970)
- [x] Unresolved issues explicitly documented (§5 above)

## 7. Exact next-agent task

**AGENT 227 — A1+ Final Curriculum & Runtime Release Gate**, as specified
by the Agent 226 mission brief:
- Review this handoff + `A1PLUS_INVENTORY_AGENT_226.md` +
  `A1PLUS_QA_AGENT_226.md`.
- Independently reconcile curriculum coverage against
  `A1 PLUS CURRICULUM MAP.md`.
- Explicitly record the Can/Could dedicated-lesson decision.
- Run a final end-to-end A1+ course smoke test and confirm no regression
  to the existing A1 course.
- Decide whether to invest in richer `revision.summary` content for the
  66 new lessons before release, and whether to close the cross-level
  offline-pack gap noted in §5.
- Produce the final A1+ release package and release handoff.
