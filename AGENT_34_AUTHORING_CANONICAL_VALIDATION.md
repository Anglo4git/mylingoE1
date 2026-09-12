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

# Agent 34 — AUTHORING_CANONICAL_VALIDATION

## Objective
Fix live authoring validation so it uses the canonical v2 field names and agrees with build validation.

## Read only these first
- `site/shared/js/authoring-validation.js`
- one canonical sample row/source schema
- focused validation tests

## Implement
- Replace stale `question_num` usage with canonical `question_number`.
- Replace stale generic `category` usage with canonical `quiz_category` / `question_category`.
- Keep legacy aliases only inside import normalization boundaries if they already exist.
- Add tests for duplicate question numbers and inconsistent categories using canonical fields.

## Focused verification
Run focused authoring-validation tests and one direct probe using canonical fields.

## Acceptance criteria
Live validation catches the same canonical errors that build validation catches; no false positives are introduced for valid canonical rows.

## Explicitly do NOT do
Do not redesign the authoring interface.
