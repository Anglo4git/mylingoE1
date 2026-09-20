# Agent 185 Handoff — Page-level tests for main/progress.html (no source change)

## Context
Picked up `HANDOFF_AGENT_184.md`, "Next agent — start here" item 1.
Baseline verified first: `node tests/run.js` → 677 passed, 0 failed.

## What was done
- **New section "main/progress.html: page rendering (Agent 185)"**, 7 tests. The WHOLE inline script is run for real via the hoisted `makeRunPage` (no changes needed to the helper itself — this page has three separate content containers, `#stats` / `#levels` / `#recent`, none named `#content`, so tests read `p.els.stats` / `p.els.levels` / `p.els.recent` directly rather than the single `.c` shortcut) against a fake fetch (per-level `quizzes.json` manifests only) and fake localStorage, with `modules: []` since this page loads no `shared/js/*.js` module at all — it reads `mylingo.progress.v1` and `mylingo.gamification.v1` directly.
  - **Top stats**: attempted / completed / avg-best (over scored entries only) / XP; a progress entry missing its own `id` field is invisible everywhere (`Object.values(progress).filter(e=>e&&e.id)`); no gamification record → XP/streak default to 0; a non-number `xpTotal` also falls back to 0; zero entries → "—" for the average, not "0%".
  - **Recent activity**: sorted by `lastAccess` descending, capped at 8; badge/title/attempts-pluralisation/time-ago; `pct` falls back `best → latest → 0`; a missing title falls back to the id; the empty-state card when nothing has been attempted.
  - **Escaping**: a quiz title with markup renders as text, never injects real tags.
  - **Per-level cards**: `%`/meta text use the real per-level `quizzes.json` total (`completed/total`) when the manifest loads, case-insensitively matched against `entry.level`; falls back to `completed/attempted` when a level's manifest is empty or missing; `href` to that level's `dashboard.html`.
  - **PINNED**: even when every one of the six `quizzes.json` fetches rejects outright, all six level cards still render a full breakdown — the `.catch()` chained after the overall `Promise.all` is effectively dead code, because every per-item fetch already has its own `.catch(()=>[])`, so the outer promise never actually rejects.
  - **PINNED**: this page has **no level-lock check anywhere** — a level the learner is locked out of by `mylingo.chosenLevel.v1` still renders its true completion card here, unlike `course.html` (hard gate) and `courses/index.html` (visual lock decoration). Same class of finding as journey.html's (Agent 182) missing lock check, now confirmed for this page too.
  - **Static wiring**: no `level-lock` string appears anywhere on the page; `#stats` / `#levels` / `#recent` all present; `app-shell.js` loads after the content containers.

`node tests/run.js`: 677 → **684** (+7). `node --check` clean.

## No source change → no cache bump
`diff -rq` against the Agent-182 input zip: only `tests/run.js` differs (plus the two handoff files, which are new). `core.zip` untouched; `sw.js` `CACHE_VERSION` stays `mylingo-v13`.

## Mutation-checked
13 hand-written mutations of `main/progress.html` (id-filter removed, completed-status check inverted, average-score calc disabled, `xpTotal` type-guard dropped, sort direction flipped, `pct` fallback chain simplified to `||` chaining — same-shape but boundary-different — pluralisation collapsed, case-insensitive level match dropped, per-level `%` formula zeroed, meta-text formula collapsed to always "Not started", one `esc()` entity dropped, the 8-item cap raised to 80): **13 killed, 0 survivors**. File restored byte-identical (`diff -q`).

## Findings (not changed — pinned by test)
- **[LOW, same class as Agent 182/183's journey.html finding] `main/progress.html` has no level-lock check at all.** A locked level's real completion percentage and history are fully visible here, even though `course.html` gates it and `courses/index.html` visually locks it. Since this is a read-only progress summary (not a way to start new content in a locked level), the product risk is lower than journey.html's case, but the inconsistency across the three "level overview" surfaces is worth a product call.
- **[INFO] The `.catch()` after `Promise.all(...).then(...)` in the per-level rendering block is dead code under the current implementation** — every individual manifest fetch already absorbs its own failure via `.catch(()=>[])`, so the outer promise cannot reject through a fetch failure. It could only fire if the `.then` handler itself threw (e.g. a future refactor removing the `Array.isArray` guard). Not a bug — the fallback code is harmless — but worth knowing it currently can't be exercised by any real-world fetch failure.
- **[INFO] Recording an entry without an `id` field silently removes it from every stat on this page** (attempted/completed/average/recent/per-level counts). No shipped write path produces an id-less record today (quiz.html's `save()` always includes `id`), so this is defensive/latent, not currently reachable in production.

## Test-infrastructure notes
- `makeRunPage`'s `contentId` parameter is cosmetic convenience only (sets `.c`/`.html`/`.err`/`.text()`) — for a page with more than one meaningful container, tests just read `p.els.<id>` directly, which already works for every id found in the page's markup. No helper changes were needed for this page.
- No shared/js module was loaded for these tests (`modules: []`) since `main/progress.html` doesn't `<script src>` any of them — matches the page's own static wiring.

## Files changed
- `tests/run.js` (new section; header comment)
- `HANDOFF_AGENT_185.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **684 passed, 0 failed**. `node --check tests/run.js` clean.
- `core.zip` valid; `CACHE_VERSION` = `mylingo-v13`; app source unchanged.

## Remaining / carried forward (from Agent 184, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also lesson gate, load()'s missing-module path, the lesson.html `?level=` override, journey.html having no lock, courses/index.html's try/catch around decoration, **now also main/progress.html having no lock check at all**).
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
27. [LOW/latent/INFO/COSMETIC] courses/index.html findings (Agent 184).
28. [LOW/INFO] main/progress.html findings above (Agent 185).

## Coverage inventory (still untested: inline page script)
| file | inline script | notes |
|---|---|---|
| `main/placement.html` | ~4.8 KB | |
| 6 × `<level>/index.html` | ~4.6 KB each (identical) | static scans only |
| 6 × `<level>/dashboard.html` | ~5.7 KB each (identical) | static wiring scan since Agent 180 |
`courses/lesson.html`, `course.html`, `journey.html`, `index.html`, `main/progress.html`: **done**.

## Next agent — start here
1. `main/placement.html` inline script: read it, run the whole script with `makeRunPage` (already hoisted) against the real modules (likely `placement.js`, `recommendations.js`, `level-lock.js`) and shipped placement banks.
2. Then the identical `<level>/index.html` and `<level>/dashboard.html` scripts (test one level's script against all six levels' files, plus a byte-identity check that the six copies are the same modulo the level).
3. Mutation-sweep approach unchanged (`sweep.py`-style `[find, replace]` lists per page over a copy of the file, restore with the original after each run, classify survivors and hand-run any NOT-FOUND patterns).
4. Items 1, 2, 10–12, 14–28 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Followed the exact "Next agent — start here" item 1 from `HANDOFF_AGENT_184.md`: `main/progress.html`'s inline script, tested with the hoisted `makeRunPage`-style harness against real modules (none loaded, by the page's own design) and shipped/fixture JSON.
- Pinned rather than fixed every finding (standing policy: fix only when unambiguous and user-visible; all findings above are latent, informational, or need a product decision).

## Artifacts produced
- `mylingo-v162-agent185-progress-page-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_185.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_185.md. You are Agent 186. Continue from 'Next agent — start here'."
