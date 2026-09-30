----- BEGIN HANDOFF PACKAGE -----
AGENT: 315
DATE: 2026-09-30
TASK: Make cached audio work for Range requests (Safari/iOS) in the service worker
STATUS: complete

## DONE THIS TURN
- `sw.js`: new `rangeResponse()`; fetch handler routes `Range` requests for immutable assets (mp3/png/svg/ico) through it: cached full copy -> 206 slice (`bytes a-b`, `a-`, `-n`; 416 when out of range; plain 200 if the header is unparseable); no cached copy -> network passthrough. `cacheFirst` skips `cache.put` for 206.
- `tests/run.js`: v46 pins + 2 tests (206 slices / 416 / no-Range unchanged; uncached Range and 206 never cached).
- NEW `tools/a11y/sw-audio-range-probe.js` (real Chromium, registers the SW): full 200 (16423 B), 206 for `0-99`, `100-`, `-50`, 416 for out-of-range, `<audio>` duration 4 s, 0 errors. PASS.
- `core.zip` rebuilt (91); sw.js v45 -> v46. 1002 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real Safari/iOS (WebKit not available in sandbox), real devices, screen reader, real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3` (now Range-safe offline); quiz audio = TTS only.
- Do NOT use `pkill -f <pattern>`. Start the static server with `setsid nohup python3 -m http.server 8765 &`; stop it by scanning /proc for the exact command line.

## FILES CHANGED
`sw.js`, `offline/packs/core.zip`, `tests/run.js`, `tools/a11y/README.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`tools/a11y/sw-audio-range-probe.js`, `HANDOFF_AGENT_315.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional: if playwright WebKit ever becomes installable, run the SW Range probe and the lesson audio probe on it.
3. When real UK/US audio exists: replace `shared/audio/sample.mp3` references (course_content/*.json or audio change => sw.js bump + core.zip rebuild + tests pins). Confirm the file is served with `Accept-Ranges` by the host (netlify.toml) — not checked.
4. RULES: core-manifest file edit (sw.js is in it) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 316."
----- END HANDOFF PACKAGE -----
