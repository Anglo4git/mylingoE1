# A2_CURRICULUM_MAP.md
# Produced by: A2 Agent 1 (Curriculum Mapper)
# Inputs read: CURRICULUM_SOURCE.md, CURRICULUM_ISSUES_SEED.md, current
# repo state (course_content/, grammar/a2/, vocabulary/a2/, a2/quizzes.json,
# lesson_content/a2/, placement/a2/).
# This file maps the CURRICULUM_SOURCE.md syllabus against what already
# exists in the app for course-a2, and proposes where new lessons go.
# It does not resolve any item in CURRICULUM_ISSUES_SEED.md.

## 1. CURRENT AS-BUILT STATE (course-a2)

- courses.json: course-a2, status "published", 2 units.
- units.json:
  - course-a2-unit-01 "Grammar" — 9 lessons
  - course-a2-unit-02 "Vocabulary" — 2 lessons
- course_content/lessons/a2.json: 11 lesson records total, matching the
  above.
- a2/quizzes.json: 22 quiz records (11 lesson_quiz_id quizzes + 11
  exercise_quiz_ids quizzes, one pair per existing lesson).
- placement/a2/placement-001.json: 10-question A2 placement check,
  already present.
- No "Functional Language" unit exists for course-a2.

## 2. GRAMMAR SYLLABUS COVERAGE (20 items in CURRICULUM_SOURCE.md)

| # | Syllabus item | Status | Existing lesson (if any) |
|---|---|---|---|
| 1 | Present Simple | GAP | — |
| 2 | Present Continuous | COVERED | course-a2-unit-01-lesson-02 |
| 3 | Comparative and superlative | PARTIAL | lesson-01 "Comparative Adjectives" covers comparative only; superlative not covered |
| 4 | Past Simple | GAP | — |
| 5 | Past Continuous | COVERED | lesson-03 |
| 6 | Present Perfect | COVERED | lesson-09 |
| 7 | Going to and will (predictions / future events / spontaneous decisions) | PARTIAL | lesson-04 "Future: going to" covers "going to" only; "will" not covered |
| 8 | Adverbs of frequency and manner | PARTIAL | lesson-07 "Adverbs of Frequency" covers frequency only; manner not covered |
| 9 | Reflexive pronouns | GAP | — |
| 10 | So / such | GAP | — |
| 11 | Have to / need to for obligation | GAP | — |
| 12 | Present Simple Passive | GAP | — |
| 13 | When / while | GAP | — |
| 14 | Must / might for deductions | GAP | — |
| 15 | As soon as | GAP | — |
| 16 | Be able to / good at | GAP | — |
| 17 | Although / however | GAP | — |
| 18 | First Conditional | COVERED | lesson-05 |
| 19 | Used to + verb | GAP | — |
| 20 | Relative clauses | GAP | — |

Covered: 4/20. Partial: 3/20. Gap: 13/20.

### Items present in the build but NOT in CURRICULUM_SOURCE.md
- lesson-06 "Countable/Uncountable" — no matching syllabus entry.
- lesson-08 "Modal: should" — no matching syllabus entry ("should" is
  not named; the syllabus's modal-adjacent items are "must/might for
  deductions", "have to/need to", and "be able to/good at").
Not removed. Logged in A2_CURRICULUM_ISSUES.md §New Findings, per the
"do not silently add or remove topics" rule — these look like additions
from before this pipeline existed, not this pass's decision to make.

## 3. VOCABULARY SYLLABUS COVERAGE (18 topics in CURRICULUM_SOURCE.md)

Existing vocabulary unit (course-a2-unit-02) has two lessons —
"Everyday Vocabulary" and "Everyday Vocabulary Review" — neither of
which is titled after, or evidently scoped to, any of the 18 named
topics below. None can be confidently marked COVERED against a specific
topic without opening lesson_content/a2/lesson-course-a2-unit-02-*.json
and checking word lists against each topic, which is Lesson Author /
Content Auditor work, not mapping work.

| Topic | Status |
|---|---|
| Families | GAP (not evidenced) |
| Restaurants and leisure venues | GAP (not evidenced) |
| Personality | GAP (not evidenced) |
| Biographical information | GAP (not evidenced) |
| Buildings and monuments | GAP (not evidenced) |
| Weather | GAP (not evidenced) |
| Clothes and accessories | GAP (not evidenced) |
| Large numbers | GAP (not evidenced) |
| Travel and tourism | GAP (not evidenced) |
| Work and careers | GAP (not evidenced) |
| Hobbies, sports and interests | GAP (not evidenced) |
| Education | GAP (not evidenced) |
| Life changes and events | GAP (not evidenced) |
| Political systems and change | GAP (not evidenced) — see seed issue B |
| Animals | GAP (not evidenced) |
| Descriptions of people, health, fitness and illnesses | GAP (not evidenced) |
| Types of music and concerts | GAP (not evidenced) |
| Household equipment | GAP (not evidenced) |

## 4. FUNCTIONAL SYLLABUS COVERAGE (13 items)

No "Functional Language" unit exists for course-a2 (units.json has only
Grammar and Vocabulary under course-a2, unlike course-b1/b2/c1, which
already carry a "Functional Language" unit — see units.json). All 13
functional items are GAP:
Asking personal questions, Talking about personal experiences, Asking
directions, Describing personality, Making travel arrangements, Ordering
in a restaurant, Talking about preferences, Expressing preferences,
Making deductions, Making predictions, Offering and suggesting, Talking
about obligation, Requesting.

## 5. PROPOSED UNIT STRUCTURE (for Lesson Author — not final, subject to
## the approval gate)

- course-a2-unit-01 "Grammar" (existing, extend in place)
  - Keep lessons 01–09 as-is.
  - Add lessons for the 13 grammar GAP/PARTIAL items in §2, split so
    each lesson stays within the ~3–7 minute rule (e.g. superlative as
    its own lesson rather than folded into lesson-01; "will" as its own
    lesson rather than folded into lesson-04).
- course-a2-unit-02 "Vocabulary" (existing, extend in place)
  - Keep lessons 01–02 as-is pending Content Auditor confirmation of
    what they currently cover.
  - Add one lesson per topic in §3 (18 topics → 18 candidate lessons,
    subject to the approval gate on whether any are combined, e.g.
    "Restaurants and leisure venues" per seed issue #7).
- course-a2-unit-03 "Functional Language" (new unit)
  - One lesson per item in §4 (13 candidate lessons), mirroring how
    course-b1/b2/c1 already structure their Functional Language units.

This is a mapping proposal, not an authored lesson list. Lesson Author
produces the actual A2_LESSON_DRAFTS.md against this map and the
syllabus, and may consolidate or split items with reasoning, flagging
any consolidation at the approval gate rather than deciding silently.

## 6. NOT IN SCOPE FOR THIS AGENT
- Whether existing lessons 01–09 need editing to add their missing half
  (superlative, "will", manner adverbs) or whether new standalone
  lessons should be added instead — flagged as a new open question in
  A2_CURRICULUM_ISSUES.md, not decided here.
- Whether "Countable/Uncountable" and "Modal: should" stay, get folded
  into a syllabus item, or get flagged to the human as scope creep —
  flagged, not decided here.
- The A1/A1+ ↔ A2 overlap (seed issue A) — unaffected by this map.
