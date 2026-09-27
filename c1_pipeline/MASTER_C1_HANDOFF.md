# MYLINGO C1 — MASTER AGENT HANDOFF
# CURRICULUM_SOURCE.md is now the real transcribed syllabus (human-provided),
# not the earlier CEFR draft. Treat it as authoritative, same status as every
# other level's source, EXCEPT the AREA OBJECTIVES section, which is still a
# carried-over placeholder — see CURRICULUM_SOURCE.md's own header and
# CURRICULUM_ISSUES_SEED.md "MISSING FROM SOURCE".

## STATUS
Level: C1 — Advanced
Workflow: SAFE / CONTROLLED (Workflow B — same as A1, A2, B1, B2)
Pipeline: Curriculum → Map → Lesson Draft → Quiz Draft → Audit → Approval →
          Integration → QA → Final Handoff
Do NOT skip stages.
Do NOT let an agent silently change the curriculum.

## 1. SOURCE OF TRUTH
- CURRICULUM_SOURCE.md       ← the syllabus (Grammar/Vocabulary/Functional
  lists are confirmed real content; AREA OBJECTIVES section is still an
  unconfirmed placeholder — see its header)
- CURRICULUM_ISSUES_SEED.md  ← pre-flagged OCR issues + cross-level overlaps

Agents may:
- organize the curriculum
- divide it into short lessons
- write learner-friendly explanations
- create examples, exercises, and one 5-question sample quiz per lesson
- flag ambiguities or gaps

Agents must NOT silently:
- add or remove topics
- re-level C1 into B2 or C2
- invent a different syllabus
- resolve open decisions without human approval

## 2. AREA OBJECTIVES
See CURRICULUM_SOURCE.md → AREA OBJECTIVES.

## 3. GRAMMAR CURRICULUM
See CURRICULUM_SOURCE.md → GRAMMAR SYLLABUS (16 items).
Several items (Mixed conditionals, Question tags, Passive, Reported speech,
Relative clauses) overlap with B1 and/or B2 content already live — see
CURRICULUM_ISSUES_SEED.md items 12–16. Do not author these until the human
resolves whether C1 deepens or risks repeating. `c1-001`, `c1-006`,
`c1-008` already partially cover 3 of the 16 items — see items 8–10.

## 4. VOCABULARY / TOPICAL CURRICULUM
See CURRICULUM_SOURCE.md → VOCABULARY AND TOPICAL SYLLABUS (17 items).
All 17 are topic-based (not skill-based like "Lexical Precision" or
"Collocation" — those pre-existing live items sit outside this syllabus
entirely, see issue 11).

## 5. FUNCTIONAL LANGUAGE
See CURRICULUM_SOURCE.md → FUNCTIONAL SYLLABUS (14 items, one of them —
"Describing" — possibly a duplicate of item 14, see issue 7). No
functional/c1/ folder exists yet — same situation B1 and B2 both had at the
start of their runs.

## 6. LESSON DESIGN RULE
Short, focused lessons — target ~5–10 minutes at C1, same as B2. Longer is
acceptable where the grammar/register item demands it, but lessons must not
become textbook chapters.

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
- C1_CURRICULUM_MAP.md
- C1_CURRICULUM_ISSUES.md (append to CURRICULUM_ISSUES_SEED.md, do not overwrite)

## 8. LESSON AUTHOR
Agent: LESSON AUTHOR
Produce: C1_LESSON_DRAFTS.md

## 9. QUIZ AUTHOR
Agent: QUIZ AUTHOR
Every lesson → ONE 5-question sample quiz.
Produce: C1_SAMPLE_QUIZZES.md

## 10. CONTENT AUDITOR
Agent: CONTENT AUDITOR
Produce: C1_CONTENT_AUDIT.md

## 11. HUMAN APPROVAL GATE
STOP after audit.
Human decides: APPROVED or CHANGES REQUIRED.
Agents must NOT continue past this gate automatically.

## 12. TECHNICAL INTEGRATOR
Only after APPROVED.
Follow existing conventions. Do not redesign unrelated UI.
Produce: C1_INTEGRATION_NOTES.md

## 13. QA
Run tests, verify lessons and quizzes, verify app behavior.
Produce: C1_QA_REPORT.md

## 14. FINAL C1 HANDOFF
Produce: C1_FINAL_HANDOFF.md
- what was added
- number of lessons
- number of sample quizzes
- total sample questions
- coverage vs syllabus
- outstanding issues
- tests performed
- files changed
- next level: C2 — NOT started automatically

## 15. AGENT RULES
Same 11 rules as A1 (see /A1/MASTER_A1_HANDOFF.md section 15), plus B2's
extra rules 12–14 (do not reuse lower-level content unrewritten; do not
scope-creep high-risk grammar items; flag register/variety rather than
choose silently), plus:
RULE 15 (C1-specific)
CURRICULUM_SOURCE.md's Grammar/Vocabulary/Functional lists are the real,
human-provided syllabus — treat them as authoritative. Its AREA OBJECTIVES
section is still an unconfirmed placeholder carried over from an earlier
draft; do not treat that one section with the same confidence as the three
syllabus lists.
RULE 16
Register and idiomatic-range items are a scope-creep risk at C1, since the
level is partly defined by nuance. Do not invent additional sub-items
beyond what CURRICULUM_SOURCE.md lists.
RULE 17
This syllabus has unusually heavy cross-level overlap with B1 and B2
(Mixed conditionals, Question tags, Passive, Reported speech, Relative
clauses all appear at multiple levels — see CURRICULUM_ISSUES_SEED.md items
12–16). Do not silently assume "deepen" as the resolution for any of these
— flag each one and let the human decide, even though "deepen, don't
repeat" was the working assumption B2 used for its own B1 overlaps.

## 16. FIRST AGENT COMMAND
The first agent working on C1 does NOT start writing lessons.
First task:
1. Read CURRICULUM_SOURCE.md and CURRICULUM_ISSUES_SEED.md.
2. Inspect the current Mylingo lesson/course/quiz architecture for C1
   (already partially done in CURRICULUM_ISSUES_SEED.md — verify it's still
   accurate).
3. Produce C1_CURRICULUM_MAP.md.
4. Append to C1_CURRICULUM_ISSUES.md.
5. Stop and hand off to the Lesson Author.

END OF C1 MASTER HANDOFF
