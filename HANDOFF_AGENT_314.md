----- BEGIN HANDOFF PACKAGE -----
AGENT: 314
DATE: 2026-09-30
TASK: Guard quiz media (audio tts / image) against adapter regressions
STATUS: complete

## DONE THIS TURN
- Surveyed `media` across all shipped quiz JSON: only `image` {src, alt} (24) and `audio` {tts, label} (12), all in the six `vocabulary/<lvl>/<lvl>-media-01.json`. No legacy imageUrl/audioUrl/videoUrl, no other keys.
- Added test in `tests/run.js` (runtime-v2-adapter block): every shipped `*-media-NN.json` question keeps image src / audio src-or-tts through `normalizeQuiz`.
- Test-only: no app/content change, sw.js stays v45, core.zip untouched. 1000 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real device voices, Safari/iOS, screen reader, real UK/US audio (placeholder).

## CURRENT STATE
- 337 lessons; skill standalone 29; embedded 93. Lesson audio = placeholder `shared/audio/sample.mp3`; quiz audio = TTS only (6 quizzes, 12 questions).
- Do NOT use `pkill -f <pattern>`. Start the static server with `setsid nohup python3 -m http.server 8765 &`; stop it by scanning /proc for the exact command line.

## FILES CHANGED
`tests/run.js`, `STATE.md`, `CHANGELOG.md`
## FILES CREATED
`HANDOFF_AGENT_314.md`
## FILES DELETED
none

## NEXT AGENT - START HERE
1. Check human feedback (exam/fluency rule still unconfirmed - no bulk tagging).
2. Optional: extend media coverage beyond the six media quizzes (e.g. Listening questions in course quizzes) only if human asks; no such content exists now.
3. When real UK/US audio exists: replace `shared/audio/sample.mp3` references (course_content/*.json or audio change => sw.js bump + core.zip rebuild + tests pins).
4. RULES: core-manifest file edit => bump sw.js CACHE_VERSION (pins + note in tests/run.js) AND rebuild core.zip from packs.json core list (deflate, manifest order); level pack change => rebuild pack; inline script/style-hash change => `node tools/build-csp.js`. NEVER overwrite CHANGELOG.md/STATE.md (prepend only).
5. PACKAGING: `zip -qr OUT.zip . -x "MYLINGO_AGENT*_HANDOFF.zip" "node_modules/*"` - NEVER exclude `*.zip`. Verify file list == previous zip's + intentional new files.
6. Standing blockers unchanged (git remote / Netlify / domain / real devices; axe-core + Lighthouse; screen-reader pass; video focus ring check).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 315."
----- END HANDOFF PACKAGE -----
