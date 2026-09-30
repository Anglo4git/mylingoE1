----- BEGIN HANDOFF PACKAGE -----
AGENT: 299
DATE: 2026-09-29
TASK: Build step 2 (A1 part) of SKILLS_LESSON_PLAN.md — rest of A1 skills unit
STATUS: complete

## DONE THIS TURN
- NEW lessons in `course-a1-unit-04` (now "Pronunciation and Listening"): 02 "Plural and -s Endings" (Pronunciation), 03 "Listening: Greetings and Numbers", 04 "Listening: Short Dialogues", 05 "Listening: Directions". All `standalone_skill`, `long`, text/transcript only (no audio), UK|US block in each, 3 quick checks each (`correctIndex` 1-BASED).
- Wired: `course_content/lessons/a1.json`, `course_content/lessons.json`, `units.json` (lesson_ids + retitle), `courses.json` (A1 description), 4 new `lesson_content/a1/lesson-course-a1-unit-04-lesson-0N.json`, `a1/quizzes.json`, `offline/packs.json`, rebuilt `offline/packs/a1.zip` (139 files) and `core.zip` (90), `sw.js` v31 -> v32, `tools/a11y/audited-lessons.json` (313), `tests/run.js` (v32 pins, pilot unit test now expects 5 ids, +1 A1-skills test).
- Gates: 986 passed, 0 failed; `node tools/verify-all.js` ALL GATES PASSED (dist 716 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on each new lesson (4 runs each).
- NOT run: lesson-keyboard-spacing-forced.js on the new lessons (same template as pilot; run it if you want parity).

## CURRENT STATE
- 313 lessons (A1 81 in 4 units). Standalone A1 skill lessons: 5 (plan said 6: word stress folded into lesson 01). Embedded segments, exam/fluency tags and C2 text still pending.
- Data style: `json.dumps(indent=2, ensure_ascii=False)` + newline; EXCEPT `tools/a11y/audited-lessons.json` = indent=1 + trailing newline.
- Reusable generator: build script pattern = append lesson record to a1.json, insert in lessons.json after last a1 record, append to unit lesson_ids, create lesson_content quiz file, add quizzes.json entry, append to a1 pack files, append to audited list, then rebuild zips and bump sw.js.
- Server for audits: `setsid nohup python3 -m http.server 8765 ... &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`.

## FILES CHANGED
`course_content/lessons/a1.json`, `course_content/lessons.json`, `course_content/units.json`, `course_content/courses.json`, `a1/quizzes.json`, `offline/packs.json`, `offline/packs/a1.zip`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `tools/a11y/audited-lessons.json`, `SKILLS_LESSON_PLAN.md`, `STATE.md` (one line prepended), `CHANGELOG.md` (prepended)
## FILES CREATED
`lesson_content/a1/lesson-course-a1-unit-04-lesson-02.json` .. `-05.json`, `HANDOFF_AGENT_299.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback + the 3 open questions in SKILLS_LESSON_PLAN.md (audio source; exam/fluency rule; standalone counts). Without answers keep plan defaults (text only, no audio).
2. Build A2 skills unit (new unit `course-a2-unit-04`, appended): pronunciation /ɪ/ vs /iː/, -ed endings, weak forms (to, can); listening routines, shopping, voicemail/announcements. Then B1..C2 per plan. Level pack (`a2.zip` etc.) + core.zip rebuild + sw.js bump each time; add `unit_ids` entry in courses.json and a `Pronunciation and Listening` unit in units.json.
3. RULES: core-manifest file edit (incl. course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (update pins + note in tests/run.js) AND rebuild core.zip from `offline/core-manifest.json` order (deflate); level pack change => rebuild that pack from `offline/packs.json`. Inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. C2 curriculum text NOT in repo: ask human to re-paste. Standing blockers unchanged: git remote / Netlify / domain / devices; axe-core + Lighthouse (npm 403); real screen-reader pass; real-browser video focus ring check.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 300."
----- END HANDOFF PACKAGE -----
