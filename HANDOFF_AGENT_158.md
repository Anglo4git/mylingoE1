# Agent 158 Handoff — Test Coverage Completed, Null-Timestamp Bug Fixed, Fail-Open Made Discoverable

## Context
Picked up `HANDOFF_AGENT_157.md` (zip `MYLINGO_v155_AGENT157_ENDHOME_CRASH_FIX_AND_TESTS.zip`).
Worked its "Suggested order" list top to bottom. Method notes from 157 still hold:
Playwright + Chromium are available (`$(npm root -g)/playwright`, browsers in
`/opt/pw-browsers`); start `python3 -m http.server` and the Playwright script in the
same `bash_tool` call, separated by `;`.

## What changed (4 files + this doc)

### 1. `shared/js/review-scheduler.js` + `shared/js/skill-mastery.js` — real bug fixed
Found while writing the new tests. `Number.isFinite(Number(x))` is **true for `null`**
(`Number(null) === 0`), so every sanitise pass turned a stored `null` timestamp into `0`
(1 Jan 1970):
- review-scheduler: `due_at:null` → `0` → `isDue()` true → `getDueSkills()` listed the skill
  as due, and `getNextReview()` returned it with a 1970 date (rendered by
  `mastery-review-ui.js` line ~100). Same for `last_review_at` and `updated_at`.
- skill-mastery: `last_attempt_at` and `updated_at` had the same coercion.

Fix: a small `finiteOrNull(v)` helper in each module (nullish/blank/non-numeric → `null`,
otherwise the number). No other behaviour changed. `gamification.js` already treats `null`
as a valid value for these fields (lines ~361–392), so this makes the modules consistent
with their own validator. Reachability today is low (normal `recordAttempt` always writes
real numbers) — it bites on imported/hand-edited/corrupt stores — but it was a genuine
wrong-answer path, and it's now pinned by tests.

### 2. `shared/quiz.html` — fail-open diagnostic (behaviour unchanged)
157's open item #1 (level-lock is fail-open if `level-lock.js` doesn't load). I did **not**
decide fail-open vs fail-closed. I took the option 157 called lowest-risk: added one
`console.warn('[mylingo] level-lock.js did not load: level gating is OFF (fail-open) for <level>')`
immediately before the existing guard. UX is byte-for-byte the same. The 12 dashboard/index
sites were left alone on purpose (no shared place to hang a warn without restructuring
their `if`/`return`); they are covered statically instead (see §3).

### 3. `tests/run.js` — 13 → 36 tests, all passing (`node tests/run.js`)
- **skill-mastery.js (9):** band boundaries, confidence thresholds, tagged/banner/non-boolean
  filtering, accumulation, sanitising untrusted stores, persistence + corrupt JSON, null
  timestamps, `getSkill`.
- **review-scheduler.js (10):** interval bands, streak doubling + 30-day cap, bad-result reset
  to 1 day vs. brand-new 6 h, legacy `calculateNextInterval`, due-date/streak scheduling,
  ignored questions, `isDue`/`getDueSkills`/`getNextReview` ordering, sanitising + legacy
  `interval_days` migration, `due_at:null` regression, persistence.
- **Static wiring (4, new):** every page that references `MylingoLevelLock` has a
  `<script src=…level-lock.js>` that resolves to a real file; script precedes first use in
  quiz.html; `offline/core-manifest.json` precaches level-lock / skill-mastery /
  review-scheduler. This closes the *omission* route to fail-open without deciding policy.
- **Broadened 157's id scan:** it now checks any unguarded `$('id').<prop>` access (not just
  `.onclick=`), ignores `?.` optional chains, and treats ids assigned at runtime
  (`.id='choiceSelect'`) as existing. Current result: no dangling ids.

### 4. `#endHome` provenance (157's item #2) — investigated, cannot be closed from this zip
Searched every `.md/.html/.js/.css` in the archive: the only mentions are Agent 151's handoff
(button worked), 157's handoff, and 157's guard. No intermediate build exists here, so *when
or why* the markup vanished is not recoverable. Recommendation: treat as closed unless someone
has the v152–v154 archives. The remaining product question is unchanged — should the result
screen get a Back button again (only "Try again" exists now)?

## Verification (real headless Chromium, local `http.server`)
- Stretch link (`recommended=1`) with ceiling `a2`: loads, full click-through to results
  screen (40%), 0 page errors; mastery **and** review-scheduling records written to
  localStorage with a real `due_at`.
- Same quiz without `recommended=1`: still `Level locked`.
- `level-lock.js` request blocked: quiz still loads (fail-open unchanged) and the new warning
  appears exactly once.
- `a1…c2` `index.html` and `dashboard.html` (12 pages): 0 page errors.
- `node --check` on both modified modules; `node tests/run.js` → 36 passed, 0 failed.

## Remaining / carried forward
1. **[DECISION] Fail-open vs fail-closed for level-lock** — still undecided; behaviour now at
   least leaves a console trail in quiz.html. If fail-closed is chosen, it's the same guard line
   plus the 12 dashboard/index sites.
2. **[PRODUCT] Restore a Back button on the quiz results screen?** (see §4).
3. **Zip name vs `RELEASE_IDENTITY.json` mismatch — still unresolved.** This zip is named
   v156 / Agent 158; `RELEASE_IDENTITY.json` (declared source of truth) still says `v118`.
   I did not edit it: its policy says it's the single source of truth and I don't know which
   number the release process intends. Someone who owns release naming should reconcile.
4. **Legacy `calculateNextInterval` (days) is unused by the app** and disagrees with the hours
   version for brand-new weak skills (1 day vs 6 h). Pinned by a test as "legacy"; safe to
   delete together with its test if nobody needs it.
5. **Not yet covered by tests:** `gamification.js` (32 KB, contains validators for both stores),
   `learner-state.js`, `quiz-packer.js`, `offline-packs.js`. Extend `tests/run.js`; the
   module-shim pattern at its top generalises.
