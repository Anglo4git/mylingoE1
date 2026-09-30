----- BEGIN HANDOFF PACKAGE -----
AGENT: 300
DATE: 2026-09-29
TASK: Build step 2 (A2 part) of SKILLS_LESSON_PLAN.md — A2 skills unit
STATUS: complete

## DONE THIS TURN
- NEW unit `course-a2-unit-04` "Pronunciation and Listening" (appended, order 4) with 6 lessons, all `standalone_skill`, `long`, text/transcript only (no audio), UK|US block each, 3 quick checks each (`correctIndex` 1-BASED): 01 /ɪ/ vs /iː/, 02 -ed endings, 03 weak forms to/can (Pronunciation); 04 daily routines, 05 shopping, 06 voicemail/announcements (Listening).
- Wired: `course_content/lessons/a2.json`, `course_content/lessons.json` (after last a2 record), `units.json`, `courses.json` (unit_ids), 6 x `lesson_content/a2/lesson-course-a2-unit-04-lesson-0N.json`, `a2/quizzes.json`, `offline/packs.json`, rebuilt `offline/packs/a2.zip` (74 files) + `core.zip` (90), `sw.js` v32 -> v33, `tools/a11y/audited-lessons.json` (319), `tests/run.js` (v33 pins, count 319, +1 test).
- Gates: 987 passed, 0 failed; verify-all ALL GATES PASSED (dist 722 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on each new lesson. NOT run: keyboard/spacing/forced-colors audit on new skill lessons (same template as pilot).

## CURRENT STATE
- 319 lessons (A1 81, A2 60, each with a 4th unit). Standalone skill lessons: A1 5, A2 6. Pending: B1 6, B2 6, C1 4, C2 2 (C2 text not in repo), embedded segments, exam/fluency tags (needs human rule confirmation).
- Data style: `json.dumps(indent=2, ensure_ascii=False)` + newline; `tools/a11y/audited-lessons.json` = indent=1 + newline.
- Recipe per level: append lesson record to `<lvl>.json`; insert in lessons.json after last record of that course; new unit in units.json + unit_ids in courses.json; `lesson_content/<lvl>/lesson-<id>.json` (2 banners + 3 checks + closing banner); `<lvl>/quizzes.json` entry (questions: 3); append files to level pack in packs.json; append ids to audited list; rebuild level pack + core.zip (manifest order, deflate); bump sw.js + tests pins/note; update tests (catalog count + new-unit test); prepend CHANGELOG/STATE.
- Audit server: start with `setsid nohup python3 -m http.server 8765 ... &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`. WARNING: `pkill -f` on the server command kills your own shell if that text appears in the same command; stop the server by scanning /proc instead.

## FILES CHANGED
`course_content/lessons/a2.json`, `course_content/lessons.json`, `course_content/units.json`, `course_content/courses.json`, `a2/quizzes.json`, `offline/packs.json`, `offline/packs/a2.zip`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `tools/a11y/audited-lessons.json`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`lesson_content/a2/lesson-course-a2-unit-04-lesson-01.json` .. `-06.json`, `HANDOFF_AGENT_300.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback + the 3 open questions in SKILLS_LESSON_PLAN.md (audio source; exam/fluency rule; counts). Otherwise keep defaults (text only).
2. Build B1 skills unit (append new unit after B1's last; verify count first): sentence stress, linking, intonation in questions; listening interviews, short talks, phone calls. Then B2 (connected speech, contrastive stress, UK/US /r/ /t/; podcasts, lectures, accents), C1 (rhythm/chunking, discourse intonation; fast speech, academic lectures).
3. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from `offline/core-manifest.json`; level pack change => rebuild pack from `offline/packs.json`. Inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. C2 curriculum text NOT in repo: ask human to re-paste. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 301."
----- END HANDOFF PACKAGE -----
