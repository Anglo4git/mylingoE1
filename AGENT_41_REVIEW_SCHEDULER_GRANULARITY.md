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

# Agent 41 — REVIEW_SCHEDULER_GRANULARITY

## Objective
Prevent strong attempts from overwriting weaker subskill evidence by making review state granular to learning objective/subskill.

## Read only these first
- `review-scheduler.js`
- mastery model
- one or two quiz-to-skill mappings

## Implement
- Introduce a stable card key at `skill + subskill/objective` where available.
- Keep aggregate skill mastery separate from review scheduling state.
- Migrate existing `skill` cards conservatively.

## Focused verification
Run tests with two subskills under one skill, showing separate due dates/intervals.

## Acceptance criteria
One easy subskill cannot erase another weak subskill’s review need; old cards migrate without data loss.

## Explicitly do NOT do
Do not build UI; Agent 40 handles dashboard display.
