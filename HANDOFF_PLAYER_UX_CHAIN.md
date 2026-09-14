# Handoff — full-screen player, quiz gating, suggestion scoping, mastery threshold

Follows the protocol in `ORCHESTRATED_AGENT_HANDOFF.md`. This is a new
chain, separate from the lesson-JSON-split work
(`HANDOFF_LESSON_JSON_SPLIT.md`), covering the person's 5-part player/quiz
UX request. Each numbered item below is one agent's mission — narrow
enough to finish and verify in one run, per the free-tier continuity rule.

## Chain
`Agent 1 (DONE) → Agent 2 (DONE) → Agent 3 (DONE) → Agent 4 (DONE) → Agent 5 (DONE) — CHAIN COMPLETE`

## Agent 1 — NAV-STRIP (full-screen player + declutter) — COMPLETED

**Mission:** remove the site header and the bottom app-shell nav from
`courses/lesson.html` (the course/lesson slide player) so it runs
full-screen, and strip unnecessary chrome text.

**Files changed:** `courses/lesson.html` only.

**Changes:**
- Removed `<header>` (brand logo + "All courses"/"All levels" links) and
  the `<footer>Mylingo · Works offline…</footer>` tagline entirely.
- Removed the `../shared/css/app-shell.css` stylesheet link and the
  `../shared/js/app-shell.js` script include, so the bottom
  Home/Courses/Progress tab bar (injected by `app-shell.js` on every page
  that includes it) never mounts on this page.
- Kept the `.chapter-trail` (Lesson → Watch → Practice slide-position
  tabs) — this is functional player UI, not site chrome — but moved it out
  of a bordered `<header>` bar into a plain `.player-top` wrapper with no
  background/border, so it reads as part of the fullscreen slide, not a
  website header.
- Kept the `#crumb` breadcrumb (`Courses / <course> / <unit>`) as the only
  way back out of the player, since removing the header nav removed the
  other exit path. **Flagging this for review** — if "no headers" should
  mean removing the crumb too, the next agent (or the person) needs to
  confirm there's still some other way to leave the player before cutting
  it; right now it's the sole back-navigation.
- Kept `.player-nav` (the fixed Back/Continue slide-navigation bar) and
  the `.skipbtn` ("Skip revision" link) — both are functional in-player
  controls, not decorative chrome, and were not touched.
- Reduced `main`'s bottom padding from 140px to 48px (was reserving space
  for the now-removed bottom app-shell bar) and cleaned up now-dead CSS
  (`.headrow`, `.brand-logo`, old `header{}`/`footer{}` rules).

**Verification:**
- `node --check` on both `<script>` blocks in `courses/lesson.html`: pass.
- `grep -n "<header>\|</header>\|<footer>\|app-shell" courses/lesson.html`
  → zero markup hits (only two explanatory code comments mention
  "app-shell" by name).
- Confirmed `shared/js/splash.js` and `shared/css/theme.css` (both still
  included) don't independently inject `.mylingo-appshell` — `theme.css`
  only has a dead dark-mode override selector for it now, harmless.
- Not tested in a real browser (no network egress in this sandbox) — load
  `courses/lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1` in a
  real environment to confirm no visual regression (chapter-trail spacing,
  crumb placement, no leftover blank gap where the header used to be).

**Risks:** none to other pages — `app-shell.css`/`.js` are still included
everywhere else unchanged, so the bottom tab bar still shows on
`courses/index.html`, `courses/course.html`, `courses/journey.html`, level
pages, etc. Only the lesson player itself went full-screen.

---

## Agent 2 — QUIZ-GATE (no path to quiz/practice that bypasses the course player) — COMPLETED

**Scope decision made (flagged as open in Agent 1's handoff, resolved here):**
Checked whether the per-level browse-by-topic quizzes (`a1/index.html` etc.)
use the same quiz ids as lesson exercises — they don't, entirely. In A1,
the level manifest has 23 quizzes; only 13 are referenced by any lesson's
`exercise_quiz_ids`; the other 10 are standalone practice content with no
lesson at all. That gives a clean, principled line: **a quiz that belongs
to a lesson must be reached via the lesson player; a quiz that doesn't
belong to any lesson was never part of the course/lesson flow and stays
directly accessible.** No product-scope guess required — the content
model already draws this line.

**Implementation — one choke point instead of patching every link:**
Rather than hunting down and fixing every page that links to
`shared/quiz.html` (`a1..c2/index.html`, `a1..c2/dashboard.html`,
`main/progress.html`, etc.), added a gate inside `shared/quiz.html` itself:

- New `lessonParam=p.get('lesson')` — set by `courses/lesson.html` on
  every quiz link it builds (`quizUrl()` now takes a 6th arg,
  `lessonIdParam`, and appends `&lesson=<id>`; all three call sites in
  `courses/lesson.html` updated to pass `lesson.lesson_id`).
- New `findOwningLesson(quizId)` — fetches
  `../course_content/lessons/<level>.json` (falls back to the monolith,
  same pattern as the lesson-JSON-split work), returns the lesson whose
  `exercise_quiz_ids` contains this quiz id, or `null` if none (standalone
  quiz, or a placement quiz — `/^placement-/` ids are excluded up front).
- New `enforceLessonGate()` — if the quiz has an owning lesson and the
  `lesson` URL param is missing or doesn't match that lesson's id,
  `location.replace()`s to
  `../courses/lesson.html?lesson=<ownerId>&level=<level>&redirect=<original redirect or back to course.html>`
  instead of loading the quiz. Called at the top of `load()`, skipped only
  in `mode==='placement'` (placement flow has its own routing, untouched).

**Also removed two now-confirmed-dead direct-to-quiz shortcuts** (belt and
suspenders with the gate above, and these were genuinely unused/redundant
buttons — ties into Agent 1's "no unnecessary buttons" goal too):
- `courses/journey.html` — deleted `directHref()` and the "Practice this
  topic" link it powered from every lesson row (it pointed at the same
  lesson-owned quiz as "Open lesson"/"Review" already did, just bypassing
  the player).
- `courses/course.html` — deleted the unused `quizUrl()` helper (confirmed
  via grep it was never called anywhere in the file — `lessonUrl()` was
  already the only path used for every exercise link, per the existing
  Agent-76 comment). Left dormant, it was a latent bypass waiting to be
  wired up by a future edit.

**Files changed:** `shared/quiz.html`, `courses/lesson.html`,
`courses/journey.html`, `courses/course.html`.

**Verification:**
- `node --check` on both `<script>` blocks in all four files: pass.
- Confirmed `main/progress.html`'s review/retry quiz links (which still
  point straight at `shared/quiz.html`, unedited) and every `a1../c2`
  index/dashboard page are covered by the gate automatically — no edits
  needed there, verified the gate gets hit for any lesson-owned id
  regardless of entry point, by construction (it lives inside
  `shared/quiz.html`, not on the linking pages).
- Confirmed the homepage "Continue" card (`index.html`, `main/index.html`
  via `shared/js/course-progress.js`) already linked to
  `courses/lesson.html` before this change — untouched, no gate interaction
  needed.
- Not tested in a real browser (no network egress in this sandbox). Before
  merging: click a lesson-owned quiz link from `main/progress.html` or a
  level index page in a real environment and confirm it redirects into
  `courses/lesson.html` instead of starting the quiz; click "Start
  exercises" from inside `courses/lesson.html` and confirm the quiz loads
  normally (no redirect loop — the `lesson` param should match).

**Risks:** the gate adds one extra `fetch()` (the per-level lessons file)
before every non-placement quiz load, even ones that turn out to be
standalone. This is the same small JSON file `courses/lesson.html` already
fetches, so it's cheap and cacheable, but it is a new network round-trip
on the quiz page that didn't exist before — worth confirming it doesn't
introduce a visible loading flash in a real browser test.

---

## Agent 3 — QUIZ-SUGGEST (result-card suggestions scoped to lesson/unit) — COMPLETED

**Turned out simpler than scoped:** the lesson objects in
`course_content/lessons/<level>.json` already carry their own `unit_id`
field directly (confirmed by inspection), so no separate fetch of
`course_content/units.json` was needed — filtering the already-fetched
lesson list by `unit_id` gives the same-unit set directly.

**Also reused, not duplicated, Agent 2's fetch:** factored the
lesson-list fetch out of `findOwningLesson()` into a new cached
`getLevelLessons()` (promise memoized in `_levelLessonsPromise`), and had
both `findOwningLesson()` (the gate, runs earlier in `load()`) and the new
suggestion logic call it. Net effect: still exactly one
`course_content/lessons/<level>.json` fetch per non-placement quiz load,
same as before Agent 3 — no new network round-trip added for this
feature, addressing the "worth confirming no extra fetch" note Agent 2
left in its risk section.

**Implementation (`shared/quiz.html`):**
- `lessonSuggestionIds()` — if `lessonParam` is unset (standalone/
  placement quiz), resolves `null` immediately, no fetch, no behavior
  change. Otherwise looks up the owning lesson from `getLevelLessons()`
  and returns, in priority order: Tier 1 — the lesson's own
  `exercise_quiz_ids` minus the quiz just taken; Tier 2 (only if Tier 1 is
  empty) — `exercise_quiz_ids` from every other lesson sharing the same
  `unit_id`; `null` if both are empty.
- `loadSuggestions()` — rewritten to call `lessonSuggestionIds()` first;
  if it returns ids, maps them through the existing level manifest (via
  `getManifest()`) to get `{id,title}` suggestion cards, falling back to
  the old same-`category` behavior (now extracted into
  `categorySuggestions()`) if the tiered ids don't resolve in the
  manifest for some reason, or if `lessonSuggestionIds()` returned `null`
  (no lesson param, or a lesson/unit with no other exercises to suggest —
  the "last resort, not the default" fallback the mission called for).
- `renderSuggestions()` and its retry guard were **not changed** — both
  tiers and the fallback all populate the same `suggestPool` shape
  (`{id, title, ...}` from the manifest) that `renderSuggestions()`
  already consumed, so the render/retry path needed no edits.
- `shared/js/recommendations.js` untouched, as instructed — unrelated
  `window.MylingoRecommendations` engine, different part of the result
  screen.

**Verification:**
- `node --check`-equivalent syntax pass on both `<script>` blocks in
  `shared/quiz.html`: pass.
- Dry-ran the tiering logic against the real `course_content/lessons/
  a1.json` data (not a mock) for `course-a1-unit-01-lesson-01`: Tier 1
  correctly returns the lesson's other exercise (`a1-011`, after
  excluding `a1-001`); Tier 2 correctly returns 9 quiz ids pulled from
  every other lesson in `course-a1-unit-01`, confirming both tiers
  compute correctly against production content, not just plausible-looking
  code.
- Confirmed `data.category` (present on every individual quiz JSON, e.g.
  `grammar/a1/a1-001.json`) still exists for lesson-exercise quizzes, so
  `renderSuggestions()`'s existing "only attempt `loadSuggestions()` once"
  retry guard (gated on `data.category`) still fires normally — no
  regression there.
- Not tested in a real browser (no network egress in this sandbox).
  Before merging: finish a lesson exercise quiz in a real environment and
  confirm the result screen suggests the lesson's other exercise (or, for
  a single-exercise lesson, quizzes from other lessons in the same unit);
  then finish a standalone (non-lesson) quiz and confirm suggestions are
  unchanged from pre-Agent-3 behavior (same-category, level-wide).

**Files changed:** `shared/quiz.html` only.

**Risks:** none identified beyond the pre-existing "not browser-tested"
gap common to every agent in this sandboxed chain. The manifest-mapping
fallback (tiered ids that don't resolve in `getManifest()`) is a
defensive branch for data inconsistency between the lessons file and the
quiz manifest — not expected to trigger against current content, but
present in case a future content edit desyncs the two files.

---

## Agent 4 — MASTERY-THRESHOLD (lesson passes only at ≥60% per quiz) — COMPLETED

**Score was already persisted — no two-part fix needed.** Checked
`shared/quiz.html`'s `save()` first, per the mission's instruction: it
already writes `best` (highest percent score across attempts, computed
from `graded`/`score`) and `latest` alongside `status` on every
completion, and has for as long as `status` has existed here — this
predates Agent 4, it just wasn't being read anywhere. So this was a
single-part fix: change every completion check to also require the score,
no new persistence needed.

**Single source of truth, not five copies:** added `MASTERY_THRESHOLD=60`
and a shared `isMastered(record)` predicate to
`shared/js/course-progress.js` (already the shared progress-reading
module, already included by `index.html`/`main/index.html` for the
homepage continue card) and exported both on `window.MylingoCourseProgress`.
`course.html`, `journey.html`, and `courses/index.html` didn't previously
include this script (each is otherwise self-contained, per the existing
codebase pattern), so added the `<script src="../shared/js/course-progress.js">`
tag to each — same relative-path pattern `main/index.html`/root
`index.html` already used — and pointed their `statusFor()`/inline
completion-filter logic at `window.MylingoCourseProgress.isMastered`
instead of the old bare `status==='completed'` check. Each call site keeps
a same-shape inline fallback (`status==='completed'`, no score) in case
the script fails to load, matching this codebase's existing defensive
style rather than throwing if the global is missing.

**Backward compatibility — grandfathered, as recommended:**
`isMastered()` returns `true` for a `completed` record with no `best`
field (pre-mastery-threshold legacy data) and only checks `best>=60`
when a score is present. Comment in `course-progress.js` explains why:
no server-side recovery path exists for a client-only `localStorage`
progress store, so silently downgrading a returning learner's already-
completed lessons to "incomplete" would be a bad, unrecoverable surprise.

**`lessonPercent()` also updated** (same file) to use `isMastered()` for
its "done" count — this affects the homepage "Continue" card's percent
display too, so a lesson with an unmastered (low-score) quiz will no
longer show 100% there either. Consistent with the mission's intent, not
explicitly called out in the original mission text but a direct
consequence of `lessonPercent` sharing the same completion definition.

**`courses/lesson.html` — confirmed out of scope, not edited.** Per the
mission's own "if it does" caveat: grepped for `progress`/`status`/
`'completed'` and confirmed the lesson player doesn't read quiz-completion
state anywhere — it only builds links to lessons/quizzes, it doesn't gate
on prior mastery. Nothing to change there.

**Files changed:** `shared/js/course-progress.js`, `courses/course.html`,
`courses/journey.html`, `courses/index.html`.

**Verification:**
- Syntax pass (`node --check`-equivalent) on `shared/js/course-progress.js`
  and both `<script>` blocks in each of the three edited HTML files: pass.
- Unit-tested `isMastered()` directly (loaded the real file into a mock
  `window`, not reimplemented) against six cases: `completed`+`best:80`→
  true, `completed`+`best:40`→false, `completed`+`best:60`→true (boundary
  inclusive, matches "≥60%"), `completed` with no `best` (legacy)→true
  (grandfathered), `in-progress`+`best:90`→false (status gate holds
  regardless of score), `undefined` record→false. All matched intent.
- Confirmed all three pages read `progress` from the same
  `mylingo.progress.v1` `localStorage` key `course-progress.js` reads, so
  `isMastered()` receives the same record shape everywhere.
- Not tested in a real browser (no network egress in this sandbox).
  Before merging: complete a lesson's exercises with a score under 60% in
  a real environment and confirm the lesson/course/journey pages still
  show it as "in progress," not "completed"; then re-take and pass at
  ≥60% and confirm it flips to "completed" everywhere (course page, journey
  page, courses index percent, homepage continue card).

**Risks:** none identified. The added script include is a read-only
dependency (three functions: `isMastered`, `MASTERY_THRESHOLD`,
`lessonPercent` — none touched by these pages) so it can't affect
anything these pages did before beyond the intended completion-definition
change.

---

## Agent 5 — Quality Gate + Package — COMPLETED

**Mission:** re-run static verification across everything Agents 1–4
touched, confirm the quiz-gate decision isn't contradicted anywhere in the
tree, then package and release.

**Files inspected (no source edits made — quality-gate lane only):**
`courses/lesson.html`, `shared/quiz.html`, `courses/journey.html`,
`courses/course.html`, `courses/index.html`, `shared/js/course-progress.js`,
plus every page found to reference `shared/quiz.html`
(`a1..c2/index.html`, `a1..c2/dashboard.html`, `main/progress.html`,
`shared/js/app-shell.js`, `shared/js/gamification.js`,
`shared/js/orientation.js`, `shared/js/runtime-v2-adapter.js`).

**Verification:**
- `node --check` on all 11 `<script>`/`.js` blocks across the six edited
  files: **11/11 PASS**.
- `json.load()`-equivalent parse on every touched/relevant JSON
  (`course_content/lessons/{a1,a2,b1,b2,c1,c2}.json`,
  `course_content/{units,courses,lessons}.json`, `a1/quizzes.json`,
  `b1/quizzes.json`, `RELEASE_IDENTITY.json`, `offline/core-manifest.json`,
  `offline/packs.json`): **14/14 PASS**.
- Grepped the full tree for `quiz.html` (22 hits) and read every
  non-Agent-2/3 hit individually:
  - `a1..c2/index.html`, `a1..c2/dashboard.html`, `main/progress.html` all
    build plain `?quiz=<id>&level=<lvl>` links with **no `lesson` param** —
    none of them can spoof the gate, so a lesson-owned quiz id reached
    from any of these still gets caught and redirected by
    `enforceLessonGate()` inside `shared/quiz.html` itself, confirming
    Agent 2's "one choke point" design holds regardless of entry page.
  - `shared/js/orientation.js` builds a `mode=placement` link — correctly
    outside the gate's scope (`load()` skips `enforceLessonGate()` when
    `mode==='placement'`, and `findOwningLesson()` also short-circuits on
    `/^placement-/` ids independently — belt and suspenders, both checked).
  - `shared/js/app-shell.js`, `shared/js/course-progress.js`,
    `shared/js/gamification.js`, `shared/js/runtime-v2-adapter.js`
    reference `quiz.html` only in comments, not in any URL-building code —
    no action needed.
  - Re-read `findOwningLesson()`/`enforceLessonGate()` line-by-line
    end-to-end: placement ids excluded up front, non-lesson-backed quizzes
    return `false` (no redirect), a matching `lesson` param short-circuits
    correctly, and the redirect target always carries a valid `redirect`
    fallback (`courses/course.html?level=<lvl>`) — no dead-end or
    redirect-loop paths found.
  - **No contradiction of Agent 2's gate decision found anywhere in the
    tree.**
- Local link/asset audit (href/src resolution relative to each file, plus
  static `fetch()` targets) on all five edited HTML/JS files: **zero
  missing references**.
- Spot-re-verified Agent 1's chrome removal (`grep` for `<header>`,
  `</header>`, `<footer>`, markup-level `app-shell` in
  `courses/lesson.html`) and Agent 4's `isMastered()`/`MASTERY_THRESHOLD`
  wiring in all three consuming pages (`course.html`, `journey.html`,
  `courses/index.html`) against the handoff's own claims — both matched
  exactly, no drift between the handoff text and the actual code.

**Not verified (environment limitation, same as every prior agent in this
chain):** no real browser available in this sandbox — no network egress,
no DOM/rendering engine. All checks above are static (parse/grep/path-
resolution). The manual browser-test steps each of Agents 1–4 listed in
their own sections (visual regression on the fullscreen player, click-
through on the quiz gate redirect and non-redirect cases, suggestion
scoping on a completed exercise, mastery-threshold status flips across
pages) are still outstanding and should be run before this reaches real
users.

**Risks:** none newly identified. Carrying forward the per-agent risks
already on record: one extra `fetch()` per non-placement quiz load
(Agent 2, cheap/cacheable), and the defensive manifest-mapping fallback in
`lessonSuggestionIds()` that isn't expected to trigger against current
content (Agent 3).

**Package:** verified tree packaged unchanged (no source edits from this
lane) into a new release zip. See `FINAL_RELEASE_HANDOFF_PLAYER_UX.md` for
the release manifest.

## Free-tier continuity note
If any agent in this chain stops early, leave the zip plus an updated copy
of this file with that agent's section marked `COMPLETED`,
`COMPLETED WITH KNOWN LIMITATIONS`, or `BLOCKED`, and the exact next
mission — same rule as `ORCHESTRATED_AGENT_HANDOFF.md`. Don't restart a
completed, verified section.
