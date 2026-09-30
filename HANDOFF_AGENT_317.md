----- BEGIN HANDOFF PACKAGE -----
AGENT: 317
DATE: 2026-09-30
TASK: Guard audio reference integrity (disk + offline precache)
STATUS: complete

## DONE THIS TURN
- Audited `audio_urls` across a1..c2 catalogs: 136 refs, all `../shared/audio/sample.mp3`; present on disk, in `offline/core-manifest.json` and `offline/packs.json` core list.
- Added 1 test in `tests/run.js` enforcing that for every local audio ref (remote http(s) refs are skipped).
- Test-only: sw.js stays v46, core.zip untouched. 1003 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real devices, Safari/iOS, screen reader, real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3` (Range-safe via SW v46, CSP-clean, precache-guarded by test); quiz audio = TTS only.
- `node tools/build-dist.js` creates `dist/` locally; do not package it (`-x "dist/*"`).
- Do NOT use `pkill -f <pattern>`. Start the static server with `setsid nohup python3 -m http.server 8765 &`; stop it by scanning /proc for the exact command line.

## FILES CHANGED
`tests/run.js`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_317.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. When real UK/US audio exists: add files under `shared/audio/`, add them to core-manifest + packs.json core list (test will fail otherwise), update references, sw.js bump + core.zip rebuild + pins; rerun `csp-audio-probe.js`, `embedded-audio-keyboard.js`, `sw-audio-range-probe.js`.
3. RULES: core-manifest file edit (sw.js is in it) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*" "dist/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 318."
----- END HANDOFF PACKAGE -----
