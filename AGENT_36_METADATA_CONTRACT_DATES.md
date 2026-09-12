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

# Agent 36 — METADATA_CONTRACT_DATES

## Objective
Finish the schema-v2 date metadata contract and remove hardcoded publication placeholders.

## Read only these first
- `build.py` metadata generation/validation
- manifest generation code
- `master_source.csv`
- any schema-v2 docs

## Implement
- Choose canonical fields: `date_added`, `date_updated`, plus a deterministic publication date field only if needed.
- Add/derive actual values from source/build metadata.
- Remove hardcoded placeholder date strings.
- Keep output deterministic for identical inputs.

## Focused verification
Run source validation and inspect one generated manifest before/after a source timestamp change or explicit metadata update.

## Acceptance criteria
No placeholder date remains; generated metadata matches the canonical contract; validation accepts correct rows.

## Explicitly do NOT do
Do not invent per-row historical dates without a defined source of truth.
