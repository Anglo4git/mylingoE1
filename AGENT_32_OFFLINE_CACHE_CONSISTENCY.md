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

# Agent 32 — OFFLINE_CACHE_CONSISTENCY

## Objective
Reconcile global service-worker caching with selective offline packs and prevent stale content from defeating removal/update semantics.

## Read only these first
- `site/sw.js`
- `site/shared/js/offline-packs.js`
- `offline/packs.json`
- related offline tests only

## Implement
- Core precache must contain shell/core assets only.
- Selected pack files belong in pack-specific caches.
- Removal must make pack content unavailable unless intentionally shared core.
- Mutable content JSON should use an explicit freshness policy (versioned URLs or network-first/SWR with offline fallback).
- Keep cache names/versioning explicit.

## Focused verification
Run focused offline unit tests; perform a static cache-key/URL review for install/remove/update paths.

## Acceptance criteria
Installing pack A does not require all packs; removing A removes A-only content; updated JSON can be refreshed under the chosen policy; current core shell still works.

## Explicitly do NOT do
Do not build a new offline UI or ZIP format here.
