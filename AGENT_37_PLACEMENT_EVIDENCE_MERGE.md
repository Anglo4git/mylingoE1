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

# Agent 37 — PLACEMENT_EVIDENCE_MERGE

## Objective
Correct placement verification so final profiles combine primary assessment and boundary-verification evidence.

## Read only these first
- `site/shared/quiz.html`
- placement assessment state/result code
- adaptive placement engine files only as referenced

## Implement
- Persist primary evidence before verification.
- When verification completes, merge question/correct/skill evidence explicitly.
- Preserve counts and source quiz IDs.
- Avoid double-counting identical question IDs.

## Focused verification
Run focused placement tests or a direct deterministic probe covering primary + verification.

## Acceptance criteria
Final placement profile contains evidence from both stages; per-skill and total evidence counts are correct.

## Explicitly do NOT do
Do not redesign placement blueprint or skill thresholds; Agent 38 owns coverage.
