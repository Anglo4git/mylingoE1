# Agent 166 Handoff — recommendations.js Under Test; 6 Defects Fixed; Placement→Recommendations Chain Verified

## Context
Picked up `HANDOFF_AGENT_165.md`, whose named next target was "`recommendations.js` beyond its audit
scenario (it consumes the placement profile)". It had **1 test** (the Agent 156 level-lock scenario).
The extracted zip matched the Agent 165 handoff exactly (223 tests, all passing) before I started.

## Defects found and fixed (1 file: `shared/js/recommendations.js`)
1. **Grammar and usage recommendations offered the same quiz twice (reachable today).** `usage` maps
   to the `Grammar` category, so when both skills are weak and land on the same level,
   `resolveQuizPicks` returned two picks pointing at one quiz and the results panel showed two
   identical links. **Reproduced with the shipped C1 placement bank** (grammar 4 items, usage 2 items
   → both reportable): grammar 50% + usage 50% → both `support` at B2 → `b2-001` twice. Fix:
   `resolveQuizPicks` skips a quiz already picked (by id, else by identity); the weaker skill keeps it
   (recommendations arrive weakest-first). Confirmed in real Chromium (see Verification).
2. **A blank / boolean / array score was treated as a 0% result.** `Number('')`, `Number(false)` and
   `Number([])` are all 0, so `score: ''` produced "Build foundations" one level *down*. New
   `numericScore()`: only numbers and non-blank numeric strings count; everything else is "no score".
3. **Junk entries in the catalog level list counted as A1.** `available_levels: ['zz']` was normalised
   with `normalizeLevel` (junk → `a1`), so A1 looked available. New `validLevel()` drops non-levels.
4. **Junk manifest keys were folded into A1 and could overwrite the real A1 list**
   (`groupManifestByLevel`, key-order dependent). Junk keys are now skipped; `A1`/`a1` lists are
   concatenated instead of one silently replacing the other.
5. **`levelAt()` (exported) returned `undefined`** for a non-numeric or fractional offset
   (`LEVELS[NaN]`, `LEVELS[2.5]`). Non-numeric now means "stay", fractions truncate, ±Infinity clamp.
6. **`max_recommendations: 0` returned 3 items** (`Number(0) || 3`) while `-1` returned none; and a
   `null` element in the recommendations array made `resolveQuizPicks` throw. An explicit 0 now
   returns `[]`; a non-numeric value still falls back to 3; null/non-object recommendations are skipped.

**Scope note:** only #1 is reachable by a learner today (C1/C2-bank placements). #2–#6 are latent —
no in-app caller passes those inputs — the same class as Agent 165's two fixes.

## Tests: `tests/run.js` 223 → 258, all passing (`node tests/run.js`)
New section "recommendations.js + quiz.html renderPlacementRecommendations (Agent 166)":
- **recommendations.js (26):** exports are copies; `levelAt`/`normalizeLevel`; `scoreBand` boundaries
  + a 0–100 sweep at 0.0005 steps against an independent reference; a rules-vs-bands drift check for
  every whole score; every rule's level shift/label and both ladder ends; shape/rounding/clamping;
  non-score rejection; catalog availability (fallback prefers the lower neighbour, junk/empty/non-array);
  ranking, tie-break, cap of 3, ≥2-question rule, base-level precedence, `max_recommendations`
  table, malformed/frozen inputs; `validateProfile`; `resolveQuizPicks` (category match, no cross-level
  fallback, dedupe, junk keys, junk inputs, no mutation).
- **Against the real data (4):** every level ships a Grammar and a Vocabulary quiz (always resolvable,
  usable id/title); every skill×level×score combination resolves to a real quiz of the right category
  or to nothing; a **real C1 placement profile** built by `placement.js` from the shipped bank
  (reproduces defect #1); a real A1 profile (only grammar is reportable — see Observed).
- **quiz.html `renderPlacementRecommendations`, run for real (5, async):** lifted out of the file with
  the real `esc` and the real `recommendations.js`, fake `fetch` serving the real manifests. Covers:
  one link per distinct quiz, each needed level fetched once with `no-store`, panel appended not
  replaced; every link's quiz id exists in the manifest of its own level (all six levels); title HTML
  escaping and id URL-encoding; every failure mode (no recs, no module, network error, HTTP error,
  non-array manifest, empty manifest) leaves the panel untouched; one failing level still shows the
  others.
- **Harness cleanup:** the duplicated `extractFn` (Agent 164's and 165's copies) is now one top-level
  helper, as Agent 165 suggested; the hoist changed no test result.
- **Mutation-checked, each fails only its own tests:** score guard reverted → 2; `levelAt` guard
  reverted → 1; `max_recommendations` reverted → 1; junk-as-A1 reverted → 1; manifest key folding
  reverted → 1; dedupe removed → 4 (unit, real C1 chain, and two render tests); null-recommendation
  guard removed → 1. On `quiz.html` itself: title un-escaped → 1; id un-encoded → 1; `&recommended=1`
  dropped from the recommendation link → 4.

## Verification
- **Real Chromium end-to-end** (`no-store` static server, 390×844): completed
  `quiz.html?quiz=placement-001&level=c1&mode=placement&anchor=c1` answering grammar 2/4, usage 1/2,
  vocabulary 2/2, writing and reading correct. Stored profile: score 70, "Developing", recommended C1,
  skills `grammar 50 / usage 50 / vocabulary 100`. The panel showed exactly **two** recommendation links
  — `b2-001` (Grammar · 50% · B2) and `c2-005` (Vocabulary · 100% · C2), not three — and no page
  errors. Both links open the intended quiz's start screen (`recommended=1`), again with no page errors.
- `node --check` on touched files; **`CACHE_VERSION` bumped `mylingo-v9` → `v10`**
  (`recommendations.js` is precached and changed); `core.zip` rebuilt from `core-manifest.json`
  (90 files, manifest order, deflate); the offline reconciliation tests pass.

## Observed, deliberately not changed
- **Skill-level recommendations are effectively grammar-only for A1–B1 placements.** Each shipped
  10-question bank has 7 grammar and only 1 each of vocabulary/reading/writing; a skill needs ≥2
  items to be reported. Only the B2–C2 banks (and merged primary+verification evidence) give a
  second skill. Product decision: add a second vocabulary item per bank, or lower
  `min_reported_questions` for the 10-question banks.
- **`reading` and `listening` recommendations can never become a link:** no manifest has a `Reading`
  or `Listening` category (categories are Grammar/Vocabulary/Writing/Academic English/Mixed, and
  `Writing` starts at B1). Such a recommendation is silently dropped. `Academic English` and `Mixed`
  quizzes are never recommended.
- A duplicate still consumes one of the 3 recommendation slots (C1 case: 3 recommendations → 2
  links). Deduping before the slice would use the slot for a 4th skill; left alone because
  `recommendSkillLevels` is also the "what to practise" list and `usage` is a distinct skill there.
- With `available_levels`, a fallback keeps `reason: 'stretch'`/label "Stretch your skills" even when
  the level fell back to the learner's base level.
- **`validateProfile()` can never return `false`** — it re-checks the output of
  `recommendSkillLevels`, which already guarantees those properties. Pinned by a test; it is dead as
  a validator.
- `normalizeLevel` (both `recommendations.js` and `placement.js`) does not trim: `' B1 '` → `a1`.
- **`renderSuggestions()` in `quiz.html` (~line 1059) is untested** and builds
  `…&level='+level+'&recommended=1` with `level` unencoded (it is a normalised param, so safe today);
  it shuffles with `Math.random`, so a test needs a stubbed `Math.random`.

## Rules carried forward (still enforced by tests)
- Any edit to a file in `offline/core-manifest.json` requires rebuilding `offline/packs/core.zip`
  (zip exactly the manifest paths, deflate, manifest order — `sw.js` is one of them); bump
  `CACHE_VERSION` in `sw.js` (now `v10`) when a precached file changes.
- New local script/stylesheet on a precached page → both `core-manifest.json` and the `core` pack in
  `packs.json`. `offline_packs.py` (the stated generator) is not in this zip.
- vm-sandbox tests must return JSON clones (cross-realm prototypes break `deepStrictEqual`). The
  render tests avoid this by asserting on strings and primitives.
- To drive the placement quiz in a browser: click **Start quiz** first (intro screen), then
  `button.option[data-index=N]` (1-based, matches `correctIndex`), then `#next`.

## Remaining / carried forward
1. **[DECISION] level-lock fail-open vs fail-closed** (diagnostic warn stays until decided).
2. **[PRODUCT] Back button on the quiz results screen?**
3. **`learner-state.js` still unreferenced** — wire in or delete with its tests.
4. **`gamification.js` "Malformed legacy backup." message still dead code.**
5. **Zip filename vs `RELEASE_IDENTITY.json` (v118) still unreconciled** (naming convention).
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) still unused.
7. `main/practice.html` is a redirect stub, intentionally not precached.
8. **[PRODUCT] New from this agent:** the grammar-only recommendation and the missing
   Reading/Listening/Writing(A1–A2) catalog categories above.
9. **Still untested:** the rest of the DOM half of quiz.html (`render*` other than
   `renderPlacementRecommendations`, `end()`, `load()`/lesson gate, `renderSuggestions`,
   `renderPlacementResult` text, `placementContinue`), `orientation.js`, `mastery-review-ui.js`,
   `app-shell.js`, `authoring-*`, `splash.js`, `offline-packs-ui.js`. Natural next target:
   `placementContinue` + `renderPlacementResult` (same lift-by-name approach; both are pure functions
   of the profile and a stubbed DOM), then `renderSuggestions`.
