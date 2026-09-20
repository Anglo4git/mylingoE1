# Agent 179 Handoff — Test Coverage for offline-packs-ui.js (+ one real bug fixed)

## Context
Picked up `HANDOFF_AGENT_178.md`, "Next agent — start here": item 1, `offline-packs-ui.js` (~8 KB).
Baseline verified first: `node tests/run.js` → 475 passed, 0 failed.
The module is a self-executing IIFE (`(function(global){...})(window)`) that reads the free globals
`window`, `document`, `navigator`, and returns silently when `window.MylingoOfflinePacks` is missing.

## What was done
One new section in `tests/run.js` (after the Agent 178 section, before the Agent 159 offline-packs section) plus a
header-comment extension. It runs the REAL file in a `vm` sandbox against:
- a small **fake DOM** (`El` class) whose `innerHTML` setter genuinely parses the markup the module writes
  (nested tags, `class`/`id`/`type` attributes, entity decoding), with `querySelector(All)` for `.class` / `tag`
  selectors, `textContent`, `dataset`, `click()`; so escaping and row structure are tested like a browser would see them;
- a fake `MylingoOfflinePacks` API (call logs, per-test overrides) whose promises are settled by hand (`defer()`),
  and a controllable `navigator.onLine` + window `online`/`offline` event dispatcher.
The async tests go through the existing `testAsync` queue.

**offline-packs-ui.js: 26 tests** — exports `{VERSION:1, mount}` and a total no-op without the API; mount() structure
(section, h2 wired by aria-labelledby, loading placeholder, footer note, appended + returned); style injected once,
also across mounts and skipped if the id already exists; connection badge (online/offline/undefined); row rendering
(label→id fallback, asset pluralisation, level suffix, status/button/class per installed state, `isInstalled` order);
HTML-escaping of label/id/level; ordering (index order without `level`, level pack first case-insensitively, core
promoted); empty / non-array `packs`; getIndex failure (message in tooltip, message-less rejection must not throw
inside the handler — asserted via `unhandledRejection`); list blank while `isInstalled` pending and one failing
`isInstalled` hiding all rows (pinned); Install flow (Starting…/Caching n/total/total fallbacks/busy guard/success);
Install failure + retry; Remove flow + failure; offline at click time; online/offline events; page loaded offline;
busy rows ignored by connection changes; end-of-operation enabled-state rule; multi-mount independence; no-options
mount; static contracts (UI only calls methods the real `offline-packs.js` exports and the `{done,total}` shape it
emits; exactly the 12 level index/dashboard pages load the UI, each loads `offline-packs.js` first, has one
`#offlinePacksMount`, mounts with `{level}` in a try/catch, and dashboards skip it for locked levels).

`node tests/run.js`: 475 → **501** (+26).

## Bug found and FIXED (real, user-visible)
**Install buttons stayed disabled forever after the connection came back.** `updateNetwork()` skipped any row whose
button was `disabled` (meant to skip busy rows), but going offline itself sets `disabled = true` on uninstalled
rows — so on the following `online` event (or a page that loaded offline) the buttons were skipped and stayed
"Connect to install" / disabled until a full reload, while the badge said "Online". Also, an operation that ended
while offline re-enabled the button unconditionally (clickable-but-dead).
Fix (`shared/js/offline-packs-ui.js`, minimal): `setBusy` records `row.dataset.busy`; a new `idle()` ends an
operation and sets `disabled = (not installed && navigator.onLine === false)`; `updateNetwork` now skips on
`row.dataset.busy === '1'` instead of `button.disabled`. Verified the new tests FAIL on the old source (4 failures)
and pass on the fix.
Because the file is a core-pack file: `offline/packs/core.zip` rebuilt (manifest paths, manifest order, deflate),
`sw.js` `CACHE_VERSION` bumped `mylingo-v12` → **`mylingo-v13`** (sw.js is itself in core.zip, rebuilt again),
`unzip -t` clean, the core-reconciliation tests pass.

## Mutation-checked
Scripted sweep of 69 hand-written mutations over the fixed file (guard flips, label/status strings, escaping map,
plural rule, busy/idle logic, onLine comparisons, sort comparator terms, listener registration, export literal,
error-tooltip logic, etc.): **68 killed, 1 survivor**, and the survivor is an equivalent mutant (`esc()` is only ever
called with truthy values, so its null→'' branch is unreachable). The file was restored byte-identical after the sweep
(cmp against `core.zip`'s copy). The core.zip "byte-identical to source" check was excluded from the kill criterion
(it trips on any mutation by design).

## Findings (not changed — pinned by test where noted)
- **[LOW] One failing `isInstalled()` hides every pack** (`Promise.all` inside the same chain) and the list is
  blank (no placeholder) while it is pending, because `list.innerHTML = ''` runs before it resolves. Pinned.
- **[LOW] Remove failure gives no reason** ("Remove failed", empty tooltip) though `removePack` throws a clear
  "installed packs depend on it" error; Install surfaces its message. Pinned.
- **[LOW] Stale error tooltip:** a failed install's message stays on the button's `title` after a later successful
  install (shown on "Remove"). Pinned.
- **[LOW] Progress callback throws** `TypeError` if `progress.total` is falsy and the pack has no `files` array
  (row rendering guards `files`; the callback does not). The real `installPack` always sends `total`, so latent. Pinned.
- **[INFO] Sort comparator** `aBoost - bBoost || (a.id==='core' ? -1 : 1)` is not a consistent comparator for two
  non-core, non-matching packs (returns 1 both ways) → their relative order is engine-dependent. Tests only assert
  determinate outcomes (level pack first; core promoted over one non-core pack).
- **[INFO]** A `null` entry in `index.packs` would throw on `pack.id` and land in the generic "could not be loaded" note.

## Files changed
- `shared/js/offline-packs-ui.js` (bug fix), `sw.js` (`CACHE_VERSION` v13), `offline/packs/core.zip` (rebuilt)
- `tests/run.js` (new section + header comment)
- `HANDOFF_AGENT_179.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **501 passed, 0 failed**. `node --check` clean on run.js, sw.js, the UI file.
- `core.zip` valid and reconciled with manifest/source; `CACHE_VERSION` = `mylingo-v13`.

## Remaining / carried forward (from Agent 178, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: `mastery-review-ui.js` (~13 KB), `authoring-validation.js` (~17 KB).
    (`offline-packs-ui.js` — **CLOSED** this turn.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176); fix candidate: `app-shell.js` ROOT derivation.
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; drag-and-drop unverified on iPhone Safari.
18. [LOW] `orientation.js` coercion quirks and the "medium at both extremes" confidence rule (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages and directory URLs (Agent 177).
20. [LOW] `authoring-draft-autosave.js` `rowCount` can overstate rows written (Agent 178).
21. [INFO] `authoring-draft-autosave.js` and `authoring-validation.js` are unused by any shipped page (Agent 178).
22. [LOW] offline-packs-ui.js findings above (isInstalled all-or-nothing/blank list, silent Remove failure, stale
    tooltip, progress-callback `files` guard) (Agent 179).

## Next agent — start here
1. `mastery-review-ui.js` (~13 KB): reuse the fake-DOM (`El`) + hand-settled API recipe from the Agent 179 section
   (hoist it to a shared helper if a third user appears). Read the file first.
2. Then `authoring-validation.js` (~17 KB, likely pure logic — table-driven; unwired, see item 21).
3. Items 1, 2, 10, 11, 12, 14–19, 20–22 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Fixed the reconnect bug rather than only pinning it: the fix is unambiguous (no product decision) and small, and
  the failure is on the offline feature's main path. Other quirks were pinned and logged, not changed.
- Bumped `CACHE_VERSION` because a precached shell file changed (standing policy from Agents 162/163).
- Wrote a minimal HTML-parsing fake DOM instead of adding jsdom, keeping the suite dependency-free.

## Artifacts produced
- `mylingo-v160-agent179-offline-packs-ui-tests-and-reconnect-fix.zip` — full project state after this turn.
- `HANDOFF_AGENT_179.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_179.md. You are Agent 180. Continue from 'Next agent — start here'."
