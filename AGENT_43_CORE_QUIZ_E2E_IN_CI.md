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

# Agent 43 — CORE_QUIZ_E2E_IN_CI

## Objective
Put the existing core learner journey E2E suite into release CI so the real quiz flow is release-gated.

## Read only these first
- `.github/workflows/release.yml`
- `tests/e2e/quiz-flow.spec.js`
- existing Playwright config

## Implement
- Add the core quiz-flow E2E test to CI against the freshly built artifact.
- Keep accessibility as a separate step/job if already present.
- Make browser dependency installation explicit where CI needs it.

## Focused verification
Run the workflow locally only if browser tooling exists; otherwise validate workflow syntax and test command wiring.

## Acceptance criteria
CI actually invokes `quiz-flow.spec.js`; failures block release; no claim of local browser execution is made when unavailable.

## Explicitly do NOT do
Do not add dozens of new E2E tests.
