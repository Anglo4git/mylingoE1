# MYLINGO v42 — FREE-TIER AGENT HANDOFF

## Execution rules — mandatory for every agent
- Starting package: **Mylingo v41 / Agent 27 completed**.
- Work ONLY on the named deliverable in this handoff. Do not redesign unrelated systems.
- Read the minimum files needed. **Never scan the whole repository unless this handoff explicitly names it.**
- Target: usually **1–3 production files + focused tests/docs**.
- Preserve existing public routes, IDs, localStorage keys, and data unless this task explicitly changes that contract.
- Do not mass-regenerate content.
- Do not add new dependencies unless absolutely necessary.
- Prefer small patches over rewrites.
- Run only the exact focused checks requested below plus one lightweight syntax/build check when practical.
- Do not spend time on Playwright/browser installation if unavailable; document it instead.
- Stop when acceptance criteria pass. Do not continue “polishing.”
- Keep the final handoff under ~200 words.

## Required completion format
Return:
1. **DONE / BLOCKED**
2. Files changed
3. Tests/checks run + results
4. Any known limitation
5. One sentence for the next agent

# Agent 46 — CONTENT_ARCHITECTURE_V2_BRIDGE

## Objective
Bridge the current quiz-centric catalog toward `Course → Unit → Lesson → Activity → Question` while preserving current quiz IDs and runtime compatibility.

## Read only these first
- content schema docs (`07_CONTENT_SCHEMA_V2.md`)
- `master_source.csv` / schema source
- runtime adapter currently loading quiz records

## Implement
- Define canonical IDs and parent references for course/unit/lesson/activity.
- Make `question_type` first-class in the source contract.
- Preserve legacy flat quiz records through an adapter.
- Add a small fixture proving one activity can contain multiple question types without breaking existing runtime loading.

## Focused verification
Run schema validation plus adapter tests using the fixture.

## Acceptance criteria
New content can express hierarchy + rich question type explicitly; existing quiz records still load unchanged through the adapter.

## Explicitly do NOT do
Do not migrate all 60 starter rows or build authoring screens; Agent 47 handles scale.
