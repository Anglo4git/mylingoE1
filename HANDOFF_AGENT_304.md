----- BEGIN HANDOFF PACKAGE -----
AGENT: 304
DATE: 2026-09-30
TASK: Build C1 skills unit (4 lessons) with placeholder audio structure
STATUS: complete

## DONE THIS TURN
- NEW unit `course-c1-unit-06` "Pronunciation and Listening" (order 6), 4 standalone_skill/long lessons, UK|US block each: 01 Rhythm and Chunking, 02 Discourse Intonation (Pronunciation); 03 Listening: Fast Speech, 04 Listening: Academic Lectures (Listening).
- Audio structure as A1-B2: `audio_urls` -> `../shared/audio/sample.mp3` (Pronunciation: UK + US items; Listening: 1 item); Listening quick checks have `media.audio` = {src:"audio/sample.mp3",label:"Listen"}.
- Wired: `course_content/lessons/c1.json`, `lessons.json` (after last c1 record), `units.json`, `courses.json`, 4 x `lesson_content/c1/lesson-course-c1-unit-06-lesson-0N.json` (3 checks, 1-based correctIndex), `c1/quizzes.json`, `offline/packs.json`, `tools/a11y/audited-lessons.json` (335). Rebuilt `c1.zip` (123 files) + `core.zip` (91). `sw.js` v36 -> v37. `tests/run.js`: v37 pins, count 335, +1 C1 test.
- Gates: 991 passed, 0 failed; verify-all ALL GATES PASSED (dist 739 files, sweep 108 loads / 0 problems).
- NOT verified: real-browser audio playback (lesson.html slides / quiz.html player); lesson-contrast-names / keyboard-spacing audit on the 4 new C1 lessons.

## CURRENT STATE
- 335 lessons (A1 81, A2 60, B1 56, B2 66, C1 62, C2 10). Standalone skill lessons: A1 5, A2 6, B1 6, B2 6, C1 4 = 27. Pending: C2 2 (C2 text NOT in repo), embedded segments, exam/fluency tags (rule unconfirmed - no bulk tagging).
- Generator pattern: /tmp scripts are lost between sessions; recreate per recipe. Data style: `json.dumps(indent=2, ensure_ascii=False)` + newline; `tools/a11y/audited-lessons.json` = indent=1 + newline. Pack/core zips: deflate, file order = packs.json / core-manifest order. Level-pack lesson_content entries insert after the last `lesson_content/<lvl>/` entry.
- Recipe per level: append lesson records to `<lvl>.json`; insert in lessons.json after last record of that course; unit in units.json + unit_ids in courses.json; `lesson_content/<lvl>/lesson-<id>.json` (2 banners + 3 checks + closing banner); `<lvl>/quizzes.json` entry (questions: 3); files into level pack in packs.json; ids into audited list; rebuild level pack + core.zip; bump sw.js + tests pins/note/count; add unit test; prepend CHANGELOG/STATE.
- IMPORTANT: bump sw.js FIRST, then rebuild core.zip (sw.js is in the core manifest) - otherwise the core.zip test fails.
- Audit server: `setsid nohup python3 -m http.server 8765 &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`. Never `pkill -f` a pattern that appears in your own command.

## FILES CHANGED
`course_content/lessons/c1.json`, `course_content/lessons.json`, `course_content/units.json`, `course_content/courses.json`, `c1/quizzes.json`, `offline/packs.json`, `offline/packs/{c1,core}.zip`, `tools/a11y/audited-lessons.json`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`lesson_content/c1/lesson-course-c1-unit-06-lesson-01..04.json`, `HANDOFF_AGENT_304.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. C2 skills unit (2 lessons: nuance/attitude in intonation; implication, irony, mixed accents): C2 curriculum text is NOT in repo - ask the human to re-paste; else build with the same recipe (`course-c2-unit-05`? verify C2 has 4 units) WITH audio_urls + media.audio from the start.
2. Run lesson-contrast-names + keyboard/spacing audit on the 4 C1 lessons; real-browser check that audio plays in lesson.html and quiz.html.
3. Embedded segments (batch by unit); exam/fluency tags only after the human confirms the rule in SKILLS_LESSON_PLAN.md. Human can replace `shared/audio/sample.mp3` (same name) with the real sample.
4. RULES: core-manifest file edit => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 305."
----- END HANDOFF PACKAGE -----
