# C1 CURRICULUM ISSUES — SEED (pre-flagged for human review)
# Agent 1 must read this BEFORE mapping.
# Do not silently resolve these. Append, do not overwrite.

## OCR / SOURCE AMBIGUITIES

1. Three-column table OCR'd into three sequential blocks (not row-by-row).
   Column membership for each line was inferred by content type: grammar
   terms → Grammar; topic nouns → Vocabulary and Topical Syllabus;
   communicative-function words/phrases → Functional Syllabus. High
   confidence given how cleanly the three blocks separated by content type,
   but not verified against the original table layout.
   ACTION: Confirm with human that the block boundaries are correct,
   especially the boundary points (item 16→1 between Grammar and
   Vocabulary, and item 17→1 between Vocabulary and Functional).

2. "Advertising Architecture" (one OCR line) — split into two separate
   topical items: "Advertising" and "Architecture".
   ACTION: Confirm with human this is two items, not one hyphenated/compound
   topic ("Advertising Architecture" as a single field of study seems
   unlikely but not impossible).

3. "Instructing Describing Advising" (one OCR line) — split into three
   functional items: "Instructing", "Describing", "Advising".
   ACTION: Confirm with human.

4. "Speculating Expressing annoyance" (one OCR line) — split into two
   functional items: "Speculating" and "Expressing annoyance".
   ACTION: Confirm with human.

5. "Moral and persona dilemmas" — typo: "persona" → "personal". Normalized
   to "Moral and personal dilemmas".
   ACTION: Confirm with human.

6. "Types of communicatior" — OCR typo, missing final "n". Normalized to
   "Types of communication".
   ACTION: Confirm with human.

7. **"Describing" (functional item 3) vs "Describing people and things and
   situations" (functional item 14) — possible duplication.**
   "Describing" appears as one of three items split out of the merged line
   "Instructing Describing Advising" near the top of the functional block;
   "Describing people and things and situations" appears as its own,
   more specific bullet at the end of the block.
   QUESTION: are these two genuinely distinct functional items (a general
   "describing" function early on, and a more specific/expanded
   "describing people/things/situations" skill later), or did OCR
   duplicate one item into two places?
   ACTION: FLAGGED. Do NOT merge or delete either without human
   confirmation — same treatment as B2's "Phrasal verbs in both Grammar
   and Vocabulary" issue.

## PRE-EXISTING LIVE CONTENT vs THIS SYLLABUS

`c1/quizzes.json` already ships 22 entries — checked against the syllabus
above:

8. `c1-001` "Advanced Conditionals" maps to the syllabus's "Mixed
   conditionals" (Grammar item 13). Likely already covers this item — do
   not re-author without confirming scope matches.

9. `c1-006` "Ellipsis" maps to "Ellipsis and elision" (Grammar item 9) —
   confirm the live lesson also covers elision, or whether that half of
   the item still needs authoring.

10. `c1-008` "Inversion after Only" maps to "Inversions and negative
    adverbials" (Grammar item 15) — live content is narrower (only "Only")
    than the syllabus item (all negative adverbials: Not only, No sooner,
    Rarely, Little, etc.). Likely needs a broader companion lesson rather
    than being treated as fully covered.

11. `c1-002` "Subjunctive", `c1-003` "Cleft Sentences", `c1-007` "Lexical
    Precision", `c1-010` "Collocation" — none of these match anything on
    this syllabus. Same status as B1's Linkers/Gerunds and B2's
    Inversion/Causative/Concession: pre-existing extra topics, not this
    pipeline's business to remove.

## MAJOR CROSS-LEVEL OVERLAP — NEEDS HUMAN DECISION BEFORE MAPPING

12. **Mixed conditionals: three-way overlap.** `b2-001` "Mixed
    Conditionals" is already live at B2. `c1-001` "Advanced Conditionals"
    is already live at C1. And this C1 syllabus independently lists "Mixed
    conditionals" as a C1 grammar item. This is the same shape of question
    B2's own Issue H raised (live content vs. syllabus scope) but now
    spans two levels.
    QUESTION: is "mixed conditionals" a B2 topic, a C1 topic, or
    (deliberately) both, taught at different depth? The two live lessons
    (b2-001, c1-001) may already answer this by example — worth a human
    read of both before deciding whether C1's syllabus item is already
    fully covered by c1-001 or needs its own distinct lesson.
    ACTION: FLAGGED. Do not author a new C1 conditionals lesson until this
    is resolved.

13. **Question tags: appears at B1, B2, and now C1.** B1 has it live
    (`b1-*`, per B1_FINAL_HANDOFF.md conventions), B2 authored it as a new
    lesson this run (`b2-014`), and now C1's syllabus lists it again.
    QUESTION: does each level deepen (more complex tags, intonation,
    register) or does this risk being a straight repeat three levels
    running?
    ACTION: FLAGGED, not decided.

14. **Passive: appears at B2 and now C1.** B2 has "Passive" (`b2-020`,
    foundational, deliberately scoped away from B2's own live "Advanced
    Passive" `b2-006`). C1's syllabus lists "Passive" again, with C1
    already separately shipping nothing passive-specific live.
    QUESTION: is C1's "Passive" meant to be the most advanced tier (passive
    reporting structures, causative passive), building on B2's two
    existing passive lessons?
    ACTION: FLAGGED, not decided.

15. **Reported speech: appears at B1 and B2, now C1.** B1 authored but
    never shipped it; B2 authored and shipped a "B2 extensions" version
    this run (`b2-022`). C1's syllabus lists it a third time.
    QUESTION: same shape as #13 — deepening across three levels, or
    unintended repetition?
    ACTION: FLAGGED, not decided.

16. **Relative clauses: appears at B1 and B2, now C1.** Same pattern as
    #15 — B1 authored-not-shipped, B2 shipped this run (`b2-023`), C1
    syllabus lists it again.
    ACTION: FLAGGED, not decided.

17. **Collocation: appears at B2 (live) and C1 (live).** Not part of this
    C1 syllabus transcription at all (C1's real syllabus has no vocabulary
    item called "Collocation" — the live `c1-010` predates or sits outside
    this syllabus, similar to item 11 above), but worth surfacing here
    since it's a direct title match to `b2-008` "Collocations". Same
    open question as B2's own Issue A shape, now confirmed live at both
    levels regardless of what either syllabus document says.
    ACTION: FLAGGED, not decided.

## HUMAN RESOLUTION (recorded this run)

**Decision:** For every item that already exists at a lower level or already
partially exists at C1 (issues 8, 9, 10, 12, 13, 14, 15, 16, 17), the human
has confirmed the "spiral curriculum" reading: C1 deepens rather than
repeats. All 5 previously-HELD grammar items (Mixed conditionals, Question
tags, Passive, Reported speech, Relative clauses) are UNBLOCKED, on the
condition that each lesson explicitly builds past what the lower level(s)
already teach rather than re-covering the same ground — see
C1_LESSON_DRAFTS.md, where each formerly-held item states exactly what it
assumes as known and what it adds. The 3 narrower partial-matches
(Ellipsis and elision vs. `c1-006`; Inversions and negative adverbials vs.
`c1-008`; Participles/Modal verbs vs. B2 content) are resolved the same
way: author the C1 lesson to cover only the ground the existing lesson
doesn't, not the whole topic from scratch.

This does not resolve issue 7 (possible "Describing" duplicate) — both
items are still drafted separately per the original "don't merge, flag"
plan, since the human's direction was about cross-level redundancy, not
this same-level naming ambiguity.

## MISSING FROM SOURCE was provided with this transcription (unlike
  B1/B2's sources). CURRICULUM_SOURCE.md currently carries over the
  earlier CEFR-drafted objectives as an unconfirmed placeholder.
  ACTION: Human should confirm these, replace them, or confirm the
  syllabus lists are sufficient without a separate objectives section.
- No register/variety guidance (British/American/neutral) — same
  unresolved question carried from B2's Issue D, relevant here too given
  "Expressing opinions formally and informally" and other register-
  sensitive functional items.
- No lesson-count target given — same as B2's Issue G, not capped here
  either.
