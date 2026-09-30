----- BEGIN HANDOFF PACKAGE -----
AGENT: 311
DATE: 2026-09-30
TASK: Step 3 (embedded skill segments), batch 6 + audit of batches 5/6
STATUS: complete (Step 3 target met)

## DONE THIS TURN
- Added a "Say it" / "Listen for" chapter to 11 lessons: B2 unit-01 03, 08, 11, 12 + unit-02 09; C1 unit-01 13, 17 + unit-02 09, 14; C2 unit-01-03, unit-02-01. UK|US block where accents differ (dropped where the difference was doubtful). One `audio_urls` item each -> `../shared/audio/sample.mp3`; `lesson_type` unchanged. Embedded total = 93 (A1 15, A2 16, B1 16, B2 21, C1 20, C2 5). Target 90-100 met.
- Data: `course_content/lessons/b2.json`, `c1.json`, `c2.json` + `lessons.json` (identical, `json.dumps(indent=2, ensure_ascii=False)+"\n"`). `core.zip` rebuilt (91); `sw.js` v43 -> v44. `tests/run.js`: v44 pins, +1 test.
- Gates: 998 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- Audit: lesson-contrast-names on all 46 lessons from batches 5+6: 0 issues. Run it in the background (`setsid nohup bash script &`, http.server on 8765, ~15 s/lesson, poll a log file); a single foreground loop exceeds the 300 s command limit.
- NOT verified: real-browser audio playback; keyboard/spacing audit.

## CURRENT STATE
- 337 lessons. Standalone skill lessons 29. Embedded 93. Step 3 done unless feedback asks for more.
- Recipe: `body_content = <p>escape(summary)</p>` (+ Examples / Key terms lists if present) + `<h3>Say it|Listen for: topic</h3>` + text + optional `<h4>Where accents differ</h4>` + `.uk-us` block + `<blockquote>`. Whitelisted tags only (P H2 H3 H4 STRONG EM B I UL OL LI BR A BLOCKQUOTE IMG DIV SPAN CODE PRE; class only on DIV/SPAN). /tmp scripts are lost.

## FILES CHANGED
`course_content/lessons/b2.json`, `c1.json`, `c2.json`, `course_content/lessons.json`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_311.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Real-browser check that audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons (needs a real browser/device).
3. Replace `shared/audio/sample.mp3` placeholders with real UK/US audio when available (each edit of course_content/*.json or the audio file => sw.js bump + core.zip rebuild).
4. RULES: core-manifest file edit => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 312."
----- END HANDOFF PACKAGE -----
