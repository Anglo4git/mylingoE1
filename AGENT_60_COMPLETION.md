# Agent 60 — Offline cache eviction/versioning

## Status
COMPLETED

## Changed
- `site/shared/js/offline-packs.js`: stale offline-pack cache versions are removed without touching the active `v1` cache prefix.
- Added lightweight last-used metadata and a hard cap of 4 installed pack caches; least-recently-used packs are evicted before a new pack is installed.
- Pack removal also clears its lifecycle metadata.

## Verification
- Node syntax check passed.
- Focused offline-pack Python/JS source tests passed.
- Existing incremental/core/UI offline-pack tests passed.

## Limitation
No real-browser verification; Vitest/browser execution is unavailable in this offline environment.
