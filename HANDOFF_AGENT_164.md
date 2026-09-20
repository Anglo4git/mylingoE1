# Agent 164 Handoff — quiz.html Inline Logic Under Test; 1 Defect Fixed

## Context / provenance (read this first)
Picked up `HANDOFF_AGENT_163.md`, item 9 (quiz.html's inline scripts — scoring, `validate`,
`correctIndexes`, `acceptedAnswers`; the largest untested logic block).
**The working tree I started from was not exactly the Agent 163 zip.** It already contained a
partial, unfinished "Agent 164" pass: a one-line fix in `shared/quiz.html` (number grading) and
a ~350-line test section in `tests/run.js` that ended at **188 passed / 5 failed**. I did not
trust it blindly: I diffed it against the 163 zip (only `quiz.html`, `tests/run.js`, `core.zip`
differed), read every test, found the 5 failures were one test-harness problem (below), fixed
that, re-derived the bug and the fix independently in a real browser, and mutation-checked the
section. Everything described here is verified from that state; nothing was taken on faith.

## Defect found and fixed (1 file: `shared/quiz.html`)
**A blank or whitespace-only answer to a `number` question was graded CORRECT whenever the
accepted answer (or tolerance) reached 0.** The number branch of `submitAnswer` does
`Number(input.value)`, and `Number('')` is `0`. The UI does not block an empty submit (the
"Check answer" button and Enter both call `submitAnswer({value: input.value})` on an empty
box), so a learner could press Check with nothing typed and get "Correct!" on any question whose
answer is `0` (e.g. "What is 3 − 3?") or whose tolerance reaches 0. Fix: the branch now also
requires `String(input.value ?? '').trim() !== ''`.
- **Reproduced in real Chromium** (route-intercepted quiz JSON with one `number` question,
  `acceptedAnswers:[0]`, click Check with the box empty): old `quiz.html` → "Correct!";
  fixed → "Not quite".
- **Honest scope note:** no shipped quiz uses `number` (shipped types: radio, banner,
  checkbox, dropdown, fill_in_the_blank, matching, ranking), so no learner can hit this today;
  it protects authored/imported content.

## Tests: `tests/run.js` 165 → 197, all passing (`node tests/run.js`)
New section "quiz.html inline logic … (Agent 164)" — **the tests run the real code.** quiz.html
has no module boundary, so the section lifts named top-level functions out of the actual file
(brace-matched extractor, string/comment/regex-literal aware) and evaluates them in a `vm`
sandbox with a fake `localStorage`; a renamed/removed function throws loudly instead of the
test silently going stale.
- typing/answer keys: `rawType` (aliases, comparison inference), `correctIndexes`,
  `acceptedAnswers` precedence chain.
- `validate()`: envelope errors, choice 2–9 answers / exactly-one-in-range-correct,
  checkbox/text-like/matching/ranking/banner/unknown-type — plus **every shipped quiz, after the
  adapter, passes `validate()`** (137 payloads: no learner can hit "Quiz data error").
- grading of every type through the real `submitAnswer`: radio/dropdown (incl. nothing-chosen
  ignored), locked no-op, checkbox exact-set, text/fill-in normalization, number
  (tolerance, non-numeric, **blank/whitespace**), date, matching, ranking, banner, `gradedTotal`.
- sessions: shard write/read/delete + index, odd quiz ids, `sanitizeSession` rejecting every
  malformed shape, corrupt-JSON tolerance, v2-blob and legacy-v1 migration, stale-session
  clearing (version/length/index/score), `saveSession`/`updateSessionAnswer`, and
  `save()` (in-progress vs completed, banner not graded, retakes never lower `best`, corrupt
  progress JSON survived, records satisfy course-progress mastery thresholds).
- result screen: `recommendation` thresholds (≥85 up / <50 down, ladder ends), `congratsTitle`
  boundaries, `backTarget` redirect safety, `orientationEstimate` precedence/corruption.
- **Harness lesson (this is what the 5 inherited failures were):** values built inside a `vm`
  context carry that realm's `Array`/`Object` prototypes, so `assert.deepStrictEqual` reports
  "same structure but not reference-equal" against outer-realm literals. The sandbox helpers now
  return JSON clones of every extracted function's result. Do the same for any future vm-based
  extraction. (Also fixed: the extractor originally mis-parsed the `\//` inside
  `isSafeRedirect`'s regex literal as a comment and swallowed following functions —
  it now skips regex literals.)
- **Mutation-checked (each fails only its own tests):** number fix reverted → 1; correctIndexes
  range filter dropped → 1; choice answer-count cap removed → 1; checkbox/ranking length check
  removed → 2 (one shared line); recommendation threshold moved → 1. One mutation (dropping
  `indexOf('//')` in the fallback `isSafeRedirect`) survives — it is an *equivalent* mutant
  (the `^\.\.?\/` regex already rejects `//…`), not a test gap.

## Verification
- Real Chromium against a `no-store` server for the number-grading repro above.
- `node --check` on `tests/run.js`; `core.zip` rebuilt (the suite enforces it): 90 files,
  byte-identical to source. **`CACHE_VERSION` bumped `mylingo-v7` → `v8`** because the precached
  `shared/quiz.html` changed (network-first online, precache-only offline; Agent 163 item 8).

## Not covered / observed
- The DOM half of quiz.html (`render*`, `end()`, `renderSuggestions`, placement result screens,
  `saveAssessmentResult`, `load()`/`enforceLessonGate`/`resolveQuizPath`) is still untested — it
  needs a browser-driven harness (the Playwright recipe above works: route-intercept the quiz JSON).
  `saveAssessmentResult` is the riskiest remaining piece (placement evidence merging).
- `date` questions compare as exact strings (no format normalization) — fine for `<input type=date>`
  (always ISO), noted only because authors might supply other formats in `acceptedAnswers`.
- `checkbox` grading does not de-duplicate `input.indices`; the UI cannot produce duplicates.

## Rules carried forward (still enforced by tests)
- Any edit to a file in `offline/core-manifest.json` requires rebuilding
  `offline/packs/core.zip` (zip exactly the manifest paths, deflate, manifest order).
- A new local script/stylesheet on a precached page goes in **both** `core-manifest.json` and the
  `core` pack in `packs.json`. `offline_packs.py` (the stated generator) is not in this zip.

## Remaining / carried forward
1. **[DECISION] level-lock fail-open vs fail-closed** (diagnostic warn stays until decided).
2. **[PRODUCT] Back button on the quiz results screen?**
3. **`learner-state.js` still unreferenced** — wire in or delete with its tests.
4. **`gamification.js` "Malformed legacy backup." message still dead code.**
5. **Zip filename vs `RELEASE_IDENTITY.json` (v118) still unreconciled** (naming convention).
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) still unused.
7. `main/practice.html` is a redirect stub, intentionally not precached.
8. Bump `CACHE_VERSION` (now `v8`) again whenever a precached file changes.
9. **Still untested:** browser-driven quiz.html (see above), `recommendations.js` beyond the
   audit scenario, `orientation.js`, `mastery-review-ui.js`, `app-shell.js`, `authoring-*`,
   `splash.js`, `offline-packs-ui.js`.
