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

# Agent 45 — GAMIFICATION_REWARD_INTEGRITY

## Objective
Prevent repeat-quiz XP farming while preserving legitimate improvement rewards.

## Read only these first
- gamification scoring/reward code
- progress model
- focused gamification tests

## Implement
- Change the reward signature/policy from `quizId + score + questionTotal` to a quiz/version completion policy.
- Award full completion XP once per quiz version.
- Allow a bounded improvement bonus or daily cap for meaningful gains.
- Ensure placement/diagnostic runs do not award ordinary XP unless explicitly intended.

## Focused verification
Run tests for first completion, same-score replay, improved score, repeated improvement, and placement.

## Acceptance criteria
XP cannot be farmed by cycling scores; legitimate improvement has a bounded reward; placement is not a reward loophole.

## Explicitly do NOT do
Do not redesign badges, streak UI, or unrelated gamification visuals.
