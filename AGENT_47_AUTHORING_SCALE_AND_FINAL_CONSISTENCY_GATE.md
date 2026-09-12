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

# Agent 47 — AUTHORING_SCALE_AND_FINAL_CONSISTENCY_GATE

## Objective
Finish the hardening cycle by making authoring validation incremental and then performing one narrow cross-contract consistency gate.

## Read only these first
- `authoring/mylingo-admin.html` and related authoring JS
- incremental validation module
- build/content validation command
- release gate scripts
- Agent 28–46 changed files only as needed

## Implement
- Ensure large datasets are validated incrementally/chunked rather than blocking on a full-grid pass.
- Add debounced validation/cancel behavior where appropriate.
- Produce a final consistency report checking: canonical fields, schema-v2 dates, ranking semantics, strict QA, root entry, JS syntax, offline core manifest, placement merge/coverage, backup sections, resume keys, CI gate wiring.
- Fix only integration mismatches discovered by this report.

## Focused verification
Run targeted authoring performance check with a synthetic 5,000-row dataset; run final `build.py validate`, `verify-output`, strict QA, JS syntax sweep, and release gate.

## Acceptance criteria
Authoring remains responsive on large input; all listed contracts agree; release gate fails on every intentionally invalid fixture tested; final report documents any browser-only checks not executed.

## Explicitly do NOT do
Do not add new product features after integration; stop at consistency/hardening.
