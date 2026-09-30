----- BEGIN HANDOFF PACKAGE -----
AGENT: 309
DATE: 2026-09-30
TASK: Step 3 (embedded skill segments), batch 4: B1
STATUS: complete

## DONE THIS TURN
- Added a "Say it" / "Listen for" chapter to 16 B1 lessons: unit-01 lessons 01, 02, 04, 07, 10, 13, 16, 20, 21; unit-02 lessons 04, 08, 12, 15; unit-04 lessons 02, 05, 09. UK|US block where accents differ. One `audio_urls` item each -> `../shared/audio/sample.mp3`; `lesson_type` unchanged. Embedded total = 47 (A1 15, A2 16, B1 16).
- KEY FINDING: all regular B1, B2, C1, C2 lessons have NO `body_content` key/value (only `revision.summary`, a stub like "Practice X."). lesson.html builds the 3 text slides from body_content, else from revision summary/examples/key_terms. Recipe used: `body_content = "<p>" + html.escape(revision.summary) + "</p>" + segment` so the summary stays as the first block. Use `r.get('body_content')` (key may be absent). One C1 lesson has revision.examples/key_terms: for it, also keep them (e.g. add an Examples list) instead of dropping them.
- Data: `course_content/lessons/b1.json` + `lessons.json` (identical). `core.zip` rebuilt (91); `sw.js` v41 -> v42. `tests/run.js`: v42 pins, +1 test.
- Gates: 996 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). lesson-contrast-names: 0 issues on the 16 edited lessons.
- NOT verified: real-browser audio playback; keyboard/spacing audit.
- Process slip (fixed): a failing `&&` chain left sw.js bumped but tests un-pinned for one run; if a generator fails, re-check sw.js, tests/run.js and core.zip are all in sync before moving on.

## CURRENT STATE
- 337 lessons. Standalone skill lessons complete (29). Embedded: 47 (A1 15, A2 16, B1 16). Target about 90-100. Remaining: B2, C1, C2 (plus more A1/A2/B1 lessons if the count is short).
- Segment recipe: `<h3>Say it: <topic></h3>` or `<h3>Listen for: <topic></h3>` + text + optional `<h4>Where accents differ</h4>` + `.uk-us` block + `<blockquote>` practice line; `audio_urls` [{url:"../shared/audio/sample.mp3", title:<segment title>}]; edit BOTH per-level file and lessons.json identically. Whitelisted tags only: P H2 H3 H4 STRONG EM B I UL OL LI BR A BLOCKQUOTE IMG DIV SPAN CODE PRE (class only on DIV/SPAN; the A2 test enforces the whitelist). /tmp scripts are lost - recreate.
- Order: bump sw.js FIRST, rebuild core.zip from `offline/core-manifest.json` (deflate, manifest order), update tests (pins + note + new test), audit new lessons, verify-all (slow; re-run if output is missing).
- Audit: `setsid nohup python3 -m http.server 8765 &` from root; `NODE_PATH=$(npm root -g)`; `ONLY=<lesson_id> OUT=/tmp/x.json node tools/a11y/lesson-contrast-names.js`; stop the server via a /proc scan.

## FILES CHANGED
`course_content/lessons/b1.json`, `course_content/lessons.json`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_309.md`
## FILES DELETED
none

## NEXT AGENT — START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Embedded batch 5: B2 (all units except unit-06 skills), then C1 (except unit-06), C2 (except unit-05). Use the summary-first recipe above. About 1 per 3-4 lessons.
3. Real-browser check that audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons.
4. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes.
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 310."
----- END HANDOFF PACKAGE -----
