# Milestone 24 — Offline Content Packs + Production Release Gate

## Goal
Make offline content a first-class build artifact and block production release when the deployable site, manifests, or offline packs are incomplete.

## Delivered
- Added `offline_packs.py` with deterministic `core` + six CEFR level pack inventories.
- Every pack has `offline/packs.json` metadata and a distributable `offline/packs/<id>.zip` artifact containing `PACK_MANIFEST.json`.
- Added `site/shared/js/offline-packs.js` with a small browser API to inspect/install/remove a selected level pack through Cache Storage.
- Upgraded the service worker cache version to v3 and made installation expand the generated pack index so all listed offline assets are precached best-effort.
- Added `build.py release-gate` to block releases on source validation failures, output integrity failures, missing offline pack assets, missing ZIPs, or missing mandatory deployment assets.
- `build` now regenerates offline pack metadata and ZIP artifacts after generating quiz files.

## Compatibility
- Existing quiz routes, level manifests, placement, skill mastery, review scheduling, and authoring behavior are unchanged.
- Service-worker strategy remains cache-first for static/data assets and network-first for HTML; only the installation inventory is expanded.
- Offline packs are additive artifacts. The browser runtime does not require the pack API to run normally.

## Release rule
A production build is releasable only when all of the following are clean:
1. `python3 build.py validate --input master_source.csv`
2. `python3 build.py build --input master_source.csv --out <site>`
3. `python3 build.py verify-output --out <site>`
4. `python3 build.py release-gate --input master_source.csv --site <site>`
5. JavaScript/unit tests required by the repository are green, or any unavailable suite is explicitly recorded rather than claimed as passing.
