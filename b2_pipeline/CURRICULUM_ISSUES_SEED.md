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
