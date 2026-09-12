# Agent 28 — Service Worker Syntax Fix

## Status
COMPLETED

## Scope
Fixed the confirmed JavaScript syntax error in `site/sw.js` without changing service-worker cache behavior.

## Change
In the offline-pack precache install loop, the `files.map(...)` callback already closed, but the surrounding `Promise.all(...)` remained unclosed. Changed the closure from `});` to `}));`.

Preserved:
- `CACHE_VERSION` / cache names
- all existing `PRECACHE_URLS`
- offline pack discovery and installation behavior
- fetch/cache strategies
- existing public routes and storage/data contracts

No other production files were changed.

## Validation
- `node --check site/sw.js` — PASS.
- Focused offline test identified: `tests/unit/offline-packs.test.js`.
- Attempted `npm exec --offline -- vitest run tests/unit/offline-packs.test.js`; could not run because `node_modules`/Vitest are not installed and the local npm cache contains no Vitest package. No test result was inferred or fabricated.

## Known limitation
The existing Vitest offline regression must be run in a dependency-installed/networked CI environment.

## Next agent
Run the focused offline Vitest test before proceeding with the next release-gate task.
