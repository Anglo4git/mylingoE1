# B1 INTEGRATION NOTES
# Agent 6 — Technical Integrator output.

## BLOCKING FINDING — DO NOT SILENTLY RESOLVE
`b1/quizzes.json` (plus `grammar/b1/*.json`, `vocabulary/b1/*.json`) already contains a **shipped
B1 catalog** that predates this pipeline run:

- Grammar (b1-001..010): Present Perfect vs Past Simple, Second Conditional, Relative Clauses,
  Reported Speech, **Gerunds and Infinitives**, Modal Deduction, Passive Voice, Used to
- Vocabulary (b1-010, b1-media-01): **Phrasal Verbs**, Picture & Sound Vocabulary
- Writing (b1-008): **Linkers**
- A parallel "lesson-course-b1-unit-0X-lesson-0Y" set mirroring the same 10 topics

This does **not** match `CURRICULUM_SOURCE.md`:
- "Gerunds and Infinitives" and "Phrasal Verbs" and "Linkers" are not in the B1 syllabus at all.
- "Second Conditional" is listed alone, where the source lists "First, second conditional"
  as one line (the open split question, decision B) — the shipped content already made that
  call unilaterally, before this pipeline existed.
- None of B1_LESSON_DRAFTS.md's 45 curriculum-mapped lessons exist in the live catalog yet.

This is precisely what MASTER_B1_HANDOFF.md Rule 12 exists to catch ("if overlap ... causes
confusion, flag it — do not silently resolve it"), just discovered one level later than usual:
at integration time instead of mapping time, because the app's existing content was never
listed as a source in CURRICULUM_SOURCE.md or CURRICULUM_ISSUES_SEED.md.

## ACTION TAKEN — MERGE (human decision: "merge, don't skip")
Per explicit instruction, the pre-existing 10-topic catalog was **kept as-is, untouched**, and
merged with new content rather than replaced:

- **Skipped re-authoring** for syllabus items that already have a shipped equivalent, to avoid
  duplicating live content: *Used to* (G1), *Past Simple/Present Perfect* (G2), *Relative
  Clauses* (G6), *Reported Speech* (G18), *Passives* (G11). The shipped versions remain the
  content of record for these five.
- *Second Conditional* (shipped) was kept as-is; the new combined first/second lesson was
  **retitled "First vs Second Conditional (Contrast)"** so it complements rather than
  duplicates the shipped item, instead of being silently dropped or silently merged into one.
- *Gerunds and Infinitives*, *Phrasal Verbs*, and *Linkers* (shipped, not in
  CURRICULUM_SOURCE.md) were left exactly as they are — not deleted, not folded into anything.
- **40 new catalog entries added** (`b1-011` through `b1-050`): 14 grammar, 16 vocabulary,
  10 functional. New folder `functional/b1/` created, using the `"Functional Language"`
  category value already established by A1/A2 (`a1/quizzes.json`) — no schema change needed.
- `b1/quizzes.json` updated: 21 existing rows kept unchanged, 40 rows appended. New total: 61.
- Each new file follows the exact schema of `grammar/b1/b1-001.json` (id, title, description,
  brand, category, tags, level, version, questions[] with question/category/tags/explanation/
  correctIndex/answers). Answer options were shuffled per question (not always index 0),
  matching the existing files' pattern.

## NOT TOUCHED / NOT DONE THIS PASS
- The parallel `lesson_content/b1/lesson-course-b1-unit-0X-lesson-0Y.json` structure (full
  lesson pages, not just quizzes) was not extended. It's a separate system from the quiz
  catalog with its own unit/lesson numbering; deciding how the new 40 items slot into units
  is a product decision, not made here to avoid guessing wrong.
- `b1/index.html` / `b1/dashboard.html` were not modified — if they hardcode quiz IDs or
  counts anywhere (rather than reading `quizzes.json` dynamically), that needs a check.

## QA FINDING (pre-existing, unrelated to this merge — see B1_QA_REPORT.md)
Validating the *full* merged catalog surfaced a bug in the **original** shipped files
(`b1-001` through `b1-010`): several questions have `correctIndex` values equal to or beyond
`answers.length` (e.g. `correctIndex: 4` with only 4 answers, valid indices 0–3). This predates
this pipeline and affects the old content, not the 40 new entries (which validated clean).
Flagged, not fixed — out of scope to silently patch shipped content without being asked.

