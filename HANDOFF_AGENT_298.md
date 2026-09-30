----- BEGIN HANDOFF PACKAGE -----
AGENT: 298
DATE: 2026-09-29
TASK: Build step 1 of SKILLS_LESSON_PLAN.md — A1 pronunciation pilot lesson
STATUS: complete

## DONE THIS TURN
- NEW lesson `course-a1-unit-04-lesson-01` "Alphabet and Sounds" (Pronunciation, `standalone_skill`, `long`, text/phonetic only, no audio) in NEW appended unit `course-a1-unit-04` "Pronunciation". UK|US blocks: Z name (zed/zee), /r/ in car, bath vowel, ballet stress. Existing units/lessons untouched. Placeholder YouTube URL reused like every other lesson (all 309 lessons have one).
- Files wired: `course_content/lessons/a1.json`, `course_content/lessons.json` (inserted after last a1 record), `units.json`, `courses.json` (unit_ids + "four units"), `lesson_content/a1/lesson-course-a1-unit-04-lesson-01.json` (3 quick checks; NOTE `correctIndex` is 1-BASED), `a1/quizzes.json` (questions: 3 = quick-check count), `offline/packs.json`.
- Rebuilt `offline/packs/a1.zip` (135 files, packs.json order) and `core.zip` (90 files, manifest order); `sw.js` CACHE_VERSION v30 -> v31; pins updated in `tests/run.js`.
- Audit: lesson-contrast-names 4 runs 0 issues; keyboard/spacing/forced-colors spacing 0 + trail outline ok; `tools/a11y/audited-lessons.json` now 309 (pick-lesson-sample returns 0).
- `tests/run.js`: +2 pilot-wiring tests. 985 passed, 0 failed. `node tools/verify-all.js` -> ALL GATES PASSED (dist byte-identical 712 files, sweep 108 loads / 0 problems).

## CURRENT STATE
- 309 lessons (A1 now 77, 4 units). Only skill lesson so far is the pilot; embedded skill segments, tags on the other 308 lessons and C2 text still pending.
- Data-file style: all JSON is `json.dumps(indent=2, ensure_ascii=False)` + trailing newline (round-trips byte-identical) — reuse when editing to avoid noisy diffs.
- Server: run `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &` FROM THE PROJECT ROOT; `NODE_PATH=$(npm root -g)`. Audit tools: `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`; lesson-keyboard-spacing-forced.js hardcodes ROOT=/home/claude/work and 3 fixed pages (use a sed'd temp copy, delete after).

## FILES CHANGED
- `course_content/lessons/a1.json`, `course_content/lessons.json`, `course_content/units.json`, `course_content/courses.json`, `a1/quizzes.json`, `offline/packs.json`, `offline/packs/a1.zip`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `tools/a11y/audited-lessons.json`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
- `lesson_content/a1/lesson-course-a1-unit-04-lesson-01.json`, `HANDOFF_AGENT_298.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Check human feedback on the pilot and the 3 open questions in SKILLS_LESSON_PLAN.md (audio source; exam/fluency rule; standalone counts). Without answers proceed with plan defaults (text/phonetic, no audio).
2. Build step 2: rest of the A1 skills unit — pronunciation (word stress basics can stay in lesson 01; add /s/ /z/ /ɪz/ endings focus) and 3 A1 listening lessons (greetings/numbers; short dialogues; directions), appended to `course-a1-unit-04` (order 2,3,...), each with lesson quiz + manifest + pack + audit as done for the pilot. Then A2..C2 per plan (new units appended; level-pack files must be rebuilt). Recipe = the wiring list under FILES CHANGED above.
3. RULES: core-manifest file edit (incl. course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (update pins + note in tests/run.js) AND rebuild core.zip from manifest (python zipfile, deflate, manifest order); level pack changes => rebuild that pack from `offline/packs.json` file list. Inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes (prepend/append; check size).
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files; sizes must not shrink.
5. C2 curriculum text NOT in repo: ask human to re-paste. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass; real-browser video focus ring check (needs YouTube).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 299."
----- END HANDOFF PACKAGE -----
