# Agent 197 Handoff — review turn, no source change (backlog is now decision-gated, not code-gated)

## Context
Picked up `HANDOFF_AGENT_196.md`, "Next agent — start here" items 1–2.
Baseline verified first: `node tests/run.js` → **782 passed, 0 failed** (matches Agent 196's reported end state).
`node --check tests/run.js` clean.

## What this turn did
Per item 1, re-read `HANDOFF_AGENT_179.md` through `HANDOFF_AGENT_185.md` end to end, specifically the "Findings
(not changed — pinned by test)" section of each, looking for any finding that is (a) still open, (b) unambiguous,
and (c) local (fixable without a product call). Result: **none qualify**. Every finding in that range is one of:
- **[PRODUCT]** — behavior is arguably correct as-is and changing it is a UX call (e.g. offline-packs-ui's
  all-or-nothing `isInstalled` list, mastery-review-ui always suggesting a review action even when nothing is due,
  authoring-validation's engine "add-once" contract).
- **[LOW/latent]** — real quirk, but unreachable from any shipped code path today (e.g. `mount(target,{now:null})`
  in mastery-review-ui — no dashboard ever passes `now`; numeric `level:0` in authoring-validation — the authoring
  flow only ever produces string levels). Fixing these blind, with no shipped repro, risks a regression test that
  pins a behavior nobody asked for.
- **[INFO]** — not a bug (dead code, unreachable branches, equivalent-mutant territory).

Per item 2: **item 19** (bottom-nav highlights no tab on `<level>/index.html`, the root `index.html`,
`shared/quiz.html`, `main/placement.html`, `main/practice.html`) is still correctly pinned as product/cosmetic.
`shared/js/app-shell.js`'s `ROUTES` table has no entry that reaches any of those five page shapes, so `activeKey()`
returns `null` and no tab lights up there. The reason this isn't unambiguous: a level index page could reasonably
be "Courses" or "Home" depending on how the product wants the level flow framed, quiz.html could be "Courses" or
no-tab-at-all (it's a modal-like flow), and practice/placement are arguably neither. Guessing one and writing a
regression test around the guess would lock in an unreviewed product decision under the guise of a "fix" — exactly
what the standing policy (fix only when unambiguous and user-visible) is there to prevent. Left pinned.

No other carried item (1, 2, 10, 17, 21–29, 35) changed status: 1/2/10/21–29/35 are all DECISION-backlog items
(fail-open vs fail-closed, results-screen Back, dead/unwired files, redirect-param cleanup, etc.) and 17 needs a
real touch device for the ranking-question QA, neither of which a code review can resolve.

## Source change → none
No app source file was touched. `sw.js` `CACHE_VERSION` stays `mylingo-v20`; `offline/packs/core.zip` untouched
(still reconciled with on-disk sources — `unzip -t` clean, identity test passes). `tests/run.js` is unchanged
(no new test section this turn — there was nothing new and unambiguous to pin; adding a test for one of the
[LOW/latent] items without a source change would just be restating the existing agent-179/180/181 pins).

## Tests: 782 -> 782 (unchanged)
`node tests/run.js` → **782 passed, 0 failed**. `node --check tests/run.js` clean.

## Remaining / carried forward (unchanged from Agent 196)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; drag-and-drop unverified on
    iPhone Safari — needs a real device.
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages and directory URLs (Agent 177; reconfirmed above).
21. [INFO] `authoring-draft-autosave.js` and `authoring-validation.js` are unused by any shipped page (Agent 178).
22–29. [LOW/PRODUCT/INFO] Assorted UI-module + page findings from Agents 179–185 (offline-packs-ui all-or-nothing
    install list / silent Remove failure / stale tooltip; mastery-review-ui `now:null`, mastered-learner copy,
    dead links; authoring-validation add-once contract, metadata source-of-truth on move; lesson.html/course.html/
    journey.html/courses-index/progress.html level-lock coverage gaps and `?level=` override — all pinned by test,
    all product calls).
35. [INFO] Whether quiz-exit should return to the homepage (Agent 192) vs dropping the unused `redirect` param.

## Next agent — start here
1. **This backlog is now fully decision-gated.** There is no more code-only work available without a product call:
   every remaining item needs either (a) a decision from whoever owns the product backlog above, or (b) a real
   device for item 17. If a decision arrives on any item, implement it directly (flip the pin in the same change,
   same as Agents 179/195/196 did for prior unambiguous items) rather than re-deriving the options — they're listed
   in the referenced Agent handoffs above.
2. If no decision is available yet, a productive use of a turn is deepening regression coverage on files that
   still don't have a dedicated test section, or a fresh adversarial pass (mutation-sweep style, as Agents 179–181
   did) over files that already have coverage but haven't had a mutation sweep, to catch drift as the app evolves.
3. If a core-pack file changes, bump `CACHE_VERSION` (currently `mylingo-v20`) and rebuild `offline/packs/core.zip`
   from ALL on-disk sources (the identity test catches a partial rebuild).

## Blockers
Product decisions for the DECISION backlog above; a real device for item 17.

## Artifacts
- `mylingo-v174-agent197-review-noop.zip`, `HANDOFF_AGENT_197.md`.

## Resume command
"Resume from HANDOFF_AGENT_197.md. You are Agent 198. Continue from 'Next agent — start here'."
