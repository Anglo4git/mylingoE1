# Agent 178 Handoff — Test Coverage for authoring-draft-autosave.js

## Context
Picked up `HANDOFF_AGENT_177.md`, "Next agent — start here": item 1, the smallest untested module,
`authoring-draft-autosave.js` (~5 KB). No source changes this turn — pure test-coverage addition.
Baseline verified first: `node tests/run.js` → 450 passed, 0 failed.

## What was done
Added one new section to `tests/run.js` (inserted after the Agent 177 app-shell section, before the
Agent 159 offline-packs section), plus a header-comment extension. `authoring-draft-autosave.js` is a
self-executing IIFE — `(function(global){...})(window)` — whose factory `create(storage, options)`
reads `setTimeout`/`clearTimeout` as **bare free globals** (not `window.setTimeout`, unlike app-shell.js),
so it runs for real in a `vm` sandbox where both live directly on the context object and are manually
driven (a `Map` of pending timers; no real timer ever fires). Storage is a per-test fake
(`get`/`set`/`remove` call logs), and a `plain()` JSON-clone handles cross-realm `deepStrictEqual` the
same way the orientation/app-shell/splash sections do.

**`authoring-draft-autosave.js`: chunked draft save/restore — 25 tests.**
- Public API: `MylingoAuthoringDraftAutosave` exports exactly `STORAGE_KEY` / `MANIFEST_KEY` /
  `SCHEMA_VERSION` / `create`; `create()`'s returned instance exports exactly `STORAGE_KEY` / `MANIFEST_KEY`
  / `SCHEMA_VERSION` / `chunkSize` / `save` / `schedule` / `flush` / `load` / `clear` / `hasDraft` /
  `formatSavedAt`, with the resolved `chunkSize` (default 200).
- Option resolution: `chunkSize` floors and clamps to a minimum of 1 (0 and negatives → 1), falls back to
  200 when non-finite/omitted; `debounceMs` clamps negatives to 0, falls back to 650 — checked via the
  actual `ms` handed to the fake `setTimeout` inside `schedule()`.
- `save()`: single- and multi-chunk writes (chunking by `chunkSize`, per-chunk `index`/`rowCount`); a
  smaller re-save removes the now-unused higher-index chunk keys left by a larger prior save; non-array
  `rows` treated as `[]` (ok:true, rowCount 0, chunkCount 0, no chunk written); `cleanRow` strips
  `__internalId` and silently drops non-object/array/primitive rows from what's actually **stored** —
  **but `rowCount` in both the return value and the manifest still reports the raw (pre-drop) length**,
  a real inconsistency, pinned by test; storage without `setItem` → `{ok:false, reason:"storage-unavailable"}`;
  `setItem` throwing `QuotaExceededError` → `reason:"quota"`, any other throw → `"write-failed"`, the
  `Error` object attached either way, never thrown out of `save()`.
- `resolveStorage`: an explicit `storage` argument wins; omitting it falls back to `window.localStorage`;
  a throwing `localStorage` accessor degrades to no storage (an ok:false result) rather than crashing.
- `load()` / `readManifest` / `loadV2`: missing / corrupt-JSON / JSON-null / non-object / wrong-`schemaVersion`
  / non-array-`chunks` / invalid-or-falsy-`savedAt` manifests all → `null`; a chunk whose stored length
  mismatches its own `rowCount`, holds a non-object row, is corrupt JSON, or was never written at all →
  invalidates the **whole** load (`null`, not a partial result); a valid multi-chunk manifest concatenates
  rows in original order and normalizes `savedAt` to ISO.
- `load()` / `loadLegacy`: a valid v1 record normalizes (`activeLevel` defaults to `"ALL"`); wrong
  `schemaVersion` / non-array `rows` / invalid `savedAt` / a store with no `getItem` at all → `null`,
  never throws; a valid v2 draft always wins over a present legacy draft.
- `schedule()`: repeated calls debounce into **one** pending timer at the resolved `debounceMs`; firing it
  saves the **latest** call's args (the earlier one is fully superseded, its `onSaved` never invoked) and
  invokes `onSaved` with the `save()` result; `onSaved` is optional.
- `flush()`: cancels a pending `schedule()` timer and saves synchronously with its **own** args (not the
  scheduled ones), returning the result directly; with nothing pending it's just an immediate `save()`.
- `clear()`: removes the manifest key, the legacy key, and every chunk key the manifest listed, and cancels
  a pending `schedule()` timer too; returns `true`; a store with no `removeItem`, or one that throws, →
  `false`, never throws.
- `hasDraft()`: true for a valid v2 manifest, true for a legacy-only draft, false when neither is present
  or valid.
- `formatSavedAt()`: a parseable timestamp → non-empty locale string; falsy/unparseable input (`''`,
  `undefined`, `null`, `0`, `'not-a-date'`) → `''`.
- Static note (not a static-contract test, since there's nothing to bind to yet): a scan of every shipped
  `.html` file confirms none currently loads `authoring-draft-autosave.js` — see Findings.

`node tests/run.js`: 450 → **475** (+25). Header comment extended.

## Mutation-checked (each verified, then reverted)
Ran a scripted sweep of 33 hand-written mutations across every constant, clamp, conditional and cleanup
branch in the file (key/constant values, `resolveStorage`'s truthy check and catch-fallback, `timestamp`'s
finite check, `cleanRow`'s type/array guard and key filter, `chunkKey`'s arithmetic, both `Math.max` option
clamps, `readManifest`'s three-part validity check taken apart term-by-term, `loadV2`'s length-mismatch and
row-type checks, `save()`'s array-coercion, loop bound, `Math.min` clamp and the stale-chunk cleanup
off-by-one, the quota-vs-generic-error branch, `schedule()`/`flush()`'s `clearTimeout` calls, `clear()`'s
legacy-key and chunk-removal lines, `hasDraft()`'s `||`, `formatSavedAt()`'s ternary, and both exported-keys
object literals) — **33 killed, 0 survivors**. The file was rewritten and restored from an in-memory
original for every mutation; `diff` after the sweep confirms it is back to byte-identical.
(`authoring-draft-autosave.js` is not a core-pack file, so no `core.zip` exclusion was needed this time —
confirmed with `unzip -t offline/packs/core.zip`, which still reports no errors.)
`diff -rq` against the Agent 177 zip confirms the tree is byte-identical after all reverts: only
`tests/run.js` and this doc differ.

## Findings (not changed)
- **`save()`'s `rowCount` can overstate what's actually stored (new, low severity).** `cleanRow` silently
  drops any row that's `null`/an array/a non-object primitive when writing chunks, but the manifest's
  (and the `save()` return value's) `rowCount` is taken from the *raw* input array length, not the count
  actually written. A caller that trusts `rowCount` to mean "rows on disk" will be wrong whenever the
  editor's row list contains a hole. Every per-**chunk** `rowCount` is internally consistent (it's derived
  from what was actually written to that chunk and is what `loadV2` checks against), so this only ever
  shows up in the top-level total. Unreachable today only because there is no caller yet (see next point);
  worth a decision — either filter before computing `rowCount`, or document it as "attempted rows" rather
  than "saved rows" — before a UI is built on top of it. Pinned by test.
- **`authoring-draft-autosave.js` has no caller yet.** Like Agent 177's `orientation.js`/`app-shell.js`
  turn, this is pure test-scaffolding for a module nothing in the shipped site currently loads — grep
  confirms no `.html` page references it (`authoring-validation.js`, item 13's next module, is in the same
  boat). A static-note test pins this and will fail loudly (telling the next agent to add the real
  static-contract test) the day some `authoring.html` starts wiring it up.
- **`resolveStorage`'s `global` is the outer IIFE's `window`, not literally `globalThis`.** Harmless in
  the shipped page (where `window` the identifier and the browser's real global are the same object), but
  worth knowing if this module is ever loaded as a CommonJS/ES module instead of a plain `<script>`.

## Files changed
- `tests/run.js` only (one new section, header comment). No application code touched.
- `HANDOFF_AGENT_178.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **475 passed, 0 failed** (Agent 177 left 450; net +25, none removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip` unchanged and valid (`unzip -t` clean); `CACHE_VERSION` unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 177, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: `offline-packs-ui.js` (~8 KB), `mastery-review-ui.js` (~13 KB),
    `authoring-validation.js` (~17 KB). (`authoring-draft-autosave.js` — **CLOSED** this turn;
    `orientation.js`/`app-shell.js` closed by Agent 177; quiz.html keyboard layer, `load()` and
    `splash.js` closed earlier.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176); a fix candidate
    already exists in `app-shell.js`'s ROOT-derivation approach (Agent 177).
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; HTML5 drag-and-drop
    unverified on iPhone Safari (Agent 176).
18. [LOW] `orientation.js` coercion quirks and the "medium at both extremes" confidence rule (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages and directory URLs (Agent 177).
20. [LOW] `authoring-draft-autosave.js`'s `save()`/manifest `rowCount` can overstate the number of rows
    actually written when the input array contains invalid entries (Agent 178, above).
21. [INFO] `authoring-draft-autosave.js` is unused by any shipped page — same situation as
    `authoring-validation.js` (item 13); whichever authoring UI eventually lands should add the matching
    static-contract test the other modules have (Agent 178, above).

## Next agent — start here
1. `offline-packs-ui.js` (~8 KB): can build on the Agent 159 fake Cache Storage helper already in this
   file. Read the file first — nothing about its behaviour is assumed here.
2. Then `authoring-validation.js` (~17 KB, likely pure logic — good for table-driven tests; also currently
   unwired, see item 21) and `mastery-review-ui.js` (~13 KB).
3. Items 1, 2, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21 need a product decision (17 also needs a real
   device) before any code changes.

## Blockers
None.

## Assumptions made
- Treated `authoring-draft-autosave.js` as the correct next item per Agent 177's explicit "start here"
  ordering (smallest untested module, same vm-sandbox recipe as before) rather than reordering.
- Manually drove `setTimeout`/`clearTimeout` as bare context globals rather than `window.setTimeout`,
  because that's how this file (unlike `app-shell.js`) actually calls them — verified by grep before
  writing the sandbox, per the standing rule to read the file first rather than assume its behaviour.
- Pinned the `rowCount`-overstatement quirk as a finding rather than "fixing" it: this turn is test-only,
  and there is no caller yet to know whether "attempted" or "written" is the intended semantic.
- Added a static "nothing wires this up yet" test (rather than skipping a static-contract test entirely)
  so the day a page does start using this module, the test fails loudly and points the next agent at the
  pattern the other modules already use.

## Artifacts produced
- `mylingo-v160-agent178-authoring-draft-autosave-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_178.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_178.md. You are Agent 179. Continue from 'Next agent — start here'."
