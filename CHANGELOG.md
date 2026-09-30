## 2026-09-30 — Agent 320 — Full lesson-audio contrast coverage
- Ran `STEP=1 node tools/a11y/lesson-audio-contrast.js` (~20 min): 122 lessons with audio (136 audio refs; some lessons have two) x light/dark at 390 px, every slide = 244 runs: 0 contrast failures, audio slide present in all, 0 page errors. Closes the "sampled only" gap from Agent 319.
- Docs-only change: sw.js v47, core.zip untouched, no code touched. Unit suite 1004 passed, 0 failed.
- NOT verified: real devices, Safari/iOS, screen reader, real UK/US audio (placeholder).

<!-- Agent 320: full audio-lesson contrast run. See HANDOFF_AGENT_320.md. -->
## 2026-09-30 — Agent 319 — Lesson audio-slide contrast (light/dark)
- NEW `tools/a11y/lesson-audio-contrast.js`: all slides of a sample of audio lessons (`STEP=4` -> 31 lessons across A1-C2; `STEP=1` for all 136; `ONLY=` ids) x light/dark at 390 px, WCAG text contrast via the shared `contrast-fn.js`. Result: 62 runs, 0 contrast failures, audio slide present in every run, 0 page errors.
- Gotcha for probes: `lesson.html` gates lessons ("Finish the previous lesson first"), so the probe seeds EVERY quiz of the level as passed; seeding only the lesson's own quizzes leaves later lessons on the gate page with 0 slides (first runs reported that as 58 false problems).
- No app/content change: sw.js v47, core.zip untouched. 1004 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: the other ~105 audio lessons (sampled, run with STEP=1 to cover), real devices, Safari/iOS, screen reader.

<!-- Agent 319: lesson audio contrast probe. See HANDOFF_AGENT_319.md. -->
## 2026-09-30 — Agent 318 — Quiz TTS button contrast in dark mode
- BUG: in dark mode `.tts-play` (quiz.html audio questions) inherited light-tuned colours: idle text 3.1:1, "Playing..." state 2.12:1 (WCAG AA needs 4.5:1). Light mode was fine.
- Fix: two rules in the dark block of `shared/css/theme.css` (idle: `--my-dark-soft` bg + `#d2e5ff`; playing: `--my-dark-brand` bg + `#07111f`, same pairs already used by `.lvl` and `.primary`). No quiz.html change, so no CSP hash change.
- NEW `tools/a11y/quiz-audio-contrast.js`: 6 media quizzes x light/dark, states idle / playing / after answer: contrast, 3 px focus outline, no overflow, 0 errors. Before: 6 problems (all dark). After: 12 runs, 0 problems.
- `core.zip` rebuilt (91), sw.js v46 -> v47, tests/run.js: v47 pins + 1 test. 1004 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real devices, Safari/iOS, screen reader; the disabled "Audio unavailable" state is exempt from contrast rules and was not measured.

<!-- Agent 318: quiz TTS dark contrast fix. See HANDOFF_AGENT_318.md. -->
## 2026-09-30 — Agent 317 — Audio reference integrity test
- Audited all lesson `audio_urls`: 136 references, all `../shared/audio/sample.mp3`; file exists, listed in `offline/core-manifest.json` and the core list in `offline/packs.json`. No gaps.
- `tests/run.js`: +1 test so a future real-audio swap cannot ship a missing or un-precached file (fails if any local audio ref is absent on disk, from the core manifest, or from the core pack list; expects >= 136 refs).
- No app/content change: sw.js v46, core.zip untouched. 1003 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).

<!-- Agent 317: audio reference integrity test. See HANDOFF_AGENT_317.md. -->
## 2026-09-30 — Agent 316 — Audio under the shipped CSP
- Earlier audio probes (312, 315) used a plain static server with no CSP. NEW `tools/a11y/csp-audio-probe.js` serves `dist/` with the exact `Content-Security-Policy` from netlify.toml (+ nosniff, Accept-Ranges/206 like Netlify) and loads the audio slide of 5 lessons with the service worker blocked and allowed (10 runs): audio duration 4 s, no media error, 0 `securitypolicyviolation` events, 0 CSP console errors, 0 page errors. PASS.
- netlify.toml reviewed: `media-src 'self'` covers `/shared/audio/*`; no audio-specific Cache-Control (Netlify default revalidation is fine with the SW cache-first). No change.
- No app/content change: sw.js v46, core.zip untouched. 1002 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real Netlify headers (local server emulates them), Safari/iOS, real devices, screen reader.

<!-- Agent 316: CSP-enforced audio probe. See HANDOFF_AGENT_316.md. -->
## 2026-09-30 — Agent 315 — Service worker Range/206 for audio
- RISK FIXED: `sw.js` cache-first returned the full cached 200 for every mp3 request. Safari/iOS sends `Range: bytes=...` for <audio> and does not accept a 200 to it, so lesson audio would fail (or not seek) there once cached/offline. Added `rangeResponse()`: cached full copy -> 206 slice with Content-Range / Content-Length / Accept-Ranges (open-ended, suffix and out-of-range 416 handled); no cached copy -> straight to network; `cacheFirst` no longer caches a 206.
- `tests/run.js`: v46 pins + 2 tests. `core.zip` rebuilt (91), sw.js v45 -> v46.
- NEW `tools/a11y/sw-audio-range-probe.js`: real Chromium, registers the SW, Range fetches on `sample.mp3`: 206/206/206/416 as expected, `<audio>` loads (4 s, no error), 0 page errors.
- 1002 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real Safari/iOS (WebKit behaviour inferred from the Range requirement, not observed), real devices, screen reader.

<!-- Agent 315: SW Range/206 for audio. See HANDOFF_AGENT_315.md. -->
## 2026-09-30 — Agent 314 — Shipped-quiz media regression test
- Survey: no other media shapes ship (no videoUrl/imageUrl/audioUrl legacy fields, no other media keys). Adapter drops nothing else in real data.
- `tests/run.js`: +1 test walking every `vocabulary/**/*-media-NN.json`, asserting each `media.image` keeps `src` and each `media.audio` keeps `src` or trimmed `tts` after `normalizeQuiz` (>= 12 audio, >= 24 image). 1000 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). No app/content change; sw.js v45.

<!-- Agent 314: shipped-quiz media test. See HANDOFF_AGENT_314.md. -->
## 2026-09-30 — Agent 313 — Quiz TTS audio fix + quiz audio probe
- BUG: `normalizeMedia` (runtime-v2-adapter.js) kept `media.audio` only when it had `src`; the six `vocabulary/*/*-media-01.json` quizzes use `media.audio.tts` (2 Listening questions each), so `quiz.html` hid the audio wrapper and the TTS button. Fix: keep a non-blank `tts` string on the normalized audio entry (dropped only when neither `src` nor `tts`).
- NEW `tools/a11y/quiz-audio-probe.js`: real-Chromium probe, 6 media quizzes x 390/320 px x speechSynthesis stub/absent (24 runs): each has 2 audio questions, TTS button >= 44 px, focusable, click speaks the text once, missing API -> disabled + aria-disabled fallback, no h-scroll, 0 page errors / failed requests. 0 problems after the fix.
- `core.zip` rebuilt (91), sw.js v44 -> v45, tests/run.js: v45 pins + 1 adapter test. 999 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- NOT verified: real device speech voices (headless stub only), Safari/iOS, screen reader, real UK/US audio.

<!-- Agent 313: quiz TTS audio fix + probe. See HANDOFF_AGENT_313.md. -->
## 2026-09-30 — Agent 312 — Real-browser audio / keyboard / spacing check of all embedded lessons
- NEW `tools/a11y/embedded-audio-keyboard.js` (+ `run-embedded-probe.sh.txt` chunk runner): headless Chromium probe. Fakes `window.YT` so the video gate unlocks (offline mode would replace the audio slide with a fallback, so the probe stays online with YouTube blocked).
- Ran on all 93 embedded lessons at 390 and 320 px (186 runs): audio slide loads `sample.mp3` (HTTP 200, 16423 bytes, duration 4 s, no media error), audio element is focusable and 54 px tall; no horizontal overflow; 9-12 tab stops with visible focus on all; `.lesson-content` h3/h4/blockquote/.uk-us/p margins and 16 px text OK; 0 page errors, 0 failed requests.
- No app/content change: no sw.js bump, core.zip untouched. 998 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- Still NOT verified: real devices, screen reader, real UK/US audio (placeholder only), quiz.html audio (Listening quick checks use `media.audio` in lesson_content quizzes; not probed).

<!-- Agent 312: browser probe of embedded lessons, all clean. See HANDOFF_AGENT_312.md. -->
## 2026-09-30 — Agent 311 — Embedded skill segments, batch 6 (B2, C1, C2) + audit
- 11 more embedded "Say it" / "Listen for" chapters: B2 5 (unit-01 03, 08, 11, 12; unit-02 09), C1 4 (unit-01 13, 17; unit-02 09, 14), C2 2 (unit-01-03, unit-02-01). Embedded total = 93 (A1 15, A2 16, B1 16, B2 21, C1 20, C2 5). Target reached.
- Data: `b2.json`, `c1.json`, `c2.json` + `lessons.json` (identical). `core.zip` rebuilt (91); sw.js v43 -> v44. `tests/run.js`: v44 pins, +1 test. 998 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems).
- lesson-contrast-names on all 46 lessons of batches 5+6: 0 issues (run in background, about 15 s per lesson). NOT run: real-browser audio, keyboard/spacing audit.

<!-- Agent 311: embedded segments batch 6 (11 lessons) + batch 5/6 audit. See HANDOFF_AGENT_311.md. -->
## 2026-09-30 — Agent 310 — Embedded skill segments, batch 5 (B2, C1, C2)
- 35 embedded "Say it" / "Listen for" chapters: B2 16 (unit-01 01, 02, 04, 07, 10, 13, 16, 20, 21; unit-02 02, 08, 12, 15; unit-05 03, 09, 13), C1 16 (unit-01 01, 02, 03, 05, 09, 14, 15; unit-02 04, 11, 16, 19; unit-04 01, 02, 03; unit-05 04, 11), C2 3 (unit-01-01, unit-02-02, unit-03-01). UK|US block where accents differ. One `audio_urls` item each -> `../shared/audio/sample.mp3`; `lesson_type` unchanged. Embedded total = 82 (A1 15, A2 16, B1 16, B2 16, C1 16, C2 3).
- Recipe: `body_content = <p>summary</p>` (+ Examples / Key terms lists when the revision has them: C1 unit-04-lesson-03) + segment.
- Data: `b2.json`, `c1.json`, `c2.json` + `lessons.json` (identical). `core.zip` rebuilt (91); sw.js v42 -> v43. `tests/run.js`: v43 pins, +1 test. 997 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). NOT run: lesson-contrast-names on the 35 lessons (loop timed out at 300 s), real-browser audio, keyboard/spacing audit.

<!-- Agent 310: embedded segments batch 5 (B2/C1/C2, 35 lessons). See HANDOFF_AGENT_310.md. -->
## 2026-09-30 — Agent 309 — Embedded skill segments, batch 4 (B1)
- 16 embedded "Say it" / "Listen for" chapters on B1 lessons: unit-01 01, 02, 04, 07, 10, 13, 16, 20, 21; unit-02 04, 08, 12, 15; unit-04 02, 05, 09. UK|US block where accents differ. One placeholder `audio_urls` item each; `lesson_type` unchanged. Embedded total: 47.
- FINDING: every regular B1-C2 lesson has NO `body_content` (only a stub `revision.summary`, e.g. "Practice X."). lesson.html builds its 3 text slides from body_content, else from the revision summary/examples/key_terms. So a body containing only the segment would REPLACE the summary slide. Recipe for these levels: `body_content = "<p>" + escaped revision.summary + "</p>" + segment`, which keeps the summary text as the first block. (A1/A2 lessons already had real bodies.)
- Data: `course_content/lessons/b1.json` + `lessons.json`. `core.zip` rebuilt (91); sw.js v41 -> v42. `tests/run.js`: v42 pins, +1 test. 996 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on the 16 edited lessons. NOT run: real-browser audio playback.

<!-- Agent 309: embedded segments batch 4 (B1, 16 lessons). See HANDOFF_AGENT_309.md. -->
## 2026-09-30 — Agent 308 — Embedded skill segments, batch 3 (A2)
- 16 embedded "Say it" / "Listen for" chapters appended to existing A2 lessons: unit-01 04, 08, 11, 14, 17, 21; unit-02 04, 08, 10, 14, 20; unit-03 01, 03, 06, 10, 12. UK|US block where accents differ. One placeholder `audio_urls` item each; `lesson_type` unchanged. Embedded total: 31.
- Scanned all level catalogs for tags outside lesson.html's sanitizer whitelist: none remain (after Agent 307's `<u>` fix). New test pins this for every lesson body.
- Data: `course_content/lessons/a2.json` + `lessons.json`. `core.zip` rebuilt (91); sw.js v40 -> v41. `tests/run.js`: v41 pins, +1 test. 995 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on the 16 edited lessons + a1-unit-04-lesson-03. NOT run: real-browser audio playback.

<!-- Agent 308: embedded segments batch 3 (A2, 16 lessons). See HANDOFF_AGENT_308.md. -->
## 2026-09-30 — Agent 307 — Embedded skill segments, batch 2 (A1 unit-02/03) + <u> fix
- 9 more embedded "Say it" / "Listen for" chapters appended to existing A1 lessons: unit-02 lessons 02, 05, 10, 14, 17; unit-03 lessons 01, 03, 09, 10. UK|US block where accents differ (02, 05, 14, 17, 03, 10). One placeholder `audio_urls` item each; `lesson_type` unchanged. Embedded total: 15.
- FIX: `<u>` is NOT an allowed tag in lesson.html's sanitizer (the element and its text are removed). Agent 299's `course-a1-unit-04-lesson-03` used `<u>teen</u>`/`<u>thir</u>`, so those syllables never showed; replaced with `thirTEEN` / `THIRty`.
- Data: `course_content/lessons/a1.json` + `lessons.json`. `core.zip` rebuilt (91); sw.js v39 -> v40. `tests/run.js`: v40 pins, +1 test. 994 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on the 9 edited lessons. NOT run: real-browser audio playback; contrast audit on unit-04-lesson-03 after the fix.

<!-- Agent 307: embedded segments batch 2 (A1 unit-02/03, 9 lessons) + u-tag fix. See HANDOFF_AGENT_307.md. -->
## 2026-09-30 — Agent 306 — Embedded skill segments, batch 1 (A1 unit-01)
- Step 3 started: short "Say it" / "Listen for" chapter appended to `body_content` of 6 existing A1 unit-01 lessons (01 Present Simple, 02 Be, 10 Pronouns, 14 Short-Form Answers, 17 Adverbs of Frequency, 21 Superlatives). UK|US block where accents differ (01, 14, 17). Each gets one `audio_urls` item -> `../shared/audio/sample.mp3`. `lesson_type` unchanged (no `embedded_skill`; that tag is for mostly-drill lessons). Lessons with empty/placeholder bodies (03-09, 25, 29) skipped on purpose.
- Data: `course_content/lessons/a1.json` + `lessons.json` only. `core.zip` rebuilt (91); sw.js v38 -> v39. No level-pack change.
- `tests/run.js`: v39 pins, +1 test. 993 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems); lesson-contrast-names 0 issues on all 6 edited lessons. NOT run: real-browser audio playback.

<!-- Agent 306: embedded segments batch 1 (A1 unit-01, 6 lessons). See HANDOFF_AGENT_306.md. -->
## 2026-09-30 — Agent 305 — C2 skills unit (with audio structure)
- NEW unit `course-c2-unit-05` "Pronunciation and Listening" (order 5) + 2 lessons (standalone_skill, long, UK|US block each): 01 Intonation: Attitude and Nuance (Pronunciation); 02 Listening: Implication, Irony and Accents (Listening). `audio_urls` -> `../shared/audio/sample.mp3` (UK + US items / one "Listen" item); Listening quick checks carry `media.audio`. C2 text was not in the repo, so content follows SKILLS_LESSON_PLAN.md topics.
- Wired as C1 (c2.json, lessons.json, units.json, courses.json, 2 lesson_content/c2 quizzes, c2/quizzes.json, packs.json, audited list 337). Rebuilt `c2.zip` (26) + `core.zip` (91); sw.js v37 -> v38.
- `tests/run.js`: v38 pins, catalog count 337, +1 C2 test. 992 passed, 0 failed; verify-all ALL GATES PASSED (dist 741 files, sweep 108 loads / 0 problems). lesson-contrast-names: 0 issues on the 4 C1 + 2 C2 skill lessons. NOT run: real-browser audio playback.

<!-- Agent 305: C2 skills unit added (337 lessons total). See HANDOFF_AGENT_305.md. -->
## 2026-09-30 — Agent 304 — C1 skills unit (with audio structure)
- NEW unit `course-c1-unit-06` "Pronunciation and Listening" (order 6) + 4 lessons (standalone_skill, long, UK|US block each): 01 Rhythm and Chunking, 02 Discourse Intonation (Pronunciation); 03 Fast Speech, 04 Academic Lectures (Listening). Each has `audio_urls` -> `../shared/audio/sample.mp3` (Pronunciation: UK + US items; Listening: one "Listen: ..." item); Listening quick checks carry `media.audio` (`audio/sample.mp3`).
- Wired as A1-B2 (c1.json, lessons.json after last c1 record, units.json, courses.json, 4 lesson_content/c1 quizzes with 3 checks/1-based correctIndex, c1/quizzes.json, packs.json, audited list 335). Rebuilt `c1.zip` (123) + `core.zip` (91); sw.js v36 -> v37.
- `tests/run.js`: v37 pins, catalog count 335, +1 C1 test. 991 passed, 0 failed; verify-all ALL GATES PASSED (dist 739 files, sweep 108 loads / 0 problems). NOT run: lesson-contrast-names on the 4 new lessons; real-browser audio playback check.

<!-- Agent 304: C1 skills unit added (335 lessons total). See HANDOFF_AGENT_304.md. -->
## 2026-09-30 — Agent 303 — Audio structure for skill lessons (placeholder audio)
- Human decision: use a sample MP3 for all audio lessons/questions as a structure, replace gradually. The given URL (file-examples.com) returned 403 from the sandbox and external hosts are blocked by CSP `media-src 'self'` and unavailable offline, so a LOCAL placeholder `shared/audio/sample.mp3` (4 s tone, 16 KB, generated with ffmpeg) is used. To use the real sample: overwrite that file (same name) or point `audio_urls` at new local files.
- All 23 standalone_skill lessons (A1 5, A2 6, B1 6, B2 6) now have `audio_urls` (`../shared/audio/sample.mp3`; Listening: one "Listen: ..." item; Pronunciation: "Sample audio (UK)" + "(US)") in per-level + monolithic catalogs; the 36 Listening quick checks carry `media.audio` (`audio/sample.mp3`, relative to /shared/quiz.html). File added to core manifest + core pack list; all level packs + core.zip rebuilt; sw.js v35 -> v36.
- `tests/run.js`: v36 pins, +1 test. 990 passed, 0 failed; verify-all ALL GATES PASSED (dist 735 files, sweep 108 loads / 0 problems).

## 2026-09-30 — Agent 302 — B2 skills unit
- NEW unit `course-b2-unit-06` "Pronunciation and Listening" (order 6) + 6 lessons (standalone_skill, long, text-only, UK|US block each): 01 Connected Speech, 02 Contrastive Stress, 03 UK and US: /r/ and /t/ (Pronunciation); 04 Podcasts, 05 Lectures and Note-taking, 06 Accents (Listening).
- Wired as before (b2.json, lessons.json after last b2 record, units.json, courses.json unit_ids, 6 lesson_content/b2 quizzes, b2/quizzes.json, packs.json, audited list 331). Rebuilt `b2.zip` (80) + `core.zip` (90); sw.js v34 -> v35.
- `tests/run.js`: v35 pins, catalog count 331, +1 B2 test. 989 passed, 0 failed; verify-all ALL GATES PASSED (dist 734 files, sweep 108 loads / 0 problems); contrast-names 0 issues on all 6 lessons.

## 2026-09-29 — Agent 301 — B1 skills unit
- NEW unit `course-b1-unit-05` "Pronunciation and Listening" (order 5) + 6 lessons (standalone_skill, long, text-only, UK|US block each): 01 Sentence Stress, 02 Linking Words in Speech, 03 Intonation in Questions (Pronunciation); 04 Interviews, 05 Short Talks, 06 Phone Calls (Listening).
- Wired as in A1/A2 (b1.json, lessons.json after last b1 record, units.json, courses.json unit_ids, 6 lesson_content/b1 quizzes, b1/quizzes.json, packs.json, audited list 325). Rebuilt `b1.zip` (70) + `core.zip` (90); sw.js v33 -> v34.
- `tests/run.js`: v34 pins, catalog count 325, +1 B1 test. 988 passed, 0 failed; verify-all ALL GATES PASSED (dist 728 files, sweep 108 loads / 0 problems); contrast-names 0 issues on all 6 lessons.

## 2026-09-29 — Agent 300 — A2 skills unit
- NEW unit `course-a2-unit-04` "Pronunciation and Listening" + 6 lessons (standalone_skill, long, text-only, UK|US block each): 01 Sounds /ɪ/ and /iː/, 02 Past Endings -ed, 03 Weak Forms to and can (Pronunciation); 04 Daily Routines, 05 Shopping, 06 Voicemail and Announcements (Listening).
- Wired as in A1 (a2.json, lessons.json after last a2 record, units.json, courses.json unit_ids, 6 lesson_content/a2 quizzes with 3 quick checks/1-based correctIndex, a2/quizzes.json, packs.json, audited list 319). Rebuilt `a2.zip` (74) + `core.zip` (90); sw.js v32 -> v33.
- `tests/run.js`: v33 pins, catalog count 319, +1 A2 test. 987 passed, 0 failed; verify-all ALL GATES PASSED (dist 722 files, sweep 108 loads / 0 problems); contrast-names 0 issues on all 6 lessons.

## 2026-09-29 — Agent 299 — A1 skills unit: 4 more standalone lessons
- NEW lessons `course-a1-unit-04-lesson-02..05` (standalone_skill, long, text-only, UK|US block each): 02 "Plural and -s Endings" (Pronunciation), 03 "Listening: Greetings and Numbers", 04 "Listening: Short Dialogues", 05 "Listening: Directions" (Listening). Unit `course-a1-unit-04` retitled "Pronunciation and Listening"; courses.json A1 description mentions pronunciation and listening.
- Wired like the pilot: a1.json, lessons.json (after last a1 record), units.json, courses.json, 4 x `lesson_content/a1/*.json` (3 quick checks, 1-based correctIndex), `a1/quizzes.json`, `offline/packs.json`, rebuilt `a1.zip` (139 files) + `core.zip` (90), `sw.js` v31 -> v32, `tools/a11y/audited-lessons.json` 313.
- Listening lessons are transcript/strategy based (no audio; plan default).
- `tests/run.js`: v32 pins, pilot unit test generalised, +1 test. 986 passed, 0 failed; verify-all ALL GATES PASSED (dist 716 files, sweep 108 loads / 0 problems); lesson-contrast-names 4 runs 0 issues per new lesson.

## 2026-09-29 — Agent 298 — A1 pronunciation pilot lesson
- NEW lesson `course-a1-unit-04-lesson-01` "Alphabet and Sounds" (category Pronunciation, `lesson_type: standalone_skill`, `lesson_length: long`, UK|US blocks for Z name, /r/, bath, ballet stress) in new appended unit `course-a1-unit-04` "Pronunciation". Text/phonetic only, no audio. Existing units/lessons untouched.
- Data: `course_content/lessons/a1.json`, `course_content/lessons.json`, `units.json`, `courses.json` (unit_ids + "four units"), `lesson_content/a1/lesson-course-a1-unit-04-lesson-01.json` (3 quick checks; correctIndex is 1-based), `a1/quizzes.json`, `offline/packs.json`. Rebuilt `offline/packs/a1.zip` (135 files) and `core.zip` (90); `sw.js` CACHE_VERSION v30 -> v31.
- Audit: lesson-contrast-names (4 runs, 0 issues), keyboard/spacing/forced-colors (spacing 0, trail outline ok), recorded in `tools/a11y/audited-lessons.json` (309/309).
- `tests/run.js`: v31 pins; +2 tests (985 expected). `node tools/verify-all.js`: ALL GATES PASSED (dist 712 files, sweep 108 loads / 0 problems).

## 2026-09-29 — Agent 297 — Skills lesson plan (docs only)
- New `SKILLS_LESSON_PLAN.md`: baseline stats, standalone/embedded pronunciation+listening plan per level, UK|US rules, exam/fluency + length tagging proposal, build order, open questions. No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 296 — Optional lesson_length / lesson_type tags
- `courses/lesson.html`: `lessonTagLabels()` (whitelist, prototype-safe) + `.lesson-tags` chips under read-time; absent/unknown values ignored. Inline script changed -> `tools/build-csp.js` regenerated (`netlify.toml` hashes). `sw.js` CACHE_VERSION v29 -> v30; `offline/packs/core.zip` rebuilt (90 files, manifest order).
- `tests/run.js`: v30 pins; +4 tests (983 passed, 0 failed). Docs: LESSON_PLAYER_CONTENT_SCHEMA.md, CURRICULUM_DECISIONS.md.
- `node tools/verify-all.js`: ALL GATES PASSED (dist byte-identical 711 files, sweep 108 loads / 0 problems).

## 2026-09-29 — Agent 295 — UK | US side-by-side comparison component
- `courses/lesson.html`: scoped `.lesson-content .uk-us` styles (2 columns, 1 under 340px); sanitizer unchanged (already allows DIV/SPAN + class). `sw.js` CACHE_VERSION v28 -> v29; `offline/packs/core.zip` rebuilt from `offline/core-manifest.json` (90 files, same order). CSP unchanged (16 script hashes).
- `tests/run.js`: cache-version pins updated to v29; +2 tests (979 passed, 0 failed). Docs: LESSON_PLAYER_CONTENT_SCHEMA.md, CURRICULUM_DECISIONS.md.
- `node tools/verify-all.js`: ALL GATES PASSED (dist byte-identical 711 files, sweep 108 loads / 0 problems).

## 2026-09-29 — Agent 294 — Curriculum decisions recorded
- Human answered the four open decisions; recorded in new `CURRICULUM_DECISIONS.md` (UK/US mixed with side-by-side; 30% exam / 70% fluency; skills 50% standalone long / 50% mixed short; lesson length mixed). Docs only; no app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 293 — Verification-only checkpoint
- No unblocked work remained per HANDOFF_AGENT_292. Re-ran `node tools/verify-all.js`: ALL GATES PASSED (unit 977/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems). No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 292 — Quiz result contrast at 320px
- Out-of-tree copy of `quiz-result-contrast.js` with viewport 320x568 (tool file itself unchanged; 390px is hardcoded): `PER_LEVEL=3 STEP_CAP=400`, 38 runs (a1-c2 x 3 quizzes + placement-120, light/dark), all reached result screen, 0 contrast/overflow/error issues.
- `node tools/verify-all.js`: ALL GATES PASSED (unit 977/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems). No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 291 — Quiz result contrast wider sample
- `PER_LEVEL=6 STEP_CAP=400 node tools/a11y/quiz-result-contrast.js`: 74 runs (a1-c2 x 6 quizzes + placement-120, light/dark, 390px), all reached result screen, 0 issues.
- `node tools/verify-all.js`: ALL GATES PASSED (unit 977/0, CSP up to date, dist byte-identical 711 files, sweep 108 loads / 0 problems). No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 290 — Quiz result contrast sample
- `PER_LEVEL=3 STEP_CAP=400 node tools/a11y/quiz-result-contrast.js`: 38 runs (a1-c2 x 3 quizzes + placement-120, light/dark, 390px), all ended, 0 issues. (Default STEP_CAP=140 leaves placement-120 unfinished — use 400.)
- `node tools/verify-all.js`: ALL GATES PASSED. No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 289 — IFRAME focus flag review (no code change)
- Reviewed Agent 288's IFRAME focus flag statically: lesson video iframe has `title`, `tabindex="0"`, `allowfullscreen`; cross-origin YouTube embed draws its own focus UI, so the flag is a measurement artifact. Not changed to avoid regression (lesson.html edit would ripple to CSP/dist/offline packs; YouTube unreachable in sandbox to verify).
- `node tools/verify-all.js`: ALL GATES PASSED. No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 288 — Post-audit regression gate
- Lesson audit already complete (308/308). Ran `node tools/verify-all.js`: ALL GATES PASSED (unit 977/0, CSP up to date, dist byte-identical 711 files, CSP+SW+offline sweep 108 page loads / 0 problems).
- Ran a sampled (every 20th lesson) copy of `lesson-keyboard-spacing-forced.js` out-of-tree: 0 text-spacing issues; only flagged element type is IFRAME (video embed). Not changed or investigated further.
- No app/content/CSP/offline-pack changes.

## 2026-09-29 — Agent 287 — Lesson audit batch 30 (final)
- Followed Agent 286's item 1. Remaining 11 a1 lessons x light/dark x 390/320 = 44 runs, 0 issues; marked (308/308 audited — lesson audit complete).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0. Zip file list diffed vs previous (only new handoff added).

## 2026-09-29 — Agent 286 — Lesson audit batch 29 + packaging fix
- Followed Agent 285's item 1. `pick-lesson-sample.js 2` -> 4 lessons (a1, b2) x light/dark x 390/320 = 16 runs, 0 issues; marked (297/308 audited).
- Packaging regression (Agents 280-285 zips omitted `offline/packs/*.zip`, ~1 MB) fixed; exclude only top-level `MYLINGO_AGENT*_HANDOFF.zip`.
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-29 — Agent 285 — Lesson audit batch 28
- Followed Agent 284's item 1. `pick-lesson-sample.js 2` -> 6 lessons (a1, b2, c1) x light/dark x 390/320 = 24 runs, 0 issues; marked (293/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-29 — Agent 284 — Lesson audit batch 27
- Followed Agent 283's item 1. `pick-lesson-sample.js 2` -> 6 lessons (a1, b2, c1) x light/dark x 390/320 = 24 runs, 0 issues; marked (287/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-29 — Agent 283 — Lesson audit batch 26
- Followed Agent 282's item 1. `pick-lesson-sample.js 2` -> 6 lessons (a1, b2, c1) x light/dark x 390/320 = 24 runs, 0 issues; marked (281/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-29 — Agent 282 — Lesson audit batch 25
- Followed Agent 281's item 1. `pick-lesson-sample.js 2` -> 6 lessons (a1, b2, c1) x light/dark x 390/320 = 24 runs, 0 issues; marked (275/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-29 — Agent 281 — Lesson audit batch 24
- Followed Agent 280's item 1. `pick-lesson-sample.js 2` -> 9 lessons (a1-c1) x light/dark x 390/320 = 36 runs, 0 issues; marked (269/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-29 — Agent 280 — Lesson audit batch 23
- Followed Agent 279's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (260/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.


## 2026-09-28 — Agent 279 — Lesson audit batch 22
- Followed Agent 278's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (250/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 278 — Lesson audit batch 21
- Followed Agent 277's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (240/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 277 — Lesson audit batch 20
- Followed Agent 276's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (230/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 276 — Lesson audit batch 19
- Followed Agent 275's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (220/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 275 — Lesson audit batch 18
- Followed Agent 274's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (210/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 274 — Lesson audit batch 17
- Followed Agent 273's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (200/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 273 — Lesson audit batch 16
- Followed Agent 272's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (190/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 272 — Lesson audit batch 15
- Followed Agent 271's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (180/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 271 — Lesson audit batch 14
- Followed Agent 270's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (170/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 270 — Lesson audit batch 13
- Followed Agent 269's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (160/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 269 — Lesson audit batch 12
- Followed Agent 268's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (150/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 268 — Lesson audit batch 11
- Followed Agent 267's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (140/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 267 — Lesson audit batch 10
- Followed Agent 266's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (130/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 266 — Lesson audit batch 9
- Followed Agent 265's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (120/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 265 — Lesson audit batch 8
- Followed Agent 264's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (110/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 264 — Lesson audit batch 7
- Followed Agent 263's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (100/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 263 — Lesson audit batch 6
- Followed Agent 262's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1) x light/dark x 390/320 = 40 runs, 0 issues; marked (90/308 audited).
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 262 — Lesson audit batch 5
- Followed Agent 261's item 1. `pick-lesson-sample.js 2` -> 10 lessons (a1-c1; c2 has only 10 lessons, all now audited) x light/dark x 390/320 = 40 runs, 0 issues; marked (80/308 audited). Server verified with curl before the run.
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 261 — Lesson audit batch 4
- Followed Agent 260's item 1. `pick-lesson-sample.js 2` -> 12 lessons (2/level a1-c2) x light/dark x 390/320 = 48 runs, 0 issues; marked (70/308 audited). First attempt hit ERR_CONNECTION_REFUSED (http server had died; 48 false failures) — restarted with `setsid nohup python3 -m http.server 8765 ... &` and reran clean.
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-28 — Agent 260 — Lesson audit batch 3; per-level index pages added to pages-contrast
- Followed Agent 259's items 1-2. `pick-lesson-sample.js 2` -> 12 lessons (2/level a1-c2) run through `lesson-contrast-names.js` x light/dark x 390/320 = 48 runs, 0 issues; marked (58/308 audited).
- `tools/a11y/pages-contrast.js` PAGES map: added a2/b1/b2/c1/c2 `index.html` (previously only a1). 20 new runs (5 pages x light/dark x 390/320), 0 issues. Full sweep before the addition: 68/68 clean.
- No app/content/CSP/offline-pack changes. `node tests/run.js` 977/0.

## 2026-09-27 — Agent 259 — Persistent lesson-audit tracking; new mid-answer feedback-state audit
- Followed Agent 258's items 1-2. Added `tools/a11y/audited-lessons.json` (seeded with the ~34 lesson ids covered by Agents 255/256/258) and `tools/a11y/pick-lesson-sample.js`, which picks N unaudited lessons per level and (with `--mark`) records them, so future agents don't have to re-derive a sample or risk re-covering the same lessons. Used it this turn: picked+ran 12 new lessons (48 runs), 0 issues, marked audited (46 total now).
- New `tools/a11y/quiz-feedback-contrast.js`: checks the mid-answer `.feedback.show.good`/`.show.bad` banner on `shared/quiz.html` (shown right after answering, before Next) — the one on-page state neither `quiz-result-contrast.js` (result screen) nor `pages-contrast.js` (pre-answer question screen) covers. First run found the script itself was broken (no `#check`/`#checkBtn` exists for this quiz's MCQ type — clicking an option auto-checks — so the old "click check button" logic never fired and every run silently no-op'd, 0 runs). Fixed to answer directly; now exercises both feedback variants (good/bad) via first-option vs last-option picks. 24 runs across all 6 levels x light/dark: 0 issues.
- No app/content/CSP changes this turn — only audit tooling. `node tests/run.js` 977/0 (unaffected, as expected).
- **Housekeeping note:** discovered Agent 258's CHANGELOG.md entry never landed last turn (its doc-update script errored on the STATE.md half and the CHANGELOG.md write apparently didn't survive either, despite `verify-all` and the packaged zip both looking clean at the time — STATE.md's "Agent 258" summary line was correct, so the work itself was real and undocumented, not undone). Reconstructed it below from that turn's actual summary. Lesson: verify doc files actually changed (e.g. `grep` for the new heading) before packaging, not just that the script printed no error to the visible tail of output.

## 2026-09-27 — Agent 258 — pages-contrast.js extended; fixed a false-positive bug in the shared audit checker
- Followed Agent 257's items 1-2. Extended `tools/a11y/pages-contrast.js`'s PAGES map: a2/b2/c2 dashboards, `main/practice.html`, and two mid-quiz states (`shared/quiz.html` regular + placement, question screen not result screen).
- First run on the new pages flagged `shared/quiz.html`: 3 `<h1>` elements and 1 unnamed `<audio controls>`. Traced this to a real bug in the **audit script itself**, not the app: `quiz.html` permanently keeps all 3 screens (start/error/result) in the DOM and toggles a wrapping ancestor's `display:none`, not the elements' own `display`. `namesFn`'s checks only inspected each element's *own* computed `display`/`visibility`, which doesn't reflect an ancestor being hidden — confirmed via `offsetParent`/`getClientRects()` that only 1 of the 3 `<h1>`s and the audio element were actually rendered. Fixed `namesFn` (shared by `lesson-contrast-names.js` and `pages-contrast.js`) to use `offsetParent!==null||getClientRects().length>0` for all visibility checks (unnamed-control scan, `<h1>` count, `<main>` count, tiny-target scan) instead of the element's own display/visibility.
- Re-ran everything after the fix: new page keys 24/24 clean; full `pages-contrast.js` sweep 68/68 clean (was 8 false positives before the fix); full `node tests/run.js` still 977/0.
- Also ran a second 12-lesson batch of `lesson-contrast-names.js` (1/4 + 3/4 mark, all 6 levels): 48/48 clean — ~28 of 308 published lessons now audited. No app/content/CSP changes.

## 2026-09-27 — Agent 257 — New pages-contrast audit finds and fixes 2 real dark/light bugs on courses/journey.html
- Followed Agent 256's items 1-3. Raised `quiz-result-contrast.js`'s step cap (env `STEP_CAP`, default 140); `placement-120` (120 questions) now completes: 0 issues.
- New `tools/a11y/pages-contrast.js`: real-browser contrast/names/overflow audit for dashboard/course/journey/progress pages (the lesson-player and quiz-result equivalents already existed). Seeds a MIXED `mylingo.progress.v1` (~2/3 passed, ~1/3 low/failed, ~20% untouched) so pages render their real in-progress visuals, not just the empty state. 11 pages x light/dark x 390/320 = 44 runs.
- First run found 2 real bugs on `courses/journey.html` (the only page using these classes), reproducible in both a fresh run and the full 44-run sweep before the fix:
  1. **Dark mode:** `.lesson.completed .node` (white text on `var(--success)`, which theme.css's dark override turns into a *lighter* green `#8be56a`) = 1.55:1; `.state.completed` (`color:#2f6d06` on `var(--success-soft)`, which becomes a *near-black* dark green `#1b4828` in dark mode) = 1.65:1. Root cause: journey.html's own hardcoded text colors were never added to theme.css's existing dark-mode override block (which already has the correct, established pattern/colors for this exact "success soft badge" case — `.success-soft,.best,.status.completed{...color:#c9f7b5}`). Fixed by adding `.state.completed` to that existing selector list.
  2. **Light mode:** `.lesson.completed .node` was white-on-`#58cc02` = 2.09:1 — the same defect class Agent 255 fixed on the lesson-player's Practice slide. Fixed the same way: `#0b0c0d` instead of `#fff`.
- Re-run: 44/44 runs, 0 issues. `theme.css` and `journey.html` are both in `offline/packs/core.zip`'s manifest — both replaced. CSP hashes unaffected (no inline-script changes). `node tests/run.js` 977/0.

## 2026-09-27 — Agent 256 — Broader a11y audit sample clean; quiz-result-contrast.js repaired
- Ran `tools/a11y/lesson-contrast-names.js` on 12 more published lessons (2 per level a1-c2, mid + last) x light/dark x 390/320 = **48 runs, 0 issues** (~140s). Note: 308 lessons are published (a1 76, a2 54, b1 50, b2 60, c1 58, c2 10), not 62 as the older README says; ~16 of them are now audited.
- Extracted the in-page contrast checker into `tools/a11y/contrast-fn.js` (shared). Repaired `tools/a11y/quiz-result-contrast.js`, which depended on a missing `audit.js` and hardcoded paths: now portable (`BASE`, `OUT`, `PER_LEVEL` env). Reduced run (2 quizzes per level + placement-120 x light/dark = 26 runs): 24 reached the result screen, **0 contrast issues, 0 overflow, 0 errors**, scores 0/20/29/40/50/100%. `placement-120` did not reach the result screen within the script's 140-step cap (long placement flow; not a defect signal) — left unchecked.
- No app/content/CSP changes; `node tests/run.js` 977/0.

## 2026-09-27 — Agent 255 — Real Practice-slide a11y defects found by the lesson audit, fixed
- Followed Agent 254's item 1. `tools/a11y/lesson-contrast-names.js` was silently only ever checking slide 0: since Agent 26 the trail is `<nav>` buttons (no `[role=tab]`), so its tab loop found nothing. Fixed it to advance with the real `#navNext`, use the app's own offline fallback to pass the video gate, ignore sandbox-only youtube 403s and the known-decorative `.sep`, and be path-portable (`OUT` env, `ONLY` env unchanged). It now reaches all 5 slides.
- Sample (a1/a2/b1/c1 lessons x light/dark x 390/320 = 16 runs) then flagged the Practice slide (only visible with passed quizzes): (1) `✓` white on `#58cc02` = 2.09:1 -> `#0b0c0d` (matches the trail's done marker); (2) passed `→` `#46a302` on soft green = 2.9:1 -> `#2f6d06`; (3) no `<h1>` on that slide -> added `<h1 class="sr-only">` with the lesson title; (4) 320px horizontal overflow (grid track sized by nowrap titles) -> `.exercise-cards{grid-template-columns:minmax(0,1fr)}`.
- Re-run: **16 runs, 0 issues**. CSP hashes regenerated (16); `offline/packs/core.zip` `courses/lesson.html` entry replaced. sw.js untouched (precedent). `node tests/run.js` 977/0.
- `quiz-result-contrast.js` NOT run: it depends on a missing `audit.js` and hardcoded paths; left as-is, flagged in handoff.

## 2026-09-27 — Agent 254 — End-to-end video-gate verification under the shipped CSP
- Followed Agent 253's NEXT-AGENT item 2. Added `tools/video-gate-verify.js`: serves a fresh dist with `netlify.toml`'s real CSP header, stubs only youtube.com's network (`iframe_api` + `/embed/`) via Playwright routes, and runs the real lesson page + real gate code. Asserts Continue is locked before playback, unlocks after simulated forward playback, does NOT unlock on a seek-jump to the end, and zero CSP violations.
- Result: **ALL PASSED**. Mutation-checked: with youtube.com removed from the CSP, it fails (`script-src-elem .../iframe_api` and `frame-src` violations, gate never unlocks) — proving it catches the Agent 253 bug class, including the frame-src half that csp-sweep alone never confirmed.
- Not part of `verify-all` (needs Playwright, like the other browser tools). Run: `NODE_PATH=$(npm root -g) node tools/video-gate-verify.js`.
- `node tests/run.js` — 977/0. No app/content/CSP changes this turn.

## 2026-09-27 — Agent 253 — Critical production bug found & fixed: CSP blocked the YouTube IFrame API on every video lesson
- Continued from `HANDOFF_AGENT_252.md`, item 2 on its NEXT AGENT list: live-verify the `.term{border:1px solid CanvasText}` forced-colors rule for real, and try the full `tools/csp-sweep.js` sweep now that Playwright/Chromium is confirmed reachable in this sandbox.
- **`.term` chip investigation:** fixed `tools/a11y/forced-colors-verify.js`'s slide navigation (Agent 252's script stalled on slide 1 because the sample lessons all open on a video slide, whose "Continue" button doesn't exist as a `<button>` until 90% watched — `#playerNav button:not([disabled])` correctly found nothing). Added the same `navigator.onLine=false` init-script override the app itself already uses as its real offline fallback (`lesson.html`: `if(!navigator.onLine){unlockVideoNext();return}`) to get a real browser to advance past the video slide. With that fixed, checked all 3 text slides on 10 published lessons (a1/a2, all with non-empty `key_terms`) in a real browser: **`.term` never renders in any of them.** Traced why: `splitIntoThreeTextSlides()` only emits `<span class="term">` as a *fallback* for a text-slide group that has no natural `body_content` in it, and every sampled lesson's `body_content` is long enough to fill all three groups, so the terms/examples fallback branch is dead code with current content — not a bug, just currently unreachable. Documented honestly in `tools/a11y/README.md` (not claimed as "verified" since it can't be exercised with real content) rather than overclaimed either way.
- **Ran the full (non-`--quick`) `tools/csp-sweep.js` for the first time** — it completed inside this sandbox's budget (no 120s timeout this run). It flagged 4 real problem-page reports, all the same root cause: `courses/lesson.html` unconditionally contains `<script src="https://www.youtube.com/iframe_api">` (loaded on every visit, not just when a video slide is shown), but the shipped CSP's `script-src` never allowlisted `youtube.com` — so that script was CSP-blocked on every load. Traced the actual impact: `window.YT` never being defined means `whenYouTubeReady()`'s callback queue is never drained, so `videoWatchReady` never flips to `true` for any learner whose browser reports `navigator.onLine === true` — **the "Continue" button on every video slide would stay locked forever in production**, for every online learner, on every video lesson, site-wide. This was previously undetected because `tools/csp-sweep.js`'s own `PAGES` list used a stale lesson id (`a1-unit-01-lesson-01`) that doesn't match real content (`course-a1-unit-01-lesson-01`), so it was silently hitting the "lesson isn't available" error page and never actually rendering a video slide/iframe to test.
- **Fix:** added `https://www.youtube.com` to both `script-src` and `frame-src` (which was `'none'` and would separately have blocked the actual `<iframe src="https://www.youtube.com/embed/...">` video embed itself) in `tools/build-csp.js`'s policy template, regenerated `netlify.toml` (`node tools/build-csp.js`), and corrected the stale lesson id in `tools/csp-sweep.js`'s `PAGES` list so the sweep genuinely exercises the video-lesson/iframe path going forward. Updated the matching CSP assertion in `tests/run.js` (script-src prefix, new frame-src check).
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 711 files — unchanged, since only `netlify.toml`/`tools/`/`tests/` were touched, none of which ship in `offline/packs/core.zip`). Full `node tools/csp-sweep.js` (non-`--quick`) — **0 problem pages** (was 4).
- No content, HTML, or offline-pack rebuild was needed this turn — the fix is entirely in `netlify.toml`'s CSP header and the two tooling files that generate/verify it.

## 2026-09-27 — Agent 252 — All four AUDIT_AGENT_244 person-gated items closed
- Person supplied: audio icon SVG, dark-mode logo-horizontal/logo-stacked SVGs, dark-mode icon SVG, "yes, erase the offline/core.zip duplicate", and "do what you can" on forced-colors (real device/browser to follow with feedback).
- **Audio icon (item 1):** wired the supplied SVG into `courses/lesson.html` as `TRAIL_ICON_AUDIO` (same `currentColor`-based inline-SVG pattern as Agent 243's text/quiz/video icons); `trailIcon('audio')` now returns it instead of the `◖` glyph. Updated the one test that asserted the glyph to assert by icon kind (`viewBox="-1.5 0 19 19"`) instead, matching the existing text/quiz/video pattern.
- **Dark-mode logo asset (item 6.1):** added `shared/brand/logo-horizontal-dark.svg`, `logo-stacked-dark.svg`, `icon-dark.svg` (yellow `#ffcc02` mark, vs. the light-mode blue `#024BC7` — the real fix for the header-logo dark-mode contrast problem item 6.1 was filed for). Wrapped every page's header `<img class="logo"|"brand-logo">` (19 pages) plus `shared/quiz.html`'s `brand-logo-sm` in `<picture><source media="(prefers-color-scheme: dark)">`, so the OS-dark-mode logo swap is real, not just an asset sitting unused in `shared/brand/`. Known, pre-existing limitation this inherits (flagged by Agent 248): this only responds to the OS-level `prefers-color-scheme`, not `main/placement.html`'s manual `data-theme` toggle — same gap as every other dark-mode rule in `theme.css`, not a new one. Left `shared/quiz.html`'s completion-modal `icon.svg` (on its own white card) and the splash-screen icon untouched — both already self-contained regardless of page theme.
- **offline/core.zip duplicate (item 2):** deleted the confirmed-unreferenced top-level `offline/core.zip` (distinct from `offline/packs/core.zip`, which ships and is used).
- **Forced-colors verification (item 3):** discovered this sandbox actually has a working Chromium via the already-installed Playwright package (`/home/claude/.npm-global/lib/node_modules/playwright`) and can serve the app locally (`python3 -m http.server`) — contrary to every handoff since Agent 19/241 that reported no browser/device reachable here. The existing exhaustive script (`tools/a11y/lesson-keyboard-spacing-forced.js`) times out in this sandbox (300+ lessons × 30 tab presses each); wrote a focused one, `tools/a11y/forced-colors-verify.js`, that drives a real `forcedColors:'active'` Chromium context against 3 real shipped lessons (a1/a2/b1) and confirms `.trail-item.active{outline:3px solid Highlight}` genuinely computes as `solid 3px` outline in a real browser. Did NOT reach a live check of the `.term{border:1px solid CanvasText}` half (the nav-button selector used didn't advance past slide 1 in the sampled lessons) — that half remains statically-asserted only, documented as such in `tools/a11y/README.md` rather than overclaimed.
- Restored `.gitignore` and `.github/workflows/deploy.yml`, which were absent from the uploaded `MYLINGO_AGENT251_REVERIFY.zip` — the zip had been packed without dotfiles (exactly the "Agent 21 defect class" `tools/package.js`'s own header comment warns about), so `tools/verify-all.js`'s dist/CI tests failed on a clean extraction of that zip until these were reconstructed from the test suite's own spec (`tests/run.js`'s "publish directory" and "CI workflow + dotfiles" tests) and `netlify.toml`/`DEPLOY.md`'s existing Netlify config. This was a packaging-process gap, not a code regression.
- Regenerated CSP hashes (`node tools/build-csp.js`, 16 script hashes — `courses/lesson.html`'s inline script changed) and rebuilt `offline/packs/core.zip` from `offline/core-manifest.json` against the current source tree (the `<picture>`-wrapping touched 19 of its member files, not just `lesson.html`).
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, **711 files** — the two new dark-logo SVG assets).

## 2026-09-27 — Agent 251 — Re-verification, no code changes (still waiting on person-gated items)
- Continued from `HANDOFF_AGENT_250.md`. No response from the person on any of the four gated items (audio icon asset, dark-mode logo asset, offline/core.zip duplicate confirmation, forced-colors device test) has been recorded, so there is still nothing independently actionable in this sandbox.
- Re-ran verification: `node tests/run.js` — **977 passed, 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).
- No source files touched, for the same reason as Agent 250's turn: acting without new information or a new confirmed-dead/wrong item would be inventing scope.

## 2026-09-27 — Agent 250 — Re-verification, no code changes (person check-in)
- Continued from `HANDOFF_AGENT_249.md`. Per Agent 249's own "NEXT AGENT — START HERE," everything independently actionable in this sandbox had already been worked through; nothing new was queued.
- Re-ran verification only: `node tests/run.js` — **977 passed, 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).
- No source files touched — there was no confirmed-dead code, no verified-wrong prior note, and no independently actionable item left to act on. Inventing scope was explicitly ruled out by the prior handoff.
- Re-confirms AUDIT_AGENT_244 remains fully closed out or externally blocked, with the same person-gated items still open: audio icon asset, offline/core.zip top-level stray duplicate (needs confirmation before deleting), forced-colors verification, and dark-mode logo asset. None of these were resolved this turn since each needs the person's input or a real device/browser, not sandbox work.

## 2026-09-27 — Agent 243 — Task C: Lesson Player Chapter-Trail Icons
- Unblocked TASK C: the "slider" is the lesson player's chapter-trail slide stepper (`courses/lesson.html`, `.chapter-trail`/`.trail-item`), which rendered each slide's type as a plain text glyph (`▶`/`◖`/`✓`/`T`). User supplied SVG assets for text, quiz and video lesson types; no audio asset was supplied.
- Added `TRAIL_ICON_TEXT` / `TRAIL_ICON_QUIZ` / `TRAIL_ICON_VIDEO` (inline SVG, `currentColor`-based) and a new `trailIcon(kind)` helper in `courses/lesson.html`; `video` and `practice` (quiz) slide kinds now render the supplied SVG icons, `text` slide kinds render the supplied text-lesson SVG. `audio` keeps its `◖` glyph — no asset was provided for it, so nothing was invented or substituted.
- `courses/course.html` and `courses/journey.html` use a separate, lesson-level `type-icon` (video/audio/text only, no quiz concept) for their lesson-list rows; out of scope for this task and left untouched.
- CSS: `.trail-item .type-icon` sized/aligned for an inline SVG child (14×14) alongside the existing text-glyph fallback.
- Test suite: updated the one test in `tests/run.js` that asserted the trail's type-icon by literal glyph text (an `<svg>` node has no `textContent`); it now asserts by icon kind (`viewBox` + stroke/fill fingerprint) for video/text/quiz and the literal `◖` glyph for audio.
- Regenerated CSP hashes (`node tools/build-csp.js`, 16 script hashes — `courses/lesson.html`'s inline script changed) and rebuilt `offline/packs/core.zip`'s `courses/lesson.html` entry in place.
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

## 2026-09-27 — Agent 242 — Quiz Ending Card (behavior + visual) + Slider Icons (BLOCKED)
- TASK A — quiz ending card behavior for lesson-backed quizzes (`shared/quiz.html`):
  - Removed the in-card "Continue"/"Back to lesson practice" button entirely for any lesson-backed quiz (`lessonParam` set, non-placement). Lesson progression now lives only in the lesson player itself.
  - New `renderLessonEndingCard()`: a 1-quiz lesson shows only a "Return to quizzes" action (no suggestions). A 2+ quiz lesson shows "Return to quizzes" plus links to the quizzes in *this lesson* the learner hasn't passed yet (via `MylingoCourseProgress.isMastered`, 60% threshold), excluding the quiz just taken. Once every quiz in the lesson is mastered, the suggestion list is replaced by a completion state.
  - Standalone (non-lesson) and placement quizzes are untouched — same `renderSuggestions()`/`placementContinue()` paths as before.
  - Added `shared/js/course-progress.js` as a script dependency of `shared/quiz.html` (previously not loaded there) to reuse its mastery/threshold logic instead of duplicating it.
- TASK B — quiz ending card visual + copy:
  - New `.lesson-complete` and `.confetti` markup/CSS on the `#end` overlay.
  - `fireConfetti()`: lightweight, dependency-free CSS confetti burst, fires once a quiz is passed (≥60%, any mode), fully additive (try/catch-wrapped) and respects `prefers-reduced-motion` (both a JS `matchMedia` check and a CSS media-query fallback).
- TASK C — slider icon swap: **BLOCKED**. No slider widget/component exists anywhere in the repo (`grep -rl "slider"` across `.html`/`.js` returns nothing) and no new icon assets were provided. Not invented, not guessed, not substituted.
- Test suite: rewrote the `end()` orchestration tests in `tests/run.js` that pinned the old "Continue on the ending card" behavior, and added dedicated real-function tests for `renderLessonEndingCard`/`lessonMasteryCheck`/`fireConfetti` covering the A1/A2/A3 acceptance criteria against the real code (not just spies).
- Regenerated CSP hashes (`node tools/build-csp.js`) and rebuilt `offline/packs/core.zip`'s `shared/quiz.html` entry after the source change.
- Verification: `node tests/run.js` — **977 passed / 0 failed** (was 971/971 before this agent; net +6 tests). `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

## 2026-09-27 — Agent 239 — YouTube Player Interaction Hardening
- Locked learner pointer/touch interaction on YouTube lesson iframes so native YouTube chrome and external-link surfaces cannot be clicked from the lesson player.
- Removed Picture-in-Picture permission and iframe keyboard focus from the learning-mode player.
- Regenerated CSP hashes and rebuilt both offline core packs after the player source change.
- Verification: 971/971 tests passed; quick release gates passed; dist byte identity passed for 709 files.
## 2026-09-27 — Agent 248 — AUDIT_AGENT_244.md item 6.2: theme.css class-drift audit + fix
- Cross-checked every page's own `<style>` block and dynamic `className` assignments against every selector `shared/css/theme.css` already darkens, to find components whose light-mode CSS hardcodes a background/color that no existing dark-mode rule reaches.
- Found and fixed 11 genuine gaps, each verified live (not dead CSS) before fixing: the level-lock overlay scrim, lesson/unit trail nodes and unit icons (upcoming state only — completed/current already flip correctly via CSS vars, so these are `:not()`-scoped to avoid touching them), the unit progress-bar track, the lesson-player "ghost" back button, the placement-quiz answer buttons and their number badges (unselected state only, same `:not()` scoping), the level-picker links, the manual theme-toggle button, the ranking-question drag controls, and a text-contrast bug on the quiz "lesson complete" message (hardcoded green text on a background that goes dark-green in dark mode).
- Also found, and explicitly left alone (confirmed dead — match zero elements anywhere in the shipped app, so they're inert, not misrendering anything): theme.css's own pre-existing `.hero-card` and `.mini-flow` selectors, and `courses/index.html`'s `.card.is-level-locked .btn` rule. Noted for whoever eventually wants a cleanup pass.
- Observation for a future agent, out of scope for this item: every dark-mode rule in `theme.css` (old and new) lives inside `@media (prefers-color-scheme:dark)`, so it only applies when the OS itself is in dark mode. The manual `data-theme="dark"` toggle (only wired up on `main/placement.html`) only flips the page background/text via a separate rule — none of the component-level dark styling applies under "system light + manual dark override." This is a pre-existing architectural gap, not something this turn introduced or fixed.
- `shared/css/theme.css` is an external stylesheet (not inlined), so no CSP hash regeneration was needed; confirmed with `node tools/build-csp.js --check` — CSP up to date.
- Rebuilt `offline/packs/core.zip`'s `shared/css/theme.css` entry in place (`zip offline/packs/core.zip shared/css/theme.css`).
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

## 2026-09-27 — Agent 249 — Dead-selector cleanup (theme.css `.hero-card`/`.mini-flow`, courses/index.html `.card.is-level-locked .btn`) + correction of an Agent 248 note
- Investigated Agent 248's "next agent" note about a manual-dark-toggle architectural gap before acting on it, per this project's "verify before re-litigating" convention — found the note was **incorrect**: `data-theme` is used on exactly one page (`main/placement.html`), and that page already carries its own complete, independent manual-theme system (Step 10 / "Agent 12" block, `html[data-theme] ...` rules covering header/.card/.answer/.levels a/.progress etc. via `--surface`/`--surface2`/`--track` custom properties, always active because the page's own script sets `data-theme` unconditionally on load, falling back to OS preference when nothing is saved). There is no page anywhere in the app with a manual toggle that lacks matching coverage — the gap described doesn't currently exist. Retracting that note rather than carrying it forward.
- Removed the 3 dead selectors flagged (but deliberately left in place) by Agent 248, since they still match zero elements anywhere in the shipped app: `.hero-card` and `.mini-flow div` dropped from their selector lists in `shared/css/theme.css` (the other classes in each list are untouched and still live); `courses/index.html`'s standalone `.card.is-level-locked .btn{...}` rule removed outright (the sibling `.card.is-level-locked{opacity:.55}` rule is live and untouched — only the nested `.btn` rule was dead, since no element with class `btn` is ever rendered inside a locked card on that page).
- `node tools/build-csp.js --check` — CSP up to date (courses/index.html's edit was to an inline `<style>` block; style-src is `'unsafe-inline'`-based per Agent 247's audit, not hash-based, so no regeneration was needed).
- Rebuilt `offline/packs/core.zip`'s `shared/css/theme.css` and `courses/index.html` entries in place.
- CHANGELOG.md — entry appended.
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

# Changelog

## Agent 235 — Course lesson video integration
- Added the requested YouTube sample to all 308 published course lessons across A1, A2, B1, B2, C1 and C2.
- Synchronized per-level and aggregate lesson catalogs.
- Kept lesson context visible on video/audio slides in the lesson player.
- Regenerated CSP for YouTube framing.
- Rebuilt `offline/packs/core.zip`.
- Added shipped-lesson video assertions to the regression suite.
- Verification: `node tests/run.js` — **970 passed / 0 failed**.
## Agent 237 — Release audit
- Audited the Agent 236 release from a clean unzip.
- Verification: `node tests/run.js` — **970 passed / 0 failed**.
- Quick release gates: **ALL PASSED**; CSP current; source/dist byte-identical across 709 files.
- Confirmed the requested YouTube URL in **308/308** published lesson records.
- Packaging: **998 archive entries**, clean-unzip verification passed.
- Browser CSP sweep was attempted but requires the optional `playwright` module, which is not installed.


## Agent 238 — Video-first locked player + three-part text lessons (2026-09-27)
- Lesson player deck order is now video-first, followed by exactly three text slides, then audio and practice.
- Text slides are labelled `1 · Intro & explanation`, `2 · Usage & examples`, and `3 · More details`; rich lesson/chapter content is split across the three slides and revision-only lessons receive the same structure.
- YouTube lessons use autoplay + muted playback, hidden native controls/keyboard/fullscreen/external chrome, `enablejsapi`, and a custom learning-mode overlay.
- Continue is withheld on YouTube video slides until measured playback reaches 90%; offline/unavailable video falls back to lesson text without creating a dead-end gate.
- Video slides attempt browser fullscreen and use a viewport-filling cinema layout; browser fullscreen policies can still reject an automatic fullscreen request on initial page load.
- CSP now explicitly permits the YouTube IFrame API/player origins required by the locked player.
- Rebuilt offline core packs after the lesson player source change.
- Regression suite: 971/971 passed; quick release verifier: all gates passed.

## Agent 240 — Native YouTube playback + 90% gate fix (2026-09-27)
- Removed the custom/cinema fullscreen behavior that could crop 9:16 video.
- Restored standard YouTube player controls and native fullscreen (`controls=1`, `fs=1`).
- Restored pointer/tap interaction with the YouTube iframe so normal play/pause works.
- Reworked 90% watch accounting to credit only normal forward playback; large seek jumps are not counted.
- Kept muted autoplay attempt and video-first / three-text-slide ordering.
- Regenerated CSP and rebuilt offline core packs.
- Verification: `node tests/run.js` — **971 passed / 0 failed**.
- Real iPhone/Android browser testing was not available in this environment.

## Agent 241 — iPhone/Android player QA + PiP permission hardening (2026-09-27)
- Continued from `MYLINGO_AGENT240_YOUTUBE_NATIVE_PLAYBACK.zip`.
- Re-ran the full regression suite: 971 passed, 0 failed.
- Attempted browser automation with Chromium/Playwright. The sandbox blocks local-page navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so real iPhone Safari and Android Chrome behavior was not claimed or simulated.
- Audited the native YouTube iframe contract and removed the `picture-in-picture` iframe permission so PiP is not explicitly enabled by the app while native YouTube fullscreen remains available.
- Regenerated `netlify.toml` CSP after the player source change.
- Rebuilt `offline/packs/core.zip` and `offline/core.zip` from `offline/core-manifest.json`.
- Verified the video-first / three-text-slide / native-controls / 90%-gate contract remains covered by tests.
- Known limitation: real-device iPhone Safari and Android Chrome playback/fullscreen still require external device testing.

## Agent 245 — Quiz "Next" button resilience fix (2026-09-27)
- Continued from `AUDIT_AGENT_244.md` item 7 (Next button intermittently unresponsive).
- `shared/quiz.html` `next()`: added a re-entrancy guard (`next._busy`) so a fast double-tap or a same-tick duplicate call can't run it twice concurrently.
- `next()`: wrapped the render/end dispatch in try/catch. On a thrown error, the question index is rolled back to where it was before the attempt, the error is logged to the console, and the existing feedback area shows a visible "Something went wrong — tap Continue to try again" message with the Next button left up — no full-page reload, no lost score.
- Added 3 targeted checks confirming existing `next()` orchestration tests still pin exact render/saveSession/end call order and counts.
- Regenerated CSP (`node tools/build-csp.js`) after the inline-script edit.
- Rebuilt `offline/packs/core.zip`'s `shared/quiz.html` entry in place.
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — ALL GATES PASSED.

## Agent 246 — AUDIT_AGENT_244.md item 5 investigation + chapter-trail/slide-count cross-check (2026-09-27)
- Continued from `HANDOFF_AGENT_245.md`.
- Investigated `AUDIT_AGENT_244.md` item 5 ("unaudited lesson slide types/levels beyond a1 lesson 1") before writing new coverage, per the project's "run it for real against shipped content" testing philosophy — found that `tests/run.js` already contains a test ("page: EVERY shipped lesson renders...") that walks every published lesson across all six levels (308 lessons total) against the real shipped `course_content/lessons/*.json`, asserting no error state and correct exercise-card/gate/completion-link behavior for each. Item 5 as filed appears to be stale — this coverage already existed before this turn, it was just not surfaced in the audit.
- Confirmed via the real shipped content that video coverage is 308/308 lessons and audio coverage is 0/308 — no shipped lesson currently uses an audio slide, so `trailIcon()`'s audio fallback glyph (item 1) is unreachable in production content today, though still worth fixing once an asset is available.
- What the existing test did NOT check: that the chapter-trail's rendered item count actually matches the slide deck the page built (the specific check item 5 named). Extended the existing "EVERY shipped lesson renders" test with an independent cross-check: for every one of the 308 published lessons, the expected slide count (videos + the fixed 3 text slides + audios + 1 practice slide) is computed directly from the lesson's own raw JSON fields (mirroring `mediaEntries()`'s normalize logic, but re-implemented independently in the test rather than calling the page's own function) and asserted equal to the chapter-trail's actual rendered item count. Verified the new assertion is live by temporarily miscounting it and confirming the test fails, then restored it.
- Verification: `node tests/run.js` — **977 passed / 0 failed** (same test count as before — this was an extension of an existing test, not a new one). `node tools/verify-all.js --quick` — ALL GATES PASSED.
- Only `tests/run.js` changed this turn (a test-only file, not part of the shipped app or the offline packs) — no CSP or offline-pack rebuild was needed.

## Agent 247 — AUDIT_AGENT_244.md item 4 investigation: why "re-scope by churn" doesn't work for a single global CSP (2026-09-27, audit only, no code changed)
- Continued from `HANDOFF_AGENT_246.md`.
- Re-measured the inline `style=""` footprint against current source: 95 attributes across 22 pages (was 91 at the time of the netlify.toml comment; drifted slightly since, mostly on `shared/quiz.html` at 33 and the six `<level>/dashboard.html` copies at 6 each = 36).
- Investigated AUDIT_AGENT_244.md item 4's specific re-scoping idea — hardening `style-src` only on pages that already churn (quiz.html, lesson.html) while leaving frozen pages alone — and found it does not actually work as described: `netlify.toml`'s `Content-Security-Policy` header is declared once, in a single `[[headers]] for = "/*"` block, applying identically to every page on the site. `style-src` cannot be tightened for a subset of pages without either (a) removing every inline `style=""` attribute and `<style>` block from ALL 22 pages, not just the churn-heavy ones, or (b) adding a second, more specific `[[headers]]` block (e.g. `for = "/shared/quiz.html"`) with a stricter `style-src` — but netlify.toml's own existing comment (on HSTS) already flags that Netlify's merge behavior across two `[[headers]]` blocks matching different but overlapping paths for the *same header key* is not something this repo has been able to verify (no live Netlify deploy exists to test against — the same standing git-remote/Netlify-account blocker every agent since #19 has hit). A web search for Netlify's documented behavior here did not turn up an authoritative, unambiguous answer either.
- Conclusion: item 4's premise (a smaller, page-scoped hardening slice) is not available with this CSP delivery mechanism as currently built. The only verified-safe path to drop style-src's `'unsafe-inline'` is still the all-or-nothing one Agents 19/20/27 already priced out and declined (eliminate all 95 inline style attributes + inline `<style>` blocks, project-wide, then flip the directive) — OR building and testing a genuine per-path header split against a real Netlify deploy once one exists, which is currently blocked on the same git-remote/account gate as everything else deploy-related.
- No code was changed this turn — this is an audit correction, not a fix. Verification: `node tests/run.js` — 977 passed, 0 failed (unchanged). `node tools/verify-all.js --quick` — ALL GATES PASSED (unchanged).
