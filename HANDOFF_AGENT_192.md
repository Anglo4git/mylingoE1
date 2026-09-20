# Agent 192 Handoff — item 34 resolved (redirect self-reference is inert) + pin tests

## Context
Picked up `HANDOFF_AGENT_191.md`, "Next agent — start here" item 2 (carried item 34: does the
homepage Continue link's self-referential `redirect` literal misfire on lesson -> quiz -> back?).
Baseline: 768 passed, 0 failed.

## Finding (item 34 — RESOLVED, no bug)
- Root `index.html` Continue link: `courses/lesson.html?...&redirect=<encodeURIComponent('./index.html')>`;
  `main/index.html` uses `'../main/index.html'`.
- `courses/lesson.html` reads `?redirect` into `redirectParam` (line ~166) but **never uses it**
  (exactly 1 occurrence in the file). Every quiz link it builds carries its own return URL,
  `../courses/lesson.html?lesson=...&level=...&slide=practice`, which resolves correctly from
  `/shared/quiz.html`. Same for `course.html`/`journey.html` redirects: they are dropped by lesson.html.
- Verified in real headless Chromium (python http.server, Playwright): loaded
  `courses/lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1&slide=practice&redirect=.%2Findex.html`,
  no page errors, zero links forward the `./index.html` redirect, quiz links carry the
  `../courses/lesson.html...` return URL.
- Consequence: the self-reference literals are currently dead data (harmless; `./index.html` would
  have resolved to `/shared/index.html` if ever forwarded verbatim to quiz.html). Behaviour
  "quiz exit returns to the lesson practice tab, not the homepage" is the existing, tested design.
  If product wants exit-to-homepage, lesson.html would need to consume `redirectParam` AND rebase it
  from `/courses/` to `/shared/` — a product decision, not done here.

## Changes
Only `tests/run.js` (+ this doc). New section "lesson.html redirect param is inert ... (Agent 192)"
with 2 sync tests pinning: `redirectParam` appears exactly once in lesson.html; `practiceReturnUrl`
stays `../courses/lesson.html?lesson=...`. No shipped file touched -> `CACHE_VERSION` stays
`mylingo-v17`, `core.zip` unchanged.

## Tests: 768 -> 770 (+2)
`node tests/run.js` -> **770 passed, 0 failed**; `node --check tests/run.js` clean.

## Remaining / carried forward
Items 1/2/10–12/14–29 carried list from HANDOFF_AGENT_186/187. Items 33 and 34 are DONE.
New optional [INFO] 35: decide whether the homepage Continue flow should return to the homepage on
quiz exit (needs lesson.html to consume + rebase `redirectParam`); otherwise consider dropping the
unused `redirect` param from the two Continue links (would need drift-test rule + cache bump).

## Next agent — start here
1. Item 1/2/10–12/14–29 carried list (decisions: fail-open modules etc.) — the long-standing backlog.
2. Optional: item 35 above, only if product wants it.
3. If a core-pack file changes, bump `CACHE_VERSION` and rebuild `offline/packs/core.zip` from ALL
   on-disk sources (every member, e.g. sw.js and quiz.html).

## Blockers
None.

## Artifacts
- `mylingo-v169-agent192-redirect-pin.zip`, `HANDOFF_AGENT_192.md`.

## Resume command
"Resume from HANDOFF_AGENT_192.md. You are Agent 193. Continue from 'Next agent — start here'."
