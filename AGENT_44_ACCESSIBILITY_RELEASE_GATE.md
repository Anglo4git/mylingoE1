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

# Agent 44 — ACCESSIBILITY_RELEASE_GATE

## Objective
Turn accessibility from report-only into an evidence-based release gate, starting with critical/serious findings.

## Read only these first
- accessibility Playwright spec/config
- `.github/workflows/release.yml`
- release checklist docs

## Implement
- Ensure CI produces a real browser a11y result when the browser job runs.
- Make critical/serious findings blocking; keep moderate/minor policy explicit.
- Separate “not run” from “passed.”

## Focused verification
Run accessible subset if browser available; otherwise validate exit-code policy and fixture behavior.

## Acceptance criteria
A critical/serious axe finding causes release failure; a clean run passes; “not run” is not reported as “verified.”

## Explicitly do NOT do
Do not remediate every cosmetic issue in this task; focus on gate semantics.
