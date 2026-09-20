# Agent 199 Handoff — course-progress.js: untrusted-progress crash fix + direct unit coverage + mutation sweep

## Context
Picked up `HANDOFF_AGENT_198.md` "Next agent — start here" item 2 (mutation-sweep an already-covered file). Baseline: `node tests/run.js` → 805 passed, 0 failed.

## Finding + fix (real bug)
`shared/js/course-progress.js` header says "Persisted progress is untrusted input", but `readProgress()` (= `progress()`) returned whatever JSON was stored under `mylingo.progress.v1`. A stored JSON `null` came back as `null`, and `lessonCompletionRecord()` / `lessonPercent()` / `lessonIsComplete()` / `resolveHomepageState()` then threw `TypeError: Cannot read properties of null (reading '<id>')`. `courses/lesson.html` calls the module's `readProgress()` three times (previous-lesson gate, saved progress, refresh), so it was exposed; `course.html` / `journey.html` / `courses/index.html` use their own guarded copies and were not.
- Fix: `progress()` now returns `{}` for any non-object result (null / number / string / boolean). An ARRAY is still returned as-is (`typeof [] === 'object'`) — the Agent 181 pin ("readProgress: PINNED - a stored ARRAY is returned as-is") is untouched and still passes; `p[id]` on an array is `undefined`, so it is harmless.
- Number/string/boolean previously did not throw (property access on primitives is safe) but returned a non-object; they now normalise to `{}` too.

## Tests: 805 -> 815 (+10)
New section "course-progress.js: untrusted-progress guard + direct unit coverage (Agent 199)" in `tests/run.js`, before the "recommendations.js + level-lock.js interaction" section. Own `vm` sandbox per test (`makeCP()`), NOT the shared `fakeWindow`; cross-realm objects compared via `JSON.parse(JSON.stringify(x))` (see Agent 198's `deepStrictEqual` prototype note). 8 sync + 2 async tests: readProgress shapes (null/number/string/boolean → `{}`; missing/empty/malformed/throwing storage → `{}`; array pinned; per-quiz null/number/string records harmless), `esc` (five chars, null/undefined/numbers, double-escape), exports (thresholds 60/90 + exact key set), the 90% boundary (9/10 completes, 8/10 doesn't, 59 never counts), gate id (last when complete, first in-progress otherwise, `exercise_quiz_ids` beats `lesson_quiz_id`, null/undefined lesson), `sessionRatio` (encodeURIComponent key, non-in-progress / non-integer / string index / zero-or-missing total, cap 99, corrupt/null session), `resolveHomepageState` (default base `../`, explicit base verbatim incl. monolith fallback, `cache:'no-store'` on every fetch, order sort, unit/course/draft/orphan filtering, in-progress beats attempted, complete not surfaced, stored `null` progress → resolves `null`, HTTP error on courses.json rejects, one bad per-level file falls back).

## Mutation sweep
Throwaway script (not shipped), 84 single-point mutations of `course-progress.js` (esc chars/null, read fallback, keys, sessionFor encode, sessionRatio branches, isMastered, both thresholds ±1, every `lessonCompletionRecord` branch, wrappers, fetchJson, level list/base/path/concat/fallback, every `resolveHomepageState` filter/sort/predicate, every export, and the 4 new `progress()` guard mutations). **84/84 killed, 0 survivors.** The guard-removal mutant is killed by the NEW test (verified directly), not only by page tests. Source confirmed byte-identical after each sweep. (Note for reuse: a sweep run must finish inside one tool call or be chunked; a background process is killed when the call ends and leaves the file mutated — always `diff` against a saved copy afterwards.)

## Cache / pack
`course-progress.js` is a core-pack file → `sw.js` `CACHE_VERSION` `mylingo-v20` → `mylingo-v21`; the version pin test updated; `offline/packs/core.zip` rebuilt from ALL on-disk sources with python `zipfile` (same member order, date_time, compress_type, external_attr); `unzip -t` clean; the core.zip identity test passes.

## Files changed vs Agent 198 zip
`shared/js/course-progress.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`, `HANDOFF_AGENT_199.md`.

## Remaining / carried forward (unchanged from Agent 197/198)
Decision-gated backlog: items 1, 2, 10, 17, 19, 21–29, 35. Not yet mutation-swept: `skill-mastery.js`, `review-scheduler.js`, `gamification.js`.
Observation (not changed): `courses/course.html`, `journey.html`, `courses/index.html` each keep their own `readProgress` copy; only the module's copy had the null hole. Consolidating them is a product/refactor call — not done.

## Next agent — start here
1. Decision-gated backlog as above; if a product decision arrives, implement it and flip the pin in the same change.
2. Otherwise repeat the pattern on `gamification.js` (XP/streak/backup — user-facing numbers), `skill-mastery.js` or `review-scheduler.js`; probe untrusted-storage shapes (`null`, numbers, strings, arrays, per-key nulls) first — that is what found this bug.
3. If a core-pack file changes, bump `CACHE_VERSION` (now `mylingo-v21`) and rebuild `offline/packs/core.zip` from ALL on-disk sources.

## Blockers
Product decisions for the DECISION backlog; a real device for item 17.

## Artifacts
`mylingo-v175-agent199-course-progress-null-guard.zip`, `HANDOFF_AGENT_199.md`.

## Resume command
"Resume from HANDOFF_AGENT_199.md. You are Agent 200. Continue from 'Next agent — start here'."
