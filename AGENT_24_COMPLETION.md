# Agent 24 — Offline Content Packs + Production Release Gate

## Status
COMPLETED

## Delivered
- Added `offline_packs.py` with deterministic offline pack generation and verification.
- Added seven content packs: `core`, `a1`, `a2`, `b1`, `b2`, `c1`, `c2`.
- Generated `site/offline/packs.json` as the versioned inventory: `mylingo.offline-packs.v1`.
- Generated `site/offline/packs/<id>.zip` artifacts, each containing its listed assets plus `PACK_MANIFEST.json`.
- Added `site/shared/js/offline-packs.js` with browser-side `getIndex()`, `findPack()`, `isInstalled()`, `installPack()`, and `removePack()` APIs using Cache Storage.
- Updated `site/sw.js` from cache version v2 to v3 and expanded installation to precache all assets declared by `offline/packs.json` on a best-effort basis.
- Updated `build.py` so normal builds emit offline pack metadata/ZIPs and copy `sw.js` + root `manifest.json` into fresh output directories.
- Added `python3 build.py release-gate --input ... --site ...` as a blocking production gate for source validation, generated-site integrity, offline pack completeness, and mandatory deployment assets.
- Added `24_OFFLINE_CONTENT_PACKS_RELEASE_GATE.md` contract and `tests/unit/offline-packs.test.js` coverage.

## Compatibility
- Existing quiz routes and level manifests unchanged.
- Placement, skill mastery, review scheduling, authoring, export, and scoring behavior unchanged.
- Service worker still uses network-first navigation and cache-first data/static requests.
- Offline pack support is additive; normal runtime does not depend on the browser pack API.

## Verification
- `python3 -m py_compile build.py offline_packs.py` — passed.
- `node --check site/shared/js/offline-packs.js` — passed.
- `node --check site/shared/js/review-scheduler.js` — passed.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v` — **16/16 passed**.
- Direct Node browser-API smoke test — passed; asset URLs resolved correctly from an `/a1/` page.
- `python3 build.py validate --input master_source.csv` — **60 rows, 60 quizzes, 0 errors, 0 warnings**.
- `python3 build.py build --input master_source.csv --out <release-site> --src-root site` — **74 files written**, including 7 offline packs.
- `python3 build.py verify-output --out <release-site>` — **0 errors, 0 warnings**.
- `python3 build.py release-gate --input master_source.csv --site <release-site>` — **PASS; 0 errors, 0 warnings**.
- Vitest full command was not used as final evidence because the dependency runner timed out in this environment; no claim of full Vitest-suite success is made.
- Playwright E2E was not run because browser dependencies are not available in the package.

## Next task
Agent 25 can build a learner-facing **Offline Content Pack UI** (download/remove level packs, progress state, storage estimate, installed/due state) using `MylingoOfflinePacks`, or alternatively add CI automation that invokes `release-gate` on every production build.

## Do not change
- Existing localStorage key names.
- Placement thresholds/state machine.
- Skill mastery and review scheduler schemas.
- Legacy quiz schema and manifest resolution contract.
