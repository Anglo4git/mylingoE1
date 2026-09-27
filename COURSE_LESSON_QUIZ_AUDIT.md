# COURSE LESSON / QUIZ WIRING AUDIT

## Scope
Audit of the supplied `MYLINGO_APP_C1_UPDATED.zip` for:
- course lesson coverage in the lesson player
- quiz-to-lesson wiring across A1–C2
- lesson-content coverage
- offline pack coverage
- quiz answer-index integrity
- video embedding readiness

## Results

| Level | Course lessons | Lesson content | Quizzes | Unlinked regular quizzes | Missing lesson content |
|---|---:|---:|---:|---:|---:|
| A1 | 76 | 76 | 131 | 0 | 0 |
| A2 | 54 | 54 | 108 | 0 | 0 |
| B1 | 50 | 50 | 61 | 0 | 0 |
| B2 | 60 | 60 | 71 | 0 | 0 |
| C1 | 58 | 58 | 69 | 0 | 0 |
| C2 | 10 | 10 | 21 | 0 | 0 |

## Changes

### C1
- Expanded the published course lesson index from 11 to 58.
- Wired C1 quizzes `c1-011` through `c1-057` into the lesson player.
- Grammar: unit 01 lessons 06–21.
- Vocabulary: unit 02 lessons 03–19.
- Functional Language: new unit 05 lessons 01–14.
- Preserved all existing C1 lesson IDs and mappings.

### B1
- Expanded the course lesson index from 10 to 50.
- Wired all previously unlinked regular B1 quizzes into lessons.
- Added Functional Language unit 04.
- Added matching lesson-content records for the newly created lessons.

### B2
- Expanded the course lesson index from 10 to 60.
- Wired all previously unlinked regular B2 quizzes into lessons.
- Added Functional Language unit 05.
- Added matching lesson-content records for the newly created lessons.

### All levels
- Rebuilt `course_content/lessons.json` from the per-level lesson indexes.
- Updated `course_content/units.json` and `course_content/courses.json`.
- Confirmed every published course lesson has a matching `lesson_content/<level>/lesson-<lesson_id>.json`.
- Reconciled offline pack manifests; A2 was missing 43 lesson-content files and is now complete.
- Rebuilt all offline pack archives from their manifests.
- Corrected zero-based `correctIndex` values across shipped quiz JSON payloads to the app's required 1-based format. 162 JSON files contained affected zero-based indices.
- Rebuilt `dist/` after source changes.

## Video
The player already supports YouTube/video media through each lesson's `youtube_url` / `video_urls` / `videos` fields.

The task input did **not contain an actual video URL**, so no URL was invented or embedded. All lesson records remain ready for the supplied video URL. Once the URL is provided, it can be applied to every published lesson in one data-only pass.

## Verification
- `node tests/run.js` — **970 passed, 0 failed**
- `node tools/build-dist.js` — **709 files**
- `node tools/verify-all.js --quick`:
  - Unit suite — PASS
  - CSP — PASS
  - Dist byte identity — PASS
  - Full browser/offline sweep — not run under `--quick`
- Build/package command is available through `tools/build-dist.js`.
- No `package.json` / npm typecheck or lint scripts are present in this static app, so npm typecheck/lint are not applicable.

## Known blocker
- Actual video URL required to complete the requested embed. No URL was present in the supplied task.
