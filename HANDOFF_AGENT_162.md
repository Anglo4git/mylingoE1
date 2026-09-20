# Agent 162 Handoff — canonical-metadata.js Under Test; 4 Defects Fixed (1 Big Offline One)

## Context
Picked up `HANDOFF_AGENT_161.md`, item 7 (the last small pure untested module:
`canonical-metadata.js`). Testing it led into its only consumer, `runtime-v2-adapter.js`, and
from there into the offline precache that ships `quiz.html`'s scripts. Method notes unchanged:
Playwright/Chromium at `$(npm root -g)/playwright`, a real served origin (not `about:blank`).
New this round: for anything offline, **serve with `Cache-Control: no-store`** (the ad-hoc
`python3 -m http.server` sends none, so Chromium's HTTP cache can silently make a broken
offline path look fine — that is exactly what hid defect 1 for many agents).

## Defects found and fixed (5 files touched + rebuilt zip)

1. **`sw.js` never served precached `.js`/`.css` offline (biggest one).** The fetch handler had
   branches for navigations, `.json` and `.mp3/.png/.svg/.ico` only; everything else was
   "pass through". So the 90-ish precached scripts/stylesheets were never used: verified in
   real Chromium with an HTTP-cache-free server — offline, `main/progress.html` and
   `shared/quiz.html` got their HTML from the precache but **every** `<script>`/stylesheet
   request FAILED. (With a cacheable server it looked fine intermittently, because
   `cache.addAll` also warms the HTTP cache — which is why earlier smoke tests passed.)
   Fix: new `isShellCode()` branch → `networkFirst` (fresh when online, precache/runtime copy
   when offline — same policy as mutable JSON). `CACHE_VERSION` bumped `mylingo-v5` → `v6` so
   the old shell cache is cleaned on activate. Re-verified in Chromium: all js/css `ok` offline.
2. **Offline precache was missing 5 files the precached pages need.** Added to
   `offline/core-manifest.json` **and** the `core` pack in `offline/packs.json` (85 → 90):
   `shared/js/canonical-metadata.js`, `shared/js/runtime-content-loader.js`,
   `shared/js/safe-url.js` (all loaded by `quiz.html`; `safe-url` also by `courses/lesson.html`),
   `shared/js/mastery-review-ui.js` (all six `*/dashboard.html`), and **`main/progress.html`**
   (the bottom-nav "Progress" tab — an offline first visit got the "You're offline" stub).
   Diff against the originals is additions only.
3. **`runtime-v2-adapter.js` silently undid canonical normalization.** `normalizeQuestion`
   merged `MylingoCanonicalMetadata.normalize()` output, then a later `copyOptional` loop copied
   the RAW `skill/subskill/difficulty/cefr/estimated_time_seconds` back over it. So
   `skill:" Grammar "` stayed padded (skill-mastery.js doesn't trim → the question was dropped
   from mastery), `skill:"foo"` beat the valid category fallback, `cefr:"b1"`/`difficulty:"3"`
   stayed raw. Fix: raw copy is now only the fallback when the canonical module isn't loaded.
   **Honest scope note:** every shipped question already carries canonical values (checked all
   JSON: skill/cefr/difficulty/time), so nothing user-visible changes today — this protects
   newly authored/imported content.
4. **`canonical-metadata.js` `skillForCategory('constructor')` returned `Object`** (bare
   object lookup hits inherited keys; same for `toString`, `__proto__`). Now an own-property
   check. Exotic, but a genuine correctness hole in a validator-style module.

Also: `offline/packs/core.zip` was **stale** (8 files older than source: `courses/lesson.html`,
`main/placement.html`, `shared/quiz.html`, `shared/js/{course-progress,offline-packs,placement,
review-scheduler,skill-mastery}.js`) — rebuilt from the manifest (90 files, byte-identical to
source, `testzip` clean). Nothing in the runtime reads the zips (`offline-packs.js` fetches
files individually), so this was a distribution-artifact problem, not a live one. The six level
zips were already current.

## Tests: `tests/run.js` 109 → 130, all passing (`node tests/run.js`)
- `canonical-metadata.js` (9): skill/category/objective/`normalize` semantics incl. prototype
  keys, numeric coercion (0 kept, junk dropped), CEFR upper-casing, non-object input, no input
  mutation, defensive-copy constants, and a drift check that the SKILLS list matches
  `skill-mastery.js` and `recommendations.js`.
- adapter × canonical (6): the three normalization cases above, "the normalized skill is
  actually counted by `skill-mastery.recordAttempt`", the module-absent fallback, and
  already-canonical data unchanged.
- offline reconciliation (6): every manifest file exists; `packs.json` core == manifest; every
  local script/stylesheet of every precached page is precached; every `app-shell.js` tab target
  is precached; `core.zip` == manifest and byte-identical (CRC) to source (dependency-free zip
  reader); and a behavioural `sw.js` test (fake ServiceWorkerGlobalScope: `.js`/`.css` get a
  `respondWith` that falls back to the cached copy offline; other assets and cross-origin pass
  through).
- Harness: added `testAsync()` (queued, awaited before the summary) since `test()` is sync.
- **Mutation-checked, each fails only its own guards:** adapter fix reverted → 4 fail;
  `hasOwnProperty` reverted → 1; two manifest entries removed → 3; a source file edited without
  rebuilding `core.zip` → 1; SW branch removed → 1.

## Verification
- Real headless Chromium, `no-store` server, after the SW fix: precached js/css load offline on
  `progress.html` and `quiz.html` (before: all FAILED). Adapter+canonical loaded in the browser:
  `{skill:"vocabulary", cefr:"B1", difficulty:3}` from `skill:" foo "`, `cefr:"b1"`,
  `difficulty:"3"`, `category:"Vocabulary"`; `skillForCategory('constructor')` → `null`.
- `node --check` on every `shared/js/*.js`, `sw.js`, `tests/run.js`.

## Rules for the next agent (new, enforced by tests)
- **Any edit to a file listed in `offline/core-manifest.json` requires rebuilding
  `offline/packs/core.zip`** or the suite fails. The rebuild is: zip exactly the manifest's
  paths (deflate), in manifest order, into `offline/packs/core.zip`.
- A new local `<script>`/stylesheet on a precached page must be added to **both**
  `core-manifest.json` and the `core` pack in `packs.json` (the test lists what's missing).
- The manifest header says it's "generated from `offline_packs.py`" — **that generator is not in
  this zip.** I edited both JSON files by hand (sorted, additions only). If the generator lives
  elsewhere it needs the same 5 additions or it will regress this.

## Remaining / carried forward
1. **[DECISION] level-lock fail-open vs fail-closed** (diagnostic warn stays until decided).
2. **[PRODUCT] Back button on the quiz results screen?**
3. **`learner-state.js` still unreferenced** — wire in or delete with its tests.
4. **`gamification.js` "Malformed legacy backup." message is still dead code.**
5. **Zip filename vs `RELEASE_IDENTITY.json` (v118) still unreconciled** (naming convention,
   not an app defect; unchanged reasoning from Agents 159/160).
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) still unused.
7. `main/practice.html` is a meta-refresh redirect stub to `courses/index.html`, deliberately
   **not** precached (nothing links to it); left alone.
8. **Consider a real cache-versioning story for JS**: with network-first, online learners get
   fresh code, but an offline learner runs whatever the last install precached, so a
   `CACHE_VERSION` bump is still the way to ship shell changes to precache (I did for this round).
9. **Still untested:** `recommendations.js` beyond the audit scenario, `orientation.js`,
   `runtime-content-loader.js`, `runtime-v2-adapter.js` beyond metadata (question/quiz/hierarchy
   normalization — big surface, the natural next target), `mastery-review-ui.js`, `app-shell.js`
   (DOM), `authoring-*`, `splash.js`, `offline-packs-ui.js`. `canonical-metadata.js` is now closed out.
