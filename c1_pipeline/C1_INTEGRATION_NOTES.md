# C1 INTEGRATION NOTES
# Agent 6 — Technical Integrator. Runs only after the human approval gate
# in C1_CONTENT_AUDIT.md. Follows existing app conventions (mirroring the
# B2 run); no unrelated UI redesign.

## WHAT WAS MERGED

- 47 new quiz JSON files created, following the existing schema exactly
  ({id, title, description, brand: "Mylingo", category, tags, level,
  version: 1, questions: [{question, category, tags, explanation,
  correctIndex, answers}]}):
  - `grammar/c1/c1-011.json` through `c1-026.json` (16 files)
  - `vocabulary/c1/c1-027.json` through `c1-043.json` (17 files)
  - `functional/c1/c1-044.json` through `c1-057.json` (14 files) —
    `functional/c1/` created fresh this run, following the same
    convention `functional/b2/` used in the B2 run.
- 47 matching entries appended to `c1/quizzes.json` (catalog schema:
  {file, id, title, topic, description, category, tags, level,
  questions: 5, version: 1}). Catalog grew from 22 → 69 entries. Nothing
  removed or reordered; all 22 pre-existing rows (11 quiz items, 11
  lesson_content rows) left in place, aside from the correctIndex fix
  below.
- `correctIndex` values taken directly from C1_SAMPLE_QUIZZES.md's
  lettered answers (A/B/C/D → 0/1/2/3), matching the 0-based convention
  established by the B2 run's fix (see below) and used by every
  `grammar/b2/b2-011.json`-onward file.

## FIXES APPLIED FROM C1_CONTENT_AUDIT.md

C1_CONTENT_AUDIT.md section 5 left two minor fixes for this stage to
apply. Neither had actually been applied to the surviving
C1_SAMPLE_QUIZZES.md file, so both were applied now, directly during
JSON conversion:

- **G13 Q4** (section 4.1): the original item asked learners to rewrite
  a counterfactual sentence with "provided that," which doesn't fit —
  the "correct" answer was that the rewrite doesn't work. Replaced with
  a clean positive item asking learners to identify which of four
  sentences correctly uses "provided that" for a real (not
  counterfactual) condition. Now lives in `grammar/c1/c1-026.json`
  (G13 is the 16th grammar item → `c1-026`).
- **G6 Q1 and Q4** (section 4.2): stripped the inline answer-key
  parentheticals ("also acceptable as a variant order...", "size→shape;
  adjacent same-order types generally take no comma") — kept only the
  letter answer, as recommended for learner-facing rendering. Now lives
  in `grammar/c1/c1-016.json`.

## PRE-EXISTING DEFECT FOUND AND FIXED (same class as B2)

While validating the merged catalog, the same defect class the B2 audit
found was also present in C1's 8 pre-existing quiz-schema files:
`correctIndex: 4` on a 4-answer array (valid range 0–3). Fixed to `3` in
every case (12 questions total across 8 files), after confirming the
intended correct answer was already the last item in each `answers`
array — no other field touched:
- `grammar/c1/c1-001.json` (2 questions)
- `grammar/c1/c1-002.json` (2 questions)
- `grammar/c1/c1-003.json` (2 questions)
- `grammar/c1/c1-006.json` (1 question)
- `grammar/c1/c1-008.json` (1 question)
- `vocabulary/c1/c1-007.json` (1 question)
- `vocabulary/c1/c1-010.json` (1 question)
- `vocabulary/c1/c1-media-01.json` (2 questions)

This wasn't flagged in C1_CONTENT_AUDIT.md (which audited the new
lesson/quiz content, not the pre-existing live items) — found
independently during this run's structural validation pass, the same
way the B2 run found its parallel defect.

## WHAT WAS DELIBERATELY NOT TOUCHED

- `lesson_content/c1/` — the 11 existing full-lesson pages (units
  01–04) were left as-is. The 47 new quiz items have no matching
  lesson_content page yet. Per B2's precedent (itself extending B1's),
  C1's existing unit-numbering pattern (unit-01 Grammar 5 lessons,
  unit-02 Vocabulary 2, unit-03 Writing 1, unit-04 Academic English 3)
  is a plausible precedent to extend, but deciding the actual numbering
  for 47 new items across Grammar/Vocabulary/Functional is a product
  call this pipeline doesn't make unilaterally — flagged as an
  outstanding item, not resolved here.
- Cleft Sentences (c1-003), Subjunctive (c1-002), Discourse Markers
  (c1-004), Nominalisation (c1-005), Academic Stance (c1-009), Lexical
  Precision (c1-007), Collocation (c1-010) — all pre-existing, outside
  the C1 syllabus (per MASTER_C1_HANDOFF.md sections 3–4, these sit
  outside the 16+17+14 syllabus lists entirely). Left alone, per the
  established "not the new pipeline's business to remove" convention.
- `offline/packs.json` and `offline/packs/c1.zip` — reference the 11
  pre-existing C1 items only. The 47 new items are not yet in any
  offline pack. Not touched this run — flagged as an outstanding item,
  same "not this pipeline's call" treatment as the lesson_content
  numbering decision above.
- No UI code changed. `c1/index.html` and `c1/dashboard.html` were
  confirmed (before integration) to already `fetch('./quizzes.json')`
  dynamically and compute all counts from the array length — same as
  every other level. The 69-entry catalog requires no code change to
  surface.

## ID / NUMBERING PLAN USED

Next free ID at the start of this run was `c1-011` (existing IDs:
`c1-001`–`c1-010`, `c1-media-01`). Assigned sequentially in
curriculum-source order: `c1-011`–`026` grammar (G1–G16), `c1-027`–`043`
vocabulary (V1–V17), `c1-044`–`057` functional (F1–F14). No gaps.
Checked programmatically against every existing ID in `c1/quizzes.json`
and by repo-wide grep for the 47 new IDs before writing — 0 collisions.

## VALIDATION PERFORMED POST-MERGE

Re-parsed the full 69-entry catalog and every quiz-schema file it points
to (55 of 69 — the other 14 are pre-existing `lesson_content/` entries,
different schema, out of scope): every file has the question count its
catalog row declares, every question has 4 answers, every correctIndex
is in range 0–3. 0 structural errors across the merged catalog.

END OF C1 INTEGRATION NOTES
