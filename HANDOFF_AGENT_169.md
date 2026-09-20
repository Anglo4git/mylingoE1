# Agent 169 Handoff — Test Coverage for `end()` (quiz.html results-screen orchestration)

## Context
Picked up `HANDOFF_AGENT_168.md`. Its "Next agent — start here" pointed at item 9: `end()` in
`shared/quiz.html` was named the highest-value untested target — complex, integrates every
gamification/skill-mastery/review-scheduler/level-lock/placement subsystem, and is the exact
function whose own comment (Agent 102) explains why it's wrapped in try/finally (a prior mid-question
nav-hide bug class). Zero direct test coverage existed for it. No source changes this turn — pure
test-coverage addition, following the harness pattern Agent 164–167 established (`extractFn` lifts a
named function's real source out of `quiz.html` by brace-matching; run it in a `vm` sandbox against
stubs).

## What was done
Added one new section to `tests/run.js`: **"quiz.html end(): results-screen orchestration, isolated
with stubbed collaborators (Agent 169)"**, inserted after the Agent 167 section, before the
"offline-packs.js" section.

**Approach:** `end()` calls ~15 sibling functions by name in quiz.html's shared scope
(`gradedTotal`, `congratsTitle`, `save`, `clearSession`, `soundResult`, `show`, `getLevelLessons`,
`backTarget`, `saveAssessmentResult`, `renderPlacementResult`, `renderPlacementRecommendations`,
`placementContinue`, `renderSuggestions`) plus 4 optional `window.Mylingo*` modules. Rather than
wiring in the real implementations of all of them (already covered by their own dedicated test
sections), this section extracts the real `end()` and runs it against **spies** for every
collaborator — testing `end()`'s own orchestration: call order, argument shapes, the additive
try/catch-per-subsystem safety net, the outer try/finally guarantee, and mode/threshold branching.

13 new tests (`node tests/run.js`: 275 → 286 net, since Agent 168 also removed one test — see below):
1. Happy path: every DOM write (bar width, aria-valuenow, `finalPct` text, ring `--score-angle` /
   reveal class, result/message text), `save(true)`, `clearSession(id)`, `soundResult(pct)`,
   reco/continueBtn hidden, `renderSuggestions()` called, `show('end')` fires last, result focused.
2. `graded=0` (banner-only quiz): pct falls back to 100, no divide-by-zero.
3. Double-call is a no-op (the `ended` guard).
4. Additive modules (gamification/skill-mastery/review-scheduler) called with correct args when
   present; badges box untouched when `MylingoGamification` is absent.
5. Review scheduling is skipped in placement mode even when the module is present (skill mastery is
   NOT placement-gated — confirms the asymmetry is intentional, not an oversight).
6. A throw inside ANY of the three additive modules never escapes `end()` — caught locally, results
   screen still completes (tested for all three individually).
7. Placement mode: exact call order `saveAssessmentResult → levelLock.setAssigned →
   renderPlacementResult → renderPlacementRecommendations → placementContinue`; `renderSuggestions`
   NOT called.
8. Placement mode with a null profile: `levelLock.setAssigned` skipped, renderers still run.
9. `levelLock.setAssigned` throwing never breaks the results screen (Agent 152's ceiling update is
   best-effort, confirmed).
10. Lesson-continue branch: only offered for a passed (≥60%) non-placement quiz with a `lessonParam`;
    correctly resolves "Continue" (next published lesson exists) vs "Back to lesson practice" (none
    left, unpublished lessons correctly skipped) — async, awaits the `getLevelLessons().then()` chain.
11. Lesson-continue branch does NOT fire below 60% or in placement mode (no `getLevelLessons` call
    at all — confirms it's skipped, not just hidden after the fact).
12. Outer try/finally: an uncaught throw from a non-additive step (`congratsTitle`) still runs
    `show('end')` and focuses the heading via `finally`, before `end()` re-throws — this is Agent
    102's original bug class, now directly under test for the first time.

## Mutation-checked (each kill verified, then reverted)
- `finally` → removed entirely (bare `try`): syntax error, every `end()` test fails as expected
  (extractFn/vm compile fails) — confirms tests depend on real source, not a mock.
- `finally` → `catch(e){}` (swallows instead of always-running): kills the "outer try/finally" test
  AND the happy-path test — because `catch` only runs on an exception, so the happy path would never
  call `show('end')` at all. This is exactly the bug class Agent 102 was guarding against.
- Placement-mode guard removed from the review-scheduler call: kills only "review scheduling is
  skipped in placement mode," nothing else — a clean, isolated kill.
- Verified via `diff` that `shared/quiz.html` was byte-identical to its pre-mutation backup after each
  revert (no leftover mutation state).

## Two bugs in my own first draft, caught by the initial test run (not shipped)
- Read `ring['--score-angle']` instead of `ring.style['--score-angle']` (the sandbox's fake
  `style.setProperty` stores onto the style object, not the element) — fixed.
- `assert.deepStrictEqual` on an object literal (`{quizId, quizVersion, mode}`) that `end()`'s code
  constructs *inside* the `vm` sandbox failed with "same structure but not reference-equal" — a
  cross-realm `Object.prototype` mismatch, not a real bug. This is exactly the rule Agent 167 flagged
  as "vm-sandbox tests must return JSON clones." Fixed by JSON round-tripping that one object before
  comparing; documented inline so the next agent doesn't hit the same thing.

## Files changed
- `tests/run.js` only. No application code touched this turn.

## Current state
- Tests: PASS — `node tests/run.js` → **286 passed, 0 failed** (Agent 168 left 274; net +12 this
  turn: +13 new `end()` tests, and no tests were removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip`: unchanged, still valid — no precached file was modified this turn (test
  file isn't precached), so no rebuild was needed. Confirmed by the "core.zip byte-identical" test
  still passing.
- `CACHE_VERSION`: unchanged (`mylingo-v12`, from Agent 168 — no reason to bump it this turn).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 168, updated)
1. [DECISION] level-lock fail-open vs fail-closed.
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3. `learner-state.js` — CLOSED (Agent 168): intentional test-only cross-validation contract.
4. `gamification.js` dead backup branch — CLOSED (Agent 168): removed.
5. Zip filename vs `RELEASE_IDENTITY.json` — confirmed out-of-scope for a code fix (release-process
   naming, not a bug).
6. Legacy `calculateNextInterval` — CLOSED (Agent 168): removed.
7. `main/practice.html` — CLOSED (Agent 168): reviewed, working intentional redirect.
8. [PRODUCT] grammar-only recommendations / missing Reading, Listening catalog categories.
9. Still untested: `end()` — **CLOSED this turn** (13 tests, mutation-verified). Still untested:
   `load()`/lesson gate, other `render*` in quiz.html not yet covered
   (`clearQuestionUI`, `renderMedia`, `renderChoice`/`renderTextLike`/`renderMatching`/`renderRanking`
   — the question-rendering functions), `submitAnswer`/`finishAnswer`/`next` (the grading/advance
   loop), `orientation.js`, `mastery-review-ui.js`, `app-shell.js`, `authoring-*`, `splash.js`,
   `offline-packs-ui.js`.

## Next agent — start here
1. If continuing test-coverage work: `submitAnswer` / `finishAnswer` / `next` (the answer-grading and
   advance-to-next-question loop) is the next highest-value target — it's the core scoring logic that
   `end()` depends on (`score`, `answerCorrect`) but which itself has no direct tests yet. Same
   `extractFn` + `vm` + spy-stub pattern applies.
2. Items 1, 2, 8 still need a product decision before any code changes.

## Blockers
None.

## Assumptions made
- Tested `end()` against **stubs** for its ~15 collaborators rather than the real implementations,
  since those are each independently tested elsewhere in the suite (placement.js, gamification.js,
  skill-mastery.js, review-scheduler.js, level-lock.js, and `end()`'s own sibling render/continue
  functions from Agent 166–167's sections). This keeps the new section focused on what was actually
  untested — `end()`'s own control flow — rather than duplicating existing coverage.

## Artifacts produced
- `mylingo-v157-agent169-end-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_169.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_169.md. You are Agent 170. Continue from 'Next agent — start here'."
