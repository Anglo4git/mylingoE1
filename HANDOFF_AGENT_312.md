----- BEGIN HANDOFF PACKAGE -----
AGENT: 312
DATE: 2026-09-30
TASK: Real-browser check of embedded skill lessons (audio, keyboard, spacing)
STATUS: complete

## DONE THIS TURN
- Added `tools/a11y/embedded-audio-keyboard.js` (headless Chromium via playwright; `NODE_PATH=$(npm root -g)`; server on :8765; `ONLY=<ids>`; `OUT=`) and `tools/a11y/run-embedded-probe.sh.txt` (chunked background runner; copy to .sh to use).
- Probe trick: the video slide gates Continue and offline mode swaps audio for a "Media unavailable offline" fallback, so the probe stays online, aborts youtube requests and injects a fake `window.YT` whose Player fires `onStateChange({data:0})` to unlock Continue.
- Result on all 93 embedded lessons at 390 and 320 px (186 runs): audio slide loads `../shared/audio/sample.mp3` (200, 16423 bytes, duration 4 s, no media error), audio element focusable, 54 px tall; no horizontal overflow; 9-12 tab stops with visible focus; h3/h4/blockquote/.uk-us/p spacing and 16 px text OK; 0 page errors, 0 failed requests.
- No content change: sw.js stays v44, core.zip untouched. 998 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real devices / screen reader; real UK/US audio (placeholder only); quiz.html audio for Listening quick checks (`media.audio` in lesson_content quizzes) - not probed; the probe ran headless Chromium, not Safari/iOS.

## CURRENT STATE
- 337 lessons; standalone skill lessons 29; embedded 93 (A1 15, A2 16, B1 16, B2 21, C1 20, C2 5). Step 3 complete; audio is placeholder for every skill/embedded lesson.
- Do NOT use `pkill -f <pattern>` in the sandbox: it matches the calling shell and kills the command. Kill by scanning /proc and matching the exact command line.

## FILES CHANGED
`SKILLS_LESSON_PLAN.md` (unchanged this turn), `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`tools/a11y/embedded-audio-keyboard.js`, `tools/a11y/run-embedded-probe.sh.txt`, `HANDOFF_AGENT_312.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional: probe quiz.html Listening quick checks with audio (media.audio) the same way; add to the probe tool.
3. When real UK/US audio exists: replace `shared/audio/sample.mp3` references (any course_content/*.json or audio change => sw.js bump + core.zip rebuild + tests pins).
4. RULES: core-manifest file edit => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 313."
----- END HANDOFF PACKAGE -----
