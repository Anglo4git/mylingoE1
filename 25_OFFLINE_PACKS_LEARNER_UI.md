# Milestone 25 — Offline Packs Learner UI

## Goal
Make the Agent 24 offline-content-pack infrastructure discoverable and usable from the learner-facing app without changing quiz routing, scoring, mastery, review scheduling, or service-worker strategy.

## Delivered
- Added `site/shared/js/offline-packs-ui.js` as a reusable, responsive Offline Learning panel.
- Mounted the panel on the orientation landing page and all six level dashboards.
- Level dashboards promote the current CEFR pack first while retaining access to Core and other level packs.
- Shows per-pack install state and live asset-caching progress.
- Supports install/remove through the Agent 24 `MylingoOfflinePacks` API.
- Install is disabled while offline; already-installed packs remain removable offline.
- API `isInstalled()` now verifies every declared asset rather than trusting cache existence alone.
- Failed installs delete the partial pack cache to prevent false-positive installation state.
- Service worker precaches the new UI module.

## Compatibility
- Existing routes and page flows are unchanged.
- Offline pack schema remains `mylingo.offline-packs.v1`.
- Release gate semantics remain unchanged.
- Existing progress, mastery, review scheduling, placement, and authoring storage keys are untouched.

## Validation
- `node --check site/shared/js/offline-packs.js` — passed.
- `node --check site/shared/js/offline-packs-ui.js` — passed.
- `python3 -m py_compile build.py offline_packs.py` — passed.
- `python3 build.py validate --input master_source.csv` — 60 rows / 60 quizzes / 0 errors / 0 warnings.
- `python3 build.py build --input master_source.csv --out <site> --src-root site` — passed; 74 files written, 7 offline packs generated.
- `python3 build.py verify-output --out <site>` — 0 errors / 0 warnings.
- `python3 build.py release-gate --input master_source.csv --site <site>` — PASS; 0 errors / 0 warnings.
- `python3 tests/unit/test_offline_packs_ui.py -v` — expected focused tests for this milestone.

## Known environment limitation
- The repository's full Vitest/Playwright suites may be unavailable when dependencies/browsers are not installed. Such suites must never be reported as passing when they cannot execute.

## Next task
Continue with the next product milestone using the frozen offline-pack API and schema. A useful follow-up is CI/deployment automation around the production release gate.
