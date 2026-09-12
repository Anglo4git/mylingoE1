# Agent 80 Completion — Review / Mastery Integration

STATUS: IMPLEMENTED + VERIFIED

## Files changed
- `site/shared/quiz.html` — `exitBtn`/`homeBtn`/`endHome`/`errHomeBtn` now
  resolve through a new `backTarget()` (falls back to the existing
  `homeUrl()`), and the dead `recommendation()` fallback was pointed at the
  same helper.
- `tests/unit/quiz-interconnection-agent78.test.js` — one stale assertion
  fixed (see "Bug found" below).
- `tests/unit/review-mastery-integration-agent80.test.js` — new, 7 tests.

No changes to `skill-mastery.js`, `review-scheduler.js`, `course-progress.js`,
`gamification.js`, or the course/lesson/journey data files — the audit found
them already correct and additive.

## State-flow audit

### The one authoritative store per concern
| Concern | Key | Writer | Readers |
|---|---|---|---|
| Exercise/quiz progress | `mylingo.progress.v1` | `quiz.html` `save()` only | `course-progress.js`, `journey.html`, `course.html` (read-only) |
| In-progress quiz session | `mylingo.sessions.v3.<quizId>` (+ `mylingo.sessions.v3.index`) | `quiz.html` `writeSession()`/`clearSession()` | `course-progress.js` (`sessionFor`, read-only, for partial-lesson %) |
| Skill mastery | `mylingo.skill-mastery.v1` | `skill-mastery.js` `recordAndPersist()`, called only from `quiz.html` `end()` | mastery UI (`mastery-review-ui.js`) |
| Review scheduling | `mylingo.review-scheduling.v1` | `review-scheduler.js` `recordAndPersist()`, called only from `quiz.html` `end()`, skipped for `mode==='placement'` | mastery/review UI |
| Gamification (XP/streak) | its own key inside `gamification.js` | `gamification.js` `recordSession()`, called only from `quiz.html` `end()` | homepage/UI badges |

`course-progress.js` is a pure projection: it has no `localStorage.setItem`
anywhere, computes `lessonPercent()`/`resolveHomepageState()` from the two
canonical keys above, and creates no course/lesson-specific completion
record. Lesson, unit, and course "done" status is always re-derived from
`exercise_quiz_ids` against `mylingo.progress.v1` — never cached
separately — so there is nothing that can drift out of sync with the quiz
engine's own record of what was completed. This matches the "content vs.
learner state vs. presentation" separation the handoff calls for: course/
lesson/unit records (content) hold only IDs; `mylingo.progress.v1` /
mastery / review (learner state) are untouched by the course layer;
lesson/journey/course pages (presentation) only read.

### Write path (single source of truth per write)
`quiz.html` `end()` is the only place any of these five stores is written,
in this order: canonical progress (`save(true)`) → session cleared
(`clearSession`) → gamification → skill mastery → review scheduler (skipped
in placement mode). Each of the three additive calls (gamification,
mastery, review) is independently wrapped in its own `try/catch` with a
comment stating it must never block the results screen — confirmed by test
`mastery/review recording is best-effort...`. Score, feedback text, and
audio (`soundResult`, `soundCorrect`/`soundWrong`) are computed before and
independently of these calls and were not touched.

### Read path / resume
Course, unit, and lesson completion (`course-progress.js`, `journey.html`,
`course.html`) all derive status the same way: every `exercise_quiz_ids`
entry checked against `mylingo.progress.v1[id].status==='completed'`, with
partial credit for an `in-progress` session read from the same session
shard the quiz engine itself writes. There is exactly one derivation
function per surface, no duplicate logic that could disagree.

## Bug found and fixed: `redirect` was accepted but never honored
`lesson.html`, `journey.html`, and the homepage `Continue` card all build a
`?redirect=...` query param when linking into `quiz.html`, specifically so
finishing (or leaving) an exercise launched from the guided path returns the
learner to that lesson/journey/homepage context rather than the bare level
index. `quiz.html` parsed `redirect` into a constant but never read it
anywhere in the non-placement completion or exit paths — `exitBtn`,
`homeBtn`, `endHome`, and `errHomeBtn` all unconditionally sent the learner
to `homeUrl()` (`../<level>/index.html`), and the one function that did
reference `redirect` (`recommendation()`) is dead code, never called for a
non-placement quiz. This broke exactly the property Agent 80 is required to
verify — "Resume returns to the correct lesson/exercise" — for every
learner who entered an exercise from a lesson, the journey, or the homepage
"Continue" card.

Fixed by adding `backTarget()` (`redirect` if present and safe, else the
existing `homeUrl()`) and routing all four exit/back controls through it.
`redirect` is validated with `isSafeRedirect()` — must be a relative
`./`/`../` path with no URL scheme and not protocol-relative — since it is
reflected straight from the query string; anything else silently falls back
to `homeUrl()` rather than being followed. Quiz-only entry points (no
`redirect` param, e.g. linking straight from a level's quiz list) are
unaffected: `backTarget()` reduces to the original `homeUrl()` behavior.

## Bug found and fixed: stale test assertion (Agent 78 regression suite)
`tests/unit/quiz-interconnection-agent78.test.js` asserted
`course-progress.js` contains the string `mylingo.quiz.session.v1.` — a key
that has never existed anywhere in the codebase. The actual session key
`course-progress.js` reads (`mylingo.sessions.v3.`) already matched what
`quiz.html` writes (`SESSION_SHARD_PREFIX='mylingo.sessions.v3.'`); only the
test's expected string was wrong, so it was silently failing on every run.
This was exactly the class of orphan/broken-reference drift Agent 80 was
asked to catch between contracts, even though the code under test was
correct. Fixed the assertion to check for the real key.

## Verification
- `npm ci` (138 packages) then `npx vitest run`: **228 tests, 226 pass**
  (7 new, all passing; the fixed Agent 78 test now passes).
- 2 pre-existing failures remain, both unrelated to review/mastery/progress
  and present before any Agent 80 change: `graded-question-consistency.test.js`
  (a stale exact-whitespace match against `quiz.html`'s counter text) and
  `session-resume.test.js` (a stale exact-string match against the resume
  button label). Left out of scope — they don't touch progress, mastery,
  review, or resume-routing behavior, only pre-existing string-match drift
  in unrelated assertions.
- Confirmed by inspection (and asserted in the new test file) that
  `skill-mastery.js` and `review-scheduler.js` each own exactly one storage
  key, distinct from `mylingo.progress.v1` and from each other, and that
  `course-progress.js` performs no writes.
- Confirmed `lesson.html`, `journey.html`, and the homepage all still build
  `redirect` links exactly as before (no data-layer changes needed) — only
  `quiz.html` needed to start honoring the parameter.

## Guardrails respected
- No new storage key introduced; no existing storage key touched.
- No progress reset for any learner: `mylingo.progress.v1`, mastery, and
  review formats are byte-for-byte unchanged.
- Quiz scoring, feedback rendering, and audio (`soundCorrect`/`soundWrong`/
  `soundResult`) were not modified.
- `course-progress.js` remains read-only; no course/lesson-specific
  progress cache was added.

## Next dependency
Agent 81 — Offline + Link Safety can proceed; the `redirect` chain it needs
to audit (lesson → quiz → lesson/journey/home) is now actually wired end to
end instead of silently dead in the non-placement path.
