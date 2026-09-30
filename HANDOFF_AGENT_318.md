----- BEGIN HANDOFF PACKAGE -----
AGENT: 318
DATE: 2026-09-30
TASK: Contrast check of the quiz audio (TTS) UI in light/dark
STATUS: complete

## DONE THIS TURN
- NEW `tools/a11y/quiz-audio-contrast.js` (real Chromium, speechSynthesis stubbed): 6 `*-media-01` quizzes x light/dark x states (idle, playing, after answer).
- DEFECT FOUND + FIXED: dark-mode `.tts-play` was 3.1:1 idle / 2.12:1 playing. Added 2 dark rules to `shared/css/theme.css` (idle `--my-dark-soft` + `#d2e5ff`; playing `--my-dark-brand` + `#07111f`). Probe after: 12 runs, 0 problems; 3 px focus outline present; no overflow.
- `core.zip` rebuilt (91); sw.js v46 -> v47; tests/run.js v47 pins + 1 test. 1004 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real devices, Safari/iOS, screen reader, disabled "Audio unavailable" state contrast (exempt), real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3` (Range-safe, CSP-clean, precache-guarded); quiz audio = TTS only (dark contrast now fixed).
- `node tools/build-dist.js` creates `dist/` locally; do not package it (`-x "dist/*"`).
- Do NOT use `pkill -f <pattern>`. Start the static server with `setsid nohup python3 -m http.server 8765 &`; stop it by scanning /proc for the exact command line.

## FILES CHANGED
`shared/css/theme.css`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `tools/a11y/README.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`tools/a11y/quiz-audio-contrast.js`, `HANDOFF_AGENT_318.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional: same light/dark contrast pass for the lesson-page audio slide (`.media-audio`/`<audio>` label, UK|US block) with real audio states; lesson-contrast-names already covered text on those slides.
3. When real UK/US audio exists: add files under `shared/audio/`, add to core-manifest + packs.json core list (test enforces), update references, sw.js bump + core.zip rebuild + pins; rerun `csp-audio-probe.js`, `embedded-audio-keyboard.js`, `sw-audio-range-probe.js`.
4. RULES: core-manifest file edit (sw.js, theme.css are in it) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*" "dist/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 319."
----- END HANDOFF PACKAGE -----
