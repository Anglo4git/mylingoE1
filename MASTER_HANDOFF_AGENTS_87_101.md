# Agent 86 — App Shell & Navigation Audit
## Master Handoff for Agents 87–101 (15 agents)

**Author:** Agent 86 (audit only — no code changed in this pass)
**Triggered by:** direct user feedback after reviewing the Agent 73–85
Course/Lesson/Journey release: no persistent navigation, the home page reads
as one long scrolling listing, and the course→lesson→quiz flow doesn't feel
like a distinct "course engine" even though — see Finding 3 — it technically
is one.

---

## 1. What I checked, and what's actually true

I read the shipped HTML/JS directly rather than relying on prior agents'
"0 drift" reports (same discipline as Agent 84). Three separate claims were
in the user's feedback; each is checked independently below.

### Finding 1 — CONFIRMED: there is no persistent navigation anywhere in the app
```
grep -rl "tabbar|bottom-nav|bottomnav|tab-bar" site --include=*.html --include=*.js --include=*.css
→ NONE FOUND
```
Every page invents its own header nav independently:
- `main/index.html` — pill-style top nav: "Courses" / "Find my level"
- `a1..c2/index.html` and `dashboard.html` (12 files) — a different `headrow` pattern, no link back to courses at all
- `courses/index.html`, `course.html`, `lesson.html`, `journey.html` — a third pattern: plain text links "All courses" / "All levels"
- `shared/quiz.html` — minimal header, brand mark + title only, **no navigation at all** (by design, to avoid accidental exits mid-quiz — see Finding 3's note on this)
- `main/placement.html` — not checked in isolation but follows the same per-page pattern

There is no shared app-shell component. Every page is a standalone HTML
document with its own inlined `<style>` block and its own idea of what the
top-level nav looks like. This is the root cause of "I don't see course
bundle or lesson engine" — the courses/lesson pages are real and reachable,
but nothing in the persistent chrome tells the learner they exist unless
they're already on `main/index.html` and click "Courses" once.

### Finding 2 — CONFIRMED: the home page is one long vertical scroll
`site/main/index.html` (single file, ~34KB inlined) stacks, top to bottom,
in one uninterrupted scroll: hero → "Continue learning" card → "Explore by
level" (6 level tiles) → "Practice by goal" (6 goal tiles) → "How it works"
(4 steps) → footer. There are no tabs, no swipeable sections, no
distinction between "this is the home tab" and "this is everything the app
can do, rendered as one page." This matches the user's description exactly.

### Finding 3 — PARTIALLY CONFIRMED, needs precision: the lesson engine exists but doesn't *feel* like one
I traced the actual click path:
```
courses/index.html → course.html?level=X → lesson.html?lesson=ID → shared/quiz.html?quiz=ID&redirect=...
```
`lesson.html` is a real, populated page — I checked the content data, not
just the template: **all 60 published lessons have a non-empty revision
summary** (`course_content_qa.py`/`content_qa.py` confirm 0 errors on this).
So learners are *not* being dumped straight into a bare quiz — they pass
through a revision screen with a summary, examples, key terms, and
optionally video, with a "Start exercises" CTA.

What's real about the complaint:
- `lesson.html`'s header/footer/branding is its own third visual language, disconnected from both `main/index.html` and `shared/quiz.html` — there's no shared "this is a course page" visual identity (no progress ring, no unit/course chrome carried into the quiz itself).
- The quiz launched from a lesson (`shared/quiz.html?quiz=...&redirect=...`) is *pixel-for-pixel the same engine and chrome* as a quiz launched from direct level practice (`a1/index.html`) — intentionally, per the product copy itself ("One exercise engine powers both guided learning and direct practice"). Nothing in the quiz screen shows "You're in Unit 2 of the A1 Grammar Foundations course" — it just says "Mylingo Quiz." That is very likely what reads as "regular quiz pages" to the user: correct in that the *engine* is shared by design, but currently there's zero visual continuity carried from the course/lesson context into it.
- `course.html`'s unit/lesson list is a flat list with a status pill, not a visual course roadmap/progress map — so the "course" doesn't look distinct from any other listing page in the app.

**Conclusion:** the plumbing is sound (content, routing, redirect-back are
all real and tested). The problem is entirely in the presentation layer:
no shared app shell, no persistent navigation, no visual continuity between
course context and the shared quiz engine, and a home page built as one
long document instead of an app-like set of destinations.

---

## 2. Design direction for the 15 build agents

This is intentionally decided up front so all 15 agents build toward the
same target instead of improvising independently (the failure mode this
audit exists to prevent).

**App shell:** one shared, fixed-position bottom navigation bar with 4
destinations: **Home · Courses · Practice · Progress**. Rendered via a
single shared partial (`shared/js/app-shell.js`, injecting shared markup +
`shared/css/app-shell.css`) included by every page — not copy-pasted per
page, so it only has to be styled/fixed once. `aria-current="page"` on the
active tab; safe-area-inset-bottom padding; min 44×44px tap targets; hidden
during an in-progress quiz question per the existing "don't let learners
accidentally exit mid-question" intent (Agent 79's homepage/front-door
notes describe this concern already — extend it, don't relitigate it).

**Home tab:** compressed to a single non-scrolling-feeling "dashboard"
view: one Continue card, one row of level shortcuts, one row of course
recommendations — not all 5 sections of the current page. "Practice by
goal" and "How it works" move to their own reachable places (Practice tab /
an info sheet) rather than living permanently on Home.

**Courses tab:** becomes a first-class nav destination (not a link
buried in Home's top nav), with course cards showing a real progress
indicator.

**Course → Lesson → Quiz visual continuity:** carry a lightweight course
context bar (course/unit name + progress) from `course.html` through
`lesson.html` into `shared/quiz.html` when `redirect` indicates course
mode, so the quiz screen visibly still belongs to the course. Direct-practice
quizzes (no course redirect) keep today's plain header — the shared engine
stays shared, only the chrome gains a course-aware header when relevant.

**Progress tab:** consolidates the six duplicated per-level
`dashboard.html` pages behind one entry point.

---

## 3. The 15 build agents (87–101)

Sequential — each agent should confirm the prior agent's stated acceptance
criteria before starting, same discipline as Agents 28–85. Every agent must
run the applicable slice of `ci/release_gate.sh` (or the specific
`content_qa.py` / `course_content_qa.py` / `course_schema.py validate` /
`node --check` commands relevant to their change) before writing their
`AGENT_NN_COMPLETION.md`, and must produce a `AGENT_NN_<TOPIC>.md` handoff
in the same style as Agents 73–85.

### Agent 87 — Shared App-Shell & Bottom Navigation Component
Build `shared/js/app-shell.js` + `shared/css/app-shell.css`: a single
injectable bottom nav (Home/Courses/Practice/Progress), fixed position,
safe-area aware, `aria-current`, 44px+ tap targets, keyboard-focusable,
active-tab detection by `location.pathname`. Do **not** wire it into any
page yet — this agent only builds and unit-tests the component in
isolation (a throwaway demo HTML file is fine for manual verification).
**Acceptance:** component renders correctly standalone; `node --check`
clean; no existing page touched.

### Agent 88 — Wire Bottom Nav Into Level Pages
Inject Agent 87's shell into all 12 level pages (`a1..c2/index.html` and
`dashboard.html`). Adjust each page's bottom padding so content isn't
hidden behind the fixed bar. Remove any now-redundant top nav links that
duplicate a bottom-nav destination.
**Acceptance:** all 12 pages render with the bar, no content clipped,
`node --check` clean, existing per-level vitest/E2E specs still pass.

### Agent 89 — Wire Bottom Nav Into Course Pages
Same wiring for `courses/index.html`, `course.html`, `lesson.html`,
`journey.html`. Replace the "All courses"/"All levels" text links with the
shared shell (Courses tab already covers "All courses"; keep a lightweight
in-page breadcrumb for course > unit > lesson, that's a different job than
top-level nav).
**Acceptance:** all 4 pages render with the bar; breadcrumb still works;
`course_schema.py validate` and `course_content_qa.py --strict` still pass
(no data touched, but re-run to confirm nothing broke).

### Agent 90 — Wire Bottom Nav Into Quiz Engine, Placement, and Main Entrance
Wire `shared/quiz.html`, `main/placement.html`, and `main/index.html`.
Define and implement the "hide nav during an active quiz question" rule
precisely: nav visible on the quiz's pre-start and results screens, hidden
during an in-progress question, reappears on completion.
**Acceptance:** nav present everywhere except mid-question; existing
`quiz-flow` E2E spec updated if it asserts on full-viewport quiz layout.

### Agent 91 — Home Tab Redesign (break up the long scroll)
Restructure `main/index.html` per the Home-tab spec in Section 2: Continue
card + level shortcuts + course recommendations only. Move "Practice by
goal" and "How it works" content into the Practice tab / an info sheet
respectively (don't delete the content — relocate it).
**Acceptance:** Home no longer requires more than ~1.5 screens of scroll on
a standard mobile viewport; all relocated content is still reachable and
linked from somewhere; `node --check` clean.

### Agent 92 — Courses Tab Landing Redesign
Redesign `courses/index.html` as a true tab destination: grid of course
cards with a real progress indicator per course (percent or ring), not a
plain vertical list. Wire the new Practice tab (a new
`main/practice.html` or equivalent) to hold the "Practice by goal" content
relocated in Agent 91.
**Acceptance:** Courses tab shows progress per course sourced from the same
progress data `course-progress.js` already tracks; no new progress schema
invented.

### Agent 93 — Course Detail Visual Identity (roadmap/progress map)
Redesign `course.html`'s unit/lesson list into a visual roadmap (e.g.
vertical path with unit nodes and per-lesson status), replacing the current
flat list, while keeping all existing data bindings (`next lesson` CTA,
`lessonUrl()`/`practiceUrl` logic) intact.
**Acceptance:** `course_content_qa.py --strict` still 0/0; roadmap reflects
real completion state from `course-progress.js`.

### Agent 94 — Lesson Engine Visual Identity & Course-Aware Quiz Header
Give `lesson.html` a visual identity distinct from a generic content page
(course/unit context header, consistent with Agent 93's roadmap styling).
Then implement the "course context bar" described in Section 2: when
`shared/quiz.html` is launched with a course-mode `redirect` param, show a
slim header identifying the course/unit/lesson; when launched in direct-
practice mode, keep the existing plain header unchanged.
**Acceptance:** direct-practice quiz visuals are pixel-identical to today
(regression check); course-mode quiz visibly shows course context;
`quiz-flow` E2E (both modes) still passes.

### Agent 95 — Quiz Tap/Interaction Polish
Audit and improve `shared/quiz.html`'s answer-tap targets, tap feedback
(pressed state, timing), and shared design tokens so the quiz engine's
color/spacing/typography visibly belongs to the same app as the new shell
(don't reinvent the quiz *logic*, only the tap/feedback layer and shared
tokens).
**Acceptance:** no change to scoring/answer logic (verify via existing quiz
unit tests); tap targets ≥44px; manual tap-feedback timing documented.

### Agent 96 — Sample Content Expansion Pack 1 (Courses/Units/Lessons)
Audit `course_content/{courses,units,lessons}.json` against
`master_source.csv` for coverage gaps (levels/categories with quizzes but
no course/lesson wrapping them yet). Author new courses/units/lessons
following the existing schema (`COURSE_SCHEMA.md`) with real revision
content (summary, examples, key terms) — no placeholder text.
**Acceptance:** `course_schema.py validate` and `course_content_qa.py
--strict` both 0/0 on the expanded data; every new lesson has a non-empty
revision summary (matching the 100% coverage this audit found on the
existing 60).

### Agent 97 — Sample Content Expansion Pack 2 (Quiz Bank for New Lessons)
Author the underlying quiz questions in `master_source.csv` (via the
existing `generation/` pipeline — `generate.py` → `promote.py`, not hand-
edited CSV rows) for any lessons Agent 96 added that reference quiz IDs not
yet in the master source.
**Acceptance:** `content_qa.py --strict` 0 errors; `generation/` test suite
still green; every `exercise_quiz_ids` reference in the expanded
`lessons.json` resolves to a real quiz.

### Agent 98 — Progress Tab (consolidate per-level dashboards)
Build one Progress tab entry point that consolidates the six duplicated
`{a1..c2}/dashboard.html` pages (level switcher within one page, or one
page that reads progress across all levels) rather than requiring the
learner to already be on a level page to find their dashboard.
**Acceptance:** all data currently shown per-level dashboard is still
reachable from the new Progress tab; no progress-data schema changes.

### Agent 99 — Cross-Page Navigation & Redirect/Back-Stack Audit
With the new shell wired everywhere (Agents 87–98 complete), audit every
page's breadcrumb/back-link and the `redirect` param chain end-to-end.
Specifically verify: switching bottom-nav tabs *during* an in-progress quiz
question doesn't silently lose progress (define and implement a save-or-
confirm rule), and that no page is now unreachable or a dead end.
**Acceptance:** full click-path audit table (like Agent 84's) covering
every route in the app; 0 dead ends; quiz-abandon behavior documented and
consistent.

### Agent 100 — Accessibility & Mobile QA for the New Shell
Extend `tests/e2e/accessibility.spec.js` and `tests/e2e/quiz-flow.spec.js`
to cover the bottom nav specifically (landmark role, `aria-current`,
contrast, tap target size, focus order with a fixed-position element,
mobile-safari viewport behavior). Run the real axe-core + Playwright suite
(requires network/browser install — flag clearly if the executing
environment can't do this, per Agent 85's documented limitation) rather
than static substitutes.
**Acceptance:** axe-core reports 0 new critical/serious violations
attributable to the nav; quiz-flow E2E passes on both configured projects.

### Agent 101 — Final Integration & Release Gate (App-Shell Release)
Re-run the entire release sequence from `ci/release_gate.sh` end-to-end
against the fully wired app (fresh build, JS syntax gate, content QA,
course QA, full a11y + E2E, scale gate, hygiene sweep), same rigor as
Agent 85. Produce `AGENT_101_RELEASE_AUDIT.md` with an explicit PASS/FAIL
and, if PASS, package the release build for handoff.
**Acceptance:** matches Agent 85's stop condition — no PASS declared if any
P0/P1 defect remains unresolved, and no PASS declared on trust for any gate
that requires a browser/network the executing environment doesn't have.

---

## 4. Sequencing / dependency graph

```
87 (shell component)
 └─ 88 (levels) ─┐
 └─ 89 (courses) ─┼─ 90 (quiz/placement/home wiring)
                  │        └─ 91 (home redesign)
                  │             └─ 92 (courses tab redesign) ── 93 (course roadmap) ── 94 (lesson identity + quiz context header)
                  │                                                                         └─ 95 (quiz tap polish)
 96 (content pack 1) ── 97 (content pack 2)   [can run in parallel with 87-95, independent of UI work]
                  └─ 98 (progress tab, needs 87-90 shell)
                                                                                                └─ 99 (nav/redirect audit, needs everything above)
                                                                                                     └─ 100 (a11y/mobile QA)
                                                                                                          └─ 101 (final release gate)
```
96/97 (content) have no UI dependency and can be done by a parallel agent at
any point before 99, since 99's audit needs both the final content set and
the final nav wiring to be meaningful.

## 5. Non-negotiables for all 15 agents (carried over from existing project discipline)
- Never declare "0 drift" from an in-place build — verify against a fresh
  output directory per Agent 84's finding.
- Every agent runs the actual verification commands and pastes real output
  into their completion doc — no narrated/assumed results.
- No placeholder/lorem-ipsum content — Agent 96/97's sample content must be
  real, level-appropriate English content.
- Direct-practice (non-course) quiz flow must remain visually and
  functionally unchanged unless an agent's brief explicitly says otherwise
  (Agents 94/95 are the only ones touching shared quiz chrome).
- If an agent's environment lacks network/browser access for a required
  check (as documented in `AGENT_85_RELEASE_AUDIT.md`), that must be stated
  as an explicit limitation, never silently marked PASS.
