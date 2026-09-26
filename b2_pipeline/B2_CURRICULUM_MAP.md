# B2 CURRICULUM MAP
# Agent 1 — Curriculum Mapper. Output of step "FIRST AGENT COMMAND" in
# MASTER_B2_HANDOFF.md. Does not author lesson content — see B2_LESSON_DRAFTS.md
# (Agent 2) for that. This file maps syllabus → lesson slots and records what
# already exists live so nothing gets silently duplicated.

## 0. ARCHITECTURE INSPECTION (done before mapping, per First Agent Command step 2)

`b2/quizzes.json` is NOT empty. It already ships 21 entries — this is the same
situation the B1 run hit ("Always check for pre-existing live content..."). Unlike
B1, the B2 catalog mixes two kinds of rows in the same file:
- 10 quiz items + 1 media-vocab item (`b2-001`–`b2-010`, `b2-media-01`)
- 10 matching `lesson_content/b2/lesson-course-b2-unit-0N-lesson-0M` pages, one per
  quiz item (except the media item), unit-numbered by category:
  - unit-01 = Grammar, lessons 01–07 (7 grammar quizzes → 7 lesson pages)
  - unit-02 = Vocabulary, lesson 01 (Collocation)
  - unit-03 = Writing, lesson 01 (Register)
  - unit-04 = Academic English, lesson 01 (Hedging)

So at B2, unlike B1, `lesson_content/` is already wired to the live quiz catalog
1:1, and both live in `quizzes.json` together. This is useful precedent for
whoever eventually closes B1's open "lesson_content/b1/ numbering" item — B2
already shows one working pattern (`unit-0N` per category, `lesson-0M` sequential
within it).

`functional/b2/` does not exist yet (same as `functional/b1/` before the B1 run).
Next free plain quiz ID: **b2-011** (001–010 and media-01 are taken).

## 1. PRE-EXISTING CONTENT vs SYLLABUS — cross-check

Existing 10 topics, checked against CURRICULUM_SOURCE.md:

| Existing id | Title | Category | In B2 syllabus? |
|---|---|---|---|
| b2-001 | Mixed Conditionals | Grammar | Partially — see ⚠ below |
| b2-002 | Inversion | Grammar | **Not listed** — extra topic |
| b2-003 | Modal Perfect | Grammar | Partial match to "Modals: present and perfect" |
| b2-004 | Causative | Grammar | **Not listed** — extra topic |
| b2-005 | Participle Clauses | Grammar | Adjacent to "Participle adjectives" but not the same construction |
| b2-006 | Advanced Passive | Grammar | Matches "Passive" |
| b2-007 | Hedging | Academic English | **Not listed** (Academic English isn't a B2 syllabus category at all — precedent from B1's convention notes: "Academic English (B2/C1/C2)") |
| b2-008 | Collocation | Vocabulary | Matches "Collocations" |
| b2-009 | Concession | Grammar | **Not listed** — adjacent to "Conjunctions: although, despite, in spite of..." |
| b2-010 | Register | Writing | Not a listed syllabus item (Writing isn't a B2 syllabus category either — matches B1/A2 precedent of a standalone Writing category) |
| b2-media-01 | Picture & Sound Vocabulary | Vocabulary | Media vocab, not topic-specific — same pattern as `b1-media-01`, leave alone |

⚠ **Flagged, not resolved (added to B2_CURRICULUM_ISSUES.md as item H):** the live
`b2-001` "Mixed Conditionals" already exists and teaches mixed conditional forms.
CURRICULUM_ISSUES_SEED.md issue B says to *assume the syllabus means only the four
standard conditional types* and confirm at the approval gate. The shipped content
already contradicts that default. This needs a human decision before Agent 2
authors the new "Zero, first, second and third conditionals" lesson, so the two
don't overlap or contradict each other.

⚠ **Flagged (issue I):** `b2-003` "Modal Perfect" only covers perfect modals
(deduction/regret: must have, should have, could have, might have) — it does not
cover present modals (ability/permission/obligation nuance at B2). The syllabus
item "Modals: present and perfect" is therefore half-covered. Seed issue C (modal
perfect scope) is still open — the shipped content has already picked "narrow /
deduction-regret" as its de facto scope. Needs confirming, not just assuming.

⚠ **Flagged (issue J):** `b2-005` "Participle Clauses" (e.g. "Having finished his
homework, he went out") and the syllabus's "Participle adjectives" (e.g.
bored/boring) are different constructions that share only the word "participle."
Do not treat b2-005 as covering the syllabus item — "Participle adjectives" still
needs its own lesson.

⚠ **Flagged (issue K):** `b2-009` "Concession" (grammar-level concessive
constructions, e.g. inversion with "Much as...") sits very close to the syllabus's
"Conjunctions: although, despite, in spite of, otherwise, unless" and to the
functional item "Stating contrast." Three different pipeline items could end up
teaching overlapping ground. Recommend Agent 2 treat them as: Conjunctions =
basic connector words/patterns, Concession (existing) = advanced concessive
structures, Stating contrast (functional) = conversational phrases — but this is
a judgement call for the human to confirm, not a resolved decision.

Inversion (b2-002) and Causative (b2-004) are extra topics with no syllabus
overlap at all — same status as B1's Linkers/Gerunds/Phrasal Verbs: pre-existing,
not the new pipeline's business to touch or remove.

## 2. LESSON SLOT PLAN — GRAMMAR (18 syllabus items)

None of the 18 syllabus grammar items are fully covered by existing content
except "Passive" (via Advanced Passive, see flag above — human should confirm
whether a separate foundational Passive lesson is still wanted, since "Advanced
Passive" may assume B1 passive is already known rather than reteaching it).

Proposed: one lesson + one 5-question sample quiz per item, 18 total, unless the
human resolves an open issue to merge two (see Issues A and E, which both
propose possible merges that Agent 2 must NOT decide alone):

1. Habit in the Present and the Past — ⚠ Issue E: possible overlap with B1's
   "Used to" and with item 16 below (Always + present continuous). Author
   separately for now, flag overlap in the lesson draft.
2. Present Perfect Simple and Present Perfect Continuous
3. Past Simple, Past Continuous, and Past Perfect
4. Question tags
5. Will, going to, Present Simple, Present Continuous for the future
6. Future Perfect
7. Phrasal verbs (grammar/pattern angle — see Issue 5, paired with vocab item 6
   below; author as two distinct lessons, do not merge)
8. Zero, first, second and third conditionals — ⚠ see Issue H above; hold for
   human confirmation before drafting, to avoid contradicting/duplicating the
   live Mixed Conditionals lesson
9. Wish and if only
10. Passive — ⚠ see flag above; draft a foundational version but flag for human
    to confirm it's wanted alongside Advanced Passive
11. Compounds of some, any, no, every
12. Reported speech — ⚠ Issue A (B1/B2 overlap): author as a B2 deepening
    (mixing reported statements/questions/commands with modal + tense shifts
    B1 doesn't cover), not a repeat of B1's reported speech. Flag this framing
    for human confirmation.
13. Relative clauses — ⚠ Issue A: B1 authored but never shipped a relative
    clauses lesson (see B1_FINAL_HANDOFF.md). Nothing live to duplicate yet at
    either level. Author as B2-appropriate (defining/non-defining + reduced
    relative clauses), flag for human awareness that B1 still has none live.
14. Conjunctions: although, despite, in spite of, otherwise, unless — ⚠ see
    Issue K above
15. Modals: present and perfect — ⚠ see Issue I above; author the missing
    "present modals" half only, do not re-author perfect modals (already live
    as Modal Perfect), to avoid duplicating b2-003
16. Always for frequency + present continuous — ⚠ see Issue E above
17. Adverbs of manner and modifiers — ⚠ Issue 7 (seed): same phrasing used at
    A2/B1. Author as a B2 deepening (position rules, modifying adjectives vs
    verbs), flag for human to confirm it's not a repeat
18. Participle adjectives — ⚠ see Issue J above; do not treat as covered by
    the existing Participle Clauses lesson

Net new grammar lessons to author: 18 (all items get a draft; several carry a
flag asking the human to confirm framing/non-duplication before the draft is
finalized at the audit stage — this is Agent 2/3/4's job, not resolved here).

## 3. LESSON SLOT PLAN — VOCABULARY (17 syllabus items)

Only "Collocations" is already live (b2-008) — do not re-author it.
16 net new vocabulary lessons:

1. Affixes
2. Collocations — **SKIP, already live as b2-008**
3. Work, working conditions
4. Approximations with -ish
5. Transport and exploration
6. Phrasal verbs (lexical/vocabulary angle — companion to grammar item 7, not
   a merge)
7. Crime and punishment — ⚠ Issue F: also exists at B1 (`b1-037`). Author as a
   B2 deepening (legal processes, court/justice-system vocabulary) rather than
   repeating B1's basic terms (theft, fine, arrest, witness, sentence). Flag
   tone/register for human sign-off the same way B1's version was.
8. Relationships
9. Festivals and celebrations
10. Connotation
11. Homonyms
12. Idiomatic expressions — ⚠ Issue D: needs a British/American/neutral
    decision before drafting; hold or draft with an explicit placeholder
    variety and flag loudly
13. Sport and leisure
14. Euphemisms — ⚠ Issue D, same as above
15. Geography and climate
16. Banks / money
17. Colloquial expressions — ⚠ Issue D, same as above

## 4. LESSON SLOT PLAN — FUNCTIONAL (16 syllabus items)

`functional/b2/` doesn't exist yet — all 16 are net new, same situation B1 was
in for its functional items:

1. Giving opinions
2. Summarising
3. Expressing regret
4. Drawing conclusions
5. Making offers
6. Describing cause and effect
7. Stating purpose
8. Emphasising
9. Stating contrast — ⚠ see Issue K above (overlap risk with grammar
   Conjunctions/Concession)
10. Adding information
11. Congratulating
12. Commiserating
13. Clarifying
14. Guessing
15. Ordering arguments
16. Giving examples

## 5. TOTALS

- Grammar: 18 syllabus items → 18 lesson drafts (0 skipped; several flagged,
  none silently merged or duplicated)
- Vocabulary: 17 syllabus items → 16 lesson drafts (1 skipped: Collocations,
  already live)
- Functional: 16 syllabus items → 16 lesson drafts (functional/b2/ net new)
- **Total: 51 syllabus items → 50 net new lesson + sample-quiz drafts**
  (250 sample questions once Agent 3 completes the quiz pass)
- Pre-existing content left untouched: 10 quiz items + 10 lesson_content pages +
  1 media-vocab item (21 rows in the current `quizzes.json`)
- Proposed ID range for net-new plain quiz items, once approved and integrated:
  **b2-011 through b2-060** (exact assignment is Agent 6/Technical Integrator's
  job, not decided here — this map only confirms b2-011 is the next free slot
  and there are 50 items to place)

## 6. ISSUES CARRIED FORWARD

Every ⚠ flag above is duplicated, with more detail, in `B2_CURRICULUM_ISSUES.md`
(append to the seed, items H–K plus explicit notes on how seed issues A, B, C,
D, E, F, and seed ambiguity items 5 and 7 interact with content that's already
live). None of these are resolved here. Per MASTER_B2_HANDOFF.md, this agent
stops here and hands off to the Lesson Author — Agent 2 drafts content, still
carrying every open flag forward rather than resolving it, per Rule 12–14.

END OF B2 CURRICULUM MAP
