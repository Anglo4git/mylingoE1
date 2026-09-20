# Agent 184 Handoff — Page-level tests for courses/index.html (no source change)

## Context
Picked up `HANDOFF_AGENT_183.md`, "Next agent — start here" item 1.
Baseline verified first: `node tests/run.js` → 667 passed, 0 failed.

## What was done
- **Hoisted `run()` into `makeRunPage(html, script, contentId)`** at the top level of `tests/run.js` (right after the PN mini DOM / `FakeDOMParser`), per Agent 183's own handoff note ("copy `run()` into a hoisted helper first — it is generic apart from the page name"). The Agent 183 course.html/journey.html section now calls it too (`RUNNERS[page](o)`), confirmed byte-for-byte behavior-preserving (667 passed, 0 failed before adding any new test).
- **Extended the `PN` mini DOM**: `appendChild`, a `className` setter, `classList` (add/remove/contains/has/toggle), `dataset` (Proxy over `data-*` attributes, supports get/set/delete), `style` (Proxy supporting arbitrary property assignment plus a `cssText` getter/setter), and `[attr]` presence-selector support in `matches()`. Needed because `courses/index.html` is the first page under test that calls `level-lock.js`'s `decorateLevelLinks()`, which uses all of the above.
- **New section "courses/index.html: page rendering (Agent 184)"**, 10 tests, run via `makeRunPage(HTML, SCRIPT, 'grid')` (this page's container is `#grid`, not `#content`) against the REAL `level-lock.js` + `course-progress.js`, on hand-made fixtures and on every shipped level:
  - fetch chain: the six per-level `course_content/lessons/<level>.json` files fetched in parallel + `lessons.json` fallback if any is missing
  - errors: no published course anywhere → `renderError()` with the "Go to levels" link; a failing fetch → same message
  - only published courses render, sorted A1→C2 regardless of input order
  - card content: level badge + label, escaped title/description, `href`, `aria-label`, a missing description renders blank (never `"undefined"`)
  - stats: units + lessons scoped to the course's own units only (a unit belonging to another `course_id` is invisible even if it points at the right level's lessons); exercises summed across published lessons
  - progress % and CTA: MASTERY-gated (`best>=60`, not just `status==='completed'`) via `course-progress.js`'s `isMastered`; 0 lessons → 0% / "Start course"; any attempted quiz → "Continue"; fully mastered → "Review course" (100%); a course with zero published lessons has no bar/CTA row at all
  - **PINNED**: without `course-progress.js` loaded, `isMastered` falls back to `status==='completed'` with no score check, so a low-scored "completed" quiz now counts toward the percent (asserted the percent actually changes between the two runs)
  - level-lock decoration: a locked level's card gets `is-level-locked` + an appended `.level-lock-overlay`, and its `<a class="course-card">` gets `aria-disabled="true"`; an unlocked level is untouched; **without `level-lock.js`, the page's own `try{...}catch(e){}` around the `decorateLevelLinks` call swallows it silently — page still renders, nothing gets decorated** (this matches the "fail open" pattern already pinned for course.html/lesson.html, but here it's a caught exception rather than an explicit `if(window.MylingoLevelLock)` skip, since `decorateLevelLinks` itself is what's missing, not the `MylingoLevelLock` check)
  - every shipped level: all six render as cards with correct href, unit counts, and (for a fresh learner) 0% / "Start course"
  - static wiring: both `level-lock.js` and `course-progress.js` load before the inline script; `#grid` is present

`node tests/run.js`: 667 → **677** (+10). `node --check` clean.

## No source change → no cache bump
`diff -rq` against the input zip: only `tests/run.js` differs (plus this handoff, which is new). `core.zip` untouched; `sw.js` `CACHE_VERSION` stays `mylingo-v13`.

## Mutation-checked
14 hand-written mutations of `courses/index.html` (CEFR sort direction, published-course filter polarity, published-lesson filter removed, mastery-`every`→length-only, % formula, CTA `>=100`→`>100`, `startedAny` ternary collapsed, own-unit equality flipped, unit-scoping dropped, empty-state guard disabled, `.toLowerCase()` dropped from the href level, the `try/catch` around `decorateLevelLinks` removed, one `esc()` entity dropped, the "no lessons → no bar" ternary disabled): **14 killed, 0 survivors**. File restored byte-identical (`diff -q`).

## Findings (not changed — pinned by test)
- **[INFO — consistent with Agent 182/183]** `courses/index.html`'s CTA/% logic is MASTERY-gated the same way `course.html` is, via the same `course-progress.js` `isMastered()` — so the two pages' percentages agree when the module is present. Neither page was changed to enforce this; it was already true and is now asserted for `index.html` in isolation.
- **[LOW/latent, same shape as course.html's fallback]** Without `course-progress.js`, `courses/index.html`'s local `isMastered` fallback (`r&&r.status==='completed'`) ignores score entirely, so a `best:1` "completed" quiz counts as mastered. No shipped code path loads this page without `course-progress.js` today (it's hard-coded in the page's own `<script src>` list), so this is latent, same class of finding as Agent 182/183's carried-forward fail-open items.
- **[COSMETIC/INFO] `decorateLevelLinks`'s failure mode here is a swallowed exception, not a graceful `if` check** — if `level-lock.js` fails to load, `window.MylingoLevelLock` is `undefined` and the guard already skips it cleanly; the `try/catch` only matters if `MylingoLevelLock` exists but `decorateLevelLinks` itself throws (e.g. a mini-DOM/older-browser gap). Behavior is unchanged either way: cards render without lock decoration.
- No new BUG-ISH findings on this page — its logic is a narrower duplicate of `course.html`'s (same MASTERY threshold, same escaping, same ordering rule), and the one asymmetry (own-unit-only stats scoping) matches `course.html`'s already-pinned Agent 183 finding.

## Test-infrastructure notes
- `PN` (the mini DOM used since Agent 183) gained `classList` / `dataset` / `style` / `appendChild` / a `className` setter, and `[attr]` (presence-only) selector support. These are additive; existing PN-based tests were unaffected (confirmed 667→667 after the hoist/extension, before any new test was added).
- `style` and `dataset` are backed by `Proxy` so arbitrary property names (`el.style.position`, `el.dataset.mylingoLocked`, `delete el.dataset.x`) work without enumerating every possible key up front — mirrors how `level-lock.js` actually uses them.
- `getComputedStyle` in the sandbox is a stub that always returns `{position:'static'}` (the mini DOM has no real layout/CSS engine), which is sufficient for `decorateLevelLinks`'s one branch (`if (getComputedStyle(node).position === 'static') node.style.position = 'relative'`).
- `[attr]` selector support is presence-only (no `[attr=value]` matching) — enough for `decorateLevelLinks`'s `querySelectorAll('[data-level]')`, not a general CSS attribute-selector implementation.

## Files changed
- `tests/run.js` (hoisted `makeRunPage`; PN extended; new section; header comment)
- `HANDOFF_AGENT_184.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **677 passed, 0 failed**. `node --check tests/run.js` clean.
- `core.zip` valid; `CACHE_VERSION` = `mylingo-v13`; app source unchanged.

## Remaining / carried forward (from Agent 183, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also lesson gate, load()'s missing-module path, the lesson.html `?level=` override, journey.html having no lock, courses/index.html's try/catch around decoration).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176).
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; drag-and-drop unverified on iPhone Safari.
18. [LOW] `orientation.js` coercion quirks (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages (Agent 177).
20. [LOW] `authoring-draft-autosave.js` `rowCount` can overstate rows (Agent 178).
21. [INFO] `authoring-draft-autosave.js` / `authoring-validation.js` unused by any shipped page.
22–24. offline-packs-ui / mastery-review-ui / authoring-validation findings (Agents 179–181).
25. [LOW/COSMETIC/INFO] lesson.html findings (Agent 182).
26. [PRODUCT/LOW/COSMETIC] course.html / journey.html findings (Agent 183).
27. [LOW/latent/INFO/COSMETIC] courses/index.html findings above (Agent 184).

## Coverage inventory (still untested: inline page script)
| file | inline script | notes |
|---|---|---|
| `main/progress.html` | ~5.3 KB | referenced by tab-href tests only |
| `main/placement.html` | ~4.8 KB | |
| 6 × `<level>/index.html` | ~4.6 KB each (identical) | static scans only |
| 6 × `<level>/dashboard.html` | ~5.7 KB each (identical) | static wiring scan since Agent 180 |
`courses/lesson.html`, `course.html`, `journey.html`, `index.html`: **done**.

## Next agent — start here
1. `main/progress.html` inline script: read it, run the whole script with `makeRunPage` (already hoisted — just pick the right `contentId` for its markup) against the real modules and shipped JSON.
2. Then `main/placement.html`, then the identical `<level>/index.html` and `<level>/dashboard.html` scripts (test one level's script against all six levels' files, plus a byte-identity check that the six copies are the same modulo the level).
3. Mutation-sweep approach unchanged (`sweep.py`-style `[find, replace]` lists per page over a copy of the file, restore with the original after each run, classify survivors and hand-run any NOT-FOUND patterns).
4. Items 1, 2, 10–12, 14–27 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Followed the exact "Next agent — start here" item 1 from `HANDOFF_AGENT_183.md`: `courses/index.html`'s inline script, tested with a hoisted `run()`-style harness against the real modules and shipped JSON.
- Pinned rather than fixed every finding (standing policy: fix only when unambiguous and user-visible; all findings above are latent or need a product decision).

## Artifacts produced
- `mylingo-v161-agent184-courses-index-page-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_184.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_184.md. You are Agent 185. Continue from 'Next agent — start here'."
