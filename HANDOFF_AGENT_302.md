----- BEGIN HANDOFF PACKAGE -----
AGENT: 302
DATE: 2026-09-29
TASK: Build step 2 (B2 part) of SKILLS_LESSON_PLAN.md — B2 skills unit
STATUS: complete

## DONE THIS TURN
- NEW unit `course-b2-unit-06` "Pronunciation and Listening" (appended, order 6; B2 has 6 units now) with 6 lessons, all `standalone_skill`, `long`, text/transcript only (no audio), UK|US block each, 3 quick checks each (`correctIndex` 1-BASED): 01 connected speech, 02 contrastive stress, 03 UK/US /r/ and /t/ (Pronunciation); 04 podcasts, 05 lectures and note-taking, 06 accents (Listening).
- Wired: `course_content/lessons/b2.json`, `course_content/lessons.json` (after last b2 record), `units.json`, `courses.json`, 6 x `lesson_content/b2/lesson-course-b2-unit-06-lesson-0N.json`, `b2/quizzes.json`, `offline/packs.json`, rebuilt `offline/packs/b2.zip` (80 files) + `core.zip` (90), `sw.js` v34 -> v35, `tools/a11y/audited-lessons.json` (331), `tests/run.js` (v35 pins, count 331, +1 test).
- Gates: 989 passed, 0 failed; verify-all ALL GATES PASSED (dist 734 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on each new lesson. NOT run: keyboard/spacing/forced-colors audit on new skill lessons (same template as pilot).

## CURRENT STATE
- 331 lessons (A1 81, A2 60, B1 56, B2 66). Standalone skill lessons: A1 5, A2 6, B1 6, B2 6. Pending: C1 4, C2 2 (C2 text not in repo), embedded segments, exam/fluency tags (needs human rule confirmation).
- Generator pattern: /tmp scripts are lost between sessions; recreate per recipe below. Data style: `json.dumps(indent=2, ensure_ascii=False)` + newline; `tools/a11y/audited-lessons.json` = indent=1 + newline.
- Recipe per level: append lesson record to `<lvl>.json`; insert in lessons.json after last record of that course; new unit in units.json + unit_ids in courses.json; `lesson_content/<lvl>/lesson-<id>.json` (2 banners + 3 checks + closing banner); `<lvl>/quizzes.json` entry (questions: 3); append files to level pack in packs.json; append ids to audited list; rebuild level pack + core.zip (manifest order, deflate); bump sw.js + tests pins/note; update tests (catalog count + new-unit test); prepend CHANGELOG/STATE.
- Audit server: start with `setsid nohup python3 -m http.server 8765 ... &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`. WARNING: `pkill -f` on the server command kills your own shell if that text appears in the same command; stop the server by scanning /proc instead.

## FILES CHANGED
`course_content/lessons/b2.json`, `course_content/lessons.json`, `course_content/units.json`, `course_content/courses.json`, `b2/quizzes.json`, `offline/packs.json`, `offline/packs/b2.zip`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `tools/a11y/audited-lessons.json`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`lesson_content/b2/lesson-course-b2-unit-06-lesson-01.json` .. `-06.json`, `HANDOFF_AGENT_302.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback + the 3 open questions in SKILLS_LESSON_PLAN.md (audio source; exam/fluency rule; counts). Otherwise keep defaults (text only).
2. Build C1 skills unit (`course-c1-unit-06`, 4 lessons; C1 has 5 units - verify): rhythm and chunking, discourse intonation (Pronunciation); fast speech, academic lectures (Listening). Then C2 (2 lessons: nuance/attitude in intonation; implication, irony, mixed accents) - C2 curriculum text is NOT in repo: ask the human to re-paste before touching C2.
3. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from `offline/core-manifest.json`; level pack change => rebuild pack from `offline/packs.json`. Inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. C2 curriculum text NOT in repo: ask human to re-paste. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 303."
----- END HANDOFF PACKAGE -----
