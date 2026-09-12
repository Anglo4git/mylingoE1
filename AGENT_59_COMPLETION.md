# Agent 59 — Offline install concurrency

## Status
COMPLETED

## Problem
`installPack()` used `Promise.all(files.map(...))`, starting one Cache Storage
write for every asset in a selected offline pack at once. Large packs could
therefore create an avoidable request/promise/memory spike.

## Changed
- `site/shared/js/offline-packs.js`
  - Added a fixed `INSTALL_CONCURRENCY = 4` budget.
  - Replaced the per-file `Promise.all(files.map(...))` fan-out with a small
    worker queue. At most four `cache.add()` operations are active at once.
  - Preserves progress callbacks, returned file ordering, and partial-cache
    cleanup on failure.
  - Exposes the concurrency budget as `MylingoOfflinePacks.INSTALL_CONCURRENCY`
    for diagnostics/tests without changing the pack schema.
- `tests/unit/offline-packs.test.js`
  - Added focused source assertions for the bounded worker model and removal
    of the old unbounded install fan-out.

## Verification
- `node --check site/shared/js/offline-packs.js` — passed.
- Focused static assertions replicated against the actual source — passed.
- A custom Node smoke test with a fake Cache Storage implementation confirmed
  a 4-operation ceiling, ordered returned files, progress completion, and
  cleanup after a simulated failure.

## Limitation
Vitest was not runnable because dependencies cannot be installed offline;
no browser verification is claimed.

## Next task
Agent 60: continue with offline cache eviction/versioning while preserving the
frozen `mylingo.offline-packs.v1` API and bounded install behavior.
