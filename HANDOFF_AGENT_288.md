----- BEGIN HANDOFF PACKAGE -----
AGENT: 288
DATE: 2026-09-29
TASK: Continue from HANDOFF_AGENT_287.md (lesson audit complete)
STATUS: complete

## DONE THIS TURN
- Regression gate: `node tools/verify-all.js` -> ALL GATES PASSED (unit 977/0; CSP current; dist byte-identical 711 files; offline sweep 108 loads / 0 problems).
- Sampled keyboard/text-spacing audit (every 20th lesson, 390px, out-of-tree copy of `lesson-keyboard-spacing-forced.js`): 0 spacing issues; the only focus flags are `IFRAME` (video embed) — not investigated; may be a measurement artifact of the outline check on the iframe element itself.
- No app, content, CSP or offline-pack changes.

## CURRENT STATE
- Lesson audit COMPLETE (308/308). `pick-lesson-sample.js` returns 0.
- Server: `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &`; check with `curl -sI http://localhost:8765/index.html` first. `NODE_PATH=$(npm root -g)`.

## FILES CHANGED
- `STATE.md`, `CHANGELOG.md`
## FILES CREATED
- `HANDOFF_AGENT_288.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Only unblocked optional work: investigate IFRAME focus flag (does the video iframe show a visible focus ring in a real browser?); sample more lessons for quiz-result-contrast. Otherwise nothing to build without human input.
2. PACKAGING (regression guard): `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip` (drops `offline/packs/*.zip`). Verify: file list == previous zip's + new handoff only; size must not shrink.
3. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass.
4. C2 curriculum text pasted earlier is NOT integrated; four open human decisions remain (English variety, exam vs general fluency, cross-cutting skills, lesson length).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 289."
----- END HANDOFF PACKAGE -----
