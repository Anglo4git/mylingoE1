# Agent 180 Handoff — Test Coverage for mastery-review-ui.js (no source change)

## Context
Picked up `HANDOFF_AGENT_179.md`, "Next agent — start here": item 1, `mastery-review-ui.js` (~13 KB).
Baseline verified first: `node tests/run.js` → 501 passed, 0 failed.
The module is a self-executing IIFE (`(function(global){...})(window)`) that captures `window.MylingoSkillMastery` and
`window.MylingoReviewScheduler` ONCE at load, reads the free global `document` only inside `ensureStyle()`, and renders
by assigning `target.innerHTML`. Exports `{VERSION:1, buildSummary, compute, render, mount}`.

## What was done
- **Hoisted the fake DOM** (`ENT`, `decode`, `class El`) out of the Agent 179 section to the top level of `tests/run.js`
  (second user, as Agent 179 recommended). `El.querySelectorAll` gained descendant-combinator support (`"a b"`); the
  Agent 179 tests are unaffected.
- **New section in `tests/run.js`** (after the Agent 179 section, before the Agent 159 offline-packs section) plus a header-comment
  extension. It runs the REAL `mastery-review-ui.js` in a `vm` sandbox against the REAL `skill-mastery.js` and
  `review-scheduler.js` (stores seeded in a fake localStorage, so the sanitizers, mastery bands, confidence rule and
  due-sorting are the shipped ones), and against small hand-made fakes where a shape the real modules can never produce is
  needed (escaping, missing modules, raw un-sanitised stores, `due_at` oddities, capturing the `now` argument).

**mastery-review-ui.js: 28 tests** — exports and loading with neither data module present; `render(null)`/`mount(null)` → null and
nothing touched; style injected once / skipped when the id exists / skipped with no `document`; empty state (heading wired by
aria-labelledby, "Nothing due", "Start your first review", "Practice A1" → `./index.html`; level upper-cased, missing level →
"Practice level", markup in the level escaped); a 0-question skill is not "tracked"; seeded learner (count chip, four KPIs,
overall accuracy = total correct / total questions rounded, priority skill); due list (earliest due first, "Due now" chip,
`N% accuracy · review due <date>`, meter width, "Review <skill>" link); mastery list (ascending accuracy, band label + class,
question-count plural, confidence chip); next recommended action + closing note; singular/plural and rounding; nothing-due
fallback to the weakest skill; due-but-no-evidence ("limited evidence", KPIs 0/—/—, no Mastery heading); `options.now`
semantics; `mount()` re-reads storage each time and survives corrupt / wrong-version JSON; module-capture order; re-render replaces
the target and returns what `compute()` returns; `compute()` rows/kinds/cards; `buildSummary()` defaults, tie-break, null and
0-question entries; HTML escaping of skill names, band keys, confidence, level (no element created, no attribute breakout);
band/label fallbacks without the mastery module and meter clamping; due-row rounding / zero accuracy / clamping; `due_at: 0` and
the finite `now` handed to the scheduler; underscore skill names; static contract (only methods/members the real modules export,
`{skill, card.due_at}` and `{key, label}` shapes, every real band has a stylesheet chip class); static page wiring (exactly the six
level dashboards load the UI, after `skill-mastery.js` and `review-scheduler.js`, one `#masteryReviewMount` before the script, an
ungated `try{…mount(…,{level:level})}catch(e){}`, the `.section-title` style the markup relies on, and all three scripts in the
offline core manifest).

`node tests/run.js`: 501 → **529** (+28).

## No source change → no cache bump
`shared/js/mastery-review-ui.js` is byte-identical to the input. `core.zip` untouched (`unzip -t` clean); `sw.js` `CACHE_VERSION` stays
`mylingo-v13`. The only files that changed are `tests/run.js` and this handoff. No real user-visible bug was found this turn; the quirks
below are latent or product-level, so they were pinned, not fixed (standing policy: fix only when unambiguous and user-visible).

## Mutation-checked
Scripted sweep of 97 hand-written mutations over the file (escape map, band/label fallbacks, tracked filter, rounding
floor/ceil/round, sort comparators, `now` handling, store defaults, empty/due/nothing-due branches, every user-visible string,
link/label text, clamping, export literals, aria wiring): **94 killed, 3 survivors**, all equivalent mutants:
1. `esc()` null → '' branch (only ever called with truthy or '' values);
2. `compute()`'s `model.masteryStore || {skills:{}}` (`buildSummary` applies the same default itself);
3. `.toLowerCase()` on the level (it is upper-cased again right after).
The file was restored byte-identical after the sweep (`cmp`). The baseline "core.zip byte-identical to source" failure that any mutation
trips by design was excluded from the kill criterion.

## Findings (not changed — pinned by test where noted)
- **[LOW] `mount(target, {now: null})` (or `''`) is treated as the epoch:** `Number.isFinite(Number(model.now))` accepts `Number(null) === 0`,
  so nothing is ever due. Same bug class Agent 158 fixed in `review-scheduler.js`. No shipped caller passes `now` (dashboards pass only
  `{level}`), so latent. Pinned. Fix would be `model.now != null && model.now !== '' && Number.isFinite(Number(model.now))` (would need a
  `core.zip` rebuild + `CACHE_VERSION` bump).
- **[PRODUCT/LOW] A fully mastered learner with nothing due is still told "Next recommended action: review <weakest skill>"**
  ("Lowest current mastery · 100% accuracy"). Pinned.
- **[PRODUCT/INFO] "Review <skill>" / "Practice now" always link to `./index.html` (the level index), not to a skill-specific quiz;**
  `actionUrl(level)` ignores its argument. Pinned.
- **[INFO] Load-order dependence:** the two data modules are captured once at load; a module defined after the UI script is ignored and the
  panel shows the empty state despite stored data. All six dashboards load them in the right order (tested); a missing module degrades quietly. Pinned.
- **[INFO] Dead / duplicated code:** `var SKILLS` is never used; `compute().rows` is not used by `render()` (which re-derives the same lists
  from the summary); `summary.next` only feeds `compute().rows`. Due skills appear in both the due list and the mastery list (by design).
- **[INFO] Raw (un-sanitised) stores handed straight to `render()`/`compute()`** can produce "Not started" chips with "0% accuracy" text or
  `width:NaN%`; `mount()` always sanitises through `readStored()`, so this cannot happen on a shipped page.

## Files changed
- `tests/run.js` (fake DOM hoisted + descendant selectors; new section; header comment)
- `HANDOFF_AGENT_180.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **529 passed, 0 failed**. `node --check tests/run.js` clean.
- `core.zip` valid and reconciled; `CACHE_VERSION` = `mylingo-v13`; app source unchanged.

## Remaining / carried forward (from Agent 179, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: `authoring-validation.js` (~17 KB). (`mastery-review-ui.js` — **CLOSED** this turn; `offline-packs-ui.js` closed by Agent 179.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176); fix candidate: `app-shell.js` ROOT derivation.
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; drag-and-drop unverified on iPhone Safari.
18. [LOW] `orientation.js` coercion quirks and the "medium at both extremes" confidence rule (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages and directory URLs (Agent 177).
20. [LOW] `authoring-draft-autosave.js` `rowCount` can overstate rows written (Agent 178).
21. [INFO] `authoring-draft-autosave.js` and `authoring-validation.js` are unused by any shipped page (Agent 178).
22. [LOW] offline-packs-ui.js findings (isInstalled all-or-nothing/blank list, silent Remove failure, stale tooltip, progress-callback `files` guard) (Agent 179).
23. [LOW/PRODUCT/INFO] mastery-review-ui.js findings above (`now:null` → epoch, mastered learner still told to review, links always to the level index,
    load-order capture, dead `SKILLS`/unused `compute().rows`) (Agent 180).

## Next agent — start here
1. `authoring-validation.js` (~17 KB, likely pure logic — table-driven; unwired, see item 21). Read the file first; reuse the `vm` sandbox
   pattern (`makeMr` in the Agent 180 section is the smallest example: load the real file, seed inputs, assert on outputs) and the mutation-sweep
   approach (a JSON list of `[find, replace]` pairs, run `node tests/run.js` per mutant, ignore the one core.zip identity failure).
2. After that, no untested shipped-or-unshipped JS module remains from the Agent 178 list: consider a coverage inventory (list every `shared/js/*.js`
   file and grep `tests/run.js` for it) before choosing the next target.
3. Items 1, 2, 10, 11, 12, 14–19, 20–23 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Pinned rather than fixed the `now:null` quirk: it is latent (no caller passes `now`) and fixing a precached file costs a `core.zip` rebuild and a
  `CACHE_VERSION` bump for no user-visible gain.
- Hoisted the fake DOM instead of copying it (second user), and added only the descendant combinator it needed.
- Tests use the real data modules wherever possible so a change in a band threshold, confidence rule or due-sorting fails here loudly.

## Artifacts produced
- `mylingo-v160-agent180-mastery-review-ui-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_180.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_180.md. You are Agent 181. Continue from 'Next agent — start here'."
