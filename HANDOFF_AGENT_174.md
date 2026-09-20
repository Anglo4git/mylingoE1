# Agent 174 Handoff — Test Coverage for the Keyboard Layer (quiz.html)

## Context
Picked up `HANDOFF_AGENT_173.md`, "Next agent — start here" item 1: `onOptionKeydown`, `moveFocus` and the
document-level digit-key handler are the only keyboard path through a radio question and had no direct test.
No source changes this turn — pure test-coverage addition.

## What was done
Added one section to `tests/run.js`: **"quiz.html keyboard layer: onOptionKeydown/moveFocus/document digit-key
handler (Agent 174)"**, after the Agent 173 section, before "offline-packs.js". Also extended the file-header
scope comment (172/173/174 lines).

**Approach:** the REAL `rawType`, `answerList`, `onOptionKeydown` and `moveFocus` (via `extractFn`) run in a `vm`
sandbox with fake option buttons (`click`/`focus` recorders, roving `tabIndex`, `disabled`). The document handler
is an inline `document.addEventListener('keydown', e=>{...})`, so it is SLICED out of `quiz.html` by source text
(`digitHandlerSrc()`: from the `document.addEventListener('keydown',e=>{` opener to the next `\n});`) and run
against a stub `document.addEventListener` that captures the listener; a rename/restructure throws a loud
"handler not found" failure inside the test body. `locked` / `data` / `i` are sandbox lexical globals, as in the
page; `$` returns the fake `#options` box and the start/end/error screens (`style.display`).

12 new synchronous tests (`node tests/run.js`: 346 → 358):
1. Wiring: exactly one `document.addEventListener('keydown'` in the page, registered as `keydown`; `renderChoice`
   attaches `onOptionKeydown` to each option.
2. Arrows: Right/Down → next, Left/Up → previous, each `preventDefault()`ed; roving `tabIndex` follows focus; moving
   focus never clicks.
3. `moveFocus` wraps at both ends (single option wraps onto itself); exactly ONE option tabbable at all times.
4. `moveFocus` no-op when locked (arrows still `preventDefault()`ed) or when the list is empty.
5. Enter/Space click the focused option + `preventDefault()`; locked → still `preventDefault()`ed, no click.
6. Other keys (Tab, Escape, letters, digits, Home/End, PageDown) untouched: no click/focus/`preventDefault`.
7. Non-option targets (Check button, select, unknown, null/undefined) ignored, nothing `preventDefault()`ed; the list
   is re-queried at event time with the direct-child `#options > .option` selector.
8. Digit N clicks the Nth option for a radio question; 0 / out-of-range / non-digit keys do nothing; the CURRENT
   question index `i` decides the valid range.
9. Guards: locked, no `data`, or start/end/error screen `display:grid` → ignored; `none`/`flex`/`block`/`''` do not block.
10. Radio-only: checkbox, dropdown, text, number, fill_in_the_blank, matching, ranking, banner ignore digits; radio
    aliases (missing type, `Radio`, comparison without pairs) still work.
11. Object answers (`{text}`) count via `answerList`; a disabled Nth button is skipped; a missing Nth button does
    not throw.
12. PINNED current behaviour: digit keys are not modifier-aware (Ctrl/Cmd/Alt+digit also click; not
    `preventDefault()`ed). See Findings.

## Mutation-checked (each kill verified, then reverted)
20 mutations, all killed (the `offline/packs/core.zip` byte-identity test fails on ANY `quiz.html` edit because
`quiz.html` is a core-pack file — that one expected failure was excluded from the kill count): no wrap-around;
no roving-`tabIndex` reset; `moveFocus` ignoring `locked`; dropped `idx<0` guard; Space not handled; Enter clicking
while locked; Enter not `preventDefault()`ed; ArrowUp dropped; doc handler ignoring `locked`; doc handler ignoring
`!data`; each of the start / end / error screen guards removed; checkbox also getting digits; digit range ignored
(`n<=9`); disabled button not skipped; missing button throwing; question index fixed to 0; selector loosened to
`.option`; and a modifier guard added (kills the pin in test 12, as intended). `md5sum` over every project file
confirms the tree is byte-identical to the Agent 173 baseline after reverts (only `tests/run.js` and this doc differ).

## Findings (not changed)
- **Ctrl/Cmd/Alt+digit answers the question.** The document handler checks only `parseInt(e.key,10)`, never
  `ctrlKey`/`metaKey`/`altKey`, and never `preventDefault()`s. Ctrl/Cmd+1…9 is the browser's tab-switch shortcut, so a
  learner switching tabs on a radio question can submit an answer by accident (and lock it). One-line fix candidate:
  `if(e.ctrlKey||e.metaKey||e.altKey)return;` at the top of the handler. It changes behaviour (test 12 flips), so it
  is logged as carried item 14 for a yes/no. Pinned by test 12.
- Minor, not tested: digit shortcuts can only reach options 1–9 (`e.key` is a single character), and the kbHint
  reads "Press 1–N" for any N. A scan of the shipped JSON found NO radio question with 10+ answers, so this is
  latent only.

## Files changed
- `tests/run.js` only (new section + header comment). No application code touched.

## Current state
- Tests: PASS — `node tests/run.js` → **358 passed, 0 failed** (Agent 173 left 346; net +12, none removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip` unchanged and valid; `CACHE_VERSION` unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 173, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also covers the lesson gate — Agent 173).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: `load()` itself (the orchestration around the tested gate: `!id` error state, the
    `recommended=1` lock bypass, lock check, data fetch, start screen), `orientation.js`, `mastery-review-ui.js`,
    `app-shell.js`, `authoring-*`, `splash.js`, `offline-packs-ui.js`. (Keyboard layer for radio questions —
    **CLOSED this turn**. Still open inside it: the ranking-row keydown handler (ArrowUp/ArrowDown reorder) and the
    text-input Enter-to-submit, both inline in `renderRanking` / `renderTextLike`.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174, above).

## Next agent — start here
1. `load()` orchestration (`extractFn(html,'load')`; it is `async function load(){`): `!id` → `errorState('No quiz
   to load',…,false)`; missing `window.MylingoLevelLock` only warns (fail-open); `mode!=='placement' &&
   !directRecommended` + locked level → `errorState('Level locked',…)`; `directRecommended` bypasses BOTH the lock and
   the lesson gate; `enforceLessonGate()` true → return before any data fetch; placement path via `resolveQuizPath`
   vs `MylingoRuntimeContentLoader.load(level,id)`; HTTP 404 → "Quiz not found", other failure → "Connection problem"
   with retry=true; `normalizeQuiz` throw → "Quiz data error"; `validate()` error → "Quiz data error" with the message;
   happy path sets `data` and shows the start screen. Stub `show`, `errorState`, `resolveQuizPath`, `fetch`,
   `window.MylingoRuntimeContentLoader/MylingoRuntimeV2/MylingoLevelLock`; reuse the Agent 173 `gate()` pattern.
2. Or the two inline keydown handlers left in item 13 (ranking-row reorder in `renderRanking`, text Enter in
   `renderTextLike`): drive them through the existing Agent 172 `FakeElement` sandbox (the listeners are on the
   elements it creates, so `dispatch('keydown', …)` reaches them).
3. Items 1, 2, 10, 11, 12, 14 need a product decision before any code changes.

## Blockers
None.

## Assumptions made
- Pinned the modifier-key behaviour rather than fixing it: this turn is test-only, and a fix flips test 12.
- Sliced the inline document handler by source text (opener → next `\n});`) instead of refactoring it into a named
  function, keeping the turn source-neutral; a restructure fails loudly rather than silently skipping.
- Used simple hand-rolled fake buttons instead of the Agent 172 `FakeElement`: these handlers only need
  `click`/`focus`/`tabIndex`/`disabled`, and it keeps this section self-contained.

## Artifacts produced
- `mylingo-v159-agent174-keyboard-layer-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_174.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_174.md. You are Agent 175. Continue from 'Next agent — start here'."
