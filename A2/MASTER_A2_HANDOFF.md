# MYLINGO A2 — MASTER AGENT HANDOFF

## STATUS
Level: A2 — Pre-Intermediate
Workflow: SAFE / CONTROLLED (Workflow B — same as A1)
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
- re-level A2 into A1 or B1
- invent a different syllabus
- resolve open decisions without human approval

## 2. AREA OBJECTIVES
See CURRICULUM_SOURCE.md → AREA OBJECTIVES.

## 3. GRAMMAR CURRICULUM
See CURRICULUM_SOURCE.md → GRAMMAR SYLLABUS.
A2 items (Past Continuous, Present Perfect, First Conditional, Passive,
Reflexive pronouns, Used to, Relative clauses, So/such, Must/might for
deductions, Be able to / good at, Although/however, As soon as, When/while)
are IN SCOPE. Do NOT down-level them and do NOT treat them as B1.

## 4. VOCABULARY / TOPICAL CURRICULUM
See CURRICULUM_SOURCE.md → VOCABULARY / TOPICAL SYLLABUS.

## 5. FUNCTIONAL LANGUAGE
See CURRICULUM_SOURCE.md → FUNCTIONAL SYLLABUS.

## 6. LESSON DESIGN RULE
Same as A1: short revision-style lessons, target ~3–7 minutes.
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
- A2_CURRICULUM_MAP.md
- A2_CURRICULUM_ISSUES.md (append to CURRICULUM_ISSUES_SEED.md, do not overwrite)

## 8. LESSON AUTHOR
Agent: LESSON AUTHOR
Produce: A2_LESSON_DRAFTS.md

## 9. QUIZ AUTHOR
Agent: QUIZ AUTHOR
Every lesson → ONE 5-question sample quiz.
Produce: A2_SAMPLE_QUIZZES.md

## 10. CONTENT AUDITOR
Agent: CONTENT AUDITOR
Produce: A2_CONTENT_AUDIT.md

## 11. HUMAN APPROVAL GATE
STOP after audit.
Human decides: APPROVED or CHANGES REQUIRED.
Agents must NOT continue past this gate automatically.

## 12. TECHNICAL INTEGRATOR
Only after APPROVED.
Follow existing conventions. Do not redesign unrelated UI.
Produce: A2_INTEGRATION_NOTES.md

## 13. QA
Run tests, verify lessons and quizzes, verify app behavior.
Produce: A2_QA_REPORT.md

## 14. FINAL A2 HANDOFF
Produce: A2_FINAL_HANDOFF.md
- what was added
- number of lessons
- number of sample quizzes
- total sample questions
- coverage vs syllabus
- outstanding issues
- tests performed
- files changed
- next level: B1 — NOT started automatically

## 15. AGENT RULES
Same 11 rules as A1 (see /A1/MASTER_A1_HANDOFF.md sections 15).
Extra rule for A2:
RULE 12
A2 is a distinct level. Do not re-use A1 lesson content as A2 content
without rewriting it for A2 scope. Do not down-level A2 items. Do not
up-level into B1. If overlap with A1/A1+ causes confusion, flag it —
do not silently resolve it.

## 16. FIRST AGENT COMMAND
The first agent working on A2 does NOT start writing lessons.
First task:
1. Read CURRICULUM_SOURCE.md and CURRICULUM_ISSUES_SEED.md.
2. Inspect the current Mylingo lesson/course/quiz architecture.
3. Produce A2_CURRICULUM_MAP.md.
4. Append to A2_CURRICULUM_ISSUES.md.
5. Stop and hand off to the Lesson Author.

END OF A2 MASTER HANDOFF
