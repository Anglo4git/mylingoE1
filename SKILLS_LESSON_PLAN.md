# Skills lesson plan — pronunciation + listening (Agent 297, docs only)

Implements decisions 1–4 of CURRICULUM_DECISIONS.md. NOTHING here is built yet; no app/content changed.

## Baseline (shipped, 308 lessons)
| Level | Lessons | Units | Categories |
|---|---|---|---|
| A1 | 76 | 3 | Grammar 30, Vocabulary 25, Functional 21 |
| A2 | 54 | 3 | Grammar 22, Vocabulary 19, Functional 12, Mixed 1 |
| B1 | 50 | 4 | Grammar 22, Vocabulary 17, Functional 10, Writing 1 |
| B2 | 60 | 5 | Grammar 25, Vocabulary 17, Functional 16, Writing 1, Academic 1 |
| C1 | 58 | 5 | Grammar 21, Vocabulary 19, Functional 14, Writing 1, Academic 2, Mixed 1 |
| C2 | 10 | 4 | Grammar 5, Vocabulary 3, Writing 1, Academic 1 |
No pronunciation or listening lessons exist. `category` has no whitelist in code/tests (free text), so new categories "Pronunciation" and "Listening" need no code change.

## Skill split (decision 3: 50% standalone-long / 50% embedded-short)
- STANDALONE: own lessons, `lesson_type: standalone_skill`, `lesson_length: long`, category "Pronunciation" or "Listening", placed in a dedicated skills unit per level (append a unit; do not renumber existing units/lessons).
- EMBEDDED: short segment (one text slide chapter + optional audio) added inside existing regular lessons, `lesson_type: embedded_skill` is for lessons that are mostly a skill drill; for ordinary lessons just add a "Say it" / "Listen for" chapter and keep their current type.
- Balance rule: per level, total skill minutes ≈ 50% in standalone lessons, 50% in embedded segments.

## Proposed standalone lessons per level (long; ~half pronunciation, half listening)
| Level | Standalone | Pronunciation topics | Listening topics |
|---|---|---|---|
| A1 | 6 | alphabet + sounds; word stress basics; -s/-es endings | greetings and numbers; short dialogues; directions |
| A2 | 6 | /ɪ/ vs /iː/; -ed endings; weak forms (to, can) | routines; shopping; voicemail/announcements |
| B1 | 6 | sentence stress; linking; intonation questions | interviews; short talks; phone calls |
| B2 | 6 | connected speech; contrastive stress; UK/US /r/ and /t/ | podcasts; lectures (note-taking); accents |
| C1 | 4 | rhythm and chunking; discourse intonation | fast speech; academic lectures |
| C2 | 2 | nuance/attitude in intonation | implication, irony, mixed accents |
Total ≈ 30 standalone lessons. Embedded segments: aim for one per 3–4 regular lessons (~90–100 segments total), written in batches by unit.

## UK | US (decision 1)
Every pronunciation lesson and every embedded segment where accents differ MUST use the `.uk-us` block (schema doc). Typical rows: /r/ after vowels (car), /t/ flapping (water), /æ/ vs /ɑː/ (bath), stress (advertisement, laboratory), vocabulary/spelling pairs in listening scripts. Audio: where a native-audio file is impossible offline, provide phonetic text + minimal-pair drills; add UK and US audio only from licensed/own recordings (do NOT scrape).

## Exam vs fluency tagging (decision 2: ~30/70)
Proposed default tagging of the 308 existing lessons via `lesson_type` (human to confirm before bulk edit): Functional Language -> `fluency`; Academic English + Writing -> `exam`; Grammar/Vocabulary -> mostly `fluency`, with roughly a third at B1–C2 marked `exam` (exam-relevant structures/word lists). Verify final ratio ≈30/70 by count and adjust. Bulk tagging is a content edit: rebuild level packs, re-run lesson audit tooling.

## Length tagging (decision 4)
`lesson_length: long` for standalone skills and deep grammar lessons; `short` for embedded/drill lessons. Use existing `estimated_minutes` as a sanity check (short ≲ 8 min, long ≳ 15 min).

## Build order (each step = its own agent turn, additive, gates green)
1. Pilot: ONE standalone lesson (A1 pronunciation: alphabet + sounds) with `.uk-us` block + tags; new unit appended in `course_content/lessons/a1.json` + units/courses mirrors; check `lesson_content/` mirrors and `offline/packs/a1.zip`; run lesson audit tooling for the new lesson; verify-all.
2. Roll out A1 skills unit, then A2..C2.
3. Embedded segments, batch by unit.
4. Tag exam/fluency after human confirms the rule above.

## Open questions for the human
- Do you have licensed UK + US audio, or should lessons stay text/phonetic for now?
- Confirm the exam/fluency tagging rule above.
- Confirm standalone counts (≈30 total) or give different numbers.

## Status
- Build step 1 DONE (Agent 298): A1 pilot `course-a1-unit-04-lesson-01`.

- Build step 2 (A1) DONE (Agent 299): lessons 02-05 (-s endings, listening x3). Word stress stays inside lesson 01. Next: A2 skills unit.
- Build step 2 (A2) DONE (Agent 300): `course-a2-unit-04`, 6 lessons. Next: B1 skills unit.
- Build step 2 (B1) DONE (Agent 301): `course-b1-unit-05`, 6 lessons. Next: B2 skills unit.
- Build step 2 (B2) DONE (Agent 302): `course-b2-unit-06`, 6 lessons. Next: C1 skills unit (4 lessons).
- Human answers (Agent 303): audio = placeholder sample MP3 for every audio lesson/question as structure, replaced gradually; standalone counts (~30) CONFIRMED. Exam/fluency rule still UNANSWERED (do not bulk-tag).
- Agent 303: audio structure wired for A1-B2 skill lessons (`shared/audio/sample.mp3`). Next: C1 skills unit (4 lessons) WITH the same audio_urls + media.audio structure.
- Build step 2 (C1) DONE (Agent 304): `course-c1-unit-06`, 4 lessons WITH audio_urls + media.audio (placeholder sample.mp3). Next: C2 skills (2 lessons; C2 text must be re-pasted by the human).
- Build step 2 (C2) DONE (Agent 305): `course-c2-unit-05`, 2 lessons WITH audio structure. All standalone skill lessons built. Next: step 3 embedded segments; step 4 exam/fluency tags after human confirms the rule.
- Build step 3 batch 1 DONE (Agent 306): 6 embedded segments in A1 unit-01. Next batches: A1 unit-02/03, then A2..C2 (about 1 per 3-4 lessons; skip lessons with empty bodies).
- Build step 3 batch 2 DONE (Agent 307): 9 embedded segments in A1 unit-02/03 (embedded total 15). Next: A2, B1, B2, C1, C2 batches.
- Build step 3 batch 3 DONE (Agent 308): 16 embedded segments in A2 (embedded total 31). Next: B1, B2, C1, C2 batches.
- Build step 3 batch 4 DONE (Agent 309): 16 embedded segments in B1 (embedded total 47). B1-C2 regular lessons have no body_content: prepend `<p>revision.summary</p>` before the segment. Next: B2, C1, C2 batches.
- Build step 3 batch 5 DONE (Agent 310): 35 embedded segments (B2 16, C1 16, C2 3); embedded total 82. Next: about 8-18 more to reach 90-100 (remaining B2/C1/C2 lessons, or more A1/A2/B1), then browser/audio checks.
- Build step 3 batch 6 DONE (Agent 311): 11 embedded segments (B2 5, C1 4, C2 2); embedded total 93 = target met. Step 3 complete. Next: real-browser audio + keyboard/spacing audit, human feedback on exam/fluency tagging.
