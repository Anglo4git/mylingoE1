----- BEGIN HANDOFF PACKAGE -----
AGENT: 316
DATE: 2026-09-30
TASK: Verify lesson audio under the shipped CSP (previous probes had no CSP)
STATUS: complete

## DONE THIS TURN
- NEW `tools/a11y/csp-audio-probe.js`: serves `dist/` with the exact CSP from netlify.toml plus Range support; 5 lessons (a1-unit-01-01, b1-unit-01-01, c1-unit-01-01 embedded; a1-unit-04-03, c2-unit-05-01 skill) x SW blocked/allowed = 10 runs. All: audio 4 s, no media error, 0 CSP violations, 0 errors. PASS.
- netlify.toml reviewed: `media-src 'self'` covers audio; no change needed.
- Tool-only change: no sw.js bump (v46), core.zip untouched. 1002 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real Netlify response headers, Safari/iOS, real devices, screen reader, real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3` (Range-safe via SW v46, CSP-clean); quiz audio = TTS only.
- `node tools/build-dist.js` creates `dist/` locally; it is NOT packaged (zip excludes nothing named dist, but verify the file list: the shipped zips contain no dist/). Delete `dist/` before zipping or add `-x "dist/*"`.
- Do NOT use `pkill -f <pattern>`. Start the static server with `setsid nohup python3 -m http.server 8765 &`; stop it by scanning /proc for the exact command line.

## FILES CHANGED
`tools/a11y/README.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`tools/a11y/csp-audio-probe.js`, `HANDOFF_AGENT_316.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. When real UK/US audio exists: replace `shared/audio/sample.mp3` references (course_content/*.json or audio change => sw.js bump + core.zip rebuild + tests pins), then rerun `csp-audio-probe.js` and `embedded-audio-keyboard.js`.
3. RULES: core-manifest file edit (sw.js is in it) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*" "dist/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
5. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 317."
----- END HANDOFF PACKAGE -----
