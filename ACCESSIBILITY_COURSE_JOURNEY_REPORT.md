# Agent 82 — Accessibility + UX: Course → Lesson → Journey → Quiz Audit

## Scope
Audited `site/courses/course.html`, `site/courses/journey.html`,
`site/courses/lesson.html`, `site/courses/index.html`, and
`site/shared/quiz.html` (the full guided-learning path) against the
checklist in this handoff: keyboard nav, focus visibility/order, semantic
headings/landmarks, accessible names, contrast/state, screen-reader
clarity, reduced motion, mobile touch targets, error/empty/loading states,
and non-color progress signaling.

## Baseline: this surface was already in strong shape
Agents 26/27/44 (release-gate wiring) and many rounds of incremental work
left this path well ahead of a typical first pass: skip links, visible
`:focus-visible` outlines, `prefers-reduced-motion` handling throughout,
44px+ touch targets, `aria-live` loading/error/feedback regions, a real
`role="progressbar"` with `aria-valuenow` (paired with visible `NN%` text,
not color alone), roving-tabindex keyboard navigation across quiz options,
full keyboard reordering for the ranking question type, non-color
correct/incorrect signaling (check vs. cross icon shape + "Correct!"/"Not
quite." text, not just green/red), and disabled/inert controls once a
question is graded. No changes were made to any of that — it works and
regressing it would violate the "preserve functional behavior" guardrail.

## Fixes made (2 files → 1 file changed: `site/shared/quiz.html`)

### 1. Stale `role` leaking onto the wrong question type
`renderChoice()` sets `#options`'s `role` to `radiogroup`/`group` for
radio/checkbox questions, but nothing ever reset it. A radio question
followed by a text, matching, ranking, or banner question left the
container still announced as a "radio group" to screen-reader users even
though it now held a text input, `<select>`s, or a draggable list —
actively misleading, not just an omission.
**Fix:** `clearQuestionUI()` now resets `#options` to a neutral
`role="group"` / `aria-label="Answer options"` on every question change;
`renderChoice()` still re-specializes it to `radiogroup`/`group` when the
next question actually is radio/checkbox.

### 2. Background content reachable behind modal overlays
The quiz's loading/start/error/end screens are full-viewport `.overlay`
sections layered on top of `<header>` and `<main>` with CSS, but the
header (exit/sound/speed buttons) and the in-progress question underneath
were never removed from the tab order or the accessibility tree. A
keyboard or screen-reader user could tab straight past the visible modal
into controls that were invisible behind it — a classic modal-focus leak.
**Fix:** added `setBackgroundInert()`, called from `show()`, which applies
the native `inert` attribute to `<header>` and `<main>` whenever any
overlay is showing and removes it the moment none is (i.e. during live
quiz play). This also implicitly covers the two call sites
(`startFresh`/`resumeSession`) that close all overlays directly, since
they already route through `show(null)`.

Both fixes are additive/defensive — no markup removed, no IDs, routes, or
localStorage keys touched, no visual change.

## Verification
- `node --check` on the extracted inline script from `quiz.html`: pass.
- `npx vitest run`: **226/228** pass, unchanged from the pre-existing
  baseline (verified by running the identical suite against the untouched
  input zip in a scratch copy — the 2 failures are pre-existing
  string-literal/test mismatches unrelated to this change:
  `session-resume.test.js` expects `'Start Over'/'Start Quiz'` casing that
  the shipped code has read as `'Start over'/'Start quiz'` since before
  this agent; `graded-question-consistency.test.js` fails identically on
  the untouched baseline. Not introduced or worsened here — flagged below
  as a remaining risk for whichever agent owns test/code casing parity.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'`: 69/69 pass.
- Manual re-read of `tests/e2e/accessibility.spec.js` /
  `quiz-flow.spec.js`: neither asserts on `#options`'s `role` or on
  `inert`, and both locate controls by role/name (`getByRole('button',
  {name:'Start Quiz'})`, `getByRole('radio', ...)`), which this change
  doesn't touch — no expected interaction with the fix.

## Known limitation
Playwright's `accessibility.spec.js` (axe-core) and `quiz-flow.spec.js`
could not be executed in this sandbox — `npx playwright install chromium`
requires `cdn.playwright.dev`, which is outside this environment's network
allowlist. This matches the identical limitation already documented by
Agents 79–81. The two fixes above are exactly the kind of finding that
tool would flag (`aria-*-mismatch`/`focus-order-semantics` and
background-reachable-content), so re-running that spec in real CI (already
wired per Agent 79) remains the outstanding confirmation step.

## Remaining risks / repeatable checks for the next agent
1. **Test/code string mismatch** (pre-existing, not introduced here):
   `session-resume.test.js` line 25 expects `'Start Over'`/`'Start Quiz'`;
   `quiz.html`'s `configureStart()` sets `'Start over'`/`'Start quiz'`.
   Whichever is correct product copy should win; the other needs updating
   so this stops silently failing CI. Same class of issue in
   `graded-question-consistency.test.js` — re-check its exact expected
   string against current code.
2. **Repeatable a11y regression check**: any new quiz question type or
   `renderXxx()` function must (a) explicitly set `#options`'s `role`/
   `aria-label` rather than relying on a leftover value, and (b) end in a
   fully-disabled/inert state once `finishAnswer()` runs — grep for
   `$('options').setAttribute('role'` and `querySelectorAll('input,select,
   button').forEach(el=>el.disabled=true)` as the two anchor points.
3. **Repeatable modal check**: any new full-viewport overlay (or any
   change to `show()`) must keep calling `setBackgroundInert()` (or an
   equivalent focus-trap) so background content can never receive focus
   while a modal is up. `inert` support requires evergreen
   Chrome/Firefox/Safari (all shipped 2022–2023); no polyfill was added
   since this app already assumes a modern PWA-capable browser
   (service worker, `@view-transition`).
4. **Not verified here (no visual/browser access in this sandbox)**:
   real contrast-ratio measurement (only reasoned about `--muted:#6b7280`
   on white, which is ≈4.6:1 and passes AA for normal text but is close to
   the line — a full axe/Lighthouke pass is the authoritative check),
   and actual screen-reader output (NVDA/VoiceOver) for the fixes above.

## Verdict
Two confirmed, real accessibility defects found and fixed with a minimal,
additive patch to a single production file. No regressions in any test
suite that could run in this sandbox. Recommend the browser-only
Playwright a11y/e2e specs be run in CI as the final confirmation, per the
limitation above.
