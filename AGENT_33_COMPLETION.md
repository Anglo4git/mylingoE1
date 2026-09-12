# Agent 33 — Offline Core Package Integrity

## Status
COMPLETED

## Delivered
- Added a generated `offline/core-manifest.json` as the canonical browser-core file manifest.
- Expanded the core package to include the actual required shell: `sw.js`, `offline-packs-ui.js`, level shells/manifests, and offline pack metadata; removed admin-only runtime files from the core ZIP contract.
- Changed `site/sw.js` to load the same generated core manifest instead of maintaining a second hardcoded precache list.
- Made missing canonical core runtime assets fail generation instead of being silently omitted.
- Extended offline verification to reject extra/missing core ZIP payload files.

## Validation
- Python unit suite: PASS.
- Production release gate: PASS (0 errors / 0 warnings).
- Core ZIP vs canonical manifest: exact match, 53 payload files, no extras/missing.
- `node --check site/sw.js`: PASS.
- Real browser/Playwright execution was not available in this sandbox.

## Next agent
Preserve `offline/core-manifest.json` as the sole core-shell contract; do not reintroduce a second hardcoded service-worker core list.
