# MyLingo — Agent 136 Handoff

## Status
IMPLEMENTED — ready for next-agent continuation and final audit.

## Mission completed
This agent implemented the requested course-first lesson/player, 120-question placement, and dark-mode UX changes on the supplied MyLingo package.

### 1. Course/quiz action consistency
- Lesson-player final action now says **Start quiz** instead of **Start lesson** when it opens a quiz.
- Lesson-backed quizzes remain protected by the existing quiz gate.
- Direct legacy `main/practice.html` now redirects to Courses with a clear course-first message.

### 2. Course-first navigation
- Course list cards are fully clickable; the separate **Practice directly** button was removed.
- Course page lesson rows are clickable and open the lesson player.
- Course page no longer exposes a direct "practice this level" action.
- Completed-course CTA stays inside the course flow as **Review course**, rather than jumping directly to a quiz list.
- Existing lesson-backed quiz gate remains the final safety net for direct quiz URLs.

### 3. Lesson player content model
Backward-compatible optional fields are now supported in lesson JSON:
- `body_content`
- `chapters: [{title, body_content}]`
- `video_urls` / `videos` (multiple video entries)
- `audio_urls` / `audios` / legacy `audio_url`
- legacy `youtube_url`

Player slide order:
1. Text/chapter slides
2. All video slides
3. All audio slides
4. Practice

The top slide strip now includes a type icon for text, video, audio, and practice.

Schema reference: `LESSON_PLAYER_CONTENT_SCHEMA.md`.

### 4. 120-question level assessment
- Added `placement/assessment/placement-120.json`.
- Exactly **120 questions**: 40 A1 + 40 A2 + 40 B1.
- Questions are deterministically shuffled so the CEFR band is not revealed by position.
- Added strict mastery-based assignment:
  - A1 mastery threshold: 70%
  - A2 requires A1 >=70% and A2 >=70%
  - B1 requires A1 >=70%, A2 >=70%, and B1 >=70%
  - Final ceiling is B1; no score can assign B2/C1/C2.
- `main/placement.html` now routes the assessment to `placement-120`.
- Assessment result stores the final A1/A2/B1 result and per-band scores.
- `placement/index.json` documents the new 120-question assessment.

### 5. Human result copy
Orientation result copy was changed from the mechanical B2-style wording to a human message explaining that the quick result is only a starting guide and the 120-question assessment determines the final level.

### 6. Dark mode
- Strengthened dark palette for iOS/Android-style contrast.
- Improved card, input, button, hover, border, muted text, and inline legacy-color overrides.
- Added dark-mode handling for common inline `#17212b`, `#6b7280`, and white-background legacy elements.

## Files materially changed
- `courses/lesson.html`
- `courses/index.html`
- `courses/course.html`
- `main/practice.html`
- `main/placement.html`
- `shared/quiz.html`
- `shared/js/orientation.js`
- `shared/js/placement.js`
- `shared/css/theme.css`
- `placement/index.json`
- `offline/core-manifest.json`
- `offline/packs.json`
- `offline/packs/core.zip`
- Added `placement/assessment/placement-120.json`
- Added `LESSON_PLAYER_CONTENT_SCHEMA.md`

## Verification performed
- All standalone JS files: `node --check` PASS.
- 43 inline HTML scripts checked with Node: PASS, 0 syntax errors.
- All JSON files parsed successfully.
- Placement bank: 120 unique question IDs; exactly 40 A1 / 40 A2 / 40 B1.
- Placement algorithm smoke tests:
  - all correct -> B1
  - none correct -> A1
  - A1 mastered only -> A2
  - A1+A2 mastered, B1 not mastered -> A2
- All normal manifest quizzes are lesson-owned: PASS.
- Local HTTP smoke returned HTTP 200 for root, Courses, Course, Lesson, 120-question quiz route, assessment JSON, and legacy Practice redirect.
- Offline core ZIP refreshed and contains the new assessment file.

## Known limitation for next agent
Full interactive browser testing was not available in this environment. Next agent should do a final browser/PWA smoke test, especially:
- first-session splash
- dark mode text contrast on real pages
- course card tap -> course -> lesson -> practice -> quiz
- direct quiz URL -> owning lesson redirect
- 120-question assessment start/resume/complete
- A1/A2/B1 result assignment and level lock behavior
- multiple chapter/video/audio rendering with sample authored JSON
- iPhone narrow-width button alignment

## Packaging
The package remains deployable from repository root. Do not add an enclosing `site/` folder when deploying this package.

## Next agent instruction
Treat this handoff as the implementation baseline. Do not undo course-first routing or the 120-question A1-B1 ceiling. First inspect and test the current package, then fix only verified issues and produce the next handoff/package.
