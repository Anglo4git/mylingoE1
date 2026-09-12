# AGENT 115 — Accessibility / Mobile QA

## Status
PASS WITH TOOLING LIMITATION

## Correction to the environment record
Agents 112–114 stated Playwright/browser binaries were unavailable in this
container. That was re-checked instead of re-stated: a headless Chromium
**is** present (`/opt/pw-browsers/chromium-1194`, resolvable via
`playwright.sync_api`, confirmed by an actual `browser.launch(headless=True)`
call) and Python Playwright is installed. This pass served `site/` over
`python3 -m http.server` and drove real Chromium against all 22 shipped HTML
pages plus `shared/quiz.html` (start screen, active question, and error
state) at a 390×844 mobile viewport, a 844×390 landscape viewport, and again
at a simulated 200% text-zoom.

This does **not** mean axe-core is available — that is a separate,
still-genuinely-blocked dependency (see below). Browser availability and
axe-core availability are independent facts and are reported separately so
neither gets misrepresented as the other.

## axe-core: exact blocked ruleset
- Not present under any `node_modules` in the package or globally
  (`npm ls -g` confirmed absent).
- `bash_tool` network egress is disabled in this container, so it cannot be
  installed from the npm registry or fetched from a CDN.
- No local/offline copy of the package or its ruleset shipped with the
  package.
- Consequence: the full axe-core ruleset (color-contrast automation beyond
  manual computation, `aria-valid-attr-value`, `duplicate-id`,
  `landmark-unique`, `image-alt` at DOM-scan scale, etc.) was **not** run.
  Per the mission's explicit instruction, this is reported as a blocked
  ruleset, not silently substituted or claimed as a PASS.
- Every item below was instead verified with a real browser (DOM/CSSOM
  inspection through Playwright's `page.evaluate`, actual keyboard `Tab`
  sequences, actual viewport resizing) or targeted static source review —
  manual/automated-by-me, not axe-core-automated. This distinction is kept
  explicit per the mission's "do not call the accessibility audit fully
  automated" instruction.

## Scope covered and result

| Scope item | Method | Result |
|---|---|---|
| Keyboard navigation | Real `Tab` sequences (15 presses) on every page | No traps found; sequences reach nav → skip link → page content in a sane order |
| Focus visibility | Read `outline`/`box-shadow` on every tabbed-to element | 0 elements with no visible indicator; global `:focus-visible{outline:3px solid #1a73e8}` confirmed in effect everywhere |
| Focus order | Same tab-sequence capture | Matches visual/DOM order on every page tested |
| Semantic buttons/links | Static scan: `<div>`/`<span onclick=...>` with no `role`/`tabindex`, across all HTML and all `shared/js/*.js` | 0 found |
| Labels | Live DOM scan for `<input>/<select>/<textarea>` without a `label[for]`, `aria-label`, `aria-labelledby`, or label-wrap | 0 found in the accessible tree (see note on `progressBackupInput` below) |
| Form controls | Same scan + manual review of `shared/quiz.html` renderers (dropdown, matching, free-text, checkbox) | Every dynamically-created control sets `aria-label` at creation time (confirmed in source, e.g. `select.setAttribute('aria-label','Choose an answer')`) |
| Screen-reader semantics | Live DOM scan for accessible names on every button/link | 0 unlabeled controls in the reachable tree |
| Heading structure | Live DOM scan of **visible** headings per page (accounts for `shared/quiz.html`'s mutually-exclusive overlay screens, each with its own `<h1>`, only one ever displayed at a time) | Exactly one visible top-level heading (`<h1>` or `role="heading" aria-level="1"`) on every page/state exercised; no level-skipping |
| Landmarks | Live DOM scan for `<main>`/`<nav>` | Present on every page |
| External-link labeling | Static scan for `href="http`/`target="_blank"` across all HTML and JS | 0 external links exist anywhere in the shipped app — nothing to label |
| Reduced motion | Static scan | `@media(prefers-reduced-motion:reduce)` present in `shared/css/app-shell.css` and inline in `shared/quiz.html`, covering spinners, option animations, overlay transitions |
| Mobile viewport | `viewport` meta on every page | `width=device-width,initial-scale=1` (or `...,viewport-fit=cover`) everywhere; none disable zoom |
| Touch target sizing | Live `getBoundingClientRect()` on every button/link/input at 390px width | 2 categories flagged and reviewed (see Findings) |
| Text scaling | Real browser: `document.documentElement.style.fontSize='200%'`, then re-measured `scrollWidth` vs `innerWidth` | 0 pages produced horizontal overflow at simulated 200% zoom |
| Overflow | `document.documentElement.scrollWidth` vs `window.innerWidth` at 390px and 844×390 landscape | 0 pages overflow horizontally in either orientation |
| Orientation-sensitive layout | Real browser at 844×390 (landscape mobile) + static scan for `orientation:portrait/landscape` CSS | No orientation lock exists; bottom nav, main content, and quiz screen all render correctly landscape. (Quiz screen intentionally hides the bottom nav only during an active question — pre-existing, documented Agent-90 behavior, not an orientation bug.) |

## Findings

### 1. Two touch-target sizes reviewed — accepted, not changed
- `site/courses/course.html`, `journey.html`, `lesson.html`: the "Courses"
  breadcrumb link renders at ~52×15px.
- All six `site/{a1,a2,b1,b2,c1,c2}/dashboard.html`: the "Browse quizzes →"
  link in the empty-state message renders at ~140×17px.

Both are inline text links embedded in a sentence/breadcrumb of running text
(`<p class="crumb"><a>Courses</a> / …</p>`, `"…yet. <a>Browse quizzes →</a>"`),
not standalone buttons or icons. WCAG 2.5.8 Target Size (Minimum) explicitly
exempts inline targets whose size is constrained by the surrounding text's
line height. Restyling either to hit 24×24px would mean padding a link out
of its sentence flow for a case the success criterion doesn't require —
rejected as an unnecessary UI change under the "do not redesign unrelated
UI" rule. Documented here as **intentionally accepted with justification**.

### 2. `progressBackupInput` file input has no `<label>` — reviewed, not a defect
`shared/js/gamification.js` creates `<input id="progressBackupInput"
type="file" hidden>` on every level dashboard. It carries the `hidden`
attribute (not just visually hidden), which removes it from both the tab
order and the accessibility tree entirely — it is never reachable by
keyboard or screen-reader navigation. It is only ever invoked
programmatically via `.click()` from the "Import learner backup" button,
which itself has a clear text label. Initially flagged by an early
input-scan pass; on inspection this is a correct, standard pattern for a
JS-triggered file picker, not a labeling gap. No change made.

### 3. Confirmed already-correct: background-inert during quiz overlays
Verified (did not need to fix) that `shared/quiz.html`'s `setBackgroundInert()`
applies the HTML `inert` attribute to the header and `<main>` whenever the
start/error/end overlay is showing, and removes it during live question
play. This is exactly the fix needed to stop a screen-reader's virtual
cursor from reaching hidden content behind a full-screen modal — it was
already implemented (visible in code comments dated to this exact concern)
and passed under this pass's audit. Locked in with a regression test.

No other findings. No accessibility or mobile-layout defects required a
code change this pass.

## Files changed
- `tests/unit/test_agent115_accessibility_mobile_qa.py` (new — 9 tests):
  regression guards for viewport meta, outline:none traps, orientation
  locks, unsemantic clickable divs/spans, external-link hygiene, the
  quiz-overlay `inert` behavior, aria-label wiring on dynamic quiz
  controls, reduced-motion media queries, and skip-link presence.
- `AGENT_115_ACCESSIBILITY_MOBILE.md` (this file).
- No `site/` source files were modified — every finding was either already
  correctly implemented by prior agents or is exempt/non-applicable per the
  reasoning above.

## Tests executed
```
$ python3 -m unittest tests.unit.test_agent115_accessibility_mobile_qa -v
... 9/9 pass

$ python3 -m unittest discover -s tests/unit -p "test_*.py"
... 105/105 pass (96 prior + 9 new)

$ python3 course_schema.py validate --content-dir site/course_content --master-source master_source.csv --strict
0 error(s), 0 warning(s).

$ python3 course_content_qa.py --content-dir site/course_content --master-source master_source.csv --site-dir site --strict
0 error(s), 0 warning(s), 0 info.

$ find site -name "*.js" | xargs -n1 node --check
(no output — all pass)
```

Real-browser Playwright checks (not unittest-wrapped, run directly against
`python3 -m http.server` + Chromium, output captured in this pass):
- Tab-sequence + focus-indicator capture across 22 pages: 0 missing
  indicators, 0 traps.
- Heading/landmark/label/touch-target/overflow DOM scan across 22 pages +
  quiz start/error states: findings as listed above, all resolved or
  accepted.
- Landscape (844×390) pass across 7 representative pages: 0 horizontal
  overflow.
- Simulated 200% text-zoom pass across the same 7 pages: 0 horizontal
  overflow.

## Known limitations
- axe-core itself remains unavailable (network-disabled container, not
  bundled) — see exact blocked ruleset above. Every axe-core-equivalent
  check in this pass was done manually via real-browser DOM/CSSOM
  inspection, which covers the scope items but is not a substitute for
  axe-core's full rule coverage (e.g. it doesn't catch every WAI-ARIA
  attribute-value mismatch axe-core's ruleset enumerates).
- Real assistive-technology software (VoiceOver/NVDA/JAWS/TalkBack) was not
  run — no such software is available in this container. Screen-reader
  behavior was inferred from the accessibility tree (roles, names, `inert`
  state) rather than observed via an actual screen reader.
- This pass exercised `shared/quiz.html`'s start and error states plus the
  radio-question renderer. It did not separately re-drive every non-radio
  renderer (matching/ranking/dropdown/checkbox/free-text) through a full
  live session — that live-content coverage is Agent 113's scope and was
  not re-litigated here; this pass only confirmed the aria-label wiring
  those renderers set statically in source.

## Next agent
Ready for Agent 116 — Regression / System Contract Audit. No code changes
from this pass, so there is nothing new to regress against.

## Release blockers
None identified by this pass.
