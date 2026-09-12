# Agent 81 Completion — Offline + Link Safety (Course/Lesson/Journey)

STATUS: IMPLEMENTED + VERIFIED

## Files changed
- `offline_packs.py` — added 9 files to the canonical `CORE_FILES` list.
- `site/offline/core-manifest.json` — regenerated (via `write_offline_packs`,
  not hand-edited) from the corrected `CORE_FILES`.
- `site/offline/packs.json` — regenerated (core pack's `files` list grows
  from 55 to 62; per-level packs unaffected).
- `site/offline/packs/core.zip` — regenerated to actually contain what
  `packs.json` and `PACK_MANIFEST.json` claim it contains.
- No changes to `sw.js`, any level's pack, `courses/*.html`, `course_content/*`,
  or any test file — the gap was entirely in the offline-package layer, not
  in the course/lesson/journey pages themselves or the service worker's
  runtime caching strategy.

## What was checked (per the mission's checklist)

**Course/lesson data availability offline** — checked whether
`courses/index.html`, `courses/course.html`, `courses/lesson.html`,
`courses/journey.html`, and their three data files
(`course_content/{courses,units,lessons}.json`) were part of any precached
or downloadable offline surface. They were not: none of the nine were in
`offline_packs.py`'s `CORE_FILES`, so they were absent from both the
service worker's install-time precache list and the downloadable "core"
pack. A learner offline who had never visited a course/journey page while
online would hit the browser's native offline error on first navigation —
a real, present dead end for the entire guided-path feature, not a
hypothetical one.

**Required local assets and manifests** — while tracing this, found the
canonical `CORE_FILES` list in `offline_packs.py` was *already* out of sync
with the checked-in `site/offline/core-manifest.json` before I touched
anything: the shipped manifest had 55 entries including `main/placement.html`
and `shared/js/course-progress.js` (evidently added by hand at some point,
appended out of the manifest's normal sorted order), but `CORE_FILES` itself
still listed only 53 and lacked both. Running the project's own existing
`offline_packs.verify_offline_packs()` confirmed this was a live, currently
failing state — 3 errors: manifest/`CORE_FILES` mismatch, `core.zip` missing
2 listed assets, and zip-vs-pack-index mismatch — and running the existing
`test_offline_core_package_integrity.py` suite (which regenerates from
`CORE_FILES` as its first assertion's side effect) silently overwrote the
checked-in manifest and `core.zip` back down to 53 files, actively deleting
`main/placement.html` and `course-progress.js` from the offline core the
next time anyone ran the test suite or rebuilt. Both problems (the pre-existing
drift and the new course/lesson gap) are fixed together: `CORE_FILES` is now
the single edited source of truth, `write_offline_packs('site')` regenerated
the manifest, `packs.json`, and every pack ZIP from it, and
`verify_offline_packs('site')` now returns 0 errors/0 warnings.

**Existing service-worker/cache behavior** — unchanged. `sw.js` already
fetches `CORE_FILES` indirectly via `./offline/core-manifest.json` at
install time and precaches whatever that manifest lists; it needed no
changes; correcting the manifest's contents was sufficient. Per-pack
(`PACK_CACHE_PREFIX`) vs. app-shell (`STATIC_CACHE`/`RUNTIME_CACHE`) cache
separation, and the `activate` handler's refusal to ever delete a pack
cache, were re-read and confirmed untouched and correct.

**Optional YouTube links never become hard dependencies** — confirmed
unchanged from Agent 76/81-planning intent: `lesson.html`'s
`youtube_url`/`presentation_url` are never added to any manifest or cache
list (nothing here changed that), the video embed only renders when
`navigator.onLine` is true, and the offline branch already shows "Video
unavailable offline. Read the quick revision instead." with the revision
text still fully available (it's plain JSON in the now-cached
`lessons.json`).

**Broken/missing media falls back gracefully** — re-verified
`onerror="this.closest('.media').remove()"` on the presentation `<img>` and
the video-wrap `onerror` fallback in `lesson.html`; both pre-existing and
untouched.

**External links are safe and accessible** — `lesson.html`'s only external
link surface is the optional YouTube embed/iframe, scoped to
`youtube.com/embed/<id>` built from a regex-validated video ID (rejects
anything that doesn't parse rather than embedding a raw URL); no other
course/lesson/journey page links off-site. Nothing changed here; confirmed
by inspection.

**Offline navigation does not dead-end** — this is what the fix directly
addresses: `courses/index.html`, `course.html`, `lesson.html`, `journey.html`
and their 3 JSON data files are now part of the service worker's precache
(via the corrected core manifest) and the downloadable core pack, so they
render from cache offline instead of hitting the browser's native offline
page. Their own internal error states (`renderError()` in each page, shown
when a fetch does fail) already link back to `./index.html` / `../main/index.html`
/ `../<level>/index.html` — all of which are also core-cached — so even a
worse-case fetch failure (e.g. a course referenced by an offline-installed
level pack but not core) resolves to a page that itself still loads offline,
rather than a second dead end.

## Guardrails respected
- **Preserve existing offline strategy**: no change to `sw.js`'s
  cache-first/network-first split, cache naming/versioning, or the
  pack-vs-shell cache separation — only the *contents* of the core manifest
  (which was already the mechanism for this) were corrected/extended.
- **Do not cache unnecessary external content**: only Mylingo's own static
  navigational pages and small (40 KB total) first-party JSON were added.
  No YouTube, presentation image, or other external URL was added to any
  manifest — those remain fetched live, online-only, with the existing
  graceful offline fallback text.

## Verification
- `offline_packs.verify_offline_packs('site')` → `([], [])` (0 errors, 0
  warnings); was 3 errors before the fix.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'` → **69/69
  pass**, including all 4 `test_offline_core_package_integrity.py` cases
  (1 was failing before the fix) and all 14 other offline/incremental-pack
  tests.
- `python3 build.py release-gate --input master_source.csv --site site
  --report ...` → **PASS; 0 errors, 0 warnings** (this is the gate CI
  actually runs; it calls `verify_offline_packs` itself).
- `npx vitest run` → **226/228 pass**; the 2 failures are the same
  pre-existing, unrelated string-match issues already documented in Agent
  80's handoff (quiz counter text, resume button label) — untouched by this
  agent, confirmed identical before and after.
- Confirmed `site/offline/core-manifest.json` now lists 62 files, is
  alphabetically sorted (byte-identical to what `write_offline_packs`
  would regenerate — no more hand-edit drift possible without the test
  suite catching it), and `core.zip` contains exactly those 62 files plus
  `PACK_MANIFEST.json` (63 total), matching `packs.json`'s core entry.
- Confirmed every `fetch()`/`fetchJson()` call across `courses/index.html`,
  `course.html`, and `lesson.html` resolves to a file that is now in the
  core manifest (`course_content/*.json`) or was already in a level's
  pack (`<level>/quizzes.json`) — no remaining un-cached data dependency
  in the course/lesson/journey surface.

## Limitation
Could not exercise the real "airplane mode" browser path (Playwright's
`accessibility.spec.js`/`quiz-flow.spec.js` require downloading Chromium
from `cdn.playwright.dev`, which this sandbox's network allowlist blocks —
same limitation Agents 79–81(final-integration) already recorded). Verified
everything reachable without a real browser: the manifest/zip byte contents
directly, the Python integrity/regression tests, and the release gate that
CI runs before those Playwright specs. The service worker logic itself was
not modified, so no new browser-only risk was introduced.

## Next dependency
Agent 82 — Accessibility + UX audit of the course/lesson/journey pages can
proceed; the pages it will be auditing are now confirmed reachable offline
so its keyboard/screen-reader/contrast checks reflect real, loadable pages
rather than ones that only render when online.
