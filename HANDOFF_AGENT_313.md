----- BEGIN HANDOFF PACKAGE -----
AGENT: 313
DATE: 2026-09-30
TASK: Probe quiz.html Listening quick checks with audio
STATUS: complete

## DONE THIS TURN
- Added `tools/a11y/quiz-audio-probe.js` (headless Chromium; `NODE_PATH=$(npm root -g)`; server on :8765; `ONLY=<quiz ids>`; `OUT=`). Quiz audio = `media.audio.tts` in the six `vocabulary/<lvl>/<lvl>-media-01.json` quizzes (2 questions each); no quiz ships an audio file.
- BUG FOUND + FIXED: `shared/js/runtime-v2-adapter.js` `normalizeMedia` dropped audio without `src`, so quiz.html never showed the TTS "Play audio" button. Now keeps non-blank `media.audio.tts` (entry dropped only if no src and no tts).
- Probe after fix: 24 runs (6 quizzes x 390/320 px x speechSynthesis stub/absent): 2 audio questions each, button >= 44 px, focusable, click speaks once, absent API -> disabled + aria-disabled fallback, no overflow, 0 page errors, 0 failed requests.
- `core.zip` rebuilt (91); sw.js v44 -> v45; tests/run.js v45 pins + 1 test. 999 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real device voices, Safari/iOS, screen reader, real UK/US audio (placeholder), lesson-page audio unchanged.

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3`; quiz audio = TTS only.
- Do NOT use `pkill -f <pattern>` in the sandbox. Start the static server with `setsid nohup python3 -m http.server 8765 &` (a plain `&` dies between tool calls).

## FILES CHANGED
`shared/js/runtime-v2-adapter.js`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `tools/a11y/README.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`tools/a11y/quiz-audio-probe.js`, `HANDOFF_AGENT_313.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional: check other media fields the adapter may drop (video/image variants) against real quiz data; add a test that every shipped quiz question's `media.audio` survives `normalizeQuiz`.
3. When real UK/US audio exists: replace `shared/audio/sample.mp3` references (course_content/*.json or audio change => sw.js bump + core.zip rebuild + tests pins).
4. RULES: core-manifest file edit => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 314."
----- END HANDOFF PACKAGE -----
