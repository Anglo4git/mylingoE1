# Agent 170 Handoff — Test Coverage for `finishAnswer()` / `next()` (grading-loop effects)

## Context
Picked up `HANDOFF_AGENT_169.md`. Its "Next agent — start here" pointed at
`submitAnswer`/`finishAnswer`/`next` as the next highest-value target — the scoring/advance loop
`end()` depends on (`score`, `answerCorrect`). On inspection, `submitAnswer`'s own decision logic
(ok/correctText per question type) was already covered end-to-end by the Agent 164 section, via a
captured `finishAnswer` stub — so that stub deliberately never exercised `finishAnswer()`'s own body,
and `next()` had zero coverage at all. That's the actual gap this turn closed. No source changes —
pure test-coverage addition, following the `extractFn` + `vm` + spy pattern Agent 164–169 established.

## What was done
Added one new section to `tests/run.js`: **"quiz.html finishAnswer()/next(): the grading loop's own
effects, isolated with stubbed collaborators (Agent 170)"**, inserted after the Agent 169 section,
before the "offline-packs.js" section.

**Approach:** extracted the real `finishAnswer` plus its real pure helpers (`rawType`, `answerList`,
`correctIndexes`, `esc`, `setTextSmooth`) into one `vm` sandbox with a minimal fake DOM (a
selector-matcher covering only the literal selectors the function actually queries: `.option`,
`.option[data-index="N"]`, `.rank-item`, `input,select,button`, `#question .blank`) and spies for its
collaborators (`soundCorrect`, `soundWrong`, `updateSessionAnswer`, `save`). `next()` was extracted
separately into its own sandbox with spies for `render`/`saveSession`/`end`.

16 new tests (`node tests/run.js`: 286 → 302):
1. Correct radio: locked, `score++`, `soundCorrect`, correct option marked (`correct`+`grow`,
   `aria-checked`), every option disabled/untabbable, next-button revealed+focused, `save(false)`.
2. Wrong radio: score unchanged, `soundWrong`, the chosen wrong option gets `wrong`+`shake`, the
   actually-correct option is *still* revealed (`correct`+`grow`) even though the learner missed it.
3. Wrong radio with no usable `input` (undefined, or `index: 0`): the wrong-marking guard is skipped,
   nothing throws.
4. Checkbox: every correct index marked `correct`; every wrongly-*selected* index marked `wrong`; a
   correctly-omitted index gets neither.
5. Matching/ranking ("else" branch): `.rank-item` elements get `aria-disabled` + `draggable=false`.
6. Final type-agnostic disable pass: every stray `input`/`select`/`button` left in `#options` ends up
   `disabled=true`, even ones the type-specific branch never touched (e.g. a dropdown's `<select>`) —
   this is the exact "only the invisible `locked` flag was stopping a resubmit" bug the inline comment
   above that pass describes; now under direct test.
7. Banner questions never touch `answerCorrect`/`score`/sounds, correct or not.
8. `restoringSessionAnswer=true` (session-resume replay): `answerCorrect` is still recorded, but score
   is not re-incremented, no sound plays, and the session is not re-written (would overwrite the very
   session being replayed).
9. `#question .blank` elements are always filled with `correctText` and marked `.filled`.
10. Feedback panel, correct path: "Correct!" status, escaped explanation only, no "correct answer is"
    prefix.
11. Feedback panel, wrong path: "Not quite.", the correct answer HTML-escaped inside literal quote
    marks, then the explanation.
12. Explanation field priority (`explanation` > `right_explanation` > `wrong_explanation`) is fixed
    regardless of `ok` — documented as current behavior (worth a product look; see below) rather than
    silently assumed.
13. `setTextSmooth` (real function) assigns the raw value, not a stringified one — confirmed via the
    score element.
14. `next()` mid-quiz: advances `i`, calls `render()` then `saveSession()` (in that order), does not
    call `end()`.
15. `next()` on the last question: calls `end()` instead; `render()`/`saveSession()` not called; `i`
    is left pointing at the last index, not walked off the array.
16. `next()` on a single-question quiz: goes straight to `end()` on the first call.

## Mutation-checked (each kill verified, then reverted)
- `next()`'s boundary (`i<data.questions.length-1` → `i<=…`): kills both the "last question" and
  "single-question quiz" tests — a clean, isolated kill on exactly the off-by-one this guards against.
- `finishAnswer`'s score/sound routing (`if(ok){score++;soundCorrect()}else{soundWrong()}` →
  unconditional `score++;soundCorrect()`): kills only the "wrong radio answer" test.
- Checkbox wrong-marking guard (`got.includes(n)&&!want.includes(n)` → `got.includes(n)`, which would
  wrongly flag a correctly-selected-and-correct index as also `wrong`): kills only the checkbox test.
- Verified via `md5sum` that every file in the project — not just `shared/quiz.html` — is byte-identical
  to the pre-mutation baseline after each revert (no leftover mutation state anywhere).

## Files changed
- `tests/run.js` only. No application code touched this turn.

## Current state
- Tests: PASS — `node tests/run.js` → **302 passed, 0 failed** (Agent 169 left 286; net +16 this turn,
  all new, none removed).
- `node --check tests/run.js`: clean.
- Full-project `md5sum` diff against the Agent 169 baseline confirms **zero bytes changed** outside
  `tests/run.js`.
- `offline/packs/core.zip`: unchanged, still valid (the "byte-identical to source" test still passes on
  the restored tree; it only failed transiently during the mutation-testing steps above, as expected,
  since it hashes `shared/quiz.html`).
- `CACHE_VERSION`: unchanged (`mylingo-v12`, from Agent 168 — no reason to bump it this turn).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 169, updated)
1. [DECISION] level-lock fail-open vs fail-closed.
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–7. Closed in earlier turns (see Agent 168/169 handoffs).
8. [PRODUCT] grammar-only recommendations / missing Reading, Listening catalog categories.
9. `end()` — CLOSED (Agent 169). `submitAnswer`/`finishAnswer`/`next` — **CLOSED this turn** (16
   tests, mutation-verified).
10. [PRODUCT, surfaced this turn] `finishAnswer`'s feedback explanation always prefers
    `right_explanation` over `wrong_explanation` when there's no generic `explanation` field, even on a
    WRONG answer (see test #12 above). This may be intentional (author only ever fills one of the two)
    or may be a latent bug for content that fills both — worth a product/content-authoring check, not a
    code change without that input.
11. Still untested: `load()`/lesson gate, the question-rendering functions (`clearQuestionUI`,
    `renderMedia`, `renderChoice`/`renderTextLike`/`renderMatching`/`renderRanking`), `orientation.js`,
    `mastery-review-ui.js`, `app-shell.js`, `authoring-*`, `splash.js`, `offline-packs-ui.js`.

## Next agent — start here
1. If continuing test-coverage work: the question-rendering functions (`renderChoice`, `renderTextLike`,
   `renderMatching`, `renderRanking`, `renderMedia`, `clearQuestionUI`) are the next highest-value
   target — they're what actually builds the DOM `submitAnswer`/`finishAnswer` operate on, and (per
   item 11 above) have no direct tests yet. Same `extractFn` + `vm` + fake-DOM pattern applies; the
   `makeNode`/`selMatch`/`queryAll` helpers added this turn can likely be reused or lightly extended
   rather than rebuilt, since the option/select/button shapes are the same ones this turn's DOM already
   models.
2. Items 1, 2, 8, 10 still need a product decision before any code changes.

## Blockers
None.

## Assumptions made
- Tested `finishAnswer()` against real pure helpers (`rawType`, `answerList`, `correctIndexes`, `esc`,
  `setTextSmooth`) rather than stubs, since these are cheap, already independently covered, and part of
  what makes `finishAnswer()`'s own marking/disabling logic meaningful to test against real grading
  decisions rather than a mocked one.
- Built a minimal selector-matcher (not a general CSS engine) covering only the literal selector
  strings the real code queries — matching Agent 169's `makeEl()` philosophy of a fake just real enough
  to run the real code.
- `next()` tested with `render`/`saveSession`/`end` stubbed as spies (each independently covered
  elsewhere — `render` isn't covered yet, see item 11 — since this section is about `next()`'s own
  branch logic, not those functions' bodies).

## Artifacts produced
- `mylingo-v158-agent170-grading-loop-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_170.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_170.md. You are Agent 171. Continue from 'Next agent — start here'."
