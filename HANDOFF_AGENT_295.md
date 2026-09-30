----- BEGIN HANDOFF PACKAGE -----
AGENT: 295
DATE: 2026-09-29
TASK: Build slice (a) of CURRICULUM_DECISIONS.md — UK | US side-by-side component
STATUS: complete

## DONE THIS TURN
- `courses/lesson.html`: `.lesson-content .uk-us` styles (2 cols; 1 col under 340px). Markup documented in LESSON_PLAYER_CONTENT_SCHEMA.md. Sanitizer unchanged (DIV/SPAN + class already allowed).
- Core-pack file changed -> `sw.js` CACHE_VERSION v28 -> v29; `offline/packs/core.zip` rebuilt from `offline/core-manifest.json` (90 files, manifest order, deflate; `unzip -t` clean). CSP unchanged.
- `tests/run.js`: v28 pins -> v29; +2 tests. 979 passed, 0 failed.
- `node tools/verify-all.js` -> ALL GATES PASSED (unit 979/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems).

## CURRENT STATE
- Lesson audit COMPLETE (308/308). Quiz-result contrast clean (390px, 320px).
- Decisions resolved (CURRICULUM_DECISIONS.md). UK|US component ready but NO lesson content uses it yet.
- Server: run `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &` FROM THE PROJECT ROOT; check `curl -sI http://localhost:8765/index.html`. `NODE_PATH=$(npm root -g)`.

## FILES CHANGED
- `courses/lesson.html`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `LESSON_PLAYER_CONTENT_SCHEMA.md`, `CURRICULUM_DECISIONS.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
- `HANDOFF_AGENT_295.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Slice (b): add lesson-length (short/long) and lesson-type (standalone-skill / embedded-skill / exam / fluency) OPTIONAL metadata to lesson JSON + schema doc, backward compatible; then (c) plan standalone pronunciation + listening lessons. Optional: pilot the `.uk-us` block in one existing lesson (that changes lesson content -> re-run lesson audit tooling for that lesson and rebuild the level offline pack).
2. RULE: any edit to a file in `offline/core-manifest.json` => bump sw.js CACHE_VERSION (update the 2 pins + note in tests/run.js) AND rebuild core.zip from the manifest (python zipfile, manifest order, deflate). Level packs (a1..c2.zip) must be rebuilt if their lesson/quiz files change.
3. C2 curriculum text NOT in repo: ask human to re-paste before any C2 integration.
4. PACKAGING (regression guard): `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify: file list == previous zip's + new handoff only; size must not shrink. NEVER overwrite CHANGELOG.md/STATE.md with a partial write (Agent 294 truncated CHANGELOG once; prepend/append only, check byte size).
5. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 296."
----- END HANDOFF PACKAGE -----
