----- BEGIN HANDOFF PACKAGE -----
AGENT: 308
DATE: 2026-09-30
TASK: Step 3 (embedded skill segments), batch 3: A2
STATUS: complete

## DONE THIS TURN
- Appended a "Say it" / "Listen for" chapter to 16 existing A2 lessons: unit-01 lessons 04, 08, 11, 14, 17, 21; unit-02 lessons 04, 08, 10, 14, 20; unit-03 lessons 01, 03, 06, 10, 12. UK|US block where accents differ. One `audio_urls` item each -> `../shared/audio/sample.mp3`; `lesson_type` unchanged. Embedded total = 31 (A1 15, A2 16).
- Scanned every level's lesson bodies for tags outside the lesson.html sanitizer whitelist: none. New test enforces it on all lessons in lessons.json.
- Skipped: A2 lessons with empty bodies (unit-01 02, 03, 05, 09; unit-02 01, 02).
- Data: `course_content/lessons/a2.json` + `lessons.json` (identical). `core.zip` rebuilt (91); `sw.js` v40 -> v41. `tests/run.js`: v41 pins, +1 test.
- Gates: 995 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). lesson-contrast-names: 0 issues on the 16 edited lessons + a1-unit-04-lesson-03 (post-fix).
- NOT verified: real-browser audio playback; keyboard/spacing audit.

## CURRENT STATE
- 337 lessons. Standalone skill lessons complete (29). Embedded: 31 (A1 15, A2 16). Target about 90-100. Remaining: B1, B2, C1, C2 (+ more A1/A2 lessons if needed).
- Segment recipe: pick lessons with real `body_content`; append `<h3>Say it: <topic></h3>` or `<h3>Listen for: <topic></h3>` + text + optional `<h4>Where accents differ</h4>` + `.uk-us` block + `<blockquote>` practice line; add `audio_urls` [{url:"../shared/audio/sample.mp3", title:<segment title>}]; assert marker absent; edit BOTH per-level file and lessons.json identically. Only whitelisted tags: P H2 H3 H4 STRONG EM B I UL OL LI BR A BLOCKQUOTE IMG DIV SPAN CODE PRE (class only on DIV/SPAN). Scripts in /tmp are lost - recreate.
- Order: bump sw.js FIRST, rebuild core.zip from `offline/core-manifest.json` (deflate, manifest order), update tests (pins + note + new test), audit new lessons, verify-all (slow; re-run if output is missing).
- Audit: `setsid nohup python3 -m http.server 8765 &` from root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`; stop the server via a /proc scan.

## FILES CHANGED
`course_content/lessons/a2.json`, `course_content/lessons.json`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_308.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Embedded batch 4: B1 (all units except unit-05 skills), then B2, C1, C2. Same recipe, about 1 per 3-4 lessons; check body sizes first.
3. Real-browser check that audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons.
4. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 309."
----- END HANDOFF PACKAGE -----
