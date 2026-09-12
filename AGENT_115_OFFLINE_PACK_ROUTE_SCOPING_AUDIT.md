# AGENT 115 — Offline Pack Route Scoping Audit

## Status
PASS WITH LIMITATION

## Scope completed
Audited every route/path a manifest hands to `fetch()`/`cache.add()` at runtime (offline pack files in `offline/packs.json`, precache list in `offline/core-manifest.json`) for scope containment, plus the cache-prefix contract between `shared/js/offline-packs.js` and `sw.js` that protects learner-installed packs across app updates.

Checked:
- No file path in any pack (`core`, `a1`..`c2`) or in the core manifest is absolute or contains a `..` path segment anywhere in the string (not just a leading one) — confirmed clean today.
- All pack `dependencies` reference known pack ids; `default_install` references a known pack.
- `sw.js`'s `PACK_CACHE_PREFIX` and `offline-packs.js`'s `CACHE_PREFIX` are identical strings, and the service worker's `activate` handler explicitly excludes any cache matching that prefix from its cleanup sweep — confirmed a version bump cannot silently delete a learner's installed packs.
- `offline-packs.js` derives its fetch base (`BASE_URL`) from `../../` relative to its own script tag; verified every page that includes it (`main/index.html`, `main/placement.html`, all six level dashboards) does so from the identical relative depth (`../shared/js/offline-packs.js`), so that math can't silently point outside `site/` from some future page.

## Files changed
- `tests/unit/test_agent115_offline_pack_route_scoping.py` (new — 7 tests)
- `AGENT_115_OFFLINE_PACK_ROUTE_SCOPING_AUDIT.md` (this file)

## Automated checks
- `python3 -m unittest tests.unit.test_agent115_offline_pack_route_scoping` — 7/7 pass
- `python3 -m unittest discover -s tests/unit -p "test_*.py"` — 96/96 pass (89 prior + 7 new)

## Limitation (build-tool sanitizer, not a live vulnerability)
`offline_packs.py`'s `norm()` helper (used when generating manifests) only strips **leading** `.`/`/` characters — it does not scan for a `..` segment in the middle of a string. Today's manifests are clean (see tests above, which now lock that in as a regression gate), but `norm()` itself would not catch a future hand-edited or badly-generated entry like `"shared/../../outside/file"`. This audit did not modify `offline_packs.py`, per the standing rule against production rewrites; flagging it here as a follow-up candidate rather than fixing it in-place.

## Not in scope / unchanged
- No production pack-install/service-worker logic was modified.
- No new pack content or duplicate routes were added.
- Real-browser Cache Storage behavior (actual install/evict/activate timing) was not exercised — Playwright/browser binaries remain unavailable in this environment, consistent with Agents 112–114.

## Next agent
Handoff open (suggested: harden `offline_packs.py`'s `norm()` to reject mid-string `..` segments at generation time, turning this audit's regression gate into an enforced invariant).
