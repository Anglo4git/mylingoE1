# Agent 156 Handoff — Placement → Courses Audit Fixes (Quick Wins 1 & 4)

## Context
An independent audit (`AUDIT: placement → courses pipeline`, run against this exact
build before this agent's changes) found the recommendation-link/level-lock
interaction was broken and flagged three other items. This agent picked up the
audit's "Quick Wins" list and fixed the two that were pure code defects.
Full audit findings this handoff does **not** yet address are listed under
"Remaining" below — please continue from there rather than re-auditing from
scratch.

## Agent 156 — fixes made

### 1. [HIGH] Fixed: stretch-skill recommendation links dead-ending as "Level locked"
- **File:** `shared/quiz.html`, `load()` guard (~line 712)
- **Root cause:** `renderPlacementRecommendations()` calls
  `MylingoLevelLock.setAssigned(profile.recommended_level)` and then builds
  "Practice next" links via `MylingoRecommendations.recommendationForSkill()`,
  which can legitimately target one CEFR level above `recommended_level` (the
  "stretch" branch, triggered by an individual skill score ≥90). Those links
  carry `&recommended=1` (`directRecommended`), which already bypassed the
  lesson-gate check one line below, but the level-lock check on the line
  *above* it didn't check `directRecommended` — so every stretch
  recommendation was immediately rejected as locked.
- **Fix:** the level-lock guard now also short-circuits on `directRecommended`,
  exactly mirroring the lesson-gate guard beneath it:
  ```js
  if(mode!=='placement' && !directRecommended && window.MylingoLevelLock && window.MylingoLevelLock.isLocked(level)){...}
  ```
- **Verification performed (this session, not yet re-run in a real browser):**
  - `node --check` and a `new Function(...)` parse of both inline `<script>`
    blocks in `shared/quiz.html`: pass, no syntax errors introduced.
  - Headless integration test loading the real `shared/js/level-lock.js` and
    `shared/js/recommendations.js` against a minimal `localStorage` shim,
    reproducing the audit's exact scenario (overall `recommended_level: a2`,
    grammar skill scored 95%): confirmed the grammar recommendation targets
    `b1`, confirmed `isLocked('b1')` is `true` right after `setAssigned('a2')`,
    confirmed the **old** guard logic blocks the `recommended=1` link
    (reproducing the bug), confirmed the **new** guard logic does not block it
    (fix works), and confirmed a manually-typed URL to the same locked level
    *without* `recommended=1` is still correctly blocked (no regression to
    normal level-lock pacing).
  - **Not done:** an actual click-through in a browser/Playwright (this
    session has no browser tooling available). Next agent should do the real
    click-through this fix claims to enable, per the standing project
    convention of verifying UI fixes end-to-end rather than trusting logic
    alone.

### 2. [LOW] Fixed: `calculate120Placement` confidence hardcoded to `120`
- **File:** `shared/js/placement.js`, `calculate120Placement()`
- **Root cause:** confidence was `overallTotal >= 120 ? 'high' : ...`, a
  magic number disconnected from `ASSESSMENT_120.question_count`.
- **Fix:** now compares against `ASSESSMENT_120.question_count` (currently
  120) and a derived two-thirds medium threshold, instead of the hardcoded
  literal, so a future change to the bank size doesn't silently desync from
  the confidence calculation.
- **Verification performed:** `node --check` pass; a small headless script
  exercised 120/120 (→ high), a hypothetical trimmed 90/90 bank (→ medium),
  and a 50/120 partial completion (→ low) — all as expected.

No other files were touched. No debug statements, console.logs, or
commented-out code were left behind by this pass.

## Remaining (from the original audit — not yet done)

1. **[MEDIUM] Level-lock is fail-open if `level-lock.js` fails to load.**
   Every page guards with `if (window.MylingoLevelLock && ...)`, so a missing/
   failed script silently disables the lock instead of failing closed. Not a
   security issue (no paywall/accounts here — it's a pacing UX only), but
   worth deciding deliberately rather than leaving implicit. Not touched this
   pass because the right fix (fail-closed vs. add a load-failure diagnostic)
   is a product decision, not a pure bug fix.
2. **No automated test suite or CI exists anywhere in this repo.** This
   agent's verification above was a one-off headless script in `/tmp`, not a
   committed test — there is nowhere in the repo to put a permanent test yet.
   The audit's "Deep Work" recommendation stands: stand up a minimal
   `node --check`-plus-`assert` harness for the pure logic modules
   (`placement.js`, `recommendations.js`, `level-lock.js`, `skill-mastery.js`,
   `review-scheduler.js`) so fixes like the two above leave a permanent
   regression test instead of a throwaway script. Recommend the *next* agent
   start here, since it would have caught issue #1 automatically.
3. **Zip filename (`v158`/`AGENT158`) vs. contents (`v154`/`AGENT154`)
   mismatch** — still unresolved/unconfirmed with whoever produces the
   archive. Not a code issue; flagging again so it isn't lost.
4. **Real browser click-through of fix #1** (see verification note above) —
   the logic is proven correct in isolation; the actual rendered link on the
   actual results screen has not been clicked in a live page load this
   session.

## Suggested order for the next agent
1. Do the real click-through of fix #1 (item 4 above) to close the loop the
   audit opened.
2. Stand up the minimal test harness (item 2) and encode fix #1 and fix #2 as
   permanent regression tests while the scenarios are fresh — this is the
   highest-leverage remaining item since it protects every future agent's
   changes to these modules, not just today's.
3. Decide and implement the fail-open vs. fail-closed policy for level-lock
   (item 1).
4. Confirm the zip naming mismatch (item 3) out-of-band.
