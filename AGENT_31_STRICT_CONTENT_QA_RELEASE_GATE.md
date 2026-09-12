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

# Agent 31 — STRICT_CONTENT_QA_RELEASE_GATE

## Objective
Unify production release gating with strict Content QA so content cannot pass release while strict QA rejects it.

## Read only these first
- `06_CONTENT_QA_SCALE.md`
- Content QA implementation/config
- `build.py` release-gate path
- `ci/release_gate.sh`
- `.github/workflows/release.yml` only as needed

## Implement
- Make the production release gate consume the strict production QA policy.
- Preserve diagnostic mode for development.
- Surface actionable failure counts.
- Do not weaken the existing strict thresholds merely to make the starter dataset pass.

## Focused verification
Run strict QA against current starter content and the release gate; a known failing fixture must block.

## Acceptance criteria
Release fails when strict QA fails; release passes only when strict QA passes; current starter dataset is reported honestly as not production-ready.

## Explicitly do NOT do
Do not bulk-edit the dataset or lower QA standards.
