# Agent 176 Handoff — Test Coverage for the Ranking Question's Reorder Listeners and splash.js

## Context
Picked up `HANDOFF_AGENT_175.md`, "Next agent — start here": item 1 (the inline keydown handlers left in carried item
13) and item 2 (a small standalone module — `splash.js` was chosen). No source changes this turn — pure test-coverage
addition.

**Correction to the Agent 174/175 handoffs:** they listed the text-input Enter-to-submit (`renderTextLike`) as untested.
It was already covered by Agent 171 ("renderTextLike (…): … Enter key and Check button both submit {value}" and "a
non-Enter keydown does not submit"). Only the ranking-row listeners were actually untested. Item 13 below is corrected.

## What was done
Added two things to `tests/run.js`:

**A. Ranking question: keyboard reorder + drag and drop** — 10 tests inside the Agent 171 question-rendering IIFE
(right after "renderRanking: falls back to answerList"), because they need Agent 171's `FakeElement` / `renderSandbox()`.
- `FakeElement` gained real-DOM move semantics: `insertBefore(node, ref)` (null/undefined ref → append, `ref===node` →
  no-op, non-child ref → throws like the DOM), `nextSibling`, and `appendChild` now detaches the node from a previous
  parent. Nothing else in the suite depended on the old "append never moves" behaviour (full suite still green).
- `rankingSandbox(items)` helper: pins `Math.random` to 0.5 in the vm so the shuffle is stable (rows in item order);
  `press(value,key)`, `drag(value)`, `drop(value)` (also fires `dragend` on the source, as browsers do), `order()`,
  `nums()`, `submit()` (clicks Check order and returns the submitted ranking).
- Tests: initial state (first row focused, kbHint text, ranks 1..N) · ArrowUp swaps with the upper neighbour only,
  renumbers, re-focuses, `preventDefault()`s · ArrowDown symmetrical · edges (Up on first / Down on last) are no-ops and
  NOT `preventDefault()`ed while the opposite direction still works · other keys ignored · repeated presses walk an item
  across the list and Check order submits the keyboard-built order · dragstart (`setData('text/plain', value)`, only the
  dragged row gets `.dragging`), dragend clears it, dragover `preventDefault()`s · drop onto a later row lands AFTER
  it (incl. the last row via `nextSibling === null`), onto an earlier row lands BEFORE it, ranks renumbered,
  `preventDefault()`ed · drop on itself / with nothing dragging / after dragend changes nothing · keyboard and drag
  compose and Check order submits the CURRENT DOM order.

**B. `splash.js`: once-per-session launch splash** — new section "splash.js: once-per-session launch splash (Agent 176)",
after the Agent 175 section, 11 tests. The real file runs in a `vm` sandbox with a fake window / sessionStorage /
document / location and manually-driven timers.
- First load: sets `window.__mylingoSplashLoaded`, writes `mylingo.splash.v1 = '1'`, mounts one `#mylingoSplash`
  (`role=status`, `aria-label="Loading Mylingo"`) plus its `<style>`.
- Second execution on the same window does nothing; marker already `'1'` → no splash/timers (flag still set); a marker
  other than `'1'` does not suppress it; `sessionStorage.getItem` OR `setItem` throwing → splash still shown, no throw.
- `readyState==='loading'` → mount deferred to a one-shot `DOMContentLoaded` listener; `interactive`/`complete` mount
  immediately, no listener. Mount never duplicates an existing `#mylingoSplash`.
- Timing: visible 1660 ms, then `.hide`; 280 ms later element AND style are removed; leaves nothing behind.
- CSS contract: `.hide` → opacity 0 / visibility hidden / pointer-events none; the `.28s` transition equals `FADE_MS`
  (280); reduced-motion rule; dark-mode rule.
- Icon path: `./` for root pages, `../` one folder deep; pinned sub-path behaviour (see Findings); static guard that every
  shipped HTML page loading `splash.js` is at most one folder deep (≥10 pages found).

`node tests/run.js`: 381 → **402** (+21). Header comment extended.

## Mutation-checked (each kill verified, then reverted)
- Ranking listeners: 24 mutations, 23 killed. **Equivalent survivor:** removing the `dragging!==row` guard in the drop
  handler — inserting a node before itself is a DOM no-op and `updateRanks` is idempotent, so the guard is defensive only.
  Killed: Up allowed on first row; Down allowed on last row; Up/Down made no-op moves; Up moving two rows; skipping
  `updateRanks` / `focus()` / `preventDefault()` in each direction; dragstart without `setData` / without the class;
  dragend not clearing; dragover without `preventDefault`; drop without `preventDefault`; drop direction flipped;
  drop always-before; drop without `updateRanks`; drop ignoring `.dragging`; `updateRanks` off by one; initial focus
  removed; kbHint text changed.
- `splash.js`: 20 mutations, 20 killed (once-per-page guard/flag; marker check/write; storage errors rethrown; duplicate
  guard; role; aria-label; `SPLASH_MS`; `FADE_MS`; `.hide` class; element/style removal; icon depth; deferral while
  loading; non-`once` listener; pointer-events; transition length; reduced-motion; style not appended).
- (`quiz.html` and `splash.js` are core-pack files, so the `core.zip` byte-identity test fails on any edit to them — that
  expected failure was excluded from every kill count.) `md5sum` over every project file confirms the tree is
  byte-identical to the Agent 175 baseline after reverts (only `tests/run.js` and this doc differ).

## Findings (not changed)
- **Splash icon path breaks for the ROOT page when the app is hosted under a sub-path.** `splash.js` picks `./` vs `../`
  from `location.pathname.split('/').length>2`, i.e. it assumes the app lives at the domain root. At
  `/mylingo/index.html` (or `/mylingo/`) the root page gets `../shared/brand/icon.svg`, which resolves above the app.
  Cosmetic only: the `<img>` has `alt=""` so the wordmark still shows and the icon slot is just empty. The rest of the app
  (manifest `scope: "./"`, `start_url: "./index.html"`, `./sw.js`) uses relative paths and would work under a sub-path,
  so this is the odd one out. Pinned by the icon-path test; a static guard confirms every current page is ≤1 folder deep.
  Fix candidate: derive the prefix from the script's own URL (`document.currentScript.src`, as `offline-packs.js`
  does). Carried item 16.
- **Ranking questions have no on-screen move controls.** Reordering is arrow keys (physical keyboard) or HTML5
  drag-and-drop (`draggable=true` rows). Unverified in a browser: whether HTML5 drag works acceptably on the iPhone Safari
  target (Agent 139). If it does not, phone learners cannot answer ranking questions. Needs a real-device check, then
  possibly Up/Down buttons per row. Carried item 17 (QA/product; no code evidence either way from this sandbox).
- Arrow keys at the list edges are deliberately not `preventDefault()`ed (the page scrolls) — pinned, looks intentional.

## Files changed
- `tests/run.js` only (two new blocks, `FakeElement` move semantics, header comment). No application code touched.

## Current state
- Tests: PASS — `node tests/run.js` → **402 passed, 0 failed** (Agent 175 left 381; net +21, none removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip` unchanged and valid; `CACHE_VERSION` unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 175, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: `orientation.js` (85 lines), `app-shell.js` (138 lines; only its TABS precache target is checked
    statically), `offline-packs-ui.js` (~8 KB), `mastery-review-ui.js` (~13 KB), `authoring-draft-autosave.js`,
    `authoring-validation.js` (~17 KB). (quiz.html keyboard layer incl. ranking rows/drag-drop, `load()`, and
    `splash.js` — **CLOSED**; the text-input Enter was already covered by Agent 171.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176, above).
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; HTML5 drag-and-drop unverified on iPhone
    Safari (Agent 176, above).

## Next agent — start here
1. `orientation.js` (85 lines, standalone; `localStorage` key `mylingo.orientation.v1` is also read by quiz.html's
   `orientationEstimate`, already tested): load it with `loadModule` + the shared fake window, or a vm sandbox as in
   the splash section, and cover its public API, storage keys and corrupt/empty-storage handling. Read the file first —
   nothing about its behaviour is assumed here.
2. Or `app-shell.js` (138 lines): bottom-nav construction, the active-tab match (it normalises backslashes in
   `location.pathname`), and the TABS targets (already checked to be precached). A vm sandbox with a fake `document`
   like the splash one works.
3. Then the larger UI modules: `offline-packs-ui.js`, `mastery-review-ui.js`, the two `authoring-*` files.
4. Items 1, 2, 10, 11, 12, 14, 15, 16, 17 need a product decision (17 also needs a real device) before any code changes.

## Blockers
None.

## Assumptions made
- Extended the shared `FakeElement` in the Agent 171 IIFE (rather than writing a second shim) because the ranking
  handlers need `insertBefore`/`nextSibling`; the change is additive apart from `appendChild` now detaching from a
  previous parent, which mirrors the DOM.
- Pinned `Math.random` in the sandbox for deterministic rows, and made the `drop` helper fire `dragend`, as browsers do —
  without it a stale `.dragging` class from an earlier drag made the second drop in a test ambiguous.
- Chose `splash.js` for item 2 because it is the smallest module with real behaviour (timers, storage, readyState) and
  needed no new shim beyond hand-driven timers.
- Pinned the sub-path icon behaviour and the missing on-screen ranking controls as findings rather than changing them:
  this turn is test-only and both need a decision (and, for the second, a device).

## Artifacts produced
- `mylingo-v159-agent176-ranking-and-splash-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_176.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_176.md. You are Agent 177. Continue from 'Next agent — start here'."
