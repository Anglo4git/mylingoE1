# MyLingo — Player/Quiz UX Chain Release Handoff

## Status
COMPLETED WITH KNOWN LIMITATIONS

## Release identity
Preserve the existing canonical release identity (v118, `RELEASE_IDENTITY.json`).
No release tag was hardcoded elsewhere; nothing in this chain touched
release identity.

## Chain covered
`HANDOFF_PLAYER_UX_CHAIN.md` — Agent 1 (NAV-STRIP) → Agent 2 (QUIZ-GATE) →
Agent 3 (QUIZ-SUGGEST) → Agent 4 (MASTERY-THRESHOLD) → Agent 5 (Quality
Gate + Package, this handoff). Separate from, and layered on top of, the
earlier `HANDOFF_LESSON_JSON_SPLIT.md` / `FINAL_RELEASE_HANDOFF.md` (v118)
work already in this tree.

## User-requested fixes delivered
- **Full-screen lesson player:** `courses/lesson.html` no longer renders
  the site header or the bottom app-shell tab bar; the chapter-trail moved
  into a plain `.player-top` wrapper so it reads as in-player UI, not site
  chrome. The `#crumb` breadcrumb is kept as the only way back out of the
  player (flagged for product review in Agent 1's section — no other exit
  path exists if this is cut later).
- **No quiz/practice path bypasses the course player:** any quiz that
  belongs to a lesson (`exercise_quiz_ids`) can now only be started from
  the lesson player. `shared/quiz.html` enforces this itself
  (`enforceLessonGate()`), so every existing entry point — level index and
  dashboard pages, the progress page's review/retry links, etc. — is
  covered automatically without per-page edits. Standalone quizzes with no
  owning lesson, and the placement flow, are unaffected by design.
- **Result-screen suggestions scoped to lesson/unit:** finishing a
  lesson-backed quiz now suggests the lesson's other exercise first, then
  other lessons in the same unit, falling back to the old same-category
  level-wide suggestions only when there's nothing lesson/unit-scoped to
  offer. Standalone quizzes keep the pre-existing behavior unchanged.
- **Lessons only count as complete at ≥60% per quiz:** a shared
  `isMastered()`/`MASTERY_THRESHOLD=60` predicate in
  `shared/js/course-progress.js` now gates completion status everywhere
  it's shown (course page, journey page, courses index percentage,
  homepage continue card), instead of any-score `status==='completed'`.
  Pre-threshold legacy records with no stored score are grandfathered as
  passing to avoid silently downgrading a returning learner's progress.

## Files changed (Agents 1–4)
- `courses/lesson.html`
- `shared/quiz.html`
- `courses/journey.html`
- `courses/course.html`
- `courses/index.html`
- `shared/js/course-progress.js`

No files were changed in the Agent 5 quality-gate lane — packaging only.

## Verification
- JavaScript syntax (`node --check` on every edited `<script>`/`.js`
  block, 11 total): **PASS**.
- JSON parse on every touched/adjacent content file (14 total, including
  all six per-level `course_content/lessons/*.json` files): **PASS**.
- Quiz-gate audit: every page in the tree that links to
  `shared/quiz.html` (22 references total, across `a1..c2/index.html`,
  `a1..c2/dashboard.html`, `main/progress.html`, `courses/*.html`, and
  four `shared/js/*.js` files) individually reviewed — no path
  contradicts Agent 2's gate decision; the placement flow's own link is
  correctly outside the gate's scope by construction.
- Static local href/src and `fetch()` path audit on all six edited files:
  **PASS — 0 missing local references.**
- Agent 1's chrome removal and Agent 4's `isMastered` wiring independently
  re-checked line-by-line against their own handoff claims: **matched
  exactly**, no drift found.
- Browser/interactive smoke: **NOT VERIFIED** — this sandbox has no
  network egress and no browser engine. Every "PASS" above is a static
  check (syntax, JSON parse, and path resolution), not a rendered-page or
  click-through test.

## Known limitations / outstanding manual QA
None of the following have been run in a real browser and should be
confirmed before this reaches users:
1. Visual check of the fullscreen lesson player (chapter-trail spacing,
   crumb placement, no leftover blank gap where the header was).
2. Click a lesson-owned quiz link from `main/progress.html` or a level
   index page → confirm redirect into `courses/lesson.html`; click "Start
   exercises" from inside the lesson player → confirm the quiz loads with
   no redirect loop.
3. Finish a lesson exercise quiz → confirm the result screen suggests the
   lesson's other exercise (or same-unit lessons, if none); finish a
   standalone quiz → confirm suggestions are unchanged from prior
   behavior.
4. Complete a lesson's exercises scoring under 60% → confirm it still
   shows "in progress" everywhere (lesson, course, journey, courses index,
   homepage continue card); retake and pass at ≥60% → confirm it flips to
   "completed" everywhere.

## Deployment
Use the ZIP contents directly, same layout as the existing v118 release
(no `site/` wrapper directory). No new dependencies were introduced.

## Agent continuity
This chain (`HANDOFF_PLAYER_UX_CHAIN.md`, Agents 1–5) is now complete. If
further work is requested on this feature set, start a new chain rather
than reopening these five sections — none should be restarted per the
free-tier continuity rule, since all five are verified `COMPLETED`.

## Next agent rule
Only perform browser/interactive verification of the four outstanding
items above from this point. Do not modify production code unless a
concrete failure is found during that verification.
