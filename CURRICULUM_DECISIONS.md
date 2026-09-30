# MYLINGO curriculum decisions (human-confirmed 2026-09-29)

Source: product owner (Erico), answering the four open questions from HANDOFF_AGENT_290 item 4.

| # | Question | Decision |
|---|----------|----------|
| 1 | English variety | MIXED British + American. Wherever the two differ (spelling, vocabulary, grammar, pronunciation), show a SIDE-BY-SIDE UK vs US comparison every time. |
| 2 | Exam vs general fluency | 30% exam-oriented / 70% general fluency (real-life speaking). |
| 3 | Cross-cutting skills (pronunciation, listening, etc.) | 50% STANDALONE lessons (large, long) / 50% MIXED into regular lessons (short ones). |
| 4 | Lesson length | MIXED: both short quick lessons and longer deep lessons. |

## Implementation notes (guidance for future agents, not yet built)
- UK/US: DONE (Agent 295) — `.uk-us` markup + styles in courses/lesson.html, documented in LESSON_PLAYER_CONTENT_SCHEMA.md; authors must use it every time. Original note: add a consistent "UK | US" comparison component/pattern in lesson JSON schema (see LESSON_PLAYER_CONTENT_SCHEMA.md) rather than ad-hoc text; show it every time a difference occurs, never omit.
- Exam/fluency split is a content-mix target across the curriculum (approx. 30/70), not a per-lesson rule.
- Skills split: standalone long skill lessons (e.g. pronunciation, listening) plus short embedded skill segments inside regular lessons.
- Length/type metadata: DONE (Agent 296) — optional `lesson_length` / `lesson_type` fields + player chips (see LESSON_PLAYER_CONTENT_SCHEMA.md); no lesson uses them yet. Original note: lesson metadata should allow short and long variants; player/progress/offline-pack/quiz-audit tooling must handle both without regression.
- The pasted C2 curriculum text is still NOT in the repo; it must be re-supplied by the human before any C2 integration.
- Any schema change requires: unit suite, CSP regeneration, dist rebuild (byte-identical gate), offline-pack rebuild, verify-all ALL GATES PASSED.
- Skills plan: see SKILLS_LESSON_PLAN.md (Agent 297).
