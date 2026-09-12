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

# Agent 42 — MULTI_SESSION_RESUME

## Objective
Make “in progress” truthful by supporting per-quiz resumable sessions or clearly limiting the UI to one active session.

## Read only these first
- `site/shared/js/` session/progress module(s)
- level dashboard quiz-card logic
- `quiz.html` resume logic

## Implement
- Prefer per-quiz session keys such as `mylingo.session.v1.<quizId>` with a small index if compatible.
- Ensure starting quiz B does not destroy resumable quiz A.
- Update dashboard wording/state accordingly.
- Keep completed quiz history unchanged.

## Focused verification
Run a focused scenario: start A, leave; start B, leave; resume A; resume B; complete one; reload.

## Acceptance criteria
Every quiz labeled resumable is actually resumable; no stale/false “in progress” cards remain.

## Explicitly do NOT do
Do not redesign scoring or gamification.
