# Agent 181 Handoff — Test Coverage for authoring-validation.js (no source change)

## Context
Picked up `HANDOFF_AGENT_180.md`, "Next agent — start here": item 1, `authoring-validation.js` (~17 KB).
Baseline verified first: `node tests/run.js` → 529 passed, 0 failed.
The module is a self-executing IIFE (`(function (global) {...})(window)`) with **no DOM, storage or network access** — pure logic.
Exports `{getRowIssues, computeQuizGroupIssues, createEngine}` on `window.MylingoAuthoringValidation`:
- `getRowIssues(row, config)` — per-row field rules (14 required fields, level, version, status, question_number, answer gaps / count,
  correct_index, duplicate answers, explanation length).
- `computeQuizGroupIssues(rows, config)` — per-quiz cross-row rules (question-count bounds, quiz-level field consistency, duplicate
  question_text / question_number, across-rows level / category / title) plus `{level, title, category, count}` metadata.
- `createEngine(config)` — incremental engine (`fullRecompute`, `onRowAdded`, `onRowRemoved`, `onFieldChanged`, `isRowValid`, `getSummary`, the
  row/quiz issue Maps, `getQuizIndexSnapshot`, resolved `config`) with running counters instead of rescans.

## What was done
- **New section in `tests/run.js`** (after the Agent 180 section, before the Agent 159 offline-packs section) plus a header-comment extension.
  It runs the REAL `authoring-validation.js` in a `vm` sandbox whose only global is `window` (`makeAv()` gives a private sandbox per call).
  No other module and no fake DOM is needed.

**authoring-validation.js: 41 tests** — exports + a source guard (no `document` / storage / `fetch` / `require`); a valid row and the empty row's
exact 20-message list in shipped order; every one of the 14 required fields × {empty, whitespace, null, undefined} and the knock-on messages each
one feeds; level (trim, case, raw quoting); version / question_number coercion table; status (trim, case, raw quoting, literal `"undefined"` /
`"null"`); answer gaps (one message per filled answer after a gap), answer count, `correct_index` range and its `max(n,2)` wording, duplicate
answers, explanation length; the fixed order of all row checks; purity; config overrides, fallbacks and MIN/MAX numeric handling (0 accepted,
strings / NaN / Infinity / null fall back to 5 / 150); group result shape; count bounds (4/5, 150/151, custom); the seven within-quiz consistency
fields (trim yes, case no, padded FIRST row too); quiz_id in messages (first row, trimmed, null → `""`); duplicate question_text (once per extra
occurrence) and question_number (`(Nx)`, blanks ignored, `"01"` ≠ `"1"`); the across-rows checks (normalised level, raw-trimmed category / title);
the fixed order of group issues; returned metadata; `[]` throws; engine start state and independence; `fullRecompute` (skips ids undefined / null,
accepts id 0, non-array clears, second call replaces); Map identity for the engine's lifetime; orphans (blank / whitespace / null quiz_id, and
numeric 0 is a real quiz); `onRowAdded`; `onRowRemoved` (incl. unknown id never touching the orphan counter while a real orphan exists);
`onFieldChanged` return values (`[]`, `[id]`, `[old,new]`, one-sided for orphans, whitespace-only edit is not a move, editing an orphan returns `[]`);
both groups re-checked on a move; counter drift (`rowsWithIssues` 0,1,0,1,0; `quizzesFailing` 0,1,1,0); `isRowValid`; `getQuizIndexSnapshot` is a copy;
**a read-count proof of the headline promise** (100 rows in 20 quizzes with counting getters: a full recompute reads all 100; a single-field edit reads
only that quiz's rows; a quiz_id move only the old + new groups (10 rows); `getSummary` / `isRowValid` / snapshot read none; a removal re-checks just the former group);
**incremental == full** (300 seeded random sequences × 60 steps of add / remove / edit / move; after every step the engine's summary, per-row issues,
per-quiz issues (as sets) and index equal a fresh `fullRecompute`); four PINNED findings (below); and a static scan that no shipped page / script /
manifest / service worker references the module and that it is not in the offline core manifest.

`node tests/run.js`: 529 → **570** (+41).

## No source change → no cache bump
`shared/js/authoring-validation.js` is byte-identical to the input (`cmp` against the input zip). The module is not loaded by any page and is not in
`offline/core-manifest.json` / `core.zip`, so nothing precached changed either. `core.zip` untouched; `sw.js` `CACHE_VERSION` stays `mylingo-v13`.
The only files that changed are `tests/run.js` and this handoff. No user-visible bug was found (the module is unwired); the quirks below are latent
or cosmetic, so they were pinned, not fixed (standing policy: fix only when unambiguous and user-visible).

## Mutation-checked
Scripted sweep of **146** hand-written mutations (config resolution and defaults, level normalisation, `quizIdOf`, every row rule / boundary / message,
every group rule / boundary / message, returned metadata, every engine counter transition, index add/remove, full-recompute resets, every
`onFieldChanged` branch and return value, summary fields, exports). First pass: **129 killed, 17 survivors**. 5 were real test gaps and were closed
in the same turn, then re-verified killed:
1. `quizIdOf` truthiness instead of `!= null` (numeric quiz_id 0) → orphan test now covers quiz `0`;
2. within-quiz `expected` not trimmed → padded FIRST row now tested for all consistency fields;
3. across-rows `quiz_category` not trimmed → padded category now tested (first row and later row);
4. `onRowRemoved` unknown-id guard removed (it decremented the orphan counter, masked by the `Math.max(0, …)` clamp) → unknown-id removal now tested while a real orphan exists;
5. `onFieldChanged` returning `['']` for an orphan edit → now asserted `[]`.

Final: **134 killed, 12 survivors, all equivalent mutants**:
`normalizeLevelWith`'s early `includes` return (falls through to the same value); `answers.push(value.toLowerCase())` (lower-cased again before the duplicate check);
the two `text &&` guards around `seenQuestionTexts` (a blank is never added, so it is never found); the `Math.max(0, …)` clamp on `orphanCount` (unreachable below 0 with a consistent index);
`!ids.size` in `rowsForQuiz` (empty Sets are deleted); `if (row)` in `rowsForQuiz` and `if (!row) return` in `revalidateRow` (ids in the index always have a row);
`if (!quizId) return` in `revalidateQuiz` (`''` is never indexed, so the fall-through is a no-op); `rowQuizId.clear()` in `fullRecompute` (only a stale map entry, never read without `rowsById`);
`if (!row) return []` in `onFieldChanged` (falls through to `[]`); `totalQuizzes: quizIndex.size` vs `quizIssuesMap.size` (equal for a consistent engine).
The file was restored byte-identical after the sweep (`cmp`).

## Findings (not changed — pinned by test where noted)
- **[LOW/latent] Engine contract is "`onRowAdded` once per row, then `onFieldChanged`":** re-adding a known row double-counts an orphan (`orphanRows` 2 for 1 row), and
  re-adding after a `quiz_id` change leaves a stale index entry so the row sits in two quiz groups (`totalQuizzes` 2 for 1 row). `fullRecompute` with two rows sharing an
  `__internalId` double-counts orphans the same way. Pinned. Fix would be: `onRowAdded` on a known id → treat as `onFieldChanged`; dedupe ids in `fullRecompute`.
- **[COSMETIC] A quiz entry's `title` / `level` / `category` come from the first row in the engine's index (insertion order), not dataset order,** so after remove + re-add they can differ
  from a fresh `fullRecompute`. The issue lists are identical as sets (proved by the property sweep); only the entry metadata and the message order can differ. Pinned.
- **[LOW/latent] `createEngine().config.LEVELS` / `VALID_STATUSES` / `ANSWER_FIELDS` are the module's own default arrays handed out by reference;** pushing to one changes every later engine and
  validator in that page. Pinned (private sandbox).
- **[INFO] `isRowValid(unknownId)` is `true`.** Pinned.
- **[LOW] `question_number` `"01"` vs `"1"` are not duplicates** (string keys), though both are valid positive integers. Pinned.
- **[LOW] Numeric `level: 0` (not the string `"0"`) slips past both level checks** (`row.level &&` guard and `String(x ?? "")`). Row values are strings in the authoring flow, so latent. Pinned.
- **[COSMETIC] A missing status reports `Missing status` AND `Unrecognized status "undefined"` / `"null"`;** custom `ANSWER_FIELDS` still produce `Gap before answer_N` wording; duplicate question_text
  emits one identical message per extra occurrence (3× the same text → 2 identical messages); `computeQuizGroupIssues([])` throws a TypeError (the engine never calls it that way). Pinned.
- **[INFO] The module is still unwired** (Agent 178 item 21). The static test now fails loudly if a page starts loading it without a decision about precache + `CACHE_VERSION`.

## Coverage inventory (Agent 180's "next agent" item 2)
Every one of the 21 `shared/js/*.js` files is now referenced by `tests/run.js` and has its own test section. What is still untested is **inline page script**:

| file | inline script | top-level functions | notes |
|---|---|---|---|
| `courses/lesson.html` | ~19.8 KB | 16: `esc, sanitizeHtml, fetchJson, renderError, estimateMinutes, youtubeId, youtubeEmbedSrc, mediaEntries, normalize, renderMediaItem, quizUrl, levelFromLessonId, refreshCompletionGate, renderTrail, renderNav, goToSlide` | referenced only as a redirect target so far; `sanitizeHtml` / `youtubeEmbedSrc` / `quizUrl` look security-relevant by name |
| `courses/course.html` | ~10.0 KB | 7: `esc, readProgress, fetchJson, renderError, statusFor, statusLabel, lessonUrl` | |
| `courses/journey.html` | ~8.8 KB | 6: `esc, readProgress, fetchJson, statusFor, lessonHref, renderError` | shares `esc/readProgress/fetchJson/statusFor/renderError` with course.html |
| `main/progress.html` | ~5.3 KB | — | referenced by tab-href tests only |
| `main/placement.html` | ~4.8 KB | — | |
| 6 × `<level>/index.html` | ~4.6 KB each (identical) | — | static scans only |
| 6 × `<level>/dashboard.html` | ~5.7 KB each (identical) | — | static wiring scan since Agent 180 |

## Files changed
- `tests/run.js` (new section; header comment)
- `HANDOFF_AGENT_181.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **570 passed, 0 failed**. `node --check tests/run.js` clean.
- `core.zip` valid and reconciled; `CACHE_VERSION` = `mylingo-v13`; app source unchanged.

## Remaining / carried forward (from Agent 180, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. **CLOSED** — every `shared/js/*.js` module now has tests (`authoring-validation.js` closed this turn; `mastery-review-ui.js` Agent 180; `offline-packs-ui.js` Agent 179).
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176); fix candidate: `app-shell.js` ROOT derivation.
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; drag-and-drop unverified on iPhone Safari.
18. [LOW] `orientation.js` coercion quirks and the "medium at both extremes" confidence rule (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages and directory URLs (Agent 177).
20. [LOW] `authoring-draft-autosave.js` `rowCount` can overstate rows written (Agent 178).
21. [INFO] `authoring-draft-autosave.js` and `authoring-validation.js` are unused by any shipped page (Agent 178; the latter now pinned by a static test, Agent 181).
22. [LOW] offline-packs-ui.js findings (isInstalled all-or-nothing/blank list, silent Remove failure, stale tooltip, progress-callback `files` guard) (Agent 179).
23. [LOW/PRODUCT/INFO] mastery-review-ui.js findings (`now:null` → epoch, mastered learner still told to review, links always to the level index, load-order capture, dead `SKILLS`/unused `compute().rows`) (Agent 180).
24. [LOW/COSMETIC/INFO] authoring-validation.js findings above (re-add double-count / stale index, entry metadata follows index order, shared default config arrays, `isRowValid(unknown)` true, `"01"` vs `"1"`, numeric `level: 0`, cosmetic messages) (Agent 181).

## Next agent — start here
1. `courses/lesson.html` inline script (~19.8 KB, 16 top-level functions, see the inventory). Lift functions out of the page by name with the hoisted `extractFn(src, name)` helper at the top of `tests/run.js`
   and run them in a `vm` sandbox exactly as the quiz.html sections do (Agent 164+); the fake DOM `El` (top of the file) covers innerHTML-driven rendering. Start with the pure / security-relevant ones
   (`sanitizeHtml`, `youtubeId`, `youtubeEmbedSrc`, `quizUrl`, `levelFromLessonId`, `estimateMinutes`, `normalize`, `mediaEntries`), then `render*` / `goToSlide` / `refreshCompletionGate`.
   Read the page first: what it loads (`level-lock.js`, `course-progress.js`, `splash.js`, `safe-url.js`) is already tested, so run the page code against the REAL modules where practical.
2. Then `courses/course.html` and `courses/journey.html` (they duplicate `esc / readProgress / fetchJson / statusFor / renderError`; a consistency test between the copies is worth adding), then `main/progress.html`, `main/placement.html`.
3. Mutation-sweep approach unchanged: a list of `[find, replace, nth]` triples over the file, run `node tests/run.js` per mutant (about 4-5 s each; run the sweep detached with `setsid nohup … &`,
   since a plain background job dies when the tool call returns), classify survivors as gap vs equivalent, close the gaps, re-run just those, then `cmp` the restored file against the input zip.
4. Items 1, 2, 10, 11, 12, 14–19, 20–24 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Pinned rather than fixed every finding: the module is unwired (nothing user-visible can change) and the engine's contract ("add once, then edit") is not violated by any caller, because there is none.
- Tested the engine's promise (incremental == full, and only the touched groups are read) rather than only its outputs, because that is the module's entire reason to exist.
- Kept `authoring-validation.js` and `core.zip` untouched so `CACHE_VERSION` stays `mylingo-v13`.

## Artifacts produced
- `mylingo-v160-agent181-authoring-validation-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_181.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_181.md. You are Agent 182. Continue from 'Next agent — start here'."
