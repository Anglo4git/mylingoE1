# Agent 152 — Placement Result vs. Level-Lock Ceiling (real bug found & fixed)

## Status
COMPLETED — ONE REAL REGRESSION FOUND AND FIXED, real-browser verified. Zero
other regressions.

## Mission
Follow-up on Agent 151's flagged untested surface: placement scoring/routing,
the "boundary check" continueBtn path in `shared/quiz.html`, and offline pack
loading.

## What was done

### 1. Placement scoring/routing — verified correct, but surfaced a real bug
Drove the *only* reachable placement path (orientation → `placement-120`,
the 120-question A1–B1 assessment) end-to-end with real clicks:
- Orientation answered to guess **A1** (lowest), then the 120-question
  assessment aced 100% on all three tiers → correctly computed
  `recommended_level: b1`, "Best starting level: B1", **Continue to B1**.
- Clicking Continue landed on `b1/index.html` — which **rendered as
  locked** ("🔒 B1 is locked … You're currently set to A1").

**Root cause:** `shared/js/level-lock.js`'s own header comment says the
assessment engine "assigning or updating a recommended level always moves
the lock ceiling, up or down" — but in practice only the 10-question
*orientation* guess ever called `MylingoLevelLock.setAssigned()` (in
`main/placement.html`'s `showResult()`). The 120-question assessment — the
one placement.html itself describes as authoritative ("Your final result is
based on performance, not the quick estimate") — computed and displayed a
recommended level but never told level-lock about it. Any learner whose
120-question result differs from their rough 10-question guess got told one
level and locked into another. This also meant a learner who guessed *high*
on orientation but scored low on the real assessment kept access to levels
they hadn't actually earned — the ceiling never moved down either.

**Fix (`shared/quiz.html`, inside `end()`'s `mode==='placement'` branch):**
right after `saveAssessmentResult()` produces the profile, call
`window.MylingoLevelLock.setAssigned(profile.recommended_level)` in a
try/catch (matching the file's existing pattern of never letting an
additive side effect break the results screen). This fires for both the
120-question path and the legacy primary/verification path, so whichever
code computes a `recommended_level` is the one that moves the ceiling.

**Re-verified live after the fix**, same scenario: `chosenLevel.v1` moves
from `{level:"a1"}` to `{level:"b1"}` the moment the 120-question result
is calculated; `b1/index.html` renders fully unlocked; `b2/index.html`
still correctly shows locked, now with the accurate message "You're
currently set to B1" (previously said A1). Also reran the fail-B1-tier
scenario (recommended `a2`) and the full site smoke sweep (21 pages ×
light/dark, 0 console/page errors) plus a full non-placement quiz
click-through to completion — all unaffected by the change.

### 2. The "boundary check" continueBtn path — confirmed real, confirmed dead
Grepped every `mode=placement` reference in the codebase: there are exactly
two — orientation.js's `placement-120` link (primary, the only one actually
linked anywhere in the UI) and quiz.html's own `placement-001` verification
link (reachable only from a `profile.verification_level` that the 120-path
never sets, since it returns early). Drove the legacy path directly by URL
to confirm it isn't broken, just orphaned: `placement-001` @ b1, 100% →
"Take B2 boundary check" → verification quiz @ b2, 100% → "Continue to B2",
zero errors, `assessment_v1` and (with this pass's fix) `chosenLevel.v1`
both update correctly. Not a regression, no code change beyond the
level-lock fix above, which also covers this path. Worth a product
decision on whether to delete the dead branch or intentionally keep it for
a future two-stage flow.

### 3. Offline pack loading — verified working
On `a1/index.html`, real service worker registered and went **active**;
the pack list rendered (7 packs); clicked "Install" on "Mylingo core" and
watched it actually cache 85 files into a real
`mylingo-offline-pack-v1-core` Cache Storage entry (confirmed via
`caches.keys()`/`cache.keys()`, not just UI text). Then forced the browser
context fully offline and reloaded — page still rendered, zero console/page
errors.

### 4. One thing checked and *not* a bug
Initially suspected the post-completion "Continue to X" button ignoring the
`redirect=...dashboard.html` param orientation.js attaches. Verified via a
mid-quiz exit that `redirect` *is* honored correctly there (exit/home
buttons go to the redirect target). The completion button intentionally
goes to `{level}/index.html` instead — same destination as "choose a level
yourself" links elsewhere in placement.html. `redirect` is for "return to
where you were if you bail early" (the *orientation-estimated* level's
dashboard); the freshly-*assessed* level correctly gets its own index page,
matching the manual-selection pattern. No change made.

## Regressions found
One (described above), found and fixed this pass, real-browser verified
before and after.

## Verification
- Playwright (real headless Chromium) against `python3 -m http.server`, no
  network egress, server + script started in the same `bash_tool` call per
  the method note carried forward from Agent 150/151.
- Full click-through, twice, of the only reachable placement path
  (orientation → 120-question assessment), one aced and one deliberately
  failing the B1 tier, checking `localStorage` state (`mylingo.assessment.v1`
  and `mylingo.chosenLevel.v1`) and the actual rendered lock state of the
  destination page after navigating there for real.
- Full click-through of the legacy primary→verification boundary-check path
  by direct URL, both before and after the fix.
- Full click-through of a normal (non-placement) quiz to its end screen —
  0 errors, confirming the placement-only code path change didn't affect
  ordinary quizzes.
- Real offline-pack install (not mocked): service worker registration,
  Cache Storage population, and a real "go offline mid-session" reload.
- Site-wide smoke sweep: 21 pages × {light, dark}, all HTTP 200, 0
  console/page errors, rerun after the fix.

## Method note carried forward
Background servers started with `&` in one `bash_tool` call do not survive
into the next call — start the server and the Playwright script in the
same command. Gated chapter-trail navigation must be driven via
`#navNext`/`#navBack`, not direct trail clicks. New for this pass: when a
quiz's `correctIndex` field is used for scoring in a Playwright script (as
opposed to reading it back out of the app's own normalized `data` object),
check whether the source JSON's convention is 0-based or 1-based before
assuming — `placement-120.json` and the per-level `placement-001.json`
files both use **1-based** `correctIndex` values (confirmed against
`shared/js/runtime-v2-adapter.js`'s `normalizeCorrectIndex`, which passes
`correct_index`/`correctIndex` through unchanged rather than adding 1).
Getting this backwards silently drives every question in the quiz to the
wrong answer without throwing any error, which nearly produced a false bug
report in this pass (see the "not a bug" note above, and note that Scenario
C's first run scored 0% purely from this indexing mistake before it was
caught by cross-checking against the question's own explanation text).

## Next agent
No other open defects found. Untested surface still remaining:
- `main/practice.html` and `main/progress.html` weren't click-tested beyond
  a load/console-error check in this pass's smoke sweep.
- The skill-level recommendation links rendered on the placement result
  screen (e.g. "Mixed Conditionals · B2") were seen rendering correctly but
  weren't clicked through.
- Non-core offline packs (per-level packs, not just "Mylingo core") weren't
  installed/verified in this pass — only the default `core` pack was
  exercised end-to-end.
