----- BEGIN HANDOFF PACKAGE -----
AGENT: 310
DATE: 2026-09-30
TASK: Step 3 (embedded skill segments), batch 5: B2, C1, C2
STATUS: complete

## DONE THIS TURN
- Added a "Say it" / "Listen for" chapter to 35 lessons: B2 16 (unit-01 01, 02, 04, 07, 10, 13, 16, 20, 21; unit-02 02, 08, 12, 15; unit-05 03, 09, 13), C1 16 (unit-01 01, 02, 03, 05, 09, 14, 15; unit-02 04, 11, 16, 19; unit-04 01, 02, 03; unit-05 04, 11), C2 3 (unit-01-01, unit-02-02, unit-03-01). UK|US block where accents differ. One `audio_urls` item each -> `../shared/audio/sample.mp3`; `lesson_type` unchanged. Embedded total = 82 (A1 15, A2 16, B1 16, B2 16, C1 16, C2 3).
- Recipe: `body_content = "<p>" + html.escape(revision.summary) + "</p>"` (+ `<h3>Examples</h3><ul>` / `<h3>Key terms</h3><ul>` if revision has them; used for C1 unit-04-lesson-03) + segment.
- JSON files are serialized as `json.dumps(d, indent=2, ensure_ascii=False) + "\n"` (round-trips byte-identical).
- Data: `course_content/lessons/b2.json`, `c1.json`, `c2.json` + `lessons.json` (identical). `core.zip` rebuilt (91); `sw.js` v42 -> v43. `tests/run.js`: v43 pins, +1 test.
- Gates: 997 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). Whitelist-tag check on all 35 bodies: clean.
- NOT verified: lesson-contrast-names on the 35 lessons (a 35-lesson loop in one command exceeds the 300 s limit; run in batches of about 8 with background + polling), real-browser audio playback, keyboard/spacing audit.

## CURRENT STATE
- 337 lessons. Standalone skill lessons complete (29). Embedded: 82. Target about 90-100. Candidates left: B2 unit-01 03, 05, 06, 08, 09, 11, 12; unit-02 03, 06, 07, 09; C1 unit-01 06-08, 10-13, 16-21; unit-02 03, 05-10, 12-15, 17-18; C2 unit-01 02-05, unit-02 01, 03; plus more A1/A2/B1.
- Segment recipe unchanged: `<h3>Say it|Listen for: <topic></h3>` + text + optional `<h4>Where accents differ</h4>` + `.uk-us` block + `<blockquote>`; edit BOTH per-level file and lessons.json identically. Whitelisted tags only: P H2 H3 H4 STRONG EM B I UL OL LI BR A BLOCKQUOTE IMG DIV SPAN CODE PRE (class only on DIV/SPAN). /tmp scripts are lost - recreate.
- Order: bump sw.js FIRST, rebuild core.zip from `offline/core-manifest.json` (deflate, manifest order), update tests (pins + note + new test), verify-all, then audit.

## FILES CHANGED
`course_content/lessons/b2.json`, `c1.json`, `c2.json`, `course_content/lessons.json`, `offline/packs/core.zip`, `sw.js`, `tests/run.js`, `SKILLS_LESSON_PLAN.md`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_310.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional embedded batch 6 (about 8-18 more, to reach 90-100), or stop at 82 if feedback says enough.
3. Run lesson-contrast-names on the 35 new lessons in small batches; real-browser check that audio plays in lesson.html and quiz.html; keyboard/spacing audit of skill lessons.
4. RULES: core-manifest file edit (course_content/*.json, a1..c2/quizzes.json) => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip; level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md with partial writes (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 311."
----- END HANDOFF PACKAGE -----
