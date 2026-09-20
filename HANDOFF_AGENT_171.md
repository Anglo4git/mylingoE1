# Agent 171 Handoff — Test Coverage for Question-Rendering Functions (quiz.html)

## Context
Picked up `HANDOFF_AGENT_170.md`. Its "Next agent — start here" pointed at the question-rendering
functions — `renderChoice`, `renderTextLike`, `renderMatching`, `renderRanking`, `renderMedia`,
`clearQuestionUI` — as the next highest-value target: they build the actual DOM that
`submitAnswer()`/`finishAnswer()` (covered Agent 164/170) operate on, and had zero direct coverage.
No source changes this turn — pure test-coverage addition.

## What was done
Added one new section to `tests/run.js`: **"quiz.html question-rendering:
renderChoice/renderTextLike/renderMatching/renderRanking/renderMedia/clearQuestionUI (Agent 171)"**,
inserted after the Agent 170 section, before "offline-packs.js".

**Approach — new this turn:** unlike prior sections' flat record-shaped fakes, these functions call
real DOM methods (`createElement`, `appendChild`, `querySelector`/`All`, `classList.toggle`,
`dataset`, and — critically — assign HTML strings via `.innerHTML` that later code queries back into,
e.g. `updateRanks()`'s `.querySelector('.rank-num')`). So this section adds:
- A minimal `FakeElement` class with real `classList`/`dataset`/`setAttribute`/`addEventListener`/
  `appendChild`/`click()` semantics.
- A tiny recursive `querySelectorAll`/`querySelector` matcher covering the literal selector shapes
  the real code uses (tag name, `.class`, `[attr="value"]`).
- A tiny flat-fragment HTML parser (`parseFragment`) so `el.innerHTML = '<span class="x">1</span>'`
  actually produces a queryable child element, not just a stored string — this was the one new wrinkle
  these functions introduced that no prior section needed, since `renderChoice`'s option-button labels
  and `renderRanking`'s rank-number span are both built via innerHTML strings that get queried back
  into afterward (`updateRanks`).
This is the same "fake just real enough to run the real code" philosophy as Agent 169's `makeEl()`
and Agent 170's `makeNode()`/`selMatch()`, extended one notch further because these functions'
contract with their own later code genuinely requires it.

20 new tests (`node tests/run.js`: 302 → 322):
1. `renderChoice` radio: one button per answer, 1-based key + escaped label, correct role/
   `tabIndex`/`dataset`, `kbHint` text, first button focused.
2. `renderChoice` radio: clicking a button calls `submitAnswer({index, button})` directly.
3. `renderChoice` checkbox: `role="group"`; clicking toggles `aria-checked`/`selected` instead of
   submitting; the appended Check button collects every *currently*-checked index (including
   re-toggling one off then back on).
4. `renderChoice` dropdown: builds the placeholder + per-answer `<option>`s (1-based value, escaped),
   Check button reads `Number(select.value)`; confirms it **early-returns before ever touching
   role/kbHint** — a real, easy-to-miss asymmetry with the radio/checkbox path, now documented by a
   test rather than tribal knowledge.
5. `renderTextLike` × 5 types (`text`/`short_text`/`number`/`date`/`fill_in_the_blank`): input `type`
   mapping, `id="answerInput"`, focused, `maxLength=120` only for `short_text`, both Enter-key and
   Check-button paths submit `{value}`.
6. `renderTextLike`: a non-Enter keydown does not submit.
7. `renderMatching`: one row per `q.pairs`, each a `<select>` with every right-hand value present
   (shuffle-order-independent, HTML-escaped), Check button reads the *current* select values keyed by
   `dataset.left`.
8. `renderMatching`: falls back to `q.matches` when `q.pairs` is absent.
9. `renderRanking`: one row per `q.items` (shuffle-order-independent, full set), each
   draggable+tabbable with `dataset.value`; `updateRanks()` numbers rows 1..N by current DOM position;
   Check-order button reads current DOM order (not original item order).
10. `renderRanking`: falls back to `answerList(q)` when `q.items` is absent.
11. `clearQuestionUI`: empties `#options`, resets role/aria-label to neutral `"group"` (the exact fix
    the function's own inline comment describes — a leftover `radiogroup` role must not survive onto a
    non-choice question), clears feedback/kbHint, hides and un-shows the next button.
12. `renderMedia` × 5: image shown/hidden + `onerror` self-hides; no-image clears a stale `src`; a real
    audio file shows the player and hides the TTS button; TTS-only audio shows the TTS button and
    wires its click to `speakTts(text)`; no audio at all hides both **and explicitly `.load()`s the
    stale `<audio>` element** (not just visually hidden — confirmed via a real call, not an inference).

## Mutation-checked (each kill verified, then reverted)
- Checkbox toggle broken (`setAttribute('aria-checked','true')` instead of the real toggle): kills
  only the checkbox test — a stuck-on-first-click regression that would silently let every checkbox
  option be "select-only" with no way to deselect.
- `updateRanks`'s off-by-one (`String(n)` instead of `String(n+1)`, i.e. numbering from 0): kills only
  the ranking test.
- Dropdown's missing `Number()` coercion (`{index:select.value}`, a string, instead of
  `{index:Number(select.value)}`): kills only the dropdown test — this is exactly the kind of
  string/number mismatch `submitAnswer`'s radio/dropdown branch (`idx===ci`, a strict `===`) would
  silently always fail against.
- Verified via `md5sum` across every file in the project that the tree is byte-identical to the
  Agent 170 baseline after each revert.

## Files changed
- `tests/run.js` only. No application code touched this turn.

## Current state
- Tests: PASS — `node tests/run.js` → **322 passed, 0 failed** (Agent 170 left 302; net +20, all new,
  none removed).
- `node --check tests/run.js`: clean.
- Full-project `md5sum` diff against the Agent 170 baseline confirms **zero bytes changed** outside
  `tests/run.js` (and this handoff doc).
- `offline/packs/core.zip`: unchanged, still valid (only transiently failed during the mutation steps
  above, as expected, since it hashes `shared/quiz.html`).
- `CACHE_VERSION`: unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 170, updated)
1. [DECISION] level-lock fail-open vs fail-closed.
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (see Agent 170 handoff) — still
    open, needs a content/product decision, not a code change.
11. Question-rendering functions — **CLOSED this turn** (20 tests, mutation-verified). Still untested:
    `load()`/lesson gate (`enforceLessonGate`, `findOwningLesson`), `render()` itself (the per-question
    dispatcher that calls the now-tested render* functions plus the progress bar / counter / reflow
    trick), `orientation.js`, `mastery-review-ui.js`, `app-shell.js`, `authoring-*`, `splash.js`,
    `offline-packs-ui.js`.

## Next agent — start here
1. If continuing test-coverage work: `render()` itself is the natural next target — it's the one
   function that ties together everything covered so far (`rawType` dispatch → `renderChoice`/
   `renderTextLike`/`renderMatching`/`renderRanking`/banner, plus `clearQuestionUI()`, `renderMedia()`,
   the counter/progress-bar text, and the `.anim-in` reflow trick) and has no direct test of its own
   dispatch logic yet. The `FakeElement`/`parseFragment`/`queryAll` machinery added this turn should be
   directly reusable — it was built generically, not narrowly for just these five functions.
2. Alternatively, `load()`'s lesson-gate path (`enforceLessonGate`/`findOwningLesson`) is untested and
   guards real navigation (`location.replace`), which is worth locking down before it's touched again.
3. Items 1, 2, 8 (Agent 169), 10 still need a product decision before any code changes.

## Blockers
None.

## Assumptions made
- Built a small but genuinely-parsing `innerHTML` fragment parser rather than treating `.innerHTML` as
  an opaque string, because two of the six functions under test (`renderChoice`, `renderRanking`) rely
  on querying back into content they just wrote via `.innerHTML` — an opaque-string fake would have
  made that real code path untestable rather than just harder to fake.
- The selector matcher supports exactly the selector shapes the real code uses (tag, `.class`,
  `[attr="value"]`) and nothing more — consistent with Agent 170's `selMatch()` precedent of a
  minimal-but-real shim over a general engine.
- `renderMatching`/`renderRanking` shuffle their option/item order via `Math.random()`; tests assert
  set-membership and structural correctness rather than exact order, since order is intentionally
  randomized by the real code.

## Artifacts produced
- `mylingo-v159-agent171-question-rendering-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_171.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_171.md. You are Agent 172. Continue from 'Next agent — start here'."
