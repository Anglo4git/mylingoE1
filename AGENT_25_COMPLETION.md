# Agent 25 — Offline Packs Learner UI

## Status
COMPLETED

## Delivered
- Added `site/shared/js/offline-packs-ui.js`, a reusable responsive learner-facing Offline Learning panel.
- Mounted it on the orientation landing page and all six CEFR dashboards.
- CEFR dashboards prioritize the current level pack while still exposing Core and other level packs.
- Added live per-pack installation progress and installed/not-installed state.
- Installation is disabled while offline; installed packs can still be removed offline.
- Hardened `site/shared/js/offline-packs.js`: `isInstalled()` validates every declared asset, and failed installs remove partial caches.
- Added the UI module to the service-worker precache.
- Added focused static/unit coverage in `tests/unit/test_offline_packs_ui.py`.
- Added `25_OFFLINE_PACKS_LEARNER_UI.md` as the milestone contract.

## Compatibility
- Existing quiz routes and schemas remain unchanged.
- Review scheduling, skill mastery, placement, gamification, progress, and authoring storage contracts remain untouched.
- Offline pack schema remains `mylingo.offline-packs.v1`.
- Production release-gate semantics remain unchanged.

## Validation
- `node --check site/shared/js/offline-packs.js` — PASS.
- `node --check site/shared/js/offline-packs-ui.js` — PASS.
- `python3 tests/unit/test_offline_packs_ui.py -v` — 6/6 PASS.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v` — 22/22 PASS.
- `python3 build.py validate --input master_source.csv` — 60 rows / 60 quizzes / 0 errors / 0 warnings.
- `python3 build.py build --input master_source.csv --out <site> --src-root site` — PASS; 74 files written, 7 offline packs generated.
- `python3 build.py verify-output --out <site>` — 0 errors / 0 warnings.
- `python3 build.py release-gate --input master_source.csv --site <site>` — PASS; 0 errors / 0 warnings.

## Environment limitations
- Full Vitest and Playwright suites were not claimed as passing unless their dependencies/browsers are available in the package environment.

## Handoff
Next useful milestone: CI/deployment integration for `build.py release-gate`, or a richer offline storage-management surface if the product roadmap prioritizes offline usage analytics.
