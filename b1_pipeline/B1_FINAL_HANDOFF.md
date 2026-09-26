# MYLINGO B1 — FINAL HANDOFF (v2 — merged into live app)

## WHAT WAS ADDED
Pipeline docs, under `b1_pipeline/`:
- `B1_CURRICULUM_MAP.md`, `B1_CURRICULUM_ISSUES.md`, `B1_LESSON_DRAFTS.md`,
  `B1_SAMPLE_QUIZZES.md`, `B1_CONTENT_AUDIT.md`, `B1_INTEGRATION_NOTES.md`, `B1_QA_REPORT.md`

Live app content:
- 40 new quiz files: `grammar/b1/b1-011.json`…`b1-024.json` (14), `vocabulary/b1/b1-025.json`
  …`b1-040.json` (16), `functional/b1/b1-041.json`…`b1-050.json` (10) — new `functional/b1/`
  folder, using the existing `"Functional Language"` category.
- `b1/quizzes.json` — 40 rows appended, 21 original rows untouched. 61 total.

## MERGE OUTCOME (per your "merge, don't skip" instruction)
- Old 10-topic catalog kept exactly as-is: Present Perfect vs Past Simple, Second Conditional,
  Relative Clauses, Reported Speech, Gerunds and Infinitives, Modal Deduction, Passive Voice,
  Used to, Linkers, Phrasal Verbs — nothing deleted or overwritten.
- New syllabus items that already had a shipped equivalent were **not** re-authored into the
  catalog (Used to, Past Simple/Pres Perfect, Relative Clauses, Reported Speech, Passives) —
  avoids duplicate content for the same skill.
- The one partial overlap (Second Conditional) was kept, and the new First/Second contrast
  lesson was added alongside it as **"First vs Second Conditional (Contrast)"**, not merged
  into or replacing the existing item.
- Everything else in the syllabus (14 grammar, 16 vocabulary, 10 functional = 40 items) is now
  live in the catalog.

## NUMBERS
- New catalog entries live: 40 (of 45 authored; 5 grammar items intentionally not duplicated)
- Total B1 catalog size: 61 (was 21)
- Full authored set (for reference/future use, all 45 lessons + 225 questions): in
  `b1_pipeline/B1_LESSON_DRAFTS.md` and `B1_SAMPLE_QUIZZES.md`

## OUTSTANDING ISSUES
1. `lesson_content/b1/` (the separate full-lesson-page system, distinct from the quiz catalog)
   was not extended — deciding unit/lesson numbering for the 40 new items there is a product
   call not made here.
2. Decisions A–K (register, tone, scope for Reported speech/Neither-so-do-I, etc.) were
   resolved with documented defaults, not individually confirmed — see B1_CONTENT_AUDIT.md.
   The two tone-sensitive items flagged there (Political Systems, Crime and Punishment) have
   since been read manually and confirmed neutral/factual (see B1_QA_REPORT.md, third pass) —
   still worth a human glance if targeting a specific sensitive market/age group, but no
   content issue was found.
3. RESOLVED this pass: all 40 live new items (200 questions) have now been manually read
   end-to-end — the 14 grammar items in the second QA pass, and the remaining 16 vocabulary +
   10 functional items in the third pass. 0 content errors found across the full set. The
   pre-existing `b1-001`–`b1-010` catalog's answer key was also re-verified as part of the
   original correctIndex bug fix (see DEFECT FOUND AND FIXED above) — not re-read line by
   line beyond that fix.
4. RESOLVED this pass: confirmed `b1/index.html` and `b1/dashboard.html` fetch `quizzes.json`
   dynamically and derive all displayed counts from it — no hardcoded quiz list/count found,
   so the 40 new items require no UI code change to appear. (Still not run in a live browser,
   since no browser is available in this environment — only static code inspection.)

## TESTS PERFORMED
Structural JSON validation of all 61 catalog entries (parses, 5 questions, 4 answers,
correctIndex in range, no duplicate IDs). Full manual content read of all 40 new items
(200 questions). Static confirmation that the quiz-list UI reads the catalog dynamically.
No live browser/UI render test (no browser in this environment).

## FILES CHANGED
- Added: `b1_pipeline/*` (7 files), `grammar/b1/b1-011..024.json` (14),
  `vocabulary/b1/b1-025..040.json` (16), `functional/b1/b1-041..050.json` (10)
- Modified: `b1/quizzes.json` (appended 40 rows), plus a 1-line `correctIndex` fix (4→3) in
  each of `grammar/b1/b1-001.json`, `b1-002.json`, `b1-003.json`, `b1-004.json`, `b1-005.json`,
  `b1-006.json`, `b1-007.json`, `writing/b1/b1-008.json`, `grammar/b1/b1-009.json`,
  `vocabulary/b1/b1-010.json` — 15 questions total, fixing a pre-existing out-of-range bug
  (no answer text or option order changed); plus a title/description cleanup on `b1-013`,
  `b1-024`, `b1-037`, `b1-038` (internal pipeline commentary had leaked into the live title)
- Untouched: everything else, including `b1/index.html`, `b1/dashboard.html`

## NEXT LEVEL
B2 — NOT started automatically, per pipeline rule.

END OF B1 FINAL HANDOFF
