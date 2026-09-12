# Agent 75 — Course Landing Page (COMPLETE)

## What was built

Two new static pages, using Agent 74's `course_content/{courses,units,lessons}.json`
and the existing per-level `quizzes.json` manifests. No server, no build step
required at runtime — plain `fetch()` against JSON, same pattern as
`site/<level>/index.html`.

- `site/courses/index.html` — **course catalog.** Cards for all 6 published
  courses (A1–C2): level badge, description, unit/lesson/exercise counts,
  a progress bar, and two buttons per card — `Continue`/`Start course` (goes
  to the course landing page) and `Practice directly` (goes straight to the
  legacy `../<level>/index.html`). A "Find my level" banner links to the
  existing placement flow (`main/index.html`).

- `site/courses/course.html?level=<a1..c2>` — **single course landing page**,
  query-driven (one template, not six duplicated files):
  - Title, level badge, description.
  - "What you'll practice" chips (unit titles: Grammar / Vocabulary /
    Writing / Academic English, per course).
  - Stat card: unit count, lesson count, exercise count (sum of
    `exercise_quiz_ids` across lessons, not just lesson count — correct
    even once lessons hold multiple exercises).
  - Progress bar + `x / y lessons` complete.
  - `Continue` button -> jumps straight to the next incomplete lesson's
    first exercise. `Start course` if nothing attempted yet. `Course
    complete - practice again` once every lesson is done.
  - `Practice this level directly` button -> legacy `../<level>/index.html`,
    always present and always enabled.
  - Collapsible unit list (`<details>`, no JS framework) - each lesson row
    shows category, exercise/question counts, a status pill
    (Not started / In progress / Completed), and a direct
    `Practice`/`Review` link.

- `site/course_content/{courses,units,lessons}.json` — copied verbatim from
  the repo-root `course_content/` (Agent 74's output) into `site/`, because
  only `site/**` is actually served/deployed and the browser can't fetch
  outside the site root. **Follow-up needed:** wire this copy step into
  `build.py` (or wherever the release pipeline assembles `site/`) so it's
  not a manual copy going forward — flagged for Agent 84/85.

## Two doors, one exercise engine

- Guided door: catalog -> course page -> unit -> lesson -> `Continue` walks
  the journey in order.
- Direct door: `Practice directly` / `Practice this level directly` on both
  pages, and every lesson's own `Practice` link, all point at the *same*
  `shared/quiz.html` runtime and the *same* legacy `<level>/index.html`
  used today. Nothing forces placement or the course path.

## Lesson -> exercise routing (temporary, by design)

Agent 76 (lesson revision page) hasn't shipped yet. Rather than block on
it, every lesson links straight to
`shared/quiz.html?quiz=<id>&level=<level>&redirect=<course.html?level=..&unit=..>`
— i.e. it reuses the existing quiz runtime's own `redirect` param (already
used by placement mode) to return to the right, expanded unit on the course
page afterward. This satisfies "revision must be skippable" trivially
(there's no revision step yet to skip) and keeps the course page fully
functional standalone.

**When Agent 76 ships:** change one line in `course.html`'s `quizUrl()` /
lesson-link construction to point at the lesson revision page instead of
straight to `quiz.html`, passing the same quiz id + redirect through. No
other change needed — the revision page is expected to itself link to
`shared/quiz.html` with the same params.

## Progress — reused, not duplicated

Both pages read the existing `localStorage['mylingo.progress.v1']` (written
by `shared/quiz.html`'s `save()`), keyed by quiz id. A lesson counts as
`completed` iff every one of its `exercise_quiz_ids` has
`status === 'completed'` in that store. No new progress store, no new
completion concept — this is a read-only view over Agents 11/40's existing
state.

## Routes

| Route | Purpose |
|---|---|
| `/courses/index.html` | Course catalog (all levels) |
| `/courses/course.html?level=a2` | Course landing page for a level |
| `/courses/course.html?level=a2&unit=course-a2-unit-02` | Same, with a specific unit pre-expanded (used by the lesson-return redirect; also usable by Agent 77's Journey UI for deep links) |

## UI states handled

- Loading (skeleton cards on the catalog; a text loading state on the
  course page).
- Fetch failure on either page -> inline error message with links back to
  the catalog and to placement (`main/index.html`) — never a blank page.
- No `?level=` or an invalid one on `course.html` -> same error state.
- Course with zero lessons (future draft course) -> stat card and progress
  bar are omitted gracefully rather than dividing by zero.
- All-complete course -> CTA switches to "Course complete - practice again"
  instead of disappearing.

## Responsive / accessibility

- Reused the existing design tokens (`--brand`, `--success`, spacing,
  radii) and patterns (`skip-link`, `:focus-visible`, `min-height:44px`
  tap targets, `prefers-reduced-motion` guards, `@view-transition`) from
  `site/a2/index.html` / `dashboard.html` — no new visual language
  introduced.
- Unit list uses native `<details>/<summary>` — keyboard-operable and
  screen-reader-exposed with no custom ARIA needed; chevron rotation is
  disabled under `prefers-reduced-motion`.
- Grid layouts (`repeat(auto-fit,minmax(...))`) reflow to a single column
  on narrow viewports; no fixed widths.
- Status pills and progress numbers are in text, not color-only.
- `aria-live="polite"` on the catalog grid and course-page loading region.

## Verified

- Embedded JS in both files: `node --check` — clean.
- Data logic simulated in Node against the real shipped JSON for all 6
  levels (`a1`…`c2`): every course resolves, every lesson's
  `exercise_quiz_ids` resolves against that level's `quizzes.json`, **0
  missing references** in every level (matches Agent 74's own 60/60 audit).
- Manual trace of all UI-state branches above (empty course, all-complete,
  fetch failure, missing/invalid `level`).
- No automated browser/E2E test was run in this pass (no headless browser
  available in this environment) — Agent 82 (accessibility) and the
  Playwright suite referenced in `playwright.config.js` should add
  coverage for `/courses/*` before release.

## Guardrails honored

- Did not touch `shared/quiz.html`, the quiz engine, or scoring.
- Did not create a second progress/completion system — reads the
  existing `mylingo.progress.v1` store only.
- Did not redesign the homepage (`site/index.html`, `site/main/index.html`
  untouched) — that's explicitly Agent 79's job. `/courses/` is reachable
  by direct link only until Agent 79 adds an entry point from the
  homepage (recommended: an `Explore courses` link next to `Find my level`).
- Did not trap experienced learners — `Practice directly` is present on
  every card and every course page, unconditionally.
- No quiz content duplicated — pages fetch/display counts and titles
  only, never question/answer content.

## Next dependency

Agent 76 (Lesson Revision Page) can proceed — the lesson link contract
(`quiz_id` + `redirect` back to `course.html?level=&unit=`) is stable and
documented above for it to slot into.
