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

# Agent 29 — JS_SYNTAX_RELEASE_GATE

## Objective
Make runtime JavaScript syntax correctness part of release validation so Agent 28’s failure class cannot recur.

## Read only these first
- `ci/release_gate.sh`
- existing build/release script that already performs validation
- `site/sw.js` only as reference

## Implement
- Add a deterministic syntax sweep over the project’s runtime `.js` files that are shipped to production.
- Use Node `--check` or equivalent.
- Fail nonzero on syntax failure.
- Exclude vendored/minified dependencies if the project intentionally ships them unchanged; document the rule.

## Focused verification
Run the new syntax gate plus existing `build.py validate` if available.

## Acceptance criteria
The release gate catches a deliberately introduced syntax error in a temporary fixture or the targeted file; current project passes.

## Explicitly do NOT do
Do not add browser execution, linting, formatting, or unrelated CI jobs.
