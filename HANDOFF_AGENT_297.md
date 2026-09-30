----- BEGIN HANDOFF PACKAGE -----
AGENT: 297
DATE: 2026-09-29
TASK: Slice (c) — plan standalone pronunciation + listening lessons (docs only)
STATUS: complete

## DONE THIS TURN
- Wrote `SKILLS_LESSON_PLAN.md`: baseline (308 lessons, no skill lessons yet; `category` is free text so "Pronunciation"/"Listening" need no code change), ~30 standalone long lessons across A1-C2, embedded short segments (~1 per 3-4 lessons), UK|US rules, proposed exam/fluency tagging (~30/70), length rule, build order, open questions.
- Docs only. `node tools/verify-all.js` -> ALL GATES PASSED (unit 983/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems). No app, content, CSP, offline-pack or sw.js changes.

## CURRENT STATE
- Built but unused: `.uk-us` component (295), lesson_length/lesson_type tags (296).
- Server: run `setsid nohup python3 -m http.server 8765 >/tmp/http.log 2>&1 < /dev/null &` FROM THE PROJECT ROOT; `NODE_PATH=$(npm root -g)`.

## FILES CHANGED
- `STATE.md`, `CHANGELOG.md`, `CURRICULUM_DECISIONS.md`
## FILES CREATED
- `SKILLS_LESSON_PLAN.md`, `HANDOFF_AGENT_297.md`
## FILES DELETED
- none

## NEXT AGENT — START HERE
1. Ask/await human answers to the 3 open questions at the end of SKILLS_LESSON_PLAN.md (audio source; exam/fluency rule; standalone counts). If the human says nothing, proceed with plan defaults, text/phonetic only (no audio).
2. Build step 1 (pilot): ONE A1 standalone pronunciation lesson (alphabet + sounds) using `.uk-us` + tags; new skills unit appended (no renumbering) in `course_content/lessons/a1.json` and the units/courses mirrors; check `lesson_content/` mirrors, rebuild `offline/packs/a1.zip` (+ core.zip/CACHE_VERSION only if core files change), run lesson audit tooling for the new lesson, verify-all. Read how a recent lesson-adding handoff (e.g. HANDOFF_AGENT_226-228 A1+ work) did it first.
3. RULES: core-manifest file edit => bump sw.js CACHE_VERSION + update pins/notes in tests/run.js + rebuild core.zip from manifest. Inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes (prepend/append; check size).
4. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` — NEVER exclude `*.zip`. Verify file list == previous zip's + new handoff (+ intentional files); sizes must not shrink.
5. C2 curriculum text NOT in repo: ask human to re-paste. Standing blockers unchanged: git remote / Netlify site / domain / physical devices; axe-core + Lighthouse (npm 403); domain-gated canonical/og/sitemap; real screen-reader pass.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 298."
----- END HANDOFF PACKAGE -----
