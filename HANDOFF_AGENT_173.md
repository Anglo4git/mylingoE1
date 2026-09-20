# Agent 173 Handoff — Test Coverage for the Lesson Gate (quiz.html)

## Context
Picked up `HANDOFF_AGENT_172.md`, "Next agent — start here" item 1: `getLevelLessons` / `findOwningLesson` /
`enforceLessonGate` guard real navigation (`location.replace`) and share the lesson-list fetch that the
suggestion tiering reuses. They had no direct test. No source changes this turn — pure test-coverage addition.

## What was done
Added one section to `tests/run.js`: **"quiz.html lesson gate: getLevelLessons/findOwningLesson/
enforceLessonGate (Agent 173)"**, after the Agent 172 section, before "offline-packs.js".

**Approach:** the REAL three functions (extracted with `extractFn`) run in a `vm` sandbox with a URL-routed
stub `fetch` (records URL+options; routes may serve JSON, `'HTTP500'`, or `'REJECT'`) and a recording
`location.replace`. Uses `testAsync` (queued, run at the end) because all three are async/promise-based.
`level`/`id`/`lessonParam`/`redirect` are sandbox globals, overridable per test.

12 new tests (`node tests/run.js`: 334 → 346):
1. `findOwningLesson`: falsy id or any `placement-*` id (case-insensitive) → null, and never fetches.
2. `findOwningLesson`: matches only lessons whose `exercise_quiz_ids` is an ARRAY containing the id (a string
   value is never substring-matched); unknown → null.
3. `getLevelLessons`: fetches `../course_content/lessons/<level>.json` with `{cache:'no-store'}`; same promise
   object shared across callers; exactly one request.
4. Per-level HTTP error OR network failure → falls back to `../course_content/lessons.json`.
5. Both sources failing, or a non-array payload → `[]` (never rejects); `findOwningLesson` then finds nothing.
6. A failed load is cached as `[]` for the page's lifetime (no retry) — pinned current behaviour (see Finding).
7. `enforceLessonGate`: un-owned quiz → `false`, no redirect.
8. Placement quiz never gated, even if a lesson lists it.
9. `?lesson=` equal to the owning lesson → passes through.
10. Missing / empty / different-lesson param → `location.replace` to `../courses/lesson.html?lesson=…&level=…
    &redirect=…`, returns `true`.
11. Redirect target: default back-link is `../courses/course.html?level=<level>`; explicit `?redirect=` wins;
    lesson id, level, and redirect are all URL-encoded.
12. Lesson list unloadable → gate FAILS OPEN (`false`, no redirect).

## Mutation-checked (each kill verified, then reverted)
Removing the placement regex (kills 1, 8); removing the `lessonParam` pass-through (kills 9); un-encoding
`backTo` (kills 11); dropping the `Array.isArray` guard (kills 2); removing promise caching (kills 3, 6);
removing the `!r.ok` throw (kills 4); ignoring explicit `redirect` (kills 11); dropping the array coercion
(kills 5). `md5sum` over every project file confirms the tree is byte-identical to the Agent 172 baseline
after reverts (only `tests/run.js` and this doc differ).

## Findings (not changed)
- **Lesson gate fails open**, same policy family as carried item 1 (level-lock fail-open vs fail-closed):
  if both lesson-list fetches fail, a lesson-backed quiz is playable directly, skipping the lesson. Pinned by
  test 12; the fail-open/closed decision for the lock and the gate should probably be made together.
- **Failed lesson-list load is cached forever** (`_levelLessonsPromise` keeps a resolved `[]`), unlike the
  runtime content loader, which evicts failed loads and retries (Agent 163). A transient offline blip at first
  load therefore disables gating and lesson-based suggestions until reload. Pinned by test 6. Fix would be to
  clear `_levelLessonsPromise` when both sources fail; needs a yes/no since it changes behaviour.

## Files changed
- `tests/run.js` only. No application code touched.

## Current state
- Tests: PASS — `node tests/run.js` → **346 passed, 0 failed** (Agent 172 left 334; net +12, none removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip` unchanged and valid; `CACHE_VERSION` unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 172, updated)
1. [DECISION] level-lock fail-open vs fail-closed (now also covers the lesson gate — see Findings).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173, above).
13. Still untested: `load()` itself (the orchestration around the now-tested gate: `!id` error state, the
    `recommended=1` lock bypass, lock check, data fetch, start screen), keyboard layer (`onOptionKeydown`,
    `moveFocus`, global keydown handler), `orientation.js`, `mastery-review-ui.js`, `app-shell.js`,
    `authoring-*`, `splash.js`, `offline-packs-ui.js`. (Lesson gate — **CLOSED this turn**.)

## Next agent — start here
1. Keyboard layer: `onOptionKeydown` (Arrow keys via `moveFocus`; Enter/Space click the target unless
   `locked`; ignores non-`#options > .option` targets), `moveFocus` (wraparound, `tabIndex` roving, no-op when
   `locked` or empty), and the document keydown handler (digit N clicks the Nth enabled radio option; ignored
   when `locked`, no `data`, or start/end/error screen is `display:grid`). `extractFn` + a vm sandbox works;
   the document handler is an inline `addEventListener` (not a named function), so capture it via a stubbed
   `document.addEventListener` or extract by source slice.
2. Or `load()` orchestration (`extractFn(html,'load')`): `!id` → `errorState`; `recommended=1` bypasses the
   lock; level locked → locked state; gate redirect stops the load; happy path shows the start screen.
3. Items 1, 2, 10, 11, 12 need a product decision before any code changes.

## Blockers
None.

## Assumptions made
- Pinned the cache-forever-on-failure behaviour rather than fixing it: this turn is test-only and the retry
  policy interacts with the fail-open decision (item 1).
- Used real `location.replace` argument strings (exact-match) for the redirect URL: the URL shape is a
  contract with `lesson.html`'s query parsing, so a change should be deliberate.

## Artifacts produced
- `mylingo-v159-agent173-lesson-gate-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_173.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_173.md. You are Agent 174. Continue from 'Next agent — start here'."
