# B2 FOLDER — WHAT TO GIVE EACH AGENT

Reuse the eight agent files from /A1/ exactly as they are.
Only the source-of-truth and handoff files change.

Agent 1 — Curriculum Mapper
  /A1/01_AGENT_CURRICULUM_MAPPER.md
  /B2/CURRICULUM_SOURCE.md
  /B2/CURRICULUM_ISSUES_SEED.md
  /B2/MASTER_B2_HANDOFF.md

Agent 2 — Lesson Author
  /A1/02_AGENT_LESSON_AUTHOR.md
  /B2/B2_CURRICULUM_MAP.md         (output of Agent 1)
  /B2/B2_CURRICULUM_ISSUES.md      (output of Agent 1)
  /B2/CURRICULUM_SOURCE.md

Agent 3 — Quiz Author
  /A1/03_AGENT_QUIZ_AUTHOR.md
  /B2/B2_CURRICULUM_MAP.md
  /B2/B2_LESSON_DRAFTS.md

Agent 4 — Content Auditor
  /A1/04_AGENT_CONTENT_AUDITOR.md
  all B2 outputs above

HUMAN APPROVAL GATE
  /A1/05_HUMAN_APPROVAL_GATE.md
  all B2 outputs above

Agent 6 — Technical Integrator
  /A1/06_AGENT_TECHNICAL_INTEGRATOR.md
  /B2/B2_APPROVAL.md

Agent 7 — QA
  /A1/07_AGENT_QA.md
  /B2/B2_INTEGRATION_NOTES.md

Agent 8 — Final Handoff
  /A1/08_AGENT_FINAL_HANDOFF.md
  /B2/B2_QA_REPORT.md

Rule: one agent at a time. Carry outputs forward as files, not as chat history.

Level sequence:
A1 (+ A1+) → A2 → B1 → B2 → C1 → C2
Each level is a separate pipeline run. Never start a new level until the
previous level's FINAL_HANDOFF is accepted.
