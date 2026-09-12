# Agent 32 — OFFLINE_CACHE_CONSISTENCY — COMPLETION

## DONE

## Root causes fixed (site/sw.js)
1. **Install bulk-cached every pack into `STATIC_CACHE`.** The `install`
   handler fetched `offline/packs.json` and pre-cached *all* packs' files
   into the shared core cache, regardless of what the learner selected —
   so "installing pack A" always silently downloaded every pack, and
   `removePack()` (which only deletes the pack-specific cache) never
   actually freed the space or made the content unavailable, since a copy
   lived on in `STATIC_CACHE`. Removed this step; pack content is now
   cached exclusively by `offline-packs.js` in `PACK_CACHE_PREFIX + id`.
2. **`activate` wiped installed packs on every deploy.** The cleanup
   filter deleted any cache key not matching the current shell version,
   which included pack caches (different prefix/versioning entirely) —
   every app update silently deleted a learner's offline packs. Now scoped
   to only `mylingo-v*` shell caches, and pack caches are explicitly
   exempted.
3. **No freshness policy for mutable JSON.** All `.json` was cache-first
   with best-effort background revalidation. Split policy: `.json`
   (quiz data, pack index, placement, dashboards) is now network-first
   with cache fallback; binary assets (`mp3/png/svg/ico`) stay cache-first.
4. Bumped `CACHE_VERSION` to `mylingo-v4` so the old polluted static cache
   from bug #1 is cleared on next activate (pack caches unaffected).

## Files changed
- `site/sw.js`
- `tests/unit/offline-packs.test.js` (updated one test that had encoded
  the old buggy behavior as expected; added 4 new tests for the fixes)

## Tests/checks run
- `npx vitest run tests/unit/offline-packs.test.js` → 8/8 passed
- `python3 -m unittest tests.unit.test_offline_packs_ui` → 6/6 passed
- `node -c site/sw.js` and `node -c site/shared/js/offline-packs.js` → OK

## Known limitation
`offline/packs.json` isn't present in this package (it's a build
artifact from `offline_packs.py`), so behavior wasn't exercised end-to-end
in a real service-worker/browser environment — verified via static
code review + unit tests only, per the handoff's scope.

## For next agent
`offline-packs.js`/`offline-packs-ui.js` were left untouched (their
per-pack cache logic was already correct) — Agent 33 can build on a
now-consistent cache boundary between core shell and packs.
