# Agent 177 Handoff — Test Coverage for orientation.js and app-shell.js

## Context
Picked up `HANDOFF_AGENT_176.md`, "Next agent — start here": item 1 (`orientation.js`) and item 2 (`app-shell.js`).
No source changes this turn — pure test-coverage addition. Baseline verified first: `node tests/run.js` → 402 passed, 0 failed.

## What was done
Added two sections to `tests/run.js` (both inserted after the Agent 176 splash section, before the Agent 159
offline-packs section), plus a header-comment extension. Both modules are self-executing IIFEs that read free globals,
so each runs for real in a `vm` sandbox with a per-test fake environment (nothing leaks into the shared `fakeWindow`).

**A. `orientation.js`: the quick English self-assessment** — 27 tests. Sandbox: fake `window` + controllable `localStorage`
(`orient({raw, localStorage, noStorage})`). Cross-realm note: values returned from the vm never `deepStrictEqual` host
literals, so the section uses a `plain()` JSON-clone helper (same reason splash/app-shell do).
- Public API surface (exact key set) and `STORAGE_KEY = 'mylingo.orientation.v1'`.
- `QUESTIONS`: 10 in the fixed order, each with text and 5 distinct answers (answer index = 0–4 score).
- Scoring: `MAX_SCORE` **42** (4 × weight sum 10.5); per-question weights (core skills ×6 = 1.25, confidence/selfEstimate
  = 1, exposure/goal = 0.5) checked one answer at a time; clamp to 0..4; numeric strings count; NaN/undefined/object/
  Infinity skipped; short/empty/undefined/null arrays; fractions kept; `null`/`''` coerce to 0 (pinned).
- `levelFromScore`: six 7-point bands (0/7/14/21/28/35), both clamps.
- `recommendation`: placement level = thirds of MAX (a1 / a2 / b1, never b2+ — all-4 answers → b1), boundaries pinned
  with real answer sets either side of 14 and 28; `level === estimated_level`; confidence `medium` below 20% and above
  85%, `high` between (fixtures at 19.6 / 20.2 / 84.5 / 85.1%); `estimate_score` rounding; `score` 2-dp rounding;
  `maxScore`; `signals` (raw, unclamped values for reading/writing/grammar/listening/speaking only, `null` when missing).
- `placementUrl`: exact URL for a1/a2/b1; anything else (b2, c2, uppercase, empty, null, path-traversal strings) → a1;
  every emitted level has a real `<level>/dashboard.html` and `shared/quiz.html` exists.
- `readState`: missing → null; corrupt JSON / JSON null / non-object JSON (`5`, `"x"`, `true`, `0`) → null; array returned
  as-is (pinned); `getItem` throwing or `localStorage` missing → null. `writeState`: stores JSON under the key and returns
  true, round-trips, later write replaces earlier; `setItem` throwing / no storage / cyclic value → false, never throws.
- Exported `QUESTIONS` / `LEVELS` are copies (mutating them cannot change scoring or level mapping).
- Static contract with `main/placement.html`: every `O.<member>` the page calls is exported, `orientation.js` loads before
  the page script, the 10-question count matches; and the `recommendedLevel` shape placement.html writes round-trips.

**B. `app-shell.js`: shared bottom navigation** — 21 tests. Sandbox: fake `document` (`currentScript`, `body`,
`createElement` → fake nav with attrs/classList/listeners, `getElementById`, `addEventListener`), `location`,
`window.setTimeout` (manually driven), host `URL`.
- Mount: one `nav#mylingoAppShell` (`role`, `aria-label="Primary"`, `data-hidden="false"`), body class
  `has-mylingo-appshell`; exact export keys; idempotent `mount()`; pre-existing nav left alone; no `<body>` → no-op, no throw;
  `readyState==='loading'` defers to a `DOMContentLoaded` listener, `interactive`/`complete` mount immediately; a second
  execution on a window that already has `MylingoAppShell` does nothing.
- Tabs: exactly Home / Courses / Progress in order, aria-hidden svg icons, hrefs `ROOT + main/index.html |
  courses/index.html | main/progress.html` (those files exist).
- ROOT derivation: domain root, sub-path host (`/mylingo/`), absolute src with query/hash, relative src resolved against the
  page; falls back to `/` for no `currentScript`, no `src`, a src not ending in `shared/js/app-shell.js` (incl. `.js.map`
  and trailing segments), or an unparsable src (`new URL` throwing is swallowed).
- `activeKey`: progress = `main/progress.html` + all six level dashboards; courses = anything under `/courses/`; home =
  `main/index.html`, `/`, `/site`, `/site/`; non-tab pages (quiz, placement, practice, level `index.html`, root
  `index.html`, unknown level, `…htmlx`, empty/null path) → null; backslash paths normalised; route order (progress beats
  courses); sub-path root (`/mylingo`, `/mylingo/`) → home; the "any URL ending in `/` → home" fall-through pinned.
- Active tab markup: `class="as-tab active"` + `aria-current="page"` only on the active tab; none on a non-tab page.
- `setVisible`: hide/show flips `data-hidden`, `aria-hidden`, `inert`; truthiness decides; no nav → no throw.
- Press feedback: pointerdown/up/cancel/leave listeners; `as-press` / `as-release` swap, 400 ms spring-back timer;
  pressing a second tab releases the first; pointerleave outside a tab falls back to the current tab; releases with nothing
  pressed are no-ops; a press outside any tab with nothing pressed is ignored.
- Static guard: every shipped HTML page loading `app-shell.js` (21 found, ≥20 asserted) also links `shared/css/app-shell.css`.

`node tests/run.js`: 402 → **450** (+48: 27 + 21). Header comment extended.

## Mutation-checked (each verified, then reverted)
- `orientation.js`: 64 mutations, 57 killed, 7 survivors — all **equivalent**: `ratio < 0.2` → `<=` and `ratio > 0.85` → `>=`
  (the exact thresholds 8.4 / 35.7 are unreachable with quarter-point weights), `indexOf(level) >= 0` → `> 0` (index 0 is
  `'a1'`, the fallback anyway), dropping `encodeURIComponent` (input already restricted to a1/a2/b1), dropping `|| 'null'`
  and `!value` in `readState` (`JSON.parse(null)` is `null`, and `typeof null === 'object'` returns null anyway), and
  `QUESTIONS[].answers` not copied (scoring never reads `answers`, so a leak is unobservable). Killed: every weight,
  both clamps, non-finite skip, `MAX_SCORE`, band width / rounding / both clamps, placement thirds / rounding / cap /
  level list, confidence bounds / operator / swap, estimate/score rounding, `maxScore`, `estimated_level`, all five signal
  ids / null / clamp, `placementUrl` fallback / every URL fragment, `readState` typeof / catch / key, `writeState`
  return values / key / stringify, `STORAGE_KEY`, LEVELS / QUESTIONS copies, question id / answer-count / order, missing exports.
- `app-shell.js`: 68 mutations, 65 killed, 3 survivors — all **equivalent**: the `ROOT.endsWith('/')` re-append (ROOT always
  ends in `/` after the replace), the `script&&script.src` check (`new URL(undefined, href)` also falls back to `/`), and
  `path===rootPath` alone (the bare `/mylingo` case is still caught by the final `/`-ending route). Five real survivors on the
  first pass (file-name end anchor, dashboard end anchor, null pathname, outside-tab pointerdown, a mistyped mutation) were
  closed by strengthening the tests, then re-killed.
- (`orientation.js` and `app-shell.js` are core-pack files, so the `core.zip` byte-identity test fails on any edit — that
  expected failure was excluded from every kill count.) `diff -rq` against the Agent 176 zip confirms the tree is
  byte-identical after reverts: only `tests/run.js` and this doc differ.

## Findings (not changed)
- **`orientation.js` coercion quirks** (low; all unreachable from placement.html today): `null`/`''` answers are finite once
  coerced and score as 0 (a `JSON.stringify`'d sparse answers array turns holes into `null`); `signals` are the raw answer
  and are NOT clamped although `score` is; `readState()` returns a stored JSON array (only non-objects are rejected);
  `levelFromScore(NaN)` returns `undefined` (unreachable — `scoreAnswers` is always finite). Product note:
  `estimate_confidence` is `'medium'` at BOTH extremes, including a perfect 100% self-rating. All pinned by tests. Carried item 18.
- **`levelFromScore` is dead code in the shipped app.** It is exported (and now tested) but no shipped page calls it;
  placement.html uses `recommendation()`, which only ever yields a1/a2/b1. Not a bug, worth knowing before anyone "fixes" it.
- **Bottom-nav active state** (cosmetic/product): level `index.html` pages, root `index.html`, `quiz.html`, `placement.html`
  and `practice.html` highlight NO tab, while a bare directory URL such as `/a1/` highlights Home because the last route
  matches any path ending in `/`. Pinned by tests. Carried item 19.
- **Fix candidate for item 16 already exists in the repo:** `app-shell.js` derives its ROOT from
  `document.currentScript.src` (plus fallbacks) and is now tested for sub-path hosting — `splash.js` could reuse that
  approach for its icon path.

## Files changed
- `tests/run.js` only (two new blocks, header comment). No application code touched.
- `HANDOFF_AGENT_177.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **450 passed, 0 failed** (Agent 176 left 402; net +48, none removed).
- `node --check tests/run.js`: clean.
- `offline/packs/core.zip` unchanged and valid; `CACHE_VERSION` unchanged (`mylingo-v12`).
- App runs: yes — zero application-code changes.

## Remaining / carried forward (from Agent 176, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also the lesson gate and load()'s missing-level-lock path).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
3–9. Closed in earlier turns.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
13. Still untested: `offline-packs-ui.js` (~8 KB), `mastery-review-ui.js` (~13 KB), `authoring-draft-autosave.js` (~5 KB),
    `authoring-validation.js` (~17 KB). (`orientation.js` and `app-shell.js` — **CLOSED** this turn; quiz.html keyboard
    layer, `load()` and `splash.js` closed earlier.)
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176); see the reuse note above.
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; HTML5 drag-and-drop unverified on iPhone
    Safari (Agent 176).
18. [LOW] `orientation.js` coercion quirks and the "medium at both extremes" confidence rule (Agent 177, above).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages and directory URLs (Agent 177, above).

## Next agent — start here
1. `authoring-draft-autosave.js` (~5 KB, smallest untested module): read the file first — nothing about its behaviour is
   assumed here. Load it in a vm sandbox as the orientation / splash / app-shell sections do (fake window + storage +
   manually-driven timers; use a `plain()` clone for cross-realm `deepStrictEqual`) and cover its public API, storage keys,
   debounce/timer behaviour and corrupt/empty-storage handling.
2. Then `offline-packs-ui.js` (~8 KB; can build on the Agent 159 fake Cache Storage), `authoring-validation.js`
   (~17 KB, likely pure logic — good for table-driven tests) and `mastery-review-ui.js` (~13 KB).
3. Items 1, 2, 10, 11, 12, 14, 15, 16, 17, 18, 19 need a product decision (17 also needs a real device) before any code changes.

## Blockers
None.

## Assumptions made
- Chose to close both items 1 and 2 of Agent 176's "start here" in one turn (both are small standalone modules that
  share the same vm-sandbox recipe).
- Used the real answer sets found by brute force for the threshold fixtures (weighted scores are quarter-point multiples, so
  the exact thirds/20%/85% boundaries are unreachable); the fixtures assert their own scores so a weight change fails loudly.
- Pinned the coercion quirks, the dead `levelFromScore`, and the `/`-ending-URL → Home behaviour as findings rather than
  changing them: this turn is test-only and each needs a decision.
- Treated the 10 questions' text as data (only ids, count and answer-count/distinctness asserted), so copy edits do not
  break tests.

## Artifacts produced
- `mylingo-v159-agent177-orientation-and-app-shell-test-coverage.zip` — full project state after this turn.
- `HANDOFF_AGENT_177.md` — this file.

## Resume command
Paste this into the next agent:
"Resume from HANDOFF_AGENT_177.md. You are Agent 178. Continue from 'Next agent — start here'."
