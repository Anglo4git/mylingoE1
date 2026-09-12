# MYLINGO — AGENT 10 COMPLETION

## Scope completed
Graded Question Count Consistency.

## The bug
`site/shared/quiz.html` already had a correct `gradedTotal()` helper — it
excludes non-gradable `banner`-type questions from the denominator used for
score percentage, placement evidence, and session-resume validation. But two
places in `end()` (the results screen) still used the raw
`data.questions.length` instead:

1. The "You scored X out of Y" message text used the raw question count as
   `Y`, while the percentage shown right next to it (`pct`) was already
   computed from the graded count. On any quiz containing a banner question,
   these two numbers would visibly disagree (e.g. "scored 8 out of 10
   (100%)").
2. The call to `MylingoGamification.recordSession(score, total, ...)` passed
   the raw question count as `total`. Since `score` only ever increments for
   graded (non-banner) questions, `score` could never equal `total` when
   banners were present — silently disabling the perfect-score XP bonus
   (`calculateXp` awards `PERFECT_BONUS` only when `correct === total`) for
   every quiz that uses a banner interstitial, with no error or warning.

No current published quiz data uses the `banner` type (all 60 starter
quizzes are plain radio questions), so this was latent, not currently
user-visible — but the schema, UI, and `rawType()`/`gradedTotal()` machinery
all already support banner questions as a real feature, so it was a
time-bomb for the first quiz author who adds one.

## Fix
- `site/shared/quiz.html`: `end()` now reuses the single `const
  graded=gradedTotal();` it already computes, for both the score message
  text and the `recordSession(score, graded, ...)` call. `score` and
  `graded` are now consistently on the same denominator everywhere in the
  results flow.
- Left untouched, on purpose: every use of raw `data.questions.length` that
  is about position/navigation rather than scoring — the step counter
  (`i+1 / data.questions.length`), the in-quiz progress bar, the quiz
  description question count, and the frozen `mylingo.progress.v1` fields
  `current`/`totalQuestions` (which track how many questions the learner
  stepped through, banners included, not their score). Changing those would
  have been out of scope and would have touched the frozen legacy progress
  schema, which prior agents' handoffs explicitly protect.

## Production files changed
- `site/shared/quiz.html`

## Files added
- `tests/unit/graded-question-consistency.test.js`

## Verification
- `node --check` on the extracted inline `<script>` contents of
  `site/shared/quiz.html`: PASS.
- Direct Node/vm smoke test of `gradedTotal()` extracted from the live file:
  3 plain radio questions → 3; 2 banners + 2 radios → 2. PASS.
- Confirmed by source inspection that the fixed lines
  (`'...out of '+graded+...'` and `recordSession(score,graded,...)`) are
  present and the old buggy lines (`...out of '+data.questions.length+...`
  and `recordSession(score,data.questions.length,...)`) are gone.
- Re-checked literal string expectations in `tests/unit/session-resume.test.js`
  and `tests/unit/quiz-manifest-paths.test.js` against the edited file: all
  still hold. (`quiz-question-experience.test.js` has one pre-existing,
  unrelated string-match miss around `correctIndexes(...)` variable naming
  that predates this change and sits nowhere near the edited lines — not
  introduced by this fix.)
- `python3 build.py validate --input master_source.csv`: 60 rows, 60
  quizzes, 0 errors, 0 warnings.
- `python3 build.py build --input master_source.csv --out
  /tmp/mylingo-agent10-build`: 66 data files written.
- `python3 build.py verify-output --out /tmp/mylingo-agent10-build`: 0
  errors, 0 warnings.
- Vitest was unavailable because this environment has no network access to
  install `node_modules` (`npm ci` fails with a 403 from the registry) — the
  same limitation every prior agent in this package has hit. The new test
  file is written to run under the project's existing Vitest setup
  (`npm test`) once dependencies are installed in a networked environment.

## Compatibility
- `gradedTotal()` itself is unchanged.
- The gamification API contract (`recordSession(correct, total, now, meta)`)
  is unchanged — only the value passed as `total` from this one call site
  is corrected.
- No changes to `mylingo.progress.v1`, `mylingo.session.v1`,
  `mylingo.gamification.v1`, or `mylingo.backup.v1` schemas.
- No changes to placement logic, which already used `gradedTotal()`
  correctly.

## Handoff to Agent 11
- If/when a quiz with `banner`-type questions is published, the results
  screen and gamification XP will now behave correctly (score text and
  percentage will agree, and perfect graded scores will earn the perfect
  bonus). Worth adding an actual banner-containing quiz fixture once
  Vitest can run, to get real jsdom coverage of `end()` end-to-end rather
  than the source/logic-level checks this environment allowed.
- Outstanding items still open from earlier handoffs, none assigned to an
  agent yet: real Vitest execution (needs a networked environment to `npm
  ci`), an accessibility audit (axe/Lighthouse), the deployment-topology
  decision (single-origin vs. six repos), and content-scaling groundwork
  (`date_added`/`date_updated` columns, controlled tag vocabulary).
