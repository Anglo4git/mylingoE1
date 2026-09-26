# A1+ QA REPORT — AGENT 226

## Test suite
`node tests/run.js`
- Before this session's fixes (Agent 225 baseline): **967 passed, 3 failed**
- After this session's fixes: **970 passed, 0 failed**

Pre-existing baseline failures resolved as part of this pass:
1. `every shipped quiz payload normalizes without throwing and satisfies
   the radio invariants` — root cause: 24 `lesson_content/a1/*.json`
   files used 0-based `correctIndex` instead of the codebase's 1-based
   convention. Fixed (72 question values corrected).
2. `EVERY shipped quiz, after the adapter, passes quiz.html validate()`
   — same root cause as (1).
3. `offline/packs/core.zip contains exactly the manifest files,
   byte-identical to source` — pre-existing drift, unrelated to A1+
   content at first (`course_content/courses.json`,
   `course_content/lessons.json`, `course_content/units.json` were
   already stale); became directly A1+-relevant once this pass needed
   to edit `a1/quizzes.json`. Fixed by rebuilding `core.zip` from
   `offline/core-manifest.json`.

## Runtime integration (traced against source, not just JSON)
- `courses/lesson.html` gates every lesson on an exact match in
  `course_content/lessons/<level>.json` with `status === 'published'`.
  Confirmed via code read (not assumption) that a miss renders "This
  lesson isn't available yet."
- `courses/course.html`'s row renderer only emits a clickable `href`
  when `exercise_quiz_ids.length > 0` — an unlocked-but-empty-array
  lesson renders as text with no link. Found live during this pass (the
  66 new lessons initially had `exercise_quiz_ids: []`); fixed by
  pointing each at its own `lesson_quiz_id`.
- `shared/js/runtime-content-loader.js`'s `load(level, id)` tries
  `grammar/<level>/<id>.json` directly, then falls back to the level's
  `quizzes.json` manifest entry's `file` pointer. Confirmed the 24
  missing manifest entries would 404 here even after the lesson-catalog
  fix.
- `shared/js/course-progress.js`'s `lessonCompletionRecord` reads
  progress keyed by `lesson.exercise_quiz_ids` / `lesson.lesson_quiz_id`
  — i.e. the canonical ID. `shared/quiz.html`'s save path keys progress
  by the loaded JSON's own internal `id` field. Confirmed the 24
  files' internal-`id` mismatch would silently break completion/mastery
  gating even after everything else was reachable — this would have
  been a hard-to-diagnose "lesson never marks complete" bug in
  production. Fixed at the source (internal `id` corrected).

## Post-fix verification
- `units.json` lesson_ids (76) == `lesson_content/a1/` files (76) ==
  `course_content/lessons/a1.json` records (76) == `a1/quizzes.json`
  lesson-quiz entries (76). No duplicates in any of the four sets.
- `course.html` roadmap test (via `tests/run.js`): a fresh learner (no
  progress) sees exactly lesson 1 unlocked; a learner with every quiz
  marked mastered sees all 76 rows as "Completed" with a working link;
  every rendered link resolves to a real `lesson_id`. Passing.
- `offline/packs/core.zip` and `offline/packs/a1.zip` rebuilt with
  `zip -X` from their respective manifests (`offline/core-manifest.json`,
  the `a1` entry in `offline/packs.json`); both verified byte-identical
  to source by the test suite's own CRC/size check.
- `sw.js` caching strategy re-checked: all touched files match
  `isMutableJson` (`.json$`) and are served network-first with a
  runtime-cache fallback, so no `CACHE_VERSION` bump was required for
  this change (that convention, per `STATE.md`, applies to cache-first
  shell/static assets, which nothing in this pass touched).

## Static / schema QA
- No malformed JSON (every touched file re-loaded with `json.load`
  after editing).
- No duplicate lesson IDs, quiz IDs, or numbering gaps in course-a1.
- No invented schema fields: the lesson-catalog record shape,
  quiz-manifest entry shape, and `correctIndex` convention all match
  pre-existing, already-shipped examples elsewhere in the same files.
- Existing 10 published lessons: byte-for-byte untouched.

## Known open items (see HANDOFF_AGENT_226.md §5 for full detail)
- Can/Could dedicated-lesson curriculum decision: unresolved, carried
  to Agent 227.
- `revision.summary`/`key_terms` for the 66 new lessons are derived
  mechanically from each lesson's own quiz explanations rather than
  freshly authored prose — functional but thin; a content pass is
  recommended before final release.
- `course_content/lessons/<level>.json` absent from every level's
  offline-pack manifest (all 6 levels, pre-existing, not A1+-specific)
  — flagged, not fixed in this pass.
- Full manual pedagogical/answer-key review of all 76 A1+ lessons was
  not performed; only the specific `correctIndex` convention bug found
  during test-failure triage was corrected. A dedicated content-accuracy
  pass is recommended before final release.
