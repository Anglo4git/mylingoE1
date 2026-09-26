# A2 FOLDER — WHAT TO GIVE EACH AGENT

Reuse the eight agent files from /A1/ exactly as they are.
Only the source-of-truth and handoff files change.

Agent 1 — Curriculum Mapper
  /A1/01_AGENT_CURRICULUM_MAPPER.md
  /A2/CURRICULUM_SOURCE.md
  /A2/CURRICULUM_ISSUES_SEED.md
  /A2/MASTER_A2_HANDOFF.md

Agent 2 — Lesson Author
  /A1/02_AGENT_LESSON_AUTHOR.md
  /A2/A2_CURRICULUM_MAP.md         (output of Agent 1)
  /A2/A2_CURRICULUM_ISSUES.md      (output of Agent 1)
  /A2/CURRICULUM_SOURCE.md

Agent 3 — Quiz Author
  /A1/03_AGENT_QUIZ_AUTHOR.md
  /A2/A2_CURRICULUM_MAP.md
  /A2/A2_LESSON_DRAFTS.md

Agent 4 — Content Auditor
  /A1/04_AGENT_CONTENT_AUDITOR.md
  all A2 outputs above

HUMAN APPROVAL GATE
  /A1/05_HUMAN_APPROVAL_GATE.md
  all A2 outputs above

Agent 6 — Technical Integrator
  /A1/06_AGENT_TECHNICAL_INTEGRATOR.md
  /A2/A2_APPROVAL.md

Agent 7 — QA
  /A1/07_AGENT_QA.md
  /A2/A2_INTEGRATION_NOTES.md

Agent 8 — Final Handoff
  /A1/08_AGENT_FINAL_HANDOFF.md
  /A2/A2_QA_REPORT.md

Rule: one agent at a time. Carry outputs forward as files, not as chat history.
