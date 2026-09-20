# Agent 186 Handoff — Page-level tests for main/placement.html + "Change answers" bug fix

## Context
Picked up `HANDOFF_AGENT_185.md`, "Next agent — start here" item 1.
Baseline verified first: `node tests/run.js` → 684 passed, 0 failed.

## What was done
### 1. Bug found and FIXED (user-visible, unambiguous): "Change answers" did nothing
On the result card, `#editAnswers` was bound straight to `start()`. `start()` sees the finished orientation state
(all answers + `completedAt` + `recommendedLevel`, which `save()` had just written) and immediately calls `showResult()`
again, so the button bounced the learner back to the same result. Now bound to a new `edit()`:
reads the stored answers, re-saves them as an in-progress state (`completedAt`/`recommendedLevel` = null), resets to
Q1, un-hides the quiz card + intro, hides result + manual chooser, and renders with the previous answers pre-selected.
It also works when the page loaded straight into the stored result (where the in-closure `answers` array is still empty).

### 2. New section "main/placement.html: page rendering (Agent 186)", 15 tests
Both inline scripts are run for real via the hoisted `makeRunPage` against the REAL `gamification.js`, `orientation.js`,
`placement.js`, `level-lock.js`:
- fresh load (question, five numbered answers, progress bar / aria-valuenow, Back hidden, focus, nothing persisted);
- answer → advance → in-progress state persisted, Back reappears, returns with the earlier choice selected, Back on Q1 no-op;
- all ten answered (B1 / A1 / A2 cases): chip, copy, assessment plan (only with `placement.js`), level-lock ceiling written
  as `source: assessment`, state completed, Start-assessment URL (`placementUrl(level)&stage=primary`);
- resume (partial, ten-without-completion → last question, >10 answers sliced); garbage / short / level-less stored state = fresh;
- finished state → straight to result; **Change answers** (fix above, both entry paths);
- Skip / "Choose a level yourself": manual chooser, `#manual` anchor, focus, six links to `course.html?level=`,
  locked decoration above the ceiling (re-decorated with the CURRENT ceiling on open), missing `level-lock.js` and a throwing
  decorator both swallowed;
- header stats (XP/streak from real gamification state; hidden for 0 / junk / missing module);
- no `orientation.js` → script exits, manual chooser stays visible; throwing `localStorage` never blocks the result;
- theme-toggle script (default light, saved dark, junk value, click toggles + persists + icon/aria-label/title);
- static wiring (every `getElementById` id exists, module order, app-shell last, `edit` binding).
- **PINNED**: merely opening the page with a finished quick estimate re-writes the level-lock ceiling from it (see findings).
- **PINNED**: the script uses an undeclared `back` that works only via browser named-element access.

### 3. Test-harness extensions (backwards compatible; all earlier sections unchanged)
`makeRunPage` gained: `o.namedGlobals` (ids exposed as globals), `o.setup(els, sb, store)` hook, `document.querySelector`
(`#id sel`), `document.documentElement`; `RUN_MOD` gained `or` / `pl` / `ga`; `PN` gained `focus()` (counts calls) and
`:last-child` in `matches()`.

`node tests/run.js`: 684 → **699** (+15). `node --check` clean.

## Source change → cache bump + core.zip rebuilt
`main/placement.html` is a core-pack file, so: `sw.js` `CACHE_VERSION` `mylingo-v13` → **`mylingo-v14`**, and
`offline/packs/core.zip` rebuilt from `offline/core-manifest.json` (same member list/order; `unzip -t` clean; the
core.zip byte-identity test passes). `diff -rq` vs the Agent-185 zip: only `main/placement.html`, `sw.js`,
`offline/packs/core.zip`, `tests/run.js` (+ this file).

## Mutation-checked
41 hand-written mutations of `main/placement.html` (edit binding / each part of `edit()`, Back visibility, progress %, label,
answer numbering, selected marker, persistence calls, advance condition, completed/level fields, ceiling write, level
upper-casing/default, plan gate, `&stage=primary`, resume conditions and index, answers slice, skip/choose-level flows,
decoration + focus + try/catch, stats threshold/values/unhide, early exit, theme junk/persist/icon/aria, focus calls,
script order): **39 killed, 2 survivors — both equivalent mutants** (`r.estimated_level||r.level` — `recommendation()` always
returns both equal; the `||'a1'` default — unreachable because a stored result needs a truthy `recommendedLevel`).
File restored byte-identical to the fixed version.

## Findings (not changed unless stated)
- **[FIXED] "Change answers" bounced straight back to the same result** (above).
- **[PRODUCT/LOW — PINNED] Opening `placement.html` with a finished quick estimate calls `setAssigned()` again on every load.**
  A learner whose ceiling was raised by the real 120-question assessment (e.g. B1) and who later revisits this page sees the
  ceiling reset to the quick estimate (e.g. A1) and the higher levels re-locked. The setAssigned call belongs to "just finished
  the quiz", not "showing a stored result". Needs a product call (only set on `save()`, or only when no assessment-sourced ceiling exists).
- **[INFO/latent — PINNED] Undeclared `back` global** relies on named-element access; works in every browser, breaks if the
  element id is renamed or the script is moved to a module/strict context that doesn't get named access.
- **[LOW/INFO] `chooseLevel` from the result leaves the quiz answers' saved state as "finished"**, so a reload returns to the result (by design; noted only).
- **[INFO] Two dead defaults**: `||'a1'` in `showResult` and `r.estimated_level||` (equivalent mutants above).
- **[INFO] Resuming a fully-answered but unfinished quiz** (ten answers, no `completedAt`) lands on Q10 with its answer highlighted; a second tap re-finishes it (works, mildly surprising).

## Current state
- Tests: PASS — `node tests/run.js` → **699 passed, 0 failed**. `node --check tests/run.js` clean.
- `offline/packs/core.zip` valid and reconciled; `CACHE_VERSION` = `mylingo-v14`.

## Remaining / carried forward (from Agent 185, updated)
1. [DECISION] level-lock fail-open vs fail-closed (lesson gate, load()'s missing-module path, lesson.html `?level=` override,
   journey.html + main/progress.html having no lock, courses/index.html's try/catch, **now also placement.html re-assigning the ceiling on load**).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176).
17. [QA/PRODUCT] Ranking questions on touch devices (real device needed).
18. [LOW] `orientation.js` coercion quirks (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages (Agent 177).
20. [LOW] `authoring-draft-autosave.js` `rowCount` can overstate rows (Agent 178).
21. [INFO] `authoring-draft-autosave.js` / `authoring-validation.js` unused by any shipped page.
22–24. offline-packs-ui / mastery-review-ui / authoring-validation findings (Agents 179–181).
25. lesson.html findings (Agent 182). 26. course.html / journey.html findings (Agent 183).
27. courses/index.html findings (Agent 184). 28. main/progress.html findings (Agent 185).
29. [PRODUCT/LOW/INFO] main/placement.html findings above (Agent 186).

## Coverage inventory (still untested: inline page script)
| file | inline script | notes |
|---|---|---|
| 6 × `<level>/index.html` | ~4.6 KB each (identical) | static scans only |
| 6 × `<level>/dashboard.html` | ~5.7 KB each (identical) | static wiring scan since Agent 180 |
`main/placement.html`, `courses/lesson.html`, `course.html`, `journey.html`, `index.html`, `main/progress.html`: **done**.
(`main/index.html`, `main/practice.html` were never in the inventory — check whether they carry an inline script worth testing.)

## Next agent — start here
1. `<level>/index.html` inline script: read it, run it with `makeRunPage` (real `level-lock.js` etc.; use `setup` / `namedGlobals`
   if it needs seeded markup) against one level's file, then assert the six copies are byte-identical modulo the level.
2. Same for `<level>/dashboard.html`.
3. Check `main/index.html` and `main/practice.html` for untested inline scripts.
4. Mutation-sweep approach unchanged (`[name, find, replace]` list, restore original after each run, exclude the expected
   core.zip identity failure when editing a core-pack file, classify survivors).
5. If any core-pack source file changes: bump `CACHE_VERSION` in `sw.js` and rebuild `offline/packs/core.zip` from `offline/core-manifest.json`.
6. Items 1, 2, 10–12, 14–29 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Followed "Next agent — start here" item 1. Fixed only the "Change answers" bug (unambiguous, user-visible); pinned the rest.
- "Change answers" restarts at Q1 with previous answers pre-selected (rather than at the last question).

## Artifacts produced
- `mylingo-v163-agent186-placement-page-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_186.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_186.md. You are Agent 187. Continue from 'Next agent — start here'."
