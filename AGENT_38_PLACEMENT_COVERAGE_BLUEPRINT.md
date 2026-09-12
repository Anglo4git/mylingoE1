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

# Agent 38 — PLACEMENT_COVERAGE_BLUEPRINT

## Objective
Make placement coverage honest and more representative across English skills while preserving bounded test length.

## Read only these first
- placement bank definitions
- `09_PLACEMENT_BLUEPRINT_V2.md`
- skill taxonomy only where needed

## Implement
- Define a small, explicit blueprint covering grammar, vocabulary, reading, listening, and usage/writing evidence as feasible within current runtime capabilities.
- Ensure each claimed CEFR result states its evidence basis.
- Prefer balanced quotas over merely adding more grammar items.

## Focused verification
Run a coverage report by level and skill; verify every level meets blueprint minimums.

## Acceptance criteria
Placement no longer claims broad CEFR evidence while containing only grammar/usage items; coverage is machine-reportable.

## Explicitly do NOT do
Do not create hundreds of new questions or rewrite the placement engine.
