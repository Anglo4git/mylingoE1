# Agent 159 Handoff — Remaining Modules Under Test, Four Real Defects Fixed

## Context
Picked up `HANDOFF_AGENT_158.md` (zip `MYLINGO_v156_AGENT158_…`). Worked its item 5 ("not yet
covered by tests": `gamification.js`, `learner-state.js`, `quiz-packer.js`, `offline-packs.js`).
Method notes unchanged: Playwright/Chromium available at `$(npm root -g)/playwright`;
start `python3 -m http.server` and the script in the same `bash_tool` call with `;`
(the call may report `returncode -1` after `pkill` even though output is complete).

## Defects found by the new tests and fixed (4 modules touched)

1. **`shared/js/review-scheduler.js` — one odd level silently dropped ALL review cards from
   backups.** Cards stored any string as `last_level`; `gamification.js`'s backup validator
   (`validateReviewScheduling`) accepts only CEFR levels and rejects the *whole section* if
   one card has anything else, so export/restore lost every review card. Reproduced with
   `level:'placement'`. Fix: `normalizeLevel()` (same rule as `skill-mastery.js`) on write and
   on sanitise; junk levels self-heal to `null`. Reachability today is low (URL level is
   validated; content levels are all A1–C2) — it needed a quiz JSON with a non-CEFR `level`.

2. **`shared/js/offline-packs.js` — `isInstalled()` created an empty cache for every pack it
   was asked about** (`caches.open()` creates on miss). Those phantom caches counted toward
   `MAX_INSTALLED_PACKS`. Fix: `caches.has()` first; only open a cache that exists.

3. **`shared/js/offline-packs.js` — a failed download did not stop sibling workers.** After the
   first `cache.add` rejected and the cache was rolled back, the other workers kept fetching
   the rest of the pack into the deleted cache (wasted bandwidth on flaky networks). Fix: a
   `failed` flag stops further pulls.

4. **`shared/js/learner-state.js` — `readLocal()` could never work.** It referenced `root`,
   which was a parameter of the UMD wrapper, not of the factory, so it threw a ReferenceError
   that its own `try/catch` swallowed and it returned the fallback every time. Fix: pass
   `root` into the factory. **Note:** nothing in the app references `learner-state.js` (no
   `<script>`, not in `offline/core-manifest.json`) — it's dead code today; see item 3 below.

## Tests: `tests/run.js` 36 → 85, all passing (`node tests/run.js`)
- `learner-state.js` (6), `gamification.js` XP/streak (8: XP maths, streak/day-gap/month
  boundary, time-zone `todayStr`, once-per-version rewards, improvement cap, placement/id-less
  sessions earn nothing, legacy ledger migration), `gamification.js` backup/restore (8: envelope
  validation, partial restore leaves live data alone, v1 legacy, session **merge** by quizId,
  null placement clears key).
- **Cross-module contract (8):** whatever `skill-mastery` and `review-scheduler` persist — for
  `b1`, `B2`, `placement`, `A1-B1`, `''`, `undefined`, `null` levels — must pass both the
  backup validator and `learner-state`'s validators. This is the test that would have caught #1.
- `quiz-packer.js` (7) and `offline-packs.js` (10, against a fake Cache Storage/`fetch`:
  dependency ordering, rollback, concurrency cap ≤ 4, LRU eviction that protects dependencies,
  dependency-blocked removal, old-cache cleanup, abort-on-failure, no phantom caches).
- Mutation-checked: reverting each of the four fixes makes its tests fail.

## Verification (real headless Chromium)
- Full quiz click-through to results (0 page errors) → `b1/dashboard.html`:
  `MylingoGamification.validateBackup(buildBackup())` → all 8 sections valid, 0 invalid, on data
  written by the real runtime. `caches.keys()` = only the two SW caches (no phantom pack caches).
- Regression rerun of Agent 158's suite: stretch link OK, bare link still `Level locked`,
  level-lock-blocked warning still appears once, 12 level index/dashboard pages: 0 errors.
- `node --check` on all four modified modules and on `tests/run.js`.

## Remaining / carried forward
1. **[DECISION, unchanged] level-lock fail-open vs fail-closed** (diagnostic warn from 158 stays).
2. **[PRODUCT, unchanged] Back button on the quiz results screen?**
3. **`learner-state.js` is unreferenced.** Either wire it in (it duplicates the validators in
   `gamification.js`, and the two already differ: e.g. learner-state caps `attempts` at 100000 and
   `rewardedSessions` at 20, gamification does not) or delete it with its tests. Two divergent
   copies of the same validation is the same drift class as fix #1.
4. **`gamification.js` legacy-backup check is dead:** `normalizeBackup` always builds all three
   v1 keys, so the `"Malformed legacy backup."` branch can't fire; a v1 file missing
   `gamification` is instead reported via `invalid_sections`. Behaviour is safe (nothing bad is
   restored) and is pinned by a test; only the intended error message is lost.
5. **Zip name vs `RELEASE_IDENTITY.json` (v118) — still unreconciled.** This zip is v157/Agent 159.
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) is still unused (Agent 158 #4).
7. Untested still: `recommendations.js` beyond the one audit scenario, `orientation.js`,
   `course-progress.js`, `runtime-*` modules, `authoring-*` modules, `safe-url.js`,
   `canonical-metadata.js`. `safe-url.js` is the best next target (security-relevant, pure).
