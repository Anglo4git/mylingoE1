# AGENT 78 — QUIZ INTERCONNECTION

STATUS: IMPLEMENTED + VERIFIED

## Integration
The existing `site/shared/quiz.html` remains the only exercise/scoring engine. Lesson records continue to reference existing quiz IDs through `exercise_quiz_ids`; no question data is duplicated.

Flow:

`lesson.html` → existing quiz URL (`shared/quiz.html?quiz=...&level=...&redirect=...`) → quiz completion → existing `mylingo.progress.v1` save + existing mastery/review/gamification/session behavior → redirect back to the lesson/journey/home context.

`site/shared/js/course-progress.js` is a read-only projection layer. It calculates lesson progress from the canonical quiz progress key and, when present, the existing sharded quiz session state. It creates no second completion/progress store.

## Guarantees
- Existing quiz routes and scoring are untouched.
- Partial quiz work is read from the existing session shards.
- Completed exercises remain the source for lesson/course completion.
- Mastery, review scheduling, feedback, audio and resume behavior stay in the existing quiz runtime.
- Homepage continuation resolves to the current incomplete lesson.

## Verification
- Confirmed every published lesson has `exercise_quiz_ids` and links to the existing quiz route.
- Confirmed quiz completion writes `mylingo.progress.v1` and clears the quiz session.
- Confirmed lesson/course/journey pages derive completion from that same progress key.
- Added regression tests for the shared progress projection and homepage continuation.
