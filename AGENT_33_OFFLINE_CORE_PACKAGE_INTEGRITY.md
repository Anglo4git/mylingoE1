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

# Agent 33 — OFFLINE_CORE_PACKAGE_INTEGRITY

## Objective
Ensure the downloadable core offline package exactly matches the browser’s required core shell.

## Read only these first
- `offline_packs.py`
- generated core-manifest logic
- references to `offline-packs-ui.js`
- core ZIP tests

## Implement
- Add `offline-packs-ui.js` to the core package if still missing.
- Define one canonical list/manifest for required core files.
- Add a test that compares required core files with the produced core ZIP contents.

## Focused verification
Generate a core ZIP and compare contents against the manifest; run focused Python tests.

## Acceptance criteria
No required core runtime file is missing; no non-core content is silently included.

## Explicitly do NOT do
Do not change selective pack installation logic already handled by Agent 32.
