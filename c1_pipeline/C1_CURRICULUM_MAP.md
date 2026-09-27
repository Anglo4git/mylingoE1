# C1 CURRICULUM MAP
# Agent 1 — Curriculum Mapper. Output of the "FIRST AGENT COMMAND" step in
# MASTER_C1_HANDOFF.md, run against the confirmed (human-provided)
# CURRICULUM_SOURCE.md. Does not author lesson content — see
# C1_LESSON_DRAFTS.md (Agent 2) for that.

## 0. ARCHITECTURE INSPECTION

`c1/quizzes.json` ships 22 entries: 10 quiz items, 10 matching
`lesson_content/c1/` pages (unit-numbered: unit-01 Grammar 5 lessons,
unit-02 Vocabulary 2, unit-03 Writing 1, unit-04 Academic English 2 + 1
Mixed "Academic Writing Integration"), and 1 media item — same architecture
shape B2 has. `functional/c1/` does not exist yet. Next free plain quiz ID:
**c1-011**.

## 1. PRE-EXISTING CONTENT vs THIS SYLLABUS

| Existing id | Title | Category | Matches a syllabus item? |
|---|---|---|---|
| c1-001 | Advanced Conditionals | Grammar | Likely = "Mixed conditionals" — ⚠ see Issue 12, unresolved |
| c1-002 | Subjunctive | Grammar | **Not on this syllabus** — extra topic |
| c1-003 | Cleft Sentences | Grammar | **Not on this syllabus** — extra topic |
| c1-006 | Ellipsis | Grammar | Partial match: "Ellipsis and elision" — elision half unclear |
| c1-008 | Inversion after Only | Grammar | Partial match: "Inversions and negative adverbials" — narrower than the syllabus item |
| c1-007 | Lexical Precision | Vocabulary | **Not on this syllabus** (syllabus is topic-based) — extra topic |
| c1-010 | Collocation | Vocabulary | **Not on this syllabus** — extra topic, also live at B2 (⚠ Issue 17) |
| c1-005 | Nominalisation | Academic English | Outside the 3-part syllabus (established cross-level category, not a defect) |
| c1-009 | Academic Stance | Academic English | Outside the 3-part syllabus |
| c1-004 | Discourse Markers | Writing | Outside the 3-part syllabus |
| (unit-04-lesson-03) | Academic Writing Integration | Mixed | Outside the 3-part syllabus |
| c1-media-01 | Picture & Sound Vocabulary | Vocabulary | Media vocab, not topic-specific |

None of the 3 partial/likely matches (Advanced Conditionals, Ellipsis,
Inversion after Only) are treated as fully resolving their syllabus item —
each carries an open question into the lesson-slot plan below rather than
being silently marked "done."

## 2. LESSON SLOT PLAN — GRAMMAR (16 syllabus items)

1. Uses of continuous tenses
2. Uses of would
3. Articles
4. Past Perfect
5. Order of adverbs
6. Order of adjectives
7. Participles — ⚠ note: check this doesn't overlap with B2's "Participle
   adjectives" (`b2-028`) or the pre-existing C1 "Cleft Sentences"/general
   participle-clause territory; scope unclear from a one-word syllabus
   entry, flag for Agent 2 to interpret narrowly (general participle forms
   as adjectives/reduced clauses) and flag the interpretation, not assume.
8. Modal verbs — general C1-level modal review (not yet scoped against
   B2's "Modals: present" `b2-025`; flag for Agent 2 to avoid repeating
   B2's ability/permission/obligation focus without a clear C1 deepening
   angle, e.g. modal nuance in formal/hedged register).
9. Ellipsis and elision — ⚠ Issue 9: partially covered by live `c1-006`
   "Ellipsis"; author only if elision is confirmed not already included,
   or hold pending human check of the live lesson's content.
10. Question tags — ⚠ Issue 13 (cross-level, B1+B2+C1). HOLD — do not
    author until resolved.
11. Future Continuous
12. Relative clauses — ⚠ Issue 16 (cross-level, B1+B2+C1). HOLD.
13. Mixed conditionals — ⚠ Issue 12 (three-way overlap with live b2-001
    and live c1-001). HOLD — highest-priority item to resolve before any
    conditionals content is authored at this level.
14. Passive — ⚠ Issue 14 (cross-level, B2+C1). HOLD.
15. Inversions and negative adverbials — ⚠ Issue 10: live `c1-008` only
    covers "Only"; if confirmed as intentionally narrow, author the
    broader set (Not only, No sooner, Rarely, Little, Never) as a
    companion lesson rather than a duplicate.
16. Reported speech — ⚠ Issue 15 (cross-level, B1+B2+C1). HOLD.

**5 of 16 grammar items are on HOLD pending human resolution of cross-level
overlap** (Question tags, Relative clauses, Mixed conditionals, Passive,
Reported speech). The remaining 11 can proceed to lesson drafting, 3 of
those 11 (Ellipsis and elision, Inversions and negative adverbials,
Participles) still carrying a narrower flag about exact scope vs.
pre-existing content.

## 3. LESSON SLOT PLAN — VOCABULARY AND TOPICAL (17 syllabus items)

All 17 are net new (the two pre-existing vocabulary items, Lexical
Precision and Collocation, don't match any of these topic-based items):

1. Astrology and religions — note: religious content: keep neutral/
   comparative, factual register, same care B1/B2 gave to sensitive topics
2. Nostalgia
3. Coincidences and experiences
4. Learning and educational systems
5. Eccentricity and individuality
6. Creativity
7. Age and cultural differences — note: culturally comparative content,
   same neutral-register care as above
8. Gender — note: sensitive/current topic, flag for human tone review
   before shipping, same treatment B1/B2 gave Political Systems/Crime
9. Current affairs — note: avoid dating the content to specific events;
   keep structurally focused (how to discuss current affairs) rather than
   naming real ongoing events, per this pipeline's general practice of
   avoiding real-world specifics that go stale or become contentious
10. Diet and health
11. Types of communication
12. Moral and personal dilemmas — note: sensitive/opinion-eliciting topic,
    flag for human tone review
13. Road and home safety and risk
14. Environmental issues — note: potentially politically-charged; keep
    factual/descriptive, flag for human tone review same as B2's Political
    Systems item
15. Children's development
16. Advertising
17. Architecture

## 4. LESSON SLOT PLAN — FUNCTIONAL (14 syllabus items, 1 flagged as a
## possible duplicate)

`functional/c1/` doesn't exist yet — same situation B1 and B2 both had.

1. Contradicting
2. Instructing
3. Describing — ⚠ Issue 7: possible duplicate of item 14 below. Author
   both for now (per the "don't delete, flag" rule), but note the overlap
   risk explicitly in the lesson draft so Agent 4 can catch if they end up
   near-identical.
4. Advising
5. Expressing opinions formally and informally
6. Checking and clarifying information
7. Paraphrasing
8. Expanding and exemplifying
9. Persuading and convincing
10. Speculating
11. Expressing annoyance
12. Expressing regrets
13. Comparing and contrasting
14. Describing people and things and situations — ⚠ see item 3 above

## 5. TOTALS

- Grammar: 16 syllabus items → **11 draftable now, 5 on HOLD** pending
  cross-level overlap decisions (Question tags, Relative clauses, Mixed
  conditionals, Passive, Reported speech)
- Vocabulary and Topical: 17 syllabus items → 17 draftable (0 on hold; 4
  carry a tone/register note for later human review, not a hold)
- Functional: 14 syllabus items → 14 draftable (1 — "Describing" — carries
  a possible-duplicate flag, not a hold; both versions get drafted)
- **Draftable now: 42 of 47 syllabus items. 5 held.**
- AREA OBJECTIVES section of CURRICULUM_SOURCE.md remains an unconfirmed
  placeholder — does not block lesson drafting, but should be resolved
  before this level's Final Handoff.
- Proposed ID range once approved: **c1-011 onward** for the 42 draftable
  items (exact count depends on how many of the 5 held items get
  unblocked before integration; final assignment is Agent 6's job).

## 6. RECOMMENDATION TO THE HUMAN

The 5 held grammar items are the single biggest open question in this
run — C1's syllabus independently listing Mixed conditionals, Question
tags, Passive, Reported speech, and Relative clauses, on top of those same
topics already existing at B1 and/or B2, is either a deliberate spiral
curriculum (revisit and deepen at each level) or a sign the C1 source
document and the B1/B2 pipelines were assembled independently without
cross-checking. Recommend resolving this as one batch decision (e.g. "yes,
spiral — C1 goes to native-like nuance on all five") rather than five
separate ones, since the answer is likely the same for all five.

## 7. ISSUES CARRIED FORWARD

Every ⚠ flag above is duplicated, with more detail, in
`C1_CURRICULUM_ISSUES.md` (the seed file, appended with items 1–17 this
run). Per MASTER_C1_HANDOFF.md, this agent stops here and hands off to the
Lesson Author for the 42 draftable items — the 5 held items should not be
drafted until the human resolves the cross-level overlap question above.

END OF C1 CURRICULUM MAP
