# AGENT 5 — SERVICE WORKER / OFFLINE RELIABILITY

STATUS: COMPLETED (R-005 fixed; full 8-cell threat matrix not all independently
re-verifiable in this environment — see Remaining risks)

## Mini-audit findings
Read `site/sw.js` in full. `cacheFirst()` and `networkFirst()` each had a path
where, on network failure with nothing in cache, the returned promise
resolved to `undefined`:

- `cacheFirst`: `cached || networkFetch` where `networkFetch`'s `.catch`
  returned `cached` (already `undefined`) → resolves to `undefined`.
- `networkFirst`: `.catch(() => caches.match(request))` → resolves to
  `undefined` when there's no match.

`event.respondWith(undefinedPromise)` is exactly the "no: return undefined
from fetch handlers" anti-pattern called out in the mission — it produces a
hard network error for the page instead of a controlled offline experience.

Also confirmed (no change needed): `activate` cache cleanup correctly never
touches `PACK_CACHE_PREFIX` caches, and only deletes recognized
`mylingo-v*` shell caches — offline packs are not at risk from this bug.

## Implemented
Added `offlineFallbackResponse(kind)` returning a real `Response` for three
cases:
- `'document'` — small inline offline HTML page (503).
- `'json'` — `{ error: 'offline', offline: true, cached: false }` (503,
  `application/json`), so calling app code can branch on a real JSON body
  instead of a thrown error.
- `'asset'` (fonts/misc/binary) — empty 503 `Response`.

Both `cacheFirst` and `networkFirst` now fall back to
`offlineFallbackResponse(...)` instead of an unresolved `cached`/`match`
value on total cache miss while offline. No change to the cache-first /
network-first strategy selection, precache manifest, or pack-cache
ownership rules — scope was kept to the fetch-handler defect only.

## Required tests — written and executed
`tests/unit/sw_offline_fallback.test.mjs`, using only Node's built-in
`node:test` + `node:vm` (no npm install required, so it runs even in a
network-restricted environment — see Agent 4's note on why vitest/Playwright
couldn't be installed here). It loads the real `site/sw.js` source into a
sandboxed context with a minimal Cache Storage + fetch mock and drives the
actual registered `fetch` listener.

Command and real output:

```
$ node --test tests/unit/sw_offline_fallback.test.mjs
# tests 5
# pass 5
# fail 0
# cancelled 0
# skipped 0
```

Covered:
- navigate, offline, cache miss → real 503 HTML Response (not undefined)
- mutable JSON, offline, cache miss → real 503 JSON Response (not undefined)
- immutable asset, offline, cache miss → real 503 Response (not undefined)
- navigate, offline, cache hit → cached Response returned unchanged
- mutable JSON, online → fresh network Response returned unchanged

## Verification
- `node --check site/sw.js` → OK (syntax valid).
- Grepped `site/shared/js/*.js` for callers of `cacheFirst`/`networkFirst`:
  none — these are private to `sw.js`, so the added second parameter is
  safe and doesn't touch any other file's contract.

## Exit gate
- ✓ Deliberate fallback Response on offline + cache-miss for all three
  content classes (document/json/asset) — verified by executed tests above.
- ✓ No `return undefined` path remains in either fetch strategy function.
- ~ Full threat matrix (network available + cache available; stale cache;
  partial cache; unknown-asset offline as distinct from generic asset) was
  reasoned through by code inspection but not each independently scripted
  as a separate test — the two "cache miss while offline" cells were the
  ones with an actual defect (R-005) and are the ones with executable
  evidence above.
- Could not run this repo's existing `vitest` suite (`npm test`) or the
  Playwright E2E offline scenario (Agent 4's suite) for regression
  confirmation, because `npm install` is blocked in this environment
  (403 from the npm registry — same constraint Agent 4 hit). The new test
  file was deliberately written dependency-free specifically to get *some*
  executable evidence despite that constraint.

## Remaining risks
- R-005 (Medium): fix implemented and unit-verified; **not** verified via
  the real Playwright offline E2E scenario in Agent 4's required suite
  (install → cache → disconnect → navigate → run quiz), because that
  suite cannot execute in this environment. Recommend re-running
  `npm run test:e2e` and this new node:test file together once network
  access is available, before treating R-005 as fully closed at the
  system level.
- Whether app code (e.g. `shared/js/offline-packs.js`, quiz screens) has
  any explicit handling for a 503/JSON-error response from a `fetch()`
  call, versus just treating any non-ok response as "no data," was not
  audited — out of this agent's declared scope (fetch-handler layer only).

## Next agent
Agent 6 — Client State Tamperability (R-006).
