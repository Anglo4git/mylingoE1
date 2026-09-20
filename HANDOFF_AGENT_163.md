# Agent 163 Handoff — runtime-v2-adapter.js + runtime-content-loader.js Under Test; 2 Defects Fixed

## Context
Picked up `HANDOFF_AGENT_162.md`, item 9 (rest of `runtime-v2-adapter.js`, the big untested
surface) and, because it is the adapter's sibling and 84 lines, `runtime-content-loader.js`.
Method notes unchanged (Playwright/Chromium, real served origin, `no-store` server for anything
cache-related — `/tmp`-style helper: a 10-line node static server that sends
`Cache-Control: no-store`). New note: `shared/quiz.html?quiz=<id>` **redirects to
`courses/lesson.html`** for lesson-owned quizzes unless a `&lesson=<lesson_id>` param is present
(course-first gate) — add it in any browser check of the quiz player
(e.g. `quiz=a1-001&level=a1&lesson=course-a1-unit-01-lesson-01`).

## Defects found and fixed (2 modules, + zip rebuilt)

1. **`runtime-content-loader.js` memoized failures, so quiz.html's "Try again" could never
   succeed.** `load()`/`manifest()` cache their promises in module-level maps, *including
   rejected ones*. The error screen's `Try again` button calls `load()` again **in the same
   page**, which returned the cached rejection instantly — no network request, same "Connection
   problem" screen, until the learner reloaded the whole page. Reproduced in real Chromium
   (grammar JSON aborted once, then allowed; click Try again): old loader → error stays, no
   new request; fixed loader → new request, quiz renders. Fix: evict the cache entry when the
   promise rejects (successes stay memoized; concurrent callers still share one request).
2. **`runtime-v2-adapter.js` leaked the option list as `acceptedAnswers` on radio questions.**
   `normalizeAcceptedAnswers` decided "this question has no index, so its `answers` are the
   accepted set" by reading only the RAW camelCase `correctIndex`. A radio question authored
   with `correct_index` (snake_case) or `is_correct`/`isCorrect` flags looked index-less, so
   every option (raw objects, for the flag form) was copied into `acceptedAnswers`. Fix: it now
   takes the *normalized* index. **Scope note (same honesty as Agent 162's adapter fix):** all
   137 shipped quiz payloads (793 questions) produce byte-identical output before/after
   (verified by diffing old-vs-new adapter over every payload), and none has a radio question
   with `acceptedAnswers` — this protects newly authored content; the practical harm was
   answer-key duplication and quiz.html's `comparison`→text inference, not a scoring change.

## Tests: `tests/run.js` 130 → 165, all passing (`node tests/run.js`)
- **adapter (26):** frozen API; question-text/answer-list/option-object aliases; correct-index
  aliases, numeric strings, `is_correct` flags, non-integer not rounded; the legacy `option_0`
  zero-based offset; the acceptedAnswers fix (+ explicit/alias/scalar/`answers[]` fallbacks and
  copy-not-alias); type aliases; media (legacy imageUrl/audioUrl, string, url/label, src-less
  dropped); structured payloads (pairs, correctIndices, correctOrder) pass through; error
  messages; `normalizeQuiz` (aliases, brand/version defaults, questions>items>data precedence,
  level fallback chain, date passthrough, no input mutation); `normalizeHierarchy` (ids,
  parent links, explicit radio kept, junk nodes); `flattenActivityToQuiz` (one activity,
  radio omitted again, error cases); `normalizeManifest`; and an **every-shipped-quiz
  invariant scan** (never throws; every radio question has an integer `correctIndex` inside
  `1..answers.length`, non-empty answers, no `acceptedAnswers`).
- **loader (12, via new-in-162 `testAsync`):** grammar direct route, id URL-encoding + invalid
  level → a1, 404 → manifest fallback, not-found error status, non-404 not falling through,
  explicit file, success memoization, non-array manifest, **failed load retried**, **failed
  manifest retried**, concurrent callers share one request and a success stays cached, frozen API.
- Mutation-checked: reverting the acceptedAnswers fix fails exactly its one test; removing the
  eviction fails exactly the two retry tests.
- A vacuous test slipped in and was caught in review: a sync `test()` reading a global that
  only exists after queued async tests run passes trivially — the loader "frozen" check was
  moved into `withLoader`. Watch for that when mixing `test` and `testAsync`.

## Verification
- Real headless Chromium against a `no-store` server: quiz.html error screen → Try again
  (before/after described above). `node --check` on all touched files. `core.zip` rebuilt
  (the suite enforces it) — 90 files, byte-identical to source.
- Adapter old-vs-new diff over all shipped payloads: 137 quizzes, 0 differing outputs.

## Observed but deliberately NOT changed (judgment calls for whoever owns authoring)
- `answerList()` **compacts** `answer_1..answer_9` gaps (skips null/undefined), so a legacy
  export with a blank in the *middle* (`answer_1`, `answer_3`) would shift later options down
  and make `correct_index` point one too early. Trailing blanks (the normal case) are safe and
  no shipped data has gaps; changing it means deciding whether a gap is an empty option or
  "absent" — an authoring-contract question.
- `normalizeCorrectIndex` does not range-check a direct integer (`0`, `9` on 3 options pass
  through); quiz.html's own validation is the backstop. The shipped-data scan pins that no
  shipped quiz relies on this.
- Audio media entries get an `alt` copied from their `label` (harmless).

## Rules carried from 162 (still enforced by tests)
- Any edit to a file in `offline/core-manifest.json` requires rebuilding
  `offline/packs/core.zip` (zip exactly the manifest paths, deflate, manifest order).
- A new local script/stylesheet on a precached page goes in **both** `core-manifest.json` and
  the `core` pack in `packs.json`. `offline_packs.py` (the stated generator) is **not** in this
  zip; the 5 hand-added entries from 162 need mirroring there if it exists elsewhere.

## Remaining / carried forward
1. **[DECISION] level-lock fail-open vs fail-closed** (diagnostic warn stays until decided).
2. **[PRODUCT] Back button on the quiz results screen?**
3. **`learner-state.js` still unreferenced** — wire in or delete with its tests.
4. **`gamification.js` "Malformed legacy backup." message still dead code.**
5. **Zip filename vs `RELEASE_IDENTITY.json` (v118) still unreconciled** (naming convention).
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) still unused.
7. `main/practice.html` is a redirect stub, intentionally not precached.
8. Shell-code cache story: network-first for js/css (162). A change to `sw.js`'s bytes is what makes
   installed clients re-precache, and `caches.match` prefers the *static* (older) cache on an
   offline fallback, so shipping shell changes to offline learners needs a `CACHE_VERSION` bump.
   **Done this round: `mylingo-v6` → `mylingo-v7`** (adapter + loader changed). Bump again
   whenever a precached file changes.
9. **Still untested:** `recommendations.js` beyond the audit scenario, `orientation.js`,
   `mastery-review-ui.js`, `app-shell.js` (DOM-heavy), `authoring-*`, `splash.js`,
   `offline-packs-ui.js`. Possible next: the quiz.html **inline scripts** (scoring, `validate`,
   `correctIndexes`, `acceptedAnswers`) — the largest logic block with zero tests, but it needs
   extracting or driving in Chromium rather than a Node shim; the adapter/loader work above
   was the prerequisite (its output contract is now pinned).
