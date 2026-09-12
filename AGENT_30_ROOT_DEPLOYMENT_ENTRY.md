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

# Agent 30 — ROOT_DEPLOYMENT_ENTRY

## Objective
Ensure the published site root opens Mylingo instead of potentially 404ing.

## Read only these first
- `site/` tree
- deployment docs only if routing needs clarification

## Implement
- Add a minimal `site/index.html` entry point that redirects to `./main/index.html` and contains a visible fallback link.
- Keep existing level/main routes untouched.
- Verify relative paths from the root entry.

## Focused verification
Check file existence and inspect generated output/build if the build copies site files.

## Acceptance criteria
Root URL has an actual HTML entry point; fallback link works; no existing route is removed.

## Explicitly do NOT do
Do not redesign navigation or PWA start_url in this task.
