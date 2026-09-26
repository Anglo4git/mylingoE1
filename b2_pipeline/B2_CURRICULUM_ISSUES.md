# B2 CURRICULUM ISSUES — SEED (pre-flagged for human review)
# Agent 1 must read this BEFORE mapping.
# Do not silently resolve these. Append, do not overwrite.

## OCR / SOURCE AMBIGUITIES

1. "Zero, first, second anc third conditionals"
   - Typo: "anc" → "and".
   - Normalized to "Zero, first, second and third conditionals".
   - ACTION: Confirm with human.

2. "Always for frequency I present continuous"
   - Garbled separator. Likely "Always for frequency + present continuous".
   - Meaning: using "always" with present continuous for repeated/habitual
     actions (often with annoyance or emphasis).
   - ACTION: Normalized. Confirm with human.

3. "Compounds of some, any, no, every."
   - Kept verbatim. Examples: someone, anybody, nothing, everywhere.
   - Trailing period in source is OCR noise.

4. "Will. going to, Present Simple, Present Continuous for the future"
   - Punctuation noise: "Will. going to" → "Will, going to".
   - ACTION: Normalized. Confirm with human.

5. "Phrasal verbs" appears in BOTH Grammar and Vocabulary
   - Source lists it twice.
   - QUESTION: is this intentional (grammar pattern + phrasal verb lexicon)
     or OCR duplication?
   - ACTION: FLAGGED. Do NOT remove either. Agent 1 must flag this and
     let the human decide.

6. "Connotation Homonyms"
   - Likely two separate vocabulary items:
     - Connotation
     - Homonyms
   - Split in CURRICULUM_SOURCE.md.
   - ACTION: Confirm with human.

7. "Adverbs of manner and modifiers"
   - Same phrasing used at A2 and B1.
   - QUESTION: is B2 a deepening, or a repeat?
   - ACTION: FLAGGED. Do not merge silently.

8. "Participle adjectives"
   - Kept verbatim. (e.g. bored / boring, interested / interesting)
   - Sits between grammar and vocab. Kept under Grammar per source order.

9. "Congratulating Commiserating"
   - Two separate functional items run together.
   - Split in CURRICULUM_SOURCE.md.
   - ACTION: Confirm with human.

10. "Banks / money" and "Colloquial expressions and."
    - "and." at the end is OCR truncation.
    - Normalized to "Colloquial expressions".
    - "Banks / money" kept as one topic.
    - ACTION: Confirm with human.

## DESIGN DECISIONS NEEDING HUMAN INPUT (do NOT resolve)

A. B1 ↔ B2 overlap
   - Question tags, Passive, Reported speech, Relative clauses, and
     Conjunctions (although / despite / in spite of) appear in both B1 and B2.
   - QUESTION: Does B2 re-teach these from scratch, or assume B1 and
     deepen them?
   - ACTION: Flagged. Curriculum Mapper must not decide alone.

B. Third conditional and mixed conditionals
   - Source lists "Zero, first, second and third conditionals".
   - QUESTION: does the syllabus include mixed conditionals, or only the
     four standard types?
   - ACTION: Assume only the four types. Confirm at approval gate.

C. Modal perfect scope
   - Source says "Modals: present and perfect".
   - Perfect modals (must have, should have, could have, might have) can
     be taught narrowly (deduction/regret) or broadly.
   - QUESTION: which scope?
   - ACTION: Flagged. Do not invent scope.

D. Idiomatic expressions / Colloquial expressions / Euphemisms
   - All three are register-sensitive and vary by region.
   - QUESTION: which variety of English (British, American, neutral)?
   - ACTION: Flagged. Do not pick silently.

E. "Habit in the Present and the Past"
   - Overlaps with "Used to + infinitive" from B1 and "Always for
     frequency + present continuous" from B2.
   - QUESTION: merge, deepen, or keep separate?
   - ACTION: Flagged. Do not merge silently.

F. Crime and punishment (vocab)
   - Appears at B1 and B2. B2 likely deepens it (legal processes, justice).
   - QUESTION: sensitivity constraints?
   - ACTION: Flagged. Do not remove.

G. Total lesson count
   - B2 has many items and they require longer lessons and more examples.
   - QUESTION: target lesson count, or is breadth fine?
   - ACTION: Flagged. Do not artificially cap.

## MISSING OR UNCLEAR FROM SOURCE

- No explicit writing task types beyond "letter, essay, report".
  → Lesson Author should propose specific task types and flag them.
- No guidance on how many phrasal verbs are expected (grammar vs lexical list).
  → Agent 1 must flag scope, not assume.
- No register / formality map for functional items (euphemisms, colloquial).
  → Assume neutral default and flag for approval.

## APPENDED BY AGENT 1 — CURRICULUM MAPPER (this run)
# Found while inspecting the current Mylingo architecture, per First Agent
# Command step 2. Full detail and lesson-by-lesson context in B2_CURRICULUM_MAP.md.
# Appended, not overwritten, per MASTER_B2_HANDOFF.md section 7.

H. Mixed Conditionals already live, contradicts seed issue B's default
   - `b2-001` "Mixed Conditionals" is already shipped in `b2/quizzes.json`.
   - Seed issue B says: assume the syllabus's "Zero, first, second and third
     conditionals" means only the four standard types, confirm at approval gate.
   - The live app has already gone further than that default.
   - QUESTION: was Mixed Conditionals a deliberate earlier decision that the
     four-type default should now match, or is it scope creep that predates this
     pipeline and should stay separate from the new "four types" lesson?
   - ACTION: FLAGGED. Do not draft the new conditionals lesson until this is
     resolved — risk of contradicting or duplicating live content either way.

I. Modal Perfect scope already chosen, but only covers half the syllabus item
   - `b2-003` "Modal Perfect" is live and covers deduction/regret perfect modals
     only (must have / should have / could have / might have).
   - The syllabus item is "Modals: present and perfect" — present modals
     (ability/permission/obligation at B2 nuance) are not covered by anything live.
   - Seed issue C asked which scope perfect modals should have; the shipped
     content has answered that question by example, narrowly, without a human
     sign-off on record.
   - ACTION: FLAGGED. Recommend Agent 2 authors only the missing "present
     modals" half to avoid duplicating b2-003, but this still needs the human to
     confirm the narrow perfect-modal scope is intentional and to be kept as-is.

J. "Participle Clauses" (live) is not the same item as "Participle adjectives" (syllabus)
   - `b2-005` "Participle Clauses" teaches reduced clauses (e.g. "Having
     finished his homework, he left").
   - The syllabus lists "Participle adjectives" (e.g. bored/boring), a
     different, unrelated construction.
   - ACTION: FLAGGED so Agent 2 does not skip "Participle adjectives" thinking
     it's already covered by b2-005. Confirm both are meant to coexist.

K. Concession (live) / Conjunctions (syllabus) / Stating contrast (syllabus,
   functional) — three-way overlap risk
   - `b2-009` "Concession" is already live (grammar).
   - The syllabus separately lists "Conjunctions: although, despite, in spite
     of, otherwise, unless" (grammar) and "Stating contrast" (functional).
   - All three could plausibly teach the same handful of words/structures.
   - ACTION: FLAGGED. Curriculum Mapper's non-binding suggestion: Conjunctions
     = basic connector words, Concession (existing) = advanced concessive
     structures/inversion, Stating contrast = conversational phrases for
     disagreeing/contrasting opinions. Human must confirm this split before
     Agent 2 drafts all three, or two of the three will overlap.

L. "Academic English" and "Writing" categories are not in the B2 syllabus document
   - `b2-007` (Hedging) and `b2-010` (Register) use categories
     ("Academic English", "Writing") that CURRICULUM_SOURCE.md doesn't define
     as B2 syllabus areas at all — they're outside Grammar/Vocabulary/Functional.
   - This mirrors an established cross-level convention (noted in the B1
     next-agent context: "Academic English (B2/C1/C2)" and Writing as a
     standalone category at other levels), so it is very likely intentional
     platform convention rather than an error.
   - ACTION: Not treated as a defect. Noted for awareness only — these two
     items stay untouched, outside the 51-item B2 syllabus count.

M. `lesson_content/b2/` precedent, relevant to B1's still-open item
   - Unlike B1 (where `lesson_content/b1/` was never wired to quizzes.json),
     B2 already ships all 10 of its pre-existing quiz items with a matching
     `lesson_content/b2/lesson-course-b2-unit-0N-lesson-0M` page, unit-numbered
     by category (unit-01 Grammar 7 lessons, unit-02 Vocabulary 1, unit-03
     Writing 1, unit-04 Academic English 1), and both live together as rows in
     the same `quizzes.json`.
   - ACTION: Not a B2 defect — flagged only as useful precedent for whoever
     eventually resolves B1's open "lesson_content/b1/ unit/lesson numbering"
     decision (see B1_NEXT_AGENT_CONTEXT.md item 1). Not acted on here; B2's
     own Technical Integrator will decide numbering for B2's 50 new items after
     the human approval gate, following whichever pattern is confirmed.
