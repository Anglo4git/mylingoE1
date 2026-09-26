# MYLINGO B2 — MASTER AGENT HANDOFF

## STATUS
Level: B2 — Upper-Intermediate
Workflow: SAFE / CONTROLLED (Workflow B — same as A1, A2, B1)
Pipeline: Curriculum → Map → Lesson Draft → Quiz Draft → Audit → Approval →
          Integration → QA → Final Handoff
Do NOT skip stages.
Do NOT let an agent silently change the curriculum.

## 1. SOURCE OF TRUTH
- CURRICULUM_SOURCE.md       ← the syllabus
- CURRICULUM_ISSUES_SEED.md  ← pre-flagged OCR issues + open decisions

Agents may:
- organize the curriculum
- divide it into short lessons
- write learner-friendly explanations
- create examples, exercises, and one 5-question sample quiz per lesson
- flag ambiguities or gaps

Agents must NOT silently:
- add or remove topics
- re-level B2 into B1 or C1
- invent a different syllabus
- resolve open decisions without human approval

## 2. AREA OBJECTIVES
See CURRICULUM_SOURCE.md → AREA OBJECTIVES.

## 3. GRAMMAR CURRICULUM
See CURRICULUM_SOURCE.md → GRAMMAR SYLLABUS.
B2 items (Future Perfect, Third conditional, Wish / if only, Perfect modals,
Passive, Reported speech, Relative clauses, Participle adjectives) are
IN SCOPE.
Do NOT down-level into B1 and do NOT treat them as C1.

## 4. VOCABULARY / TOPICAL CURRICULUM
See CURRICULUM_SOURCE.md → VOCABULARY / TOPICAL SYLLABUS.

## 5. FUNCTIONAL LANGUAGE
See CURRICULUM_SOURCE.md → FUNCTIONAL SYLLABUS.

## 6. LESSON DESIGN RULE
Short, focused lessons — target ~5–10 minutes at B2.
Longer than A1/A2 is acceptable where the grammar item demands it
(Third conditional, Perfect modals, Reported speech, Passives), but
lessons must NOT become textbook chapters.

Structure:
1. Lesson title
2. Simple learning objective
3. Short explanation
4. Small number of clear examples
5. Vocabulary / examples where appropriate
6. Very short practice / revision activity
7. Connection to the 5-question sample quiz

## 7. CURRICULUM MAPPING
Agent: CURRICULUM MAPPER
Produce:
- B2_CURRICULUM_MAP.md
- B2_CURRICULUM_ISSUES.md (append to CURRICULUM_ISSUES_SEED.md, do not overwrite)

## 8. LESSON AUTHOR
Agent: LESSON AUTHOR
Produce: B2_LESSON_DRAFTS.md

## 9. QUIZ AUTHOR
Agent: QUIZ AUTHOR
Every lesson → ONE 5-question sample quiz.
Produce: B2_SAMPLE_QUIZZES.md

## 10. CONTENT AUDITOR
Agent: CONTENT AUDITOR
Produce: B2_CONTENT_AUDIT.md

## 11. HUMAN APPROVAL GATE
STOP after audit.
Human decides: APPROVED or CHANGES REQUIRED.
Agents must NOT continue past this gate automatically.

## 12. TECHNICAL INTEGRATOR
Only after APPROVED.
Follow existing conventions. Do not redesign unrelated UI.
Produce: B2_INTEGRATION_NOTES.md

## 13. QA
Run tests, verify lessons and quizzes, verify app behavior.
Produce: B2_QA_REPORT.md

## 14. FINAL B2 HANDOFF
Produce: B2_FINAL_HANDOFF.md
- what was added
- number of lessons
- number of sample quizzes
- total sample questions
- coverage vs syllabus
- outstanding issues
- tests performed
- files changed
- next level: C1 — NOT started automatically

## 15. AGENT RULES
Same 11 rules as A1 (see /A1/MASTER_A1_HANDOFF.md sections 15).
Extra rules for B2:
RULE 12
B2 is a distinct level. Do not re-use B1 lesson content as B2 content
without rewriting it for B2 scope. Do not down-level B2 items. Do not
up-level into C1. If overlap with B1 causes confusion, flag it —
do not silently resolve it.
RULE 13
Phrasal verbs, Modals (present and perfect), Reported speech, and
Conditionals are the highest-risk items for scope creep at B2.
Do not expand them beyond what CURRICULUM_SOURCE.md lists. If you feel
more is needed, flag it — do not add it.
RULE 14
Register matters at B2. When producing idiomatic, colloquial, euphemistic,
or connotation-related content, do not silently choose British vs
American usage. Flag variety for human approval.

## 16. FIRST AGENT COMMAND
The first agent working on B2 does NOT start writing lessons.
First task:
1. Read CURRICULUM_SOURCE.md and CURRICULUM_ISSUES_SEED.md.
2. Inspect the current Mylingo lesson/course/quiz architecture.
3. Produce B2_CURRICULUM_MAP.md.
4. Append to B2_CURRICULUM_ISSUES.md.
5. Stop and hand off to the Lesson Author.

END OF B2 MASTER HANDOFF
