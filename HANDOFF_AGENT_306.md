----- BEGIN HANDOFF PACKAGE -----
AGENT: 306
DATE: 2026-09-30
TASK: Step 3 (embedded skill segments), batch 1: A1 unit-01
STATUS: complete

## DONE THIS TURN
- Appended a short "Say it" / "Listen for" chapter to `body_content` of 6 existing lessons: `course-a1-unit-01-lesson-01, 02, 10, 14, 17, 21`. UK|US block in 01, 14, 17 (where accents differ). Each lesson got one `audio_urls` item -> `../shared/audio/sample.mp3` (title = segment title). `lesson_type` left unchanged.
- Skipped on purpose: lessons 03-09 (empty `body_content`; adding one would replace the whole lesson view) and 25, 29 (placeholder-style bodies).
- Data: `course_content/lessons/a1.json` + `course_content/lessons.json` (identical). `core.zip` rebuilt (91 files); `sw.js` v38 -> v39. No level pack or lesson_content change. `tests/run.js`: v39 pins, +1 test.
- Gates: 993 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). lesson-contrast-names: 0 issues on the 6 edited lessons.
- NOT verified: real-browser audio playback; keyboard/spacing audit.

## CURRENT STATE
- 337 lessons (A1 81, A2 60, B1 56, B2 66, C1 62, C2 12). Standalone skill lessons complete (29). Embedded: 6 (A1 unit-01). Target about 90-100 total (1 per 3-4 regular lessons) - batches remain: A1 unit-02/03, A2, B1, B2, C1, C2.
- Segment recipe: pick lessons with a real `body_content`; append `<h3>Say it: <topic></h3>` or `<h3>Listen for: <topic></h3>` + short text + optional `<h4>Where accents differ</h4>` + `.uk-us` block + a `<blockquote>` "Say it:" line; add `audio_urls` [{url:"../shared/audio/sample.mp3", title:<segment title>}]; assert the marker is not already present. Edit BOTH per-level file and lessons.json identically. Allowed tags: P H2 H3 H4 STRONG EM B I UL OL LI BR A BLOCKQUOTE IMG DIV SPAN CODE PRE (class only on DIV/SPAN).
- Order of operations: bump sw.js FIRST, then rebuild core.zip from `offline/core-manifest.json` (deflate, manifest order), then tests (pins + note + new test), then verify-all.
- Audit: `setsid nohup python3 -m http.server 8765 &` from project root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`. Stop the server by scanning /proc, never `pkill -f` with text from your own command. verify-all can take several minutes; if output is missing, just re-run it.

## FILES CHANGED
`course_content/lessons/a1.json`, `course_content/lessons.json`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_306.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Embedded batch 2: A1 unit-02 and unit-03 (vocabulary/functional; "Say it" for stress/intonation, "Listen for" for numbers, greetings), then A2..C2. Same recipe.
3. Real-browser check that audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons.
4. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 307."
----- END HANDOFF PACKAGE -----
