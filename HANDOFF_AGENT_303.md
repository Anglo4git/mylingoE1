----- BEGIN HANDOFF PACKAGE -----
AGENT: 303
DATE: 2026-09-29
TASK: Build step 2 (audio structure) of SKILLS_LESSON_PLAN.md — placeholder audio for skill lessons
STATUS: complete

## DONE THIS TURN
- Human answers: (2) audio = use a sample MP3 as structure for all audio lessons/questions, replace gradually; (3) standalone counts confirmed. Exam/fluency rule was NOT answered -> still no bulk tagging.
- The given URL (file-examples.com) is blocked from the sandbox (403) AND would violate CSP `media-src 'self'` + not work offline, so a LOCAL placeholder `shared/audio/sample.mp3` (4 s tone, 16 KB via ffmpeg) is used. Human can overwrite that file with the real sample (same name) - nothing else to change.
- 23 standalone_skill lessons (A1 5, A2 6, B1 6, B2 6): `audio_urls` added in `course_content/lessons/{a1,a2,b1,b2}.json` + `lessons.json` (`../shared/audio/sample.mp3`; Listening = one "Listen: <title>" item; Pronunciation = "Sample audio (UK)" + "(US)"). 36 Listening quick checks in `lesson_content/<lvl>/...` got `media.audio` = `{src:"audio/sample.mp3",label:"Listen"}` (relative to /shared/quiz.html).
- `shared/audio/sample.mp3` added to `offline/core-manifest.json` + core file list in `offline/packs.json`; rebuilt `core.zip` (91) and `a1/a2/b1/b2.zip`; `sw.js` v35 -> v36; `tests/run.js` v36 pins + 1 test.
- Gates: 990 passed, 0 failed; verify-all ALL GATES PASSED (dist 735 files, sweep 108 loads / 0 problems). NOT verified in a real browser: audio playback in lesson.html slides / quiz.html player (no browser audio check run).

## CURRENT STATE
- 331 lessons (A1 81, A2 60, B1 56, B2 66). Standalone skill lessons: A1 5, A2 6, B1 6, B2 6. Pending: C1 4 (build them WITH audio_urls + media.audio from the start), C2 2 (C2 text not in repo), embedded segments, exam/fluency tags (needs human rule confirmation).
- Generator pattern: /tmp scripts are lost between sessions; recreate per recipe below. Data style: `json.dumps(indent=2, ensure_ascii=False)` + newline; `tools/a11y/audited-lessons.json` = indent=1 + newline.
- Recipe per level: append lesson record to `<lvl>.json`; insert in lessons.json after last record of that course; new unit in units.json + unit_ids in courses.json; `lesson_content/<lvl>/lesson-<id>.json` (2 banners + 3 checks + closing banner); `<lvl>/quizzes.json` entry (questions: 3); append files to level pack in packs.json; append ids to audited list; rebuild level pack + core.zip (manifest order, deflate); bump sw.js + tests pins/note; update tests (catalog count + new-unit test); prepend CHANGELOG/STATE.
- Audit server: start with `setsid nohup python3 -m http.server 8765 ... &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`. WARNING: `pkill -f` on the server command kills your own shell if that text appears in the same command; stop the server by scanning /proc instead.

## FILES CHANGED
`shared/audio/sample.mp3` (new), `course_content/lessons/{a1,a2,b1,b2}.json`, `course_content/lessons.json`, 23 x `lesson_content/{a1,a2,b1,b2}/lesson-course-*-unit-0N-lesson-*.json` (Listening ones only, 12 files), `offline/core-manifest.json`, `offline/packs.json`, `offline/packs/{core,a1,a2,b1,b2}.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`shared/audio/sample.mp3`, `HANDOFF_AGENT_303.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback + the 3 open questions in SKILLS_LESSON_PLAN.md (audio source; exam/fluency rule; counts). Otherwise keep defaults (text only).
2. Build C1 skills unit (`course-c1-unit-06`, 4 lessons; C1 has 5 units - verify): rhythm and chunking, discourse intonation (Pronunciation); fast speech, academic lectures (Listening). Include `audio_urls` (`../shared/audio/sample.mp3`) on each lesson (Listening: 1 item; Pronunciation: UK + US items) and `media.audio` on Listening quick checks, same as A1-B2. Then C2 (2 lessons) - C2 curriculum text is NOT in repo: ask the human to re-paste. Also worth doing: a real-browser check that the audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons.
3. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from `offline/core-manifest.json`; level pack change => rebuild pack from `offline/packs.json`. Inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. C2 curriculum text NOT in repo: ask human to re-paste. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 304."
----- END HANDOFF PACKAGE -----
