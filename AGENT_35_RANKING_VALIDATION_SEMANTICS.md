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

# Agent 35 — RANKING_VALIDATION_SEMANTICS

## Objective
Correct ranking validation so `correct_order` may differ from the original item order while containing the same unique items.

## Read only these first
- `build.py` ranking validation function
- existing ranking/runtime validator
- focused ranking tests

## Implement
- Validate equal length, uniqueness, and identical normalized sets.
- Allow any valid permutation as `correct_order`.
- Preserve existing error codes where possible.

## Focused verification
Run ranking unit tests including `[A,B,C]` with correct order `[C,A,B]`, duplicates, missing items, and extra items.

## Acceptance criteria
Valid permutations pass; missing/extra/duplicate items fail; runtime and build semantics agree.

## Explicitly do NOT do
Do not change rendering or scoring of other question types.
