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

# Agent 28 — SERVICE_WORKER_SYNTAX_FIX

## Objective
Fix the confirmed syntax error in `site/sw.js` without changing cache behavior.

## Read only these first
- `site/sw.js`
- `BUILD.md` only if needed for the existing check command

## Implement
- Fix the unmatched `map()` / `Promise.all()` closure around the install precache loop.
- Preserve current cache names and URLs.
- Add one minimal regression test only if no existing syntax test can cover this.

## Focused verification
`node --check site/sw.js` and the smallest relevant existing offline test.

## Acceptance criteria
`node --check site/sw.js` passes; no unrelated behavior changes; offline test still passes.

## Explicitly do NOT do
Do not redesign offline caching, pack installation, or service-worker fetch strategy.
