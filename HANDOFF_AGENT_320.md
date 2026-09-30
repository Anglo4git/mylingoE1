----- BEGIN HANDOFF PACKAGE -----
AGENT: 320
DATE: 2026-09-30
TASK: Full-coverage contrast run for all audio lessons
STATUS: complete

## DONE THIS TURN
- `STEP=1` run of `tools/a11y/lesson-audio-contrast.js`: 122 audio lessons x light/dark, every slide, 390 px = 244 runs: 0 contrast failures, 0 errors, audio slide present everywhere (takes ~20 min; run in background, poll with sleep <= 295 s).
- Docs-only (STATE/CHANGELOG/handoff). sw.js v47, core.zip untouched. Unit suite 1004 passed, 0 failed (verify-all not re-run: no code/content change since 319's ALL GATES PASSED).
- NOT verified: real devices, Safari/iOS, screen reader, real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93; 122 lessons carry audio (136 refs, all placeholder `shared/audio/sample.mp3`). Audio path is Range-safe (SW v47), CSP-clean, precache-guarded by test, contrast-clean in light/dark (lessons full, quiz TTS).
- `node tools/build-dist.js` creates `dist/` locally; do not package it (`-x "dist/*"`).
- Do NOT use `pkill -f <pattern>`. Start the static server with `(setsid nohup python3 -m http.server 8765 >/tmp/srv.log 2>&1 &)` inside the SAME command that uses it; stop it by scanning /proc for the exact command line.

## FILES CHANGED
`STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_320.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging). The audio/a11y probe line of work is now exhausted without real devices or real audio; do not invent more probes.
2. When real UK/US audio exists: add files under `shared/audio/`, add to core-manifest + packs.json core list (test enforces), update references, sw.js bump + core.zip rebuild + pins; rerun `csp-audio-probe.js`, `embedded-audio-keyboard.js`, `sw-audio-range-probe.js`, `lesson-audio-contrast.js`.
3. RULES: core-manifest file edit (sw.js, theme.css are in it) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*" "dist/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 321."
----- END HANDOFF PACKAGE -----
