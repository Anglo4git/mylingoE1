# Agent 189 Handoff — shared/quiz.html inline-script coverage audit (item 1)

## Context
Picked up `HANDOFF_AGENT_188.md`, "Next agent — start here" item 1. Baseline: 742 passed, 0 failed.

## Audit (item 1)
Listed all top-level functions in `shared/quiz.html`'s inline script and cross-checked each against
`tests/run.js`. Found 14 with zero real coverage (present only as names inside stubs/comments, never
actually executed):

- `configureStart`, `startFresh`, `resumeSession`, `applyResponseToUI` — the Start/Resume session flow
- `show`, `setBackgroundInert` — overlay switching
- `updateSoundIcon`, `updateSpeedBtn` — sound/speed buttons
- `renderCourseStrip`, `escStrip` — course strip header
- `loadSuggestions`, `lessonSuggestionIds`, `getManifest`, `categorySuggestions` — the result-screen
  suggestion pool chain
- `valuesEqual` — confirmed **genuine dead code**: defined at line 945, never called anywhere in the
  file (`submitAnswer` inlines its own per-type comparison instead of using it). Deliberately left
  untested; flagged below instead of covered.

## Tests: 742 → 764 (+22)
New section "quiz.html: sound/overlay UI helpers, course strip, the start/resume/replay flow, and the
suggestion-pool chain (Agent 189)", 17 sync + 5 async cases, added right before `finish()`/`report()`
at the end of `tests/run.js` (execution order doesn't matter there — `test()`/`testAsync()` just
register into the pass/fail counters and `queuedAsync`, and nothing runs the async queue until
`runCourseProgressTests().then(finish)` fires after the whole file has executed).

Technique: same as the Agent 164/175 sections — the REAL functions are lifted out of `shared/quiz.html`
by name (brace-matched via the existing `extractFn`) into a `vm` sandbox, not reimplemented. A small
local `QEl` class (scoped to this section only, doesn't touch the shared `PN` class used elsewhere)
supports `classList`/`dataset`/`style`/`querySelector(All)` for the handful of compound selectors these
functions use (`.option[data-index="n"]`, `select[data-left]`, `.rank-list`). Collaborators that already
have dedicated coverage elsewhere — `render()`, `finishAnswer()`/`submitAnswer()`, `stopAllSounds()` —
are stubbed as call-recorders so the tests isolate what was actually uncovered; session read/write,
`sessionForCurrentQuiz`, `gradedTotal`, `rawType`, `normalizeText`, `updateRanks`, `setTextSmooth` are
the real code, since `configureStart`/`startFresh`/`resumeSession` genuinely depend on it working.

Coverage added:
- `updateSoundIcon` / `updateSpeedBtn`: both icon/label states
- `escStrip`: all five HTML-sensitive characters; null/undefined → `''`
- `renderCourseStrip`: course+unit with separator, course-only (no separator), missing param = no-op,
  escaping
- `show()` / `setBackgroundInert()`: overlay display switching, `inert` set/cleared on header+main,
  `MylingoAppShell.setVisible` called correctly, and tolerates a missing `MylingoAppShell`
- `configureStart`: no-session vs. has-session button states, `placement-120` special label
- `startFresh`: resets index/score/answerCorrect, clears+rewrites the session, stops sounds, hides
  overlays, calls `render()`
- `resumeSession`: no-session falls through to `configureStart()`+`startFresh()`; existing session
  restores position/score; an answer already recorded at the resume index is replayed through the REAL
  `applyResponseToUI()` and re-graded via `finishAnswer()`, with `restoringSessionAnswer` true only
  during the replay
- `applyResponseToUI`: radio, checkbox, dropdown, text-like (null → `''`), matching (case/whitespace-
  insensitive key match), ranking (reorder + renumber via the real `updateRanks`)
- `getManifest` / `lessonSuggestionIds` (tier 1, tier 2 fallback, owner-not-found, no-lessonParam) /
  `categorySuggestions` (filters + excludes self + sets `suggestPool`) / `loadSuggestions` (all three
  branches: lesson ids resolve, lesson ids don't resolve → category fallback, no lesson → category)

Note for future agents extending this section: an object/array literal built *inside* the vm sandbox
(e.g. `tier2=[]` then `.push()`, or `answerCorrect={}`) is an inner-realm value, and
`assert.deepStrictEqual` against an outer literal fails with "same structure but are not
reference-equal" even though the values look identical when printed. A `clone189()` helper (JSON
round-trip) is provided in the section and used wherever a result might be sandbox-constructed;
anything sourced entirely from an outer-realm literal (e.g. a stub's return value that was never
touched by vm-internal `[]`/`{}` construction) doesn't need it, but wrapping is harmless either way.

No harness changes were needed; no source file was touched (verified byte-identical against the
Agent 188 zip — `shared/quiz.html`, `sw.js`, `offline/core-manifest.json` all match by hash).

## Mutation-checked
5 targeted mutations against the newly-tested functions, all killed:
- `startFresh`: removing the `clearSession()` call → caught
- `show`: dropping the `setBackgroundInert()` call → caught
- `updateSoundIcon`: flipping the `aria-pressed` value → caught
- `categorySuggestions`: dropping the exclude-self (`item.id!==data.id`) filter → caught
- `applyResponseToUI` ranking: dropping the `updateRanks(list)` call after reorder → caught

File restored byte-identical after each mutation (hash-verified).

## Source change → cache bump + core.zip
**None.** Only `tests/run.js` changed this round; no shipped file (`index.html`, `main/index.html`,
`shared/*`, `<level>/dashboard.html`, `sw.js`, `offline/*`) was touched, so `CACHE_VERSION` stays at
`mylingo-v16` and `offline/packs/core.zip` is unchanged from Agent 188's build (verified byte-identical).

## Findings (pinned / not changed)
- **[INFO]** `valuesEqual` (quiz.html:945) is dead code — safe to delete in a future cleanup pass, but
  left in place here since removing it wasn't in scope for a coverage-only task.

## Current state
`node tests/run.js` → **764 passed, 0 failed**; `node --check tests/run.js` clean; `CACHE_VERSION` =
`mylingo-v16` (unchanged); `core.zip` unchanged.

## Remaining / carried forward
Items 2 (normalised-diff test between `index.html` and `main/index.html`), 1/2/10–12/14–29 carried
list from HANDOFF_AGENT_186/187, plus:
33. [INFO] `valuesEqual` dead code (quiz.html:945) — consider deleting in a cleanup pass.

## Next agent — start here
1. Item 2 from Agent 188: a normalised-diff test between `index.html` and `main/index.html` (they're
   near-duplicates, differing only by path prefixes — easy to drift silently).
2. Then item 1/2/10–12/14–29 carried list (decisions: fail-open modules etc.).
3. Optional cleanup: delete dead `valuesEqual` from `shared/quiz.html` (item 33) if in scope.
4. If a core-pack file changes, bump `CACHE_VERSION` and rebuild `offline/packs/core.zip` (python
   zipfile, same member order/attrs as the existing zip).

## Blockers
None.

## Artifacts
- `mylingo-v166-agent189-quiz-coverage.zip`, `HANDOFF_AGENT_189.md`.

## Resume command
"Resume from HANDOFF_AGENT_189.md. You are Agent 190. Continue from 'Next agent — start here'."
