# Agent 183 Handoff — Page-level tests for courses/course.html and courses/journey.html (no source change)

## Context
Picked up `HANDOFF_AGENT_182.md`, "Next agent — start here" item 1 (the request "be the next stage 10, continue with the next task" was read as: be the next agent and continue).
Baseline verified first: `node tests/run.js` → 641 passed, 0 failed.

## What was done
- **Hoisted the `PN` mini DOM** (tokenizer, serialiser, `DOMParser`) out of the Agent 182 lesson.html section to the top level of `tests/run.js` (after the `El` class), and gave `PN` `textContent` / `href` setters. The lesson.html section uses it unchanged.
- **New section "courses/course.html + courses/journey.html: page rendering (Agent 183)"**, 26 tests. Both pages' WHOLE inline scripts are run for real (`run(page, opts)`: fake fetch, fake localStorage, elements built from the page's own `id="…"` markup) against the REAL `level-lock.js` and `course-progress.js`, on hand-made fixtures and on every shipped level.
  - **course.html:** invalid / case-insensitive level, lock refused before any fetch (and fail-open without the module), fetch set + `lessons.json` fallback + ignored quiz failure, both error messages, header (escaping, label, document title, journey link, blank description), stats / chips / ordering (unit `order`, lesson `order`, drafts and foreign units hidden), progress bar + CTA (Start / Continue / Course complete / none), which unit is open, unit header (plural, %, `unit-completed`), lesson unlock rule (global previous lesson, across units), link format + redirect, type icons, exercise / question counts, escaping.
  - **journey.html:** invalid level, no lock check, fetch set (no quizzes) + fallback + both error messages, chrome (title, breadcrumb, links, hero, aria progress), continue card / journey-complete / empty, unit sections (title, %, classes, icons, aria-label), lesson rows (node / state / class / action), type icons, escaping.
  - **Cross-page:** for every progress prefix of a fixture with drafts and unit gaps, both pages agree on each lesson's title, state and link presence; for all six shipped levels the course / journey order (unit.order, lesson.order) equals the lesson.html gate order (unit_id string sort, lesson.order) and every published lesson belongs to a unit of its course; every shipped level renders on both pages, a fresh learner sees only the first lesson open, a finished learner sees everything completed, and every link points at a real lesson.
  - Static wiring: scripts load before the inline script; only course.html loads `level-lock.js`.

`node tests/run.js`: 641 → **667** (+26). `node --check` clean.

## No source change → no cache bump
All app files are byte-identical to the input (`diff -rq` against the input zip: only `tests/run.js` differs, plus this handoff). `core.zip` untouched; `sw.js` `CACHE_VERSION` stays `mylingo-v13`.

## Mutation-checked
70 hand-written mutations (36 of `course.html`, 34 of `journey.html`; level parsing, lock check, both fallbacks, published filters, sort directions, %, CTA labels / escaping / conditions, open-unit rule, unlock rule and its previous-lesson default, link guards, plural forms, type icons, locked hint, status labels, `unit-completed`, chip dedupe, escaping, description, bar guard, redirect encoding, titles, quiz counts, `readProgress` shape guard, `!r.ok`, continue-card index / category fallback / labels, node symbols, unit icons / classes / `Unit N` escape / %, aria values, error text): **70 killed, 0 survivors**. Six sweep patterns did not match the source text on the first pass and were re-run by hand with corrected text (all killed). Files restored byte-identical (`diff -rq`).

## Findings (not changed — pinned by test)
- **[PRODUCT/BUG-ISH] course.html CTA says "Course complete — back to courses" when the next unfinished lesson has no `exercise_quiz_ids`,** even though lessons remain (progress shows < 100 %). No shipped lesson lacks exercises today, so latent.
- **[LOW/latent] Unlocked lesson without exercises:** course.html renders it as a locked row (no link, "Finish the previous lesson to unlock" hint) while its badge says "Ready"; journey.html gives it a "Start lesson" link. The two pages disagree only for that data shape.
- **[LOW] journey.html has no level-lock check** (already reported by Agent 182; now pinned at page level too). course.html gates; lesson.html gates.
- **[COSMETIC] An explicit but unknown `?unit=` on course.html opens no unit** (suppresses the "unit holding the next lesson" default).
- **[COSMETIC] journey.html prints "Unit  — Title" when a unit has no `order`** (all shipped units have one).
- **[INFO — positive] The course / journey unlock order and the lesson.html gate order agree on all six shipped levels** (asserted), so the lists never show a lesson as open that lesson.html then refuses because of ordering.
- **[INFO] course.html counts "Lessons" / "Exercises" from published lessons in the course's own units only;** lessons whose unit is missing are silently dropped (asserted absent from shipped data).
- Carried: fail-open without `level-lock.js`; `statusFor` legacy path without `course-progress.js` (Agent 182).

## Test-infrastructure notes
- The mini DOM's `querySelector` supports one simple selector (`.class`, `tag`, `#id`); compound selectors like `.btn.secondary` or `h2.path-title` silently match nothing — use `.class` and check `className` instead.
- The mini DOM is not a browser (parser quirks / mXSS unverified).
- Mutation sweep: `(setsid nohup python3 sweep.py > out.log 2>&1 < /dev/null &)` worked; the earlier `& disown` form died with the tool call.

## Coverage inventory (still untested: inline page script)
| file | inline script | notes |
|---|---|---|
| `courses/index.html` | not measured | course list; no lock check |
| `main/progress.html` | ~5.3 KB | referenced by tab-href tests only |
| `main/placement.html` | ~4.8 KB | |
| 6 × `<level>/index.html` | ~4.6 KB each (identical) | static scans only |
| 6 × `<level>/dashboard.html` | ~5.7 KB each (identical) | static wiring scan since Agent 180 |
`courses/lesson.html`, `course.html`, `journey.html`: **done**.

## Files changed
- `tests/run.js` (mini DOM hoisted; new section; header comment)
- `HANDOFF_AGENT_183.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **667 passed, 0 failed**. `node --check tests/run.js` clean.
- `core.zip` valid; `CACHE_VERSION` = `mylingo-v13`; app source unchanged.

## Remaining / carried forward (from Agent 182, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also lesson gate, load()'s missing-module path, the lesson.html `?level=` override, journey.html having no lock).
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
26. [PRODUCT/LOW/COSMETIC] course.html / journey.html findings above (Agent 183).

## Next agent — start here
1. `courses/index.html` inline script (course list, progress, lock decoration): read it, run the whole script with the hoisted `PN` + a `run()`-style harness (copy `run()` from the Agent 183 section into a hoisted helper first — it is generic apart from the page name) against the real modules and shipped JSON.
2. Then `main/progress.html`, `main/placement.html`, then the identical `<level>/index.html` and `<level>/dashboard.html` scripts (test one level's script against all six levels' files, plus a byte-identity check that the six copies are the same modulo the level).
3. Mutation-sweep approach unchanged (`sweep2.py`-style `[find, replace]` lists per page over a copied tree, detached with `setsid nohup … < /dev/null &`, then classify survivors and hand-run any NOT-FOUND patterns).
4. Items 1, 2, 10–12, 14–26 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- "Stage 10" in the request was interpreted as "the next agent" (Agent 183); the next task was taken from the handoff's "start here" list.
- Pinned rather than fixed every finding (standing policy: fix only when unambiguous and user-visible; all findings above are latent or need a product decision).

## Artifacts produced
- `mylingo-v160-agent183-course-journey-page-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_183.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_183.md. You are Agent 184. Continue from 'Next agent — start here'."
