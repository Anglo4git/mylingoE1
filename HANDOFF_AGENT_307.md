----- BEGIN HANDOFF PACKAGE -----
AGENT: 307
DATE: 2026-09-30
TASK: Step 3 (embedded skill segments), batch 2: A1 unit-02/03
STATUS: complete

## DONE THIS TURN
- Appended a "Say it" / "Listen for" chapter to 9 existing A1 lessons: unit-02 lessons 02, 05, 10, 14, 17; unit-03 lessons 01, 03, 09, 10. UK|US block where accents differ. Each has one `audio_urls` item -> `../shared/audio/sample.mp3`; `lesson_type` unchanged. Embedded total = 15 (6 from Agent 306).
- BUG FIXED: `<u>` is not in lesson.html ALLOWED_TAGS (P H2 H3 H4 STRONG EM B I UL OL LI BR A BLOCKQUOTE IMG DIV SPAN CODE PRE); the sanitizer removes the element AND its text. `course-a1-unit-04-lesson-03` (Agent 299) used `<u>`, so the syllables "teen"/"thir" were invisible; now `thirTEEN` / `THIRty`. Only allowed tags in new content.
- Data: `course_content/lessons/a1.json` + `lessons.json` (identical). `core.zip` rebuilt (91); `sw.js` v39 -> v40. `tests/run.js`: v40 pins, +1 test.
- Gates: 994 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). lesson-contrast-names: 0 issues on the 9 edited lessons.
- NOT verified: real-browser audio playback; contrast audit on unit-04-lesson-03 after the fix; keyboard/spacing audit.

## CURRENT STATE
- 337 lessons. Standalone skill lessons complete (29). Embedded: 15 (A1 unit-01 x6, unit-02 x5, unit-03 x4). Target about 90-100; A1 unit-02/03 still have more lessons available; A2, B1, B2, C1, C2 untouched.
- Segment recipe (unchanged): pick lessons with real `body_content` (skip empty/placeholder bodies such as A1 unit-01 03-09, 25, 29; A1 unit-02 lesson-01); append `<h3>Say it: <topic></h3>` or `<h3>Listen for: <topic></h3>` + text + optional `<h4>Where accents differ</h4>` + `.uk-us` block + `<blockquote>` practice line; add `audio_urls`; assert marker absent; edit BOTH per-level and lessons.json identically. Generators in /tmp are lost - recreate.
- Order: bump sw.js FIRST, rebuild core.zip from `offline/core-manifest.json` (deflate, manifest order), update tests (pins + note + new test), audit new lessons, verify-all (slow; re-run if output is missing).
- Audit: `setsid nohup python3 -m http.server 8765 &` from root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`; stop server via /proc scan.

## FILES CHANGED
`course_content/lessons/a1.json`, `course_content/lessons.json`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_307.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Embedded batch 3: A2 (units 01-03), then B1, B2, C1, C2. Same recipe. Check for other disallowed tags in existing content: grep body_content for tags outside ALLOWED_TAGS (e.g. `<u>`, `<table>`, `<sup>`) - they silently vanish.
3. Real-browser check that audio plays in lesson.html and quiz.html; re-audit a1-unit-04-lesson-03.
4. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 308."
----- END HANDOFF PACKAGE -----
