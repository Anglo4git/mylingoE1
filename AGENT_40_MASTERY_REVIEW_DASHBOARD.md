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

# Agent 40 — MASTERY_REVIEW_DASHBOARD

## Objective
Surface the mastery and due-review state already being recorded so the learner has an actionable adaptive dashboard.

## Read only these first
- level dashboard HTML/JS
- mastery module
- review scheduler module

## Implement
- Add a compact learner-facing panel for `Today’s Review`, due skills, mastery summary, and next recommended action.
- Read existing state; do not duplicate storage.
- Provide empty states for new learners.
- Keep the visual system consistent with current dashboard.

## Focused verification
Use fixture data to verify due and mastery summaries render correctly; run existing JS tests.

## Acceptance criteria
Learner can see what to review and why; state is derived from existing stores; no duplicate scheduling logic appears in UI.

## Explicitly do NOT do
Do not redesign the entire dashboard or add a new design system.
