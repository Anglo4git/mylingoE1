----- BEGIN HANDOFF PACKAGE -----
AGENT: 294
DATE: 2026-09-29
TASK: Record human answers to the four open curriculum decisions
STATUS: complete (docs only)

## DONE THIS TURN
- Human decisions recorded in `CURRICULUM_DECISIONS.md`: (1) English = mixed UK/US with side-by-side comparison every time; (2) 30% exam / 70% general fluency; (3) skills 50% standalone long lessons / 50% mixed into short regular lessons; (4) lesson length mixed.
- `node tools/verify-all.js` -> ALL GATES PASSED (unit 977/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems). No app, content, CSP or offline-pack changes.

## CURRENT STATE
- Lesson audit COMPLETE (308/308). Quiz-result contrast clean (390px and 320px).
- All four curriculum decisions RESOLVED. Nothing built from them yet.
- Server: run `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &` FROM THE PROJECT ROOT; check `curl -sI http://localhost:8765/index.html` first. `NODE_PATH=$(npm root -g)`.

## FILES CHANGED
- `STATE.md`, `CHANGELOG.md`
## FILES CREATED
- `CURRICULUM_DECISIONS.md`, `HANDOFF_AGENT_294.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Read `CURRICULUM_DECISIONS.md`. Next real work (pick smallest safe slice first, additive, gate-verified): (a) design the UK|US side-by-side component in the lesson schema + player, with tests; (b) add lesson-length and lesson-type (standalone skill / embedded skill / exam / fluency) metadata; (c) plan the standalone pronunciation + listening lessons.
2. C2 curriculum text is NOT in the repo: ask the human to re-paste it before any C2 integration.
3. PACKAGING (regression guard): `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip` (drops `offline/packs/*.zip`). Verify: file list == previous zip's + new handoff only (plus intentionally added files); size must not shrink.
4. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 295."
----- END HANDOFF PACKAGE -----
