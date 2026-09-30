----- BEGIN HANDOFF PACKAGE -----
AGENT: 305
DATE: 2026-09-30
TASK: Build C2 skills unit (2 lessons) with placeholder audio structure
STATUS: complete

## DONE THIS TURN
- NEW unit `course-c2-unit-05` "Pronunciation and Listening" (order 5), 2 standalone_skill/long lessons, UK|US block each: 01 Intonation: Attitude and Nuance (Pronunciation); 02 Listening: Implication, Irony and Accents (Listening). C2 curriculum text is not in the repo, so content follows the topics in SKILLS_LESSON_PLAN.md; human may replace it later.
- Audio structure as A1-C1: `audio_urls` -> `../shared/audio/sample.mp3` (Pronunciation: UK + US; Listening: 1 item); Listening quick checks have `media.audio` = {src:"audio/sample.mp3",label:"Listen"}.
- Wired: `course_content/lessons/c2.json`, `lessons.json` (after last c2 record), `units.json`, `courses.json`, 2 x `lesson_content/c2/lesson-course-c2-unit-05-lesson-0N.json`, `c2/quizzes.json`, `offline/packs.json`, `tools/a11y/audited-lessons.json` (337). Rebuilt `c2.zip` (26 files) + `core.zip` (91). `sw.js` v37 -> v38. `tests/run.js`: v38 pins, count 337, +1 C2 test.
- Gates: 992 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). lesson-contrast-names: 0 issues on all 4 C1 + 2 C2 skill lessons (the "·" 1.17 contrast entry is a pre-existing decorative separator, not counted as an issue).
- NOT verified: real-browser audio playback (lesson.html slides / quiz.html player); keyboard/spacing audit of skill lessons.

## CURRENT STATE
- 337 lessons (A1 81, A2 60, B1 56, B2 66, C1 62, C2 12). Standalone skill lessons complete: A1 5, A2 6, B1 6, B2 6, C1 4, C2 2 = 29 (plan ~30 confirmed by human).
- Pending: embedded segments (step 3), exam/fluency tags (step 4; rule NOT confirmed - no bulk tagging), real audio to replace `shared/audio/sample.mp3` (same filename).
- Data style: `json.dumps(indent=2, ensure_ascii=False)` + newline; `tools/a11y/audited-lessons.json` = indent=1. Zips: deflate, order = packs.json / core-manifest.
- IMPORTANT: bump sw.js FIRST, then rebuild core.zip (sw.js is in the core manifest) or the core.zip test fails.
- Audit server: `setsid nohup python3 -m http.server 8765 &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`. Stop the server by scanning /proc (never `pkill -f` a pattern in your own command).

## FILES CHANGED
`course_content/lessons/c2.json`, `course_content/lessons.json`, `course_content/units.json`, `course_content/courses.json`, `c2/quizzes.json`, `offline/packs.json`, `offline/packs/{c2,core}.zip`, `tools/a11y/audited-lessons.json`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`lesson_content/c2/lesson-course-c2-unit-05-lesson-01.json`, `...-lesson-02.json`, `HANDOFF_AGENT_305.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback and the open items in SKILLS_LESSON_PLAN.md (exam/fluency rule). Otherwise keep defaults.
2. Step 3, embedded segments: short "Say it" / "Listen for" chapter inside existing regular lessons (about one per 3-4 lessons; batch by unit, start with A1 unit-01). Keep existing lesson_type; use UK|US blocks where accents differ; add audio_urls only via the shared placeholder. Each batch = content edit -> bump sw.js, rebuild affected level packs + core.zip, update tests, re-run lesson audit tooling.
3. Real-browser check that audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons.
4. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 306."
----- END HANDOFF PACKAGE -----
