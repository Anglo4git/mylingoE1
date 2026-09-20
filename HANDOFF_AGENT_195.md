# Agent 195 Handoff — carried items 11, 12, 16 FIXED (banner subprompt, lesson-list retry, splash icon under a sub-path) + cache bump

## Context
Picked up `HANDOFF_AGENT_194.md`, "Next agent — start here" item 1 (fix the next unambiguous BUG-ISH items with tests;
flip any pin in the same change). Baseline: 771 passed, 0 failed. Fixed three of the four suggested items (11, 12, 16);
item 15 was left because it needs new user-facing copy.

## Fixes
1. **Item 11 — banner subprompt** (`shared/quiz.html`, `render()`): the per-type map had `banner:''`, but `''` is falsy, so a
   banner question with no `q.subprompt` showed "Choose the best answer." under an informational banner. Now
   `q.subprompt||(type==='banner'?'':{...}[type]||'Choose the best answer.')`; the dead `banner:''` map entry is removed.
   An explicit `q.subprompt` on a banner still wins. Verified in Chromium on `grammar/a1/a1-012` (Q1 is a banner): subprompt `''`.
2. **Item 12 — failed lesson-list load cached forever** (`shared/quiz.html`, `getLevelLessons()`): the final `.catch(()=>[])`
   now also clears `_levelLessonsPromise`, so the next call retries (a transient offline blip no longer disables the lesson
   gate / lesson-based suggestions until reload). Still resolves to `[]` (never rejects); concurrent callers still share one
   in-flight promise; a successful load and a well-formed non-array payload stay cached. Also: the combined-file fallback now
   throws on `!r.ok` (same as the per-level fetch) so an HTTP error there counts as a failure and is retried instead of being cached.
3. **Item 16 — splash icon under a sub-path** (`shared/js/splash.js`): the icon URL is now
   `new URL('../brand/icon.svg', document.currentScript.src).href` (captured synchronously at script start), so it is right at
   any hosting depth. Falls back to the old `./`/`../` pathname guess when `currentScript`/`src` is missing or the URL parser
   throws. Verified in Chromium: served from `/mylingo/` the root page and `/mylingo/a1/index.html` load
   `/mylingo/shared/brand/icon.svg` (naturalWidth 1359); domain-root pages likewise.

## Source change -> cache bump + core.zip
`shared/quiz.html` and `shared/js/splash.js` are core-pack files: `sw.js` `CACHE_VERSION` `mylingo-v18` -> **`mylingo-v19`**;
`offline/packs/core.zip` rebuilt from ALL on-disk sources (same 90 members / order / date_time / compress_type / external_attr;
`unzip -t` clean; identity test passes). `diff -rq` vs the Agent-193 zip: `shared/quiz.html`, `shared/js/splash.js`, `sw.js`,
`offline/packs/core.zip`, `tests/run.js` (+ HANDOFF_AGENT_194/195).

## Tests: 771 -> 776 (+5)
- Flipped Agent 172's banner pin (now asserts `''`, plus explicit subprompt on a banner wins).
- Flipped Agent 173's "failed load cached" pin into a retry test (fail -> recover -> success cached), and added a second test
  (shared in-flight promise; HTTP 500 from both sources retried; non-array payload cached).
- splash harness gained `over.currentScript` / `over.URL`; existing icon-path test re-labelled as the FALLBACK path (all its
  assertions unchanged); +2 tests for the primary script-URL path (sub-path, root, nested, query string) and the fallback triggers
  (null/undefined/empty src, unparsable src).
- Cache-version test updated to `mylingo-v19`; new section with 2 static source pins.
`node --check tests/run.js` clean; `node tests/run.js` -> **776 passed, 0 failed**.

## Browser QA (Playwright + headless Chromium, python http.server)
44 checks (22 pages x light/forced-dark, 390x844): no page errors, console errors, 4xx responses or horizontal scroll.

## Remaining / carried forward
Items 1/2/10/15/17–29 (product / fail-open DECISION list, item 15 needs new copy) and optional [INFO] 35 (HANDOFF_AGENT_192).
Items 11, 12, 14, 16, 30, 33, 34 are DONE.

## Next agent — start here
1. Item 15 if a copy decision is available (missing `runtime-content-loader.js` reported as retryable "Connection problem";
   missing `runtime-v2-adapter.js` as "corrupted"): check the global up front and show a distinct non-retryable
   "couldn't load the app, reload" state. Pinned by Agent 175 test 22 — flip in the same change.
2. Otherwise pick further unambiguous items from HANDOFF_AGENT_177..185 findings (items 18, 20 are LOW/local:
   `orientation.js` coercion quirks, `authoring-draft-autosave.js` `rowCount` overstating rows) or get a product decision on the rest.
3. If a core-pack file changes, bump `CACHE_VERSION` (now `mylingo-v19`) and rebuild `offline/packs/core.zip` from ALL on-disk
   sources (the identity test catches a partial rebuild).

## Blockers
Product decisions for the DECISION backlog; new copy for item 15.

## Artifacts
- `mylingo-v172-agent195-banner-retry-splash-fixes.zip`, `HANDOFF_AGENT_195.md`.

## Resume command
"Resume from HANDOFF_AGENT_195.md. You are Agent 196. Continue from 'Next agent — start here'."
