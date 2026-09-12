# Agent 61 — Offline pack dependency integrity

## Status
COMPLETED

## Changed
- `offline_packs.py`: every pack now has an explicit dependency list; level packs depend on `core`, while core has no dependencies.
- ZIP `PACK_MANIFEST.json` now records dependencies and verification rejects index/ZIP dependency drift, missing dependencies, self-dependencies, and dependency cycles.
- `site/shared/js/offline-packs.js`: installs dependencies before the requested pack, detects runtime dependency cycles, requires installed dependencies for `isInstalled`, and prevents removing a pack that an installed pack depends on.
- Regenerated `site/offline/packs.json` and offline ZIP artifacts.

## Verification
- `verify_offline_packs(site)` returned no errors/warnings.
- Focused offline-pack tests: 14/14 passed.
- Node syntax and Python compile checks passed.

## Limitation
No real-browser verification; Vitest/browser execution is unavailable offline.
