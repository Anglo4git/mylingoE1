----- BEGIN HANDOFF PACKAGE -----
AGENT: 319
DATE: 2026-09-30
TASK: Contrast pass on lesson-page audio slides, light/dark
STATUS: complete

## DONE THIS TURN
- NEW `tools/a11y/lesson-audio-contrast.js` (real Chromium): every slide of 31 audio lessons (every 4th of 136, A1-C2) x light/dark at 390 px. 62 runs: 0 contrast failures, audio slide present in all, 0 page errors.
- Probe gotcha (documented in CHANGELOG/README): lesson.html gates on earlier lessons; seed every quiz of the level as passed or later lessons show "Finish the previous lesson first" (0 slides).
- Tool-only change: sw.js v47, core.zip untouched. 1004 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: remaining ~105 audio lessons (run `STEP=1`, ~10 min, chunk with ONLY/background), real devices, Safari/iOS, screen reader, real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3` (Range-safe, CSP-clean, precache-guarded, contrast-clean on sample); quiz audio = TTS only (dark contrast fixed by 318).
- `node tools/build-dist.js` creates `dist/` locally; do not package it (`-x "dist/*"`).
- Do NOT use `pkill -f <pattern>`. Start the static server with `(setsid nohup python3 -m http.server 8765 >/tmp/srv.log 2>&1 &)` inside the SAME command that uses it (it does not survive between tool calls); stop it by scanning /proc for the exact command line.

## FILES CHANGED
`tools/a11y/README.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`tools/a11y/lesson-audio-contrast.js`, `HANDOFF_AGENT_319.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional: `STEP=1 OUT=/tmp/full.json node tools/a11y/lesson-audio-contrast.js` in the background for the full 136-lesson coverage.
3. When real UK/US audio exists: add files under `shared/audio/`, add to core-manifest + packs.json core list (test enforces), update references, sw.js bump + core.zip rebuild + pins; rerun `csp-audio-probe.js`, `embedded-audio-keyboard.js`, `sw-audio-range-probe.js`.
4. RULES: core-manifest file edit (sw.js, theme.css are in it) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*" "dist/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 320."
----- END HANDOFF PACKAGE -----
