# Agent 198 Handoff — level-lock.js direct unit coverage + mutation sweep (no source change)

## Context
Picked up `HANDOFF_AGENT_197.md`, "Next agent — start here" item 2 (the backlog is decision-gated;
in the meantime, deepen regression coverage or run a fresh mutation sweep on a file that already has
coverage but hasn't had one). Baseline verified first: `node tests/run.js` → 782 passed, 0 failed.

## Why level-lock.js
It's the module every level-gating decision in the app ultimately calls (course.html's hard gate,
lesson.html's gate, the dashboards' locked state, courses/index.html and placement.html's link
decoration) and it's exercised heavily *through* those pages (40 mentions across the test file), but
its own direct unit coverage was thin: 4 tests, all through `isLocked`/`setAssigned`/`setManualIfUnset`.
`read()`, `write()`'s failure/best-effort paths, `clear()`, `ceilingIndex()`, `label()`,
`renderLockedState()`, and — critically — `decorateLevelLinks()` (the DOM-mutating function every page
above actually calls) had never been called directly in a unit test, only indirectly through a full
page harness. A regression in one of those could easily hide behind an unrelated page-level assertion
passing for the wrong reason.

## What was done
New section in `tests/run.js`, directly after the existing thin level-lock.js section (before the
"recommendations.js + level-lock.js interaction" section), plus a header-comment addition to this doc.
It runs the REAL `shared/js/level-lock.js` in its own `vm` sandbox — separate from the shared
`fakeWindow` singleton the rest of the file uses, so a fake `document`/`getComputedStyle` doesn't leak
into unrelated sections — reusing the `PN` mini-DOM class already hoisted for the page-level tests.

**level-lock.js: 20 new tests** covering every exported member directly:
- `normalize()`: case-insensitivity, rejects unknown/whitespace/falsy/`0` input (documents that it is
  NOT trimmed — `'a1 '` is rejected, not accepted as `'a1'`).
- `LEVELS`/`LEVEL_LABEL` export shape: `LEVELS` is a defensive copy (mutating it doesn't touch the
  module's internal list); `LEVEL_LABEL` is exported **by reference** (mutating it DOES stick) — noted
  as a pinned, latent asymmetry, not fixed (nothing shipped ever mutates it).
- `read()`: missing key, malformed JSON, a throwing `getItem`, non-object JSON (array/number/string/
  `null`) all → `null`, never a throw; an invalid stored `level` discards the whole record (not just
  the level); missing `source`/`timestamp` default to `'manual'`/`null`.
- `write()` (via `setAssigned`/`setManualIfUnset`): an invalid level is a true no-op (storage
  untouched, no event); a valid level stores exactly `{level,source,timestamp}`, dispatches
  `mylingo:levellock` with that same record, and returns it; a throwing `setItem` OR a throwing
  `dispatchEvent` is swallowed either way and the record is still returned (best-effort, per the
  module's own comment).
- `setManualIfUnset()`: writes `source:'manual'` when nothing is set; is a true no-op (returns the
  existing record) once anything is set, whatever level is passed the second time.
- `clear()`: removes the record (ceiling back to `-1`, nothing locked); a throwing `removeItem` is
  swallowed.
- `ceilingIndex()`/`isLocked()`: the ceiling level itself is open (inclusive boundary); unrecognized
  input is never reported locked regardless of the ceiling.
- `label()`: uppercase for a valid level, `''` for anything invalid.
- `renderLockedState()`: null container is a no-op; nothing-chosen vs a-level-chosen copy; custom
  `backHref`; fully replaces prior content.
- `decorateLevelLinks()`: null container is a no-op; an invalid/missing `data-level` node is skipped
  untouched; an unlocked card is untouched and clicking its link commits the manual choice (only when
  nothing was set yet); a locked card gets the class + exactly one overlay, its link gets
  `aria-disabled` and its click handler calls `preventDefault()` and never commits a choice; the
  container element itself can be the anchor (`node.tagName === 'A'` branch); re-decorating while still
  locked doesn't duplicate the overlay or re-bind the click listener (`dataset.mylingoLockBound` guard);
  a level that unlocks between two calls (ceiling advances) cleanly removes the class, the overlay, and
  the neutralizing attributes so the link works normally again; `getComputedStyle().position` is only
  forced to `'relative'` when it was `'static'` — an already-positioned ancestor is left alone.

`node tests/run.js`: 782 → **805 passed, 0 failed** (23 new: 20 direct + 3 that surfaced while wiring
the harness — see "process notes" below). `node --check tests/run.js` and `node --check
shared/js/level-lock.js` both clean.

## Mutation sweep
A throwaway Python script (not shipped) applied 29 hand-written single-point mutations to
`shared/js/level-lock.js` — one per logical branch (case-folding, the `read()`/`write()` validation and
default-filling, both `try/catch` swallows in `write()`, both in `clear()`'s and `write()`'s error
paths, `ceilingIndex()`'s `-1` fallback, `isLocked()`'s three branches, `label()`, `renderLockedState()`'s
guard/default `backHref`, and every branch of `decorateLevelLinks()` including the two idempotency
guards) — reran the full suite after each, and restored the file. **Result: 29/29 killed, 0 survivors.**
The file was confirmed byte-identical to the original afterward (`diff`). This is a stronger result than
several earlier sweeps in this project (which typically found 1–3 equivalent-mutant survivors), because
level-lock.js's public surface is small and this turn's new tests deliberately assert on every branch by
name rather than only on end-to-end outcomes.

## No source change → no cache bump
`shared/js/level-lock.js` is byte-identical to the input; no bug was found (unusual for a first direct
unit pass on an unaudited file, but consistent with how heavily this module is already exercised
end-to-end through 40+ page-level assertions across six pages — a real regression here would already
have surfaced there). `sw.js` `CACHE_VERSION` stays `mylingo-v20`; `offline/packs/core.zip` untouched
(`unzip -t` clean, identity test passes). Only `tests/run.js` changed (confirmed by `diff -rq` against
the Agent 197 zip: exactly one file differs).

## Process notes (for whoever reuses this harness pattern)
- **Don't reuse the shared `fakeWindow` for DOM-touching functions.** `loadModule()` runs code via
  `new Function('global','window', code)`, which does NOT put a fake `document`/`getComputedStyle` in
  scope — bare references inside the module resolve through Node's real global scope, so
  `decorateLevelLinks()` would throw or silently misbehave. This section instead builds its own
  `vm.createContext` sandbox per test (`makeLL()`), the same technique the page-level sections
  (Agents 183–188) already use via `makeRunPage`, just without the HTML-page scaffolding.
- **`assert.deepStrictEqual` across a vm boundary fails on prototype identity, not content** — two
  structurally-identical plain objects from different realms (the sandbox's `Object.prototype` vs the
  test file's) are "not reference-equal" even though `assert.strictEqual` on their individual fields
  passes fine. Two of the three initial test failures this turn were this gotcha, not real bugs; fixed
  by comparing fields (or `JSON.parse(JSON.stringify(x))`) instead of the whole object across the
  boundary. Keep this in mind for any future direct-vm-sandbox unit section.
- **PN's `click()` sends a bare `{type:'click'}`** (no `preventDefault`), so a test that needs to prove
  a handler calls `e.preventDefault()` must invoke the stored listener directly with a stub event
  instead of calling `.click()`.

## Tests: 782 -> 805 (+23)
`node tests/run.js` → **805 passed, 0 failed**.

## Remaining / carried forward (unchanged from Agent 197)
Same decision-gated backlog: items 1, 2, 10, 17, 19, 21–29, 35. No new findings this turn — the sweep
and new tests confirmed level-lock.js behaves exactly as its existing page-level tests already implied;
nothing new to pin.

## Next agent — start here
1. Same as Agent 197 left it: this backlog is decision-gated. If a product decision arrives on any item,
   implement it directly (flip the pin in the same change).
2. If not, repeat this turn's pattern on another already-covered-but-not-mutation-swept file. Good
   candidates by mention count / no prior scripted sweep: `course-progress.js` (31 mentions, gates a lot
   of mastery-percent logic), `skill-mastery.js` / `review-scheduler.js` (15/12 mentions, feed the
   mastery-review-ui panel), or `gamification.js` (15 mentions, XP/streak/backup — user-facing numbers).
   Reuse `makeLL()`'s pattern (own `vm.createContext`, not the shared `fakeWindow`) for any of them that
   touch `document`.
3. If a core-pack file changes, bump `CACHE_VERSION` (currently `mylingo-v20`) and rebuild
   `offline/packs/core.zip` from ALL on-disk sources (the identity test catches a partial rebuild).

## Blockers
Product decisions for the DECISION backlog; a real device for item 17.

## Artifacts
- `mylingo-v175-agent198-level-lock-unit-coverage.zip`, `HANDOFF_AGENT_198.md`.

## Resume command
"Resume from HANDOFF_AGENT_198.md. You are Agent 199. Continue from 'Next agent — start here'."
