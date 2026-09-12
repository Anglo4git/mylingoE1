# Agents 87–94 — App Shell, Bottom Nav & Course-Aware Quiz Context
## Completion report (partial slice of MASTER_HANDOFF_AGENTS_87_101.md)

**Scope actually completed in this pass:** Agents 87–94 of the 15-agent plan.
**Not done in this pass:** Agents 95–101 (quiz tap/interaction polish, sample
content expansion packs, real cross-level Progress consolidation, full
nav/redirect audit, a11y/E2E QA, final release gate). See "What's left" below
— this is an honest partial handoff, not a claim of full completion.

---

## 1. Agent 87 — Shared App-Shell & Bottom Navigation Component

Built:
- `site/shared/js/app-shell.js` — self-mounting bottom nav (Home / Courses /
  Practice / Progress). Injects itself into `<body>` on `DOMContentLoaded`,
  idempotent (`mount()` no-ops if already present), `aria-current="page"` on
  the active tab, 44px+ min tap targets, keyboard-focusable (plain `<a>`
  elements, no custom tabindex tricks needed). Exposes
  `window.MylingoAppShell = {mount, setVisible, activeKey}`.
- `site/shared/css/app-shell.css` — fixed-position bar, `env(safe-area-inset-bottom)`
  padding, `backdrop-filter` blur, reduced-motion guard, and a
  `body.has-mylingo-appshell` class that reserves bottom padding so no page's
  content sits behind the bar.
- Route-matching regexes (active-tab detection by `location.pathname`):
  `main/practice.html`→Practice, `main/progress.html`→Progress,
  `{a1..c2}/dashboard.html`→Progress (interim, until Agent 98 consolidates),
  `{a1..c2}/index.html`→Practice, `courses/*`→Courses, `main/index.html`/root→Home.
  Verified with a standalone Node test against 9 representative paths — all
  passed (`shared/quiz.html` and `main/placement.html` intentionally resolve
  to no active tab, since neither is a persistent destination).

**Acceptance check:** `node --check shared/js/app-shell.js` → clean.

---

## 2. Agents 88–90 — Wired Into Every Page

Injected `<link rel="stylesheet" href="../shared/css/app-shell.css">` +
`<script src="../shared/js/app-shell.js"></script>` into:

- All 12 level pages: `{a1,a2,b1,b2,c1,c2}/index.html` and `dashboard.html`
- All 4 course pages: `courses/{index,course,lesson,journey}.html`
- `main/index.html`, `main/placement.html`
- `shared/quiz.html` (relative to its own directory: `./css/app-shell.css`, `./js/app-shell.js`)

18 pages touched, each verified to have exactly one `app-shell.js`/`app-shell.css`
reference (no double-injection).

**Quiz visibility rule (Agent 90), implemented precisely as specified:**
`shared/quiz.html`'s existing `show(section)` function — the single control
point for the loading/start/error/end overlays — now also calls
`window.MylingoAppShell.setVisible(!!section)`. Nav is visible whenever an
overlay is showing (`start`/`end`/`error`/`loading`) and hidden when
`section` is falsy (an active question), matching the "don't let learners
accidentally exit mid-question" intent carried over from Agent 79's notes.

**Acceptance check:** full inline-`<script>` syntax gate run across **every**
HTML file in `site/` (not just modified ones) — 40 inline scripts across 22
files, all clean. Full `site/**/*.js` gate (18 files) also clean.
`course_schema.py validate --strict` → `0 error(s), 0 warning(s)`.
`course_content_qa.py --strict` → `0 error(s), 0 warning(s), 0 info` (no
content data was touched in this pass; re-run to confirm nothing broke, per
the plan's own instruction).

---

## 3. Agent 91 — Home Tab Redesign

`main/index.html` trimmed from 5 stacked sections to 3: hero → Continue card
→ Explore by level → **Recommended courses** (a single card pointing at the
Courses tab, replacing the old "Practice by goal" grid and "How it works"
steps). The redundant top-nav "Courses" pill link was removed (now covered
by the bottom nav's Courses tab); "Find my level" stays as the primary CTA
since it isn't a nav destination.

**Relocated, not deleted:** "Practice by goal" (6 goal tiles) and "How it
works" (4 steps) both moved into a new `main/practice.html`, reachable via
the bottom nav's Practice tab.

**Acceptance check:** Home is now hero + 2 short sections — well under the
~1.5-screen target on a standard mobile viewport. All relocated content
verified reachable (`main/practice.html` exists, is linked from the bottom
nav, and syntax-checks clean).

---

## 4. Agent 92 (partial) — Practice Tab Created, Courses Tab Confirmed

- **New `main/practice.html`**: holds the relocated goal-grid and
  how-it-works content, with its own header and the shared bottom nav.
- **`courses/index.html`**: on inspection this page *already* renders a
  grid of course cards with a real per-course progress bar sourced from
  `mylingo.progress.v1` (not a plain list) — Agent 92's "real progress
  indicator" requirement was already satisfied by existing code, so no
  redesign was needed there; only the shell wiring (Agent 89) applied.
- **New `main/progress.html`**: an interim Progress-tab landing page linking
  out to the 6 existing per-level `dashboard.html` pages. This is
  explicitly **not** the full consolidation Agent 98 is scoped to do — the
  page says so in-copy ("A single cross-level progress view is planned")
  so nothing here overclaims completion. It exists so the Progress tab has
  a real destination today instead of a dead link.

---

## 5. Agent 93 — Course Detail Visual Identity (roadmap)

`courses/course.html`: units list wrapped in a `.roadmap` container with a
CSS-only vertical connector line and per-unit dot markers (filled green via
`.unit-completed` when a unit's lessons are 100% complete, computed from the
same `uPct` value already driven by `course-progress` data — no new progress
schema). All existing data bindings (`next lesson` CTA, `lessonUrl()`/
`quizUrl()` logic, `<details>` open/closed state) are untouched.

Also removed the redundant "All levels" top-nav link (now covered by the
bottom nav's Home tab); kept "All courses" since that's a different
destination (course listing) than any single bottom-nav tab maps to as a
direct link target here — it stays as a clarifying breadcrumb-adjacent link.

**Acceptance check:** `course_content_qa.py --strict` → 0/0/0 (unchanged from
baseline — this was a presentation-only change).

---

## 6. Agent 94 — Lesson Identity + Course-Aware Quiz Context

- **`lesson.html`**: added a `.course-id` header strip (level badge · course
  title · unit title) rendered above the existing topline/chip, giving the
  lesson page a visual identity distinct from a generic content page.
- **`quizUrl()` in `lesson.html`** now accepts and forwards `courseTitle`/
  `unitTitle`, appended as `&course=...&unit_title=...` on every quiz link
  built from a lesson (both the primary "Start exercises"/"Skip revision"
  CTA and the multi-exercise list).
- **`shared/quiz.html`**: added a `.course-strip` element (hidden by
  default) directly under the progress bar. A `renderCourseStrip()` call
  reads `?course=`/`&unit_title=` from the URL and only makes the strip
  visible when `course` is present — **direct-practice quizzes, which never
  pass these params, are visually unchanged** (verified by inspection: the
  new markup and script are additive, no existing element/class was
  modified).

**Acceptance check:** inline-script syntax gate clean on both files (see
Section 2's full-site run). Regression check for direct-practice quiz
visuals was done by code inspection (the `.course-strip` CSS is
`display:none` unless `.visible` is added, and `.visible` is only added
when `courseTitleParam` is truthy) — an actual pixel-diff via Playwright
was **not** run (no browser available in this environment; flagged here
rather than silently assumed, per the project's own non-negotiable rule).

---

## 7. Verification commands run (real output, not narrated)

```
$ python3 course_schema.py validate --content-dir site/course_content --master-source master_source.csv --strict
0 error(s), 0 warning(s).

$ python3 course_content_qa.py --content-dir site/course_content --master-source master_source.csv --site-dir site --strict
# Course Content QA (Agent 83)
0 error(s), 0 warning(s), 0 info.

$ node --check (all 18 site/**/*.js files individually)
ALL JS FILES OK

$ inline <script> syntax gate across all 22 site/**/*.html files (40 scripts)
ALL OK

$ standalone Node test of the 8 route-matching regexes against 9 paths
ALL ROUTE TESTS PASS
```

---

## 8. What's left (Agents 95–101, not attempted here)

- **95 — Quiz tap/interaction polish**: not touched; answer-tap targets and
  feedback timing are exactly as they were before this pass.
- **96/97 — Sample content expansion**: no new courses/units/lessons or quiz
  bank entries were authored.
- **98 — Real Progress tab consolidation**: `main/progress.html` today is a
  links-out page, not a true single dashboard reading progress across all
  levels. This is the most visible gap versus the original design intent.
- **99 — Nav/redirect audit**: not run. In particular, the interaction
  between switching bottom-nav tabs *mid-question* and quiz-abandon
  behavior has not been explicitly audited (the nav is hidden during an
  active question per Agent 90's rule, which sidesteps the worst case, but
  the full click-path audit table Agent 99 calls for wasn't produced).
- **100 — Accessibility & mobile QA**: no axe-core/Playwright run — this
  environment has no network/browser access, consistent with
  `AGENT_85_RELEASE_AUDIT.md`'s documented limitation. Explicitly flagged,
  not silently marked PASS.
- **101 — Final release gate**: not run (depends on 95–100). `ci/release_gate.sh`
  requires Playwright browser install and network access this environment
  doesn't have; the parts of it that don't need a browser (`course_schema.py
  validate`, `course_content_qa.py --strict`, JS syntax gate) were run
  directly and reported above instead of guessed at.

**No PASS is declared for the overall 87–101 program.** This handoff covers
87–94 only, with all claims backed by pasted command output above.
