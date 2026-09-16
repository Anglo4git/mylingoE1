# AGENT 149 — STUDY PATH UX / LESSON COMPLETION HANDOFF

## Status
COMPLETED

## Mission
Implement the requested study-path UX fixes from the v147 release:
- quiz/result action buttons inline responsively (max 2 columns mobile, 3 tablet/desktop);
- course player is light-first and not permanently dark;
- quiz completion returns to the owning lesson player's Practice slide;
- passed quizzes show a green check on the Practice slide after returning/reloading;
- lesson completion requires 90% of linked quizzes mastered before the Pass lesson & continue CTA activates;
- next-lesson unlocking uses the same 90% lesson rule.

## Implemented
- `shared/js/course-progress.js`
  - Added `LESSON_COMPLETION_THRESHOLD=90`.
  - Lesson completion now derives from `exercise_quiz_ids` (with `lesson_quiz_id` fallback only when no exercise list exists).
  - Existing individual quiz mastery threshold remains 60%; the lesson-level gate is 90% of linked quizzes.
- `courses/lesson.html`
  - Converted player skin to light-first colors/theme metadata.
  - Practice cards read persisted quiz mastery and render a green passed check.
  - Quiz links return to `courses/lesson.html?...&slide=practice`.
  - Player accepts `slide=practice` and opens directly on Practice when returning from a quiz.
  - Pass lesson & continue stays disabled until the 90% lesson requirement is met; when enabled it routes to the next lesson.
- `shared/quiz.html`
  - Result action grid is 2 columns at <=620px and 3 columns at >=621px, with non-button result content spanning the grid.
  - Lesson-owned quiz result action returns to the lesson Practice context instead of jumping directly to the next lesson on a single 60% quiz pass.

## Validation
- `node --check` passed for edited JavaScript and inline script blocks.
- Production-data predicate smoke test confirms lesson completion remains false below 90% and true at/above 90% of linked mastered quizzes.
- Static inspection confirms all edited local references remain valid.

## Next agent
Perform a regression/release QA pass only. Focus on:
1. Mobile <=620px: result buttons max 2 columns.
2. Tablet 621–900px and desktop: result buttons max 3 columns with additional actions wrapping.
3. Complete a lesson quiz at >=60%, return to Practice, verify green check persists after reload.
4. Verify a lesson with 89% mastered quizzes keeps Pass lesson & continue disabled.
5. Verify 90% mastered quizzes enables Pass lesson & continue and opens the next lesson.
6. Verify the previous-lesson lock disappears after the previous lesson reaches 90%.
7. Verify player remains light when device/system appearance is dark.
8. Verify quiz exit/back/result all return to the Practice slide for lesson-owned quizzes.

Do not reopen completed implementation unless a concrete regression is found.
