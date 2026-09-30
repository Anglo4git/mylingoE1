----- BEGIN HANDOFF PACKAGE -----
AGENT: 296
DATE: 2026-09-29
TASK: Slice (b) of CURRICULUM_DECISIONS.md — lesson length + lesson type metadata
STATUS: complete

## DONE THIS TURN
- `courses/lesson.html`: optional `lesson_length` (short|long) and `lesson_type` (standalone_skill|embedded_skill|exam|fluency) -> chips via `lessonTagLabels()`; whitelist only, prototype-key safe, esc()'d, nothing rendered when absent. Documented in LESSON_PLAYER_CONTENT_SCHEMA.md.
- Inline script changed -> `node tools/build-csp.js` run (updated `netlify.toml` script hashes; still 16 hashes). Core-pack file changed -> `sw.js` CACHE_VERSION v29 -> v30; `offline/packs/core.zip` rebuilt from manifest (90 files, order kept).
- `tests/run.js`: v29 pins -> v30; +4 tests incl. shipped-data invariant (any lesson using the fields must use allowed values). 983 passed, 0 failed.
- `node tools/verify-all.js` -> ALL GATES PASSED (unit 983/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems).

## CURRENT STATE
- Lesson audit COMPLETE (308/308). Quiz-result contrast clean (390px, 320px).
- UK|US component (295) and lesson tags (296) are built but NO lesson content uses them yet.
- Server: run `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &` FROM THE PROJECT ROOT; check `curl -sI http://localhost:8765/index.html`. `NODE_PATH=$(npm root -g)`.

## FILES CHANGED
- `courses/lesson.html`, `netlify.toml`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `LESSON_PLAYER_CONTENT_SCHEMA.md`, `CURRICULUM_DECISIONS.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
- `HANDOFF_AGENT_296.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Slice (c): PLAN (docs only first) the standalone pronunciation + listening lessons (long, `lesson_type: standalone_skill`, `lesson_length: long`) and the embedded short skill segments; include UK|US comparisons for pronunciation. Then optionally pilot ONE lesson using `.uk-us` + tags: editing `course_content/lessons/<level>.json` requires re-running lesson audit tooling for it and rebuilding the affected level pack (`offline/packs/<level>.zip`) + checking `lesson_content/` mirrors; run verify-all.
2. RULE: any edit to a file in `offline/core-manifest.json` => bump sw.js CACHE_VERSION (update the pins + note in tests/run.js) AND rebuild core.zip from the manifest (python zipfile, manifest order, deflate). Inline script/style-hash changes => `node tools/build-csp.js`. Level packs must be rebuilt if their lesson/quiz files change.
3. C2 curriculum text NOT in repo: ask human to re-paste before any C2 integration.
4. PACKAGING (regression guard): `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify: file list == previous zip's + new handoff only; sizes must not shrink. NEVER overwrite CHANGELOG.md/STATE.md with a partial write (prepend/append only, check byte size).
5. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 297."
----- END HANDOFF PACKAGE -----
