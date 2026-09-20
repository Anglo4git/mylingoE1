# Agent 196 Handoff — carried items 15, 18, 20 FIXED (app-files error, orientation.js quirks, autosave rowCount) + cache bump

## Context
Picked up `HANDOFF_AGENT_195.md`, "Next agent — start here" items 1–2. Baseline: 776 passed, 0 failed.
Item 15 needed new copy; I chose the wording below (easy to change — one string in `appFilesError()`).

## Fixes
1. **Item 15 — missing runtime script** (`shared/quiz.html`): `load()` now checks `window.MylingoRuntimeContentLoader.load`
   (only on the non-placement path, which is the only one that uses it) and `window.MylingoRuntimeV2.normalizeQuiz` before use and
   shows a distinct **non-retryable "App files missing" — "Part of Mylingo didn't finish loading. Please reload the page."** screen
   (new `appFilesError()`), instead of a retryable "Connection problem" (loader) / "quiz file is corrupted" (adapter). A present
   loader that rejects is still the retryable "Connection problem"; a present adapter that throws is still "Quiz data error";
   a placement quiz with a missing content loader is not blocked. Verified in Chromium by aborting each script request:
   error screen shown, Retry hidden, no page errors; normal load unchanged.
2. **Item 18 — `orientation.js` quirks:** (a) new `answerValue()`: `null`, `''` and whitespace-only answers (e.g. a hole in a
   JSON-serialised sparse array) are *unanswered* — `scoreAnswers` unchanged numerically (they added 0 anyway) but `signals`
   now report `null` instead of a fake `0`; (b) `signals` are clamped to 0..4 like the score (nothing in the app consumes
   `signals`); (c) `readState()` rejects a stored JSON array. NOT changed (product): `estimate_confidence` is `'medium'` at both
   extremes; `levelFromScore` dead code / `NaN` input.
3. **Item 20 — `authoring-draft-autosave.js`:** `save()` return value and manifest `rowCount` now count rows actually stored
   (`storedRows`, summed from the chunks) instead of `rows.length`, so they match the chunks and `load().rows.length`.
   File is not a core-pack file (no core.zip impact of its own).

## Source change -> cache bump + core.zip
`shared/quiz.html` and `shared/js/orientation.js` are core-pack files: `sw.js` `CACHE_VERSION` `mylingo-v19` -> **`mylingo-v20`**;
`offline/packs/core.zip` rebuilt from ALL on-disk sources (same 90 members/order/date_time/compress_type/external_attr;
`unzip -t` clean; identity test passes). `diff -rq` vs the Agent-193 zip: `shared/quiz.html`, `shared/js/splash.js`,
`shared/js/orientation.js`, `shared/js/authoring-draft-autosave.js`, `sw.js`, `offline/packs/core.zip`, `tests/run.js`
(+ HANDOFF_AGENT_194/195/196).

## Tests: 776 -> 782 (+6)
Flipped four earlier pins (Agent 175 test 22 -> "App files missing"; Agent 177 unclamped-signals and readState-array pins;
Agent 178 raw-rowCount pin), re-labelled the null/'' score test, and added: item-15 guard test (present-but-rejecting loader,
throwing adapter, placement path unaffected), signals-null test, multi-chunk rowCount test, cache-version test -> v20, plus a
source-pin section (3 tests). `node --check tests/run.js` clean; `node tests/run.js` -> **782 passed, 0 failed**.

## Browser QA (Playwright + headless Chromium)
22 pages x light/forced-dark at 390x844 = 44 checks, 0 bad (no page errors, console errors, 4xx, horizontal scroll).
`main/placement.html` full 10-answer flow still reaches the result card and persists orientation state.

## Remaining / carried forward
Items 1/2/10/17/19/21–29 and [INFO] 35 (product / fail-open DECISION list; 17 needs a real device). Items 11, 12, 14, 15, 16,
18 (code quirks; confidence-at-extremes note stays product), 20, 30, 33, 34 are DONE.

## Next agent — start here
1. Skim HANDOFF_AGENT_179..185 findings (items 22–28: offline-packs-ui, mastery-review-ui, authoring-validation, lesson.html,
   course/journey, courses/index, progress.html) for any remaining unambiguous, local bug fixes (flip the pin in the same change).
2. Item 19 (bottom-nav highlights no tab on level index/root/quiz/placement/practice pages) is cosmetic/product — only with a decision.
3. If a core-pack file changes, bump `CACHE_VERSION` (now `mylingo-v20`) and rebuild `offline/packs/core.zip` from ALL on-disk
   sources (the identity test catches a partial rebuild).

## Blockers
Product decisions for the DECISION backlog (fail-open vs fail-closed, results-screen Back, etc.); a real device for item 17.

## Artifacts
- `mylingo-v173-agent196-appfiles-orientation-autosave-fixes.zip`, `HANDOFF_AGENT_196.md`.

## Resume command
"Resume from HANDOFF_AGENT_196.md. You are Agent 197. Continue from 'Next agent — start here'."
