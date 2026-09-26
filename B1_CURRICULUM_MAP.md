# B1_CURRICULUM_MAP.md
# Produced by: B1 Agent 1 (Curriculum Mapper)
# Per MASTER_B1_HANDOFF.md §7, §16. Read CURRICULUM_SOURCE.md +
# CURRICULUM_ISSUES_SEED.md before mapping.

## 0. EXISTING B1 STATE (pre-existing in course-b1, before this pass)
- `course-b1-unit-01` (Grammar): 8 lessons
- `course-b1-unit-02` (Vocabulary): 1 lesson
- `course-b1-unit-03` (Writing): 1 lesson
- 10 lessons total, version 1, status published.

## 1. GRAMMAR — SYLLABUS COVERAGE (19 source items)

| # | Syllabus item | Status | Existing lesson |
|---|---|---|---|
| 1 | Used to + infinitive | COVERED | `...unit-01-lesson-08` Used to |
| 2 | Past Simple and Present Perfect | COVERED | `...lesson-01` Present Perfect vs Past Simple |
| 3 | Neither / so do I | **NEW** | — |
| 4 | Modal verbs | **PARTIAL** | `...lesson-06` Modal Deduction (deduction only; syllabus "Modal verbs" is broader) |
| 5 | Reported speech | COVERED* | `...lesson-04` Reported Speech (*scope not yet confirmed — see design decision C) |
| 6 | First, second conditional | **PARTIAL** | `...lesson-02` Second Conditional only — First conditional is NEW (see design decision B) |
| 7 | Adverbs of manner and modifiers | **NEW** | — |
| 8 | Relative clauses | COVERED | `...lesson-03` Relative Clauses |
| 9 | Adjectives and their connotations | **NEW** | — |
| 10 | Present Perfect Continuous | **NEW** | — |
| 11 | Look + adjective, look like + noun | **NEW** | — |
| 12 | Be able to / can / manage to | **NEW** | — |
| 13 | Passives | COVERED | `...lesson-07` Passive Voice |
| 14 | Past Perfect Simple | **NEW** | — |
| 15 | Have and have got | **NEW** | — |
| 16 | Be allowed to and be supposed to | **NEW** | — |
| 17 | A few and a little | **NEW** | — |
| 18 | Although / in spite of / despite | **NEW** | — |
| 19 | Question tags | **NEW** | — |

Fully covered: 5. Partial (needs extension or a companion lesson): 2
(Modal verbs, First conditional). New lessons needed: 13 (counting the
First Conditional split as one new lesson, item 6).

Off-syllabus existing lesson: `...lesson-05` Gerunds and Infinitives —
not on the B1 grammar list. Flagged; not removed (per source-of-truth
rule). Mirrors the A2 "off-syllabus lesson" pattern (Countable/
Uncountable, Modal: should).

## 2. VOCABULARY — SYLLABUS COVERAGE (16 source items)

All 16 named topics (Education, Appearances, Clothes, Character, Make
and do, Housework, Holidays and travel brochures, Illness, Cooking,
Weather, Furniture and appliances, Types of books/films/TV programmes,
Crime and punishment, Political systems, Family relationships, Pets
and animals) are **NEW** — 0 currently covered.

Existing `...unit-02-lesson-01` Phrasal Verbs is off-syllabus (not one
of the 16 named topics). Flagged; kept per source-of-truth rule.

## 3. FUNCTIONAL — SYLLABUS COVERAGE (10 source items)

All 10 items (Describing location of people and things, Stating
preferences and opinions, Talking about obligation, Reporting requests
and orders, Advising, Making deductions, Guessing, Talking about
possibility/probability and certainty, Refusing, Describing faulty
goods) are **NEW** — 0 currently covered. No functional-language unit
exists yet for B1 (mirrors A2's pre-integration state, which needed a
new `course-a2-unit-03`).

Existing `...unit-03-lesson-01` Linkers is a writing-skill lesson, not
a functional-language item; likely addresses the "no explicit writing
task types" gap noted in CURRICULUM_ISSUES_SEED.md. Flagged, not
reclassified.

## 4. PROPOSED NEW-LESSON COUNT FOR LESSON AUTHOR

- Grammar: 13 new lessons + 1 extension decision (Modal verbs) pending
  human input (see issues below)
- Vocabulary: 16 new lessons (new content under `course-b1-unit-02`)
- Functional: 10 new lessons (new unit, `course-b1-unit-03` is
  currently "Writing" — Functional Language needs its own new unit,
  e.g. `course-b1-unit-04`, unless human prefers renumbering; flagged,
  not decided)

Total proposed new lessons: 39, pending the two design-decision
answers below.

## 5. ARCHITECTURE NOTES (from inspecting the current app)

- Schema matches `LESSON_PLAYER_CONTENT_SCHEMA.md`; B1 lessons already
  use the same `body_content` field as newer A2 lessons.
- `b1/quizzes.json` exists with entries for the 10 pre-existing
  lessons only; new lessons will need matching exercise-quiz +
  lesson-quiz manifest entries, continuing whatever ID scheme
  `b1/quizzes.json` currently uses.
- `offline/packs/b1.zip` exists and will go stale the moment B1
  content changes, same as A2's core.zip did — Technical Integrator
  will need to rebuild it.
- No B1-specific tests found separate from `tests/run.js`; assume the
  same suite covers B1 structurally the way it did A2.

## 6. HANDOFF

Per MASTER_B1_HANDOFF.md §16, stopping here. Issues appended to
B1_CURRICULUM_ISSUES.md. Next: Lesson Author, but only after the two
open design decisions below (and the pre-existing seed decisions A–G)
are ruled on — do not draft new lesson content that depends on an
unresolved decision.
