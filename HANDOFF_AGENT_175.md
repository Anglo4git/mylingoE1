# Agent 175 Handoff — Test Coverage for load() (quiz.html page bootstrap)

## Context
Picked up `HANDOFF_AGENT_174.md`, "Next agent — start here" item 1: `load()` is the orchestration that
decides, on every quiz page open, whether the learner sees an error, gets redirected to a lesson, or reaches the start
screen. Its parts (lesson gate, validate, adapters) were tested; the ordering and error mapping around them was not.
No source changes this turn — pure test-coverage addition.

## What was done
Added one section to `tests/run.js`: **"quiz.html load(): the page bootstrap / orchestration (Agent 175)"**, after the
Agent 174 section, before "offline-packs.js". Extended the file-header scope comment.

**Approach:** the REAL `load`, `resolveQuizPath`, `validate` (+ `rawType`, `answerList`, `correctIndexes`,
`acceptedAnswers`, `questionText`, `normalizeText`) run in a `vm` sandbox. Everything `load()` talks to is a recording
stub in ONE ordered `calls` log: `show`, `errorState`, `configureStart`, the `$` element lookup (elements created on
demand), `document.title`, a URL-routed `fetch` (`value | 'HTTP404' | 'HTTP500' | 'REJECT'`),
`window.MylingoLevelLock` / `MylingoRuntimeContentLoader` / `MylingoRuntimeV2`, `location.replace`, `console.warn`.
`enforceLessonGate` is a stub by default (isolates the orchestration); `gate:'REAL'` swaps in the real Agent 173
functions. URL-derived page constants (`id`, `level`, `mode`, `directRecommended`, `lessonParam`, `redirect`) are sandbox
globals. `testAsync` throughout (load is async).

23 new tests (`node tests/run.js`: 358 → 381):
1. Wiring: bare `load();` bootstrap call; `retryBtn.onclick` → `stopAllSounds(); load()`.
2. First call is always `show('loading')`; missing/empty id → "No quiz to load" (not retryable) and NOTHING else runs.
3. Locked level (normal mode) → "Level locked" (not retryable); lock asked about the page level; gate/fetch/loader/
   normalize never run; no start screen.
4. Unlocked: order is show(loading) → isLocked → gate → loader, then the start screen.
5. `recommended=1` bypasses BOTH the lock and the gate, even on a locked level, and still loads.
6. `mode=placement` bypasses the lock and the gate.
7. level-lock.js missing → fail-open with a `console.warn` naming the level; no warn when the lock is bypassed; a
   throwing `console.warn` is swallowed.
8. Gate returns true → load STOPS before any fetch/loader/normalize; no error; only `show('loading')`.
9. REAL gate integration: a lesson-backed quiz without `?lesson=` → `location.replace(lesson.html…)` and nothing loaded;
   with `?lesson=<owner>` it loads normally.
10. `resolveQuizPath`: placement-120 (any case) → assessment file; other `placement-*` → `../placement/<level>/<id>.json`;
    everything else / malformed ids → null.
11. Placement ids are fetched directly with `{cache:'no-store'}`; the runtime loader is NOT used.
12. Non-placement ids go through `MylingoRuntimeContentLoader.load(level, id)`; no direct fetch.
13. Loaded JSON → `normalizeQuiz(json,{level})`; the NORMALIZED result becomes `data`.
14. 404 (placement fetch `!ok`/404, or loader rejection with status 404) → "Quiz not found", not retryable.
15. Any other failure (HTTP 500, network error, non-404 status, bare `null` rejection, unparseable body) → "Connection
    problem", RETRYABLE.
16. `normalizeQuiz` throwing → "Quiz data error" / "corrupted", not retryable.
17. `validate()` failure → "Quiz data error" carrying validate()'s own message (3 cases), `data` unset.
18. Happy path: `data`, `document.title` ("Mylingo · …"), top/start titles, "N questions · description", level badge;
    then `show(start)` → `configureStart()` → `startBtn.focus()` in that order.
19. Happy path fallbacks: description default, level badge (quiz level wins over URL level, else URL level upper-cased),
    category badge shown only when a category exists.
20. Only `placement-120` (any case of `data.id`) gets the 120-question start note / "Start level assessment" label.
21. A `placement-*` id WITHOUT `mode=placement` is still lock-checked, is never gated, and is still fetched from its
    placement file.
22. PINNED: missing `MylingoRuntimeContentLoader` → retryable "Connection problem"; missing `MylingoRuntimeV2` →
    non-retryable "Quiz data error / corrupted" (see Findings).
23. Re-runnable (Retry): failed run then successful run ends on the start screen with `data` set
    (`show` log: loading, loading, start).

## Mutation-checked (each kill verified, then reverted)
30 mutations, 29 killed, 1 equivalent survivor (the `core.zip` byte-identity test fails on ANY `quiz.html` edit because
`quiz.html` is a core-pack file — excluded from the kill count). Killed: `!id` guard removed; no-quiz retry flag flipped;
lock ignoring `directRecommended`; lock ignoring placement mode; locked error not returning; warn always / warn not
swallowed; gate result ignored; gate running for recommended / for placement; regex `/i` dropped; placement-120 made
case-sensitive; placement fetch `cache` dropped; `!res.ok` unchecked; null-rejection unsafe (`e.status`); 404 retry
flipped; Connection-problem retry flipped; loader args swapped; normalize options dropped; normalize error made
retryable; `validate` result ignored; `data=normalized` removed; title prefix; description fallback; level-badge
fallback; category always shown; 120 case-sensitive; start order swapped; start focus dropped.
**Equivalent survivor:** removing `encodeURIComponent` in `resolveQuizPath` — the id is already restricted to
`[a-z0-9_-]` by the regex and `level` is validated to a1–c2 by the page, so encoding is a no-op for every reachable
input (defence in depth only). `md5sum` over every project file confirms the tree is byte-identical to the Agent 174
baseline after reverts (only `tests/run.js` and this doc differ).

## Findings (not changed)
- **A runtime script that fails to load is reported as a network problem.** If `runtime-content-loader.js` is missing,
  `window.MylingoRuntimeContentLoader.load` throws a TypeError inside the try, which lands in the generic branch:
  "Connection problem — check your connection and try again" with a Retry button that can never succeed. A missing
  `runtime-v2-adapter.js` is reported as "This quiz file is corrupted". Both only happen if a script tag/precache entry
  is broken (the static wiring and precache tests guard that), so it is low-probability. Pinned by test 22. Fix
  candidate: check for the global up front and show a distinct non-retryable "Something went wrong loading the app,
  reload" state. Needs a yes/no (new user-facing copy) — carried item 15.
- Level-lock fail-open when level-lock.js is missing is now pinned at the `load()` level too (test 7); it belongs to the
  carried item 1 decision.
- A placement id opened WITHOUT `mode=placement` is lock-checked (so a locked level shows "Level locked"), unlike the
  in-app placement links which always pass `mode=placement`. Pinned by test 21; no evidence any link is built that way.

## Files changed
- `tests/run.js` only (new section + header comment). No application code touched.

## Current state
- Tests: PASS — `node tests/run.js` → **381 passed, 0 failed** (Agent 174 left 358; net +23, none removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip` unchanged and valid; `CACHE_VERSION` unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 174, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also covers the lesson gate — Agent 173 — and load()'s
   missing-level-lock path, pinned by Agent 175 test 7).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: the ranking-row keydown handler (ArrowUp/ArrowDown reorder, inline in `renderRanking`) and the
    text-input Enter-to-submit (inline in `renderTextLike`); `orientation.js`, `mastery-review-ui.js`, `app-shell.js`,
    `authoring-*`, `splash.js`, `offline-packs-ui.js`. (`load()` — **CLOSED this turn**.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175, above).

## Next agent — start here
1. The two inline keydown handlers left in item 13: ranking-row reorder (`row.addEventListener('keydown', …)` in
   `renderRanking`: ArrowUp at index>0 moves the row up, ArrowDown at index<last moves it down, both
   `preventDefault()`, then `updateRanks(list)` and `row.focus()`; no-ops at the ends) and text Enter-to-submit
   (`input.addEventListener('keydown', …)` in `renderTextLike`: Enter → `preventDefault()` +
   `submitAnswer({value:input.value})`). Drive them through the Agent 172 `FakeElement` sandbox (the `renderSandbox()`
   in the "render()" section): `dispatch('keydown', {key, preventDefault})` reaches the listeners on the elements it
   builds. Note `renderRanking`'s rows live in a `list` container whose `children` order is the state.
2. Or a small module: `orientation.js` (5.6 KB), `splash.js` (2 KB) or `app-shell.js` (6 KB) — each is standalone and
   loadable with `loadModule` + the shared fake window; pick whichever has DOM-light logic.
3. Items 1, 2, 10, 11, 12, 14, 15 need a product decision before any code changes.

## Blockers
None.

## Assumptions made
- Stubbed `enforceLessonGate` by default so load()'s ordering is tested in isolation, with ONE integration test (and one
  placement-without-mode test) using the real Agent 173 gate functions.
- Used the real `validate()` (and its helpers) rather than a stub, and asserted the message equals `validate(quiz)`'s
  own result, so the test stays correct if validate's copy changes but breaks if load() stops passing it through.
- Pinned the missing-runtime-script behaviour rather than fixing it: this turn is test-only and the fix adds new copy.
- Treated the `encodeURIComponent` mutation as equivalent rather than widening the sandbox to an unreachable level value.

## Artifacts produced
- `mylingo-v159-agent175-load-orchestration-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_175.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_175.md. You are Agent 176. Continue from 'Next agent — start here'."
