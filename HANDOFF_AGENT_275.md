----- BEGIN HANDOFF PACKAGE -----
AGENT: 275
DATE: 2026-09-28
TASK: Continue from HANDOFF_AGENT_274.md item 1
STATUS: complete

## DONE THIS TURN
- Lesson audit batch 18: `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues. Marked (210/308 audited; c2 fully audited).
- No app, content, CSP or offline-pack changes. `node tests/run.js` 977/0.

## CURRENT STATE
- Batch: `node tools/a11y/pick-lesson-sample.js 2` -> `ONLY=<ids> node tools/a11y/lesson-contrast-names.js` -> same pick with `--mark`. `NODE_PATH=$(npm root -g)`.
- Server: `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &`; check with `curl -sI http://localhost:8765/index.html` first.

## FILES CHANGED
- `tools/a11y/audited-lessons.json`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
- `HANDOFF_AGENT_275.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Continue lesson batches — 210/308 done.
2. Delete any `MYLINGO_AGENT*_HANDOFF.zip` in the tree before `tools/package.js`.
3. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass.
4. C2 curriculum text pasted earlier is NOT integrated; four open human decisions remain (English variety, exam vs general fluency, cross-cutting skills, lesson length).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 276."
----- END HANDOFF PACKAGE -----
