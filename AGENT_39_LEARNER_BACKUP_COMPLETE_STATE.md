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

# Agent 39 — LEARNER_BACKUP_COMPLETE_STATE

## Objective
Expand backup/restore so learner-owned mastery, review, placement, orientation, progress, session, and gamification state survive migration.

## Read only these first
- `site/shared/js/gamification.js` backup/restore
- `skill-mastery` state module
- `review-scheduler` state module
- placement state module

## Implement
- Define a versioned backup envelope.
- Include all learner-owned localStorage/state stores currently considered durable.
- Validate each section independently and migrate old backups safely.
- Reject malformed sections without destroying valid unrelated state.

## Focused verification
Run round-trip backup/restore tests with populated mastery, review, placement, progress, session, and gamification fixtures.

## Acceptance criteria
Full learner state round-trips without loss; old supported backups still restore; malformed data is safely rejected.

## Explicitly do NOT do
Do not sync to a server or introduce authentication.
