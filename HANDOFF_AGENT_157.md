# Agent 157 Handoff — Real Click-Through of Agent 156's Fix + Site-Breaking Regression Found & Fixed

## Context
Picked up Agent 156's handoff, which fixed two real bugs (level-lock vs.
`directRecommended`; `calculate120Placement` confidence) but explicitly
left the real-browser click-through of fix #1 undone ("this session has no
browser tooling available"). Browser tooling **is** available in this
sandbox (`playwright`, Chromium pre-downloaded at `/opt/pw-browsers` —
confirm with `DEBUG=pw:install npx playwright install chromium`, which
reports "already downloaded" rather than fetching anything over the
network). Method note carried forward from Agent 150/151/152, and hit
again this session: **start the `python3 -m http.server` and the
Playwright script in the same `bash_tool` call**, separated by `;` not
`&&` — background jobs started with `(cmd &)` do not survive into a later
call, and in this session `&&` immediately after the backgrounding subshell
sometimes caused the whole tool call to hang until the outer harness
killed it (returncode -1, no output at all). `;` did not have this problem.

## What was done

### 1. Verified Agent 156's fix #1 live (the task this session was sent to do)
Real headless Chromium against a local `http.server`, reproducing the
audit's exact scenario:
- Set `mylingo.chosenLevel.v1` to `{level:'a2', source:'assessment'}`
  (simulating `setAssigned('a2')` right after placement).
- Navigated to `shared/quiz.html?quiz=b1-001&level=b1&recommended=1` (a
  stretch recommendation link) — **loaded cleanly**, start screen showing
  "Present Perfect vs Past Simple", zero `errVisible`, zero page errors.
- Navigated to the same URL **without** `recommended=1` — **correctly
  still blocked**, `errTitle: "Level locked"`. No regression to normal
  pacing.

Fix #1 and fix #2 are both confirmed correct, exactly as Agent 156
described them.

### 2. Found and fixed a much bigger, unrelated, site-breaking regression
While doing the click-through above, the *first* attempt hit a page error
that had nothing to do with the level-lock fix:
```
TypeError: Cannot set properties of null (setting 'onclick')
  at shared/quiz.html:377
```
Line 377 is `$('endHome').onclick=()=>{...}` — but **`#endHome` does not
exist anywhere in this build's HTML.** Grepping the handoff history:
`AGENT_151_FULL_SITE_QA_HANDOFF.md` and `AGENT_152_PLACEMENT_LOCK_FIX_HANDOFF.md`
both describe clicking this exact button successfully in a real browser
(`"clicked the result screen's Back button (#endHome, wired to
backTarget())"`). Neither `HANDOFF_AGENT_154.md` (offline-packs.js only) nor
Agent 156's own handoff (quiz.html's one guard line + placement.js) touched
this markup. So somewhere in a build not represented by a handoff in this
zip, `#endHome`'s markup was removed from the "end" overlay (which now only
has "Try again" / `#again`) without removing the JS binding.

**Why this matters far more than it sounds:** `shared/quiz.html`'s entire
setup script is one synchronous top-level block that ends with `load();`.
A synchronous, uncaught `TypeError` partway through that block aborts
**every statement after it** — including `load()` itself. Net effect:
**every quiz on the entire site failed to initialize**, not just the
placement/stretch-link path this session was sent to check. This has
presumably been broken since whatever build removed the button, and no
prior agent's `node --check`/logic-only verification could have caught it
— it's a pure runtime/DOM defect.

**Fix (`shared/quiz.html`, same spot):**
```js
const endHomeBtn=$('endHome');if(endHomeBtn)endHomeBtn.onclick=()=>{stopAllSounds();location.href=backTarget()};
```
Null-guarded, matching the file's own existing fail-silent style elsewhere
(e.g. `focusBtn`'s `?.()`). This does **not** restore the missing "Back"
button — that's a product/UI decision (was it removed on purpose? should
"Try again" be the only exit now?) that I did not make. It only stops a
missing optional control from taking the rest of page init down with it.

**Re-verified live after the fix**, real click-through: loaded a normal
(non-lesson-gated-path) quiz via `recommended=1`, clicked Start, answered
all 5 questions via real button clicks, clicked Continue/`#next` after
each, reached the results screen (`#end` visible), clicked "Try again" —
**zero page errors throughout.** `#endHome` itself is confirmed absent
(`endHomeExists: false`), consistent with the markup genuinely being gone,
not a fluke.

One incidental finding while setting this up: `b1-001` (the quiz used in
the audit's stretch-recommendation example) is itself lesson-owned, so a
bare direct link to it (no `recommended=1`/`mode=placement`) redirects to
`courses/lesson.html` via the existing lesson-gate feature — expected
behavior (Agent 2's QUIZ-GATE), not a bug, just something to know if a
future agent reuses this quiz id for a quick manual test.

### 3. Stood up the minimal test harness (Agent 156's "Deep Work" recommendation)
New file: `tests/run.js`. No dependencies beyond Node's built-in `assert`.
Run with `node tests/run.js`. **13/13 passing:**
- `level-lock.js` (4 tests): unset ceiling, `setAssigned` locks above/opens
  at-or-below, ceiling moves down authoritatively, `setManualIfUnset`
  doesn't override an existing assignment.
- `recommendations.js` + `level-lock.js` interaction (3 tests): the audit's
  exact a2-overall/grammar-95%→b1-stretch scenario, confirms the stretch
  level really is locked by plain `isLocked`, and a copy of quiz.html's
  actual guard expression (kept in a comment as needing to stay in sync)
  proving `recommended=1` bypasses the lock and a bare link does not.
- `placement.js` (4 tests): 120/120→high, 80/120 (exact two-thirds
  boundary)→medium, 50/120→low, plus one pinning the 79/80/119 edges so a
  regression back to a hardcoded `120` would be caught even if it happened
  to still pass the three round-number cases.
- **New: a static regression guard (2 tests)** for the exact bug class
  found in §2 — scans `quiz.html` for any `$('id').onclick=` binding
  whose `id` doesn't exist anywhere in the file's `id="..."` attributes,
  and separately pins that the `endHome` fix specifically is present. This
  is a cheap net that would have caught today's regression without needing
  a browser at all (it's a static text scan, not a DOM check — it can't
  replace the real click-through, but it can flag this class of mistake
  the moment it's reintroduced).

Not covered yet: `skill-mastery.js`, `review-scheduler.js` (Agent 156's
original list). Next agent, extend this same file rather than starting a
new harness.

## Remaining (carried forward / new)

1. **[MEDIUM, unchanged from Agent 156] Level-lock is fail-open if
   `level-lock.js` fails to load.** Every guard site (`shared/quiz.html`
   line ~735, plus `a1/index.html` through `c2/index.html` and
   `a1/dashboard.html` through `c2/dashboard.html` — 13 sites total, all
   duplicated per level) checks `window.MylingoLevelLock &&`. I did not
   change this: it's a genuine product decision (silently fail-open vs.
   fail-closed vs. add a diagnostic), and with 13 near-identical sites to
   touch I didn't want to make that call unreviewed under this session's
   time pressure. If the decision is "add a diagnostic without changing
   behavior" (lowest-risk option, preserves current fail-open UX exactly),
   the change at each site is a one-line `else console.warn(...)` — happy
   to do this next pass once someone picks a direction.
2. **[NEW, HIGH-ish] Find and understand how `#endHome` disappeared.**
   I fixed the symptom (the crash), not the cause. Nobody knows which
   build removed the button or why — it's not mentioned in any handoff
   between Agent 152 (last confirmed working) and Agent 156. Whoever
   removed it may have intended to simplify the results screen (down to
   just "Try again") and just missed the JS cleanup, or it may have been
   an accidental drop during some other unrelated edit. Worth grep'ing
   whatever build artifacts exist between v152 and v155/156 if any are
   still around, purely to close the loop — not blocking, since the crash
   itself is now fixed either way.
3. **Zip filename vs. `RELEASE_IDENTITY.json` mismatch — still unresolved,
   now with a third data point.** This session's zip:
   `MYLINGO_v155_AGENT156_PLACEMENT_RECOMMENDATION_LOCK_FIX.zip` /
   folder name says v155/Agent156. `RELEASE_IDENTITY.json` inside it says
   `{"release": "v118", ...}`. Same category of mismatch Agent 156 flagged
   (their zip said v158/AGENT158, contents said v154/AGENT154). Whoever
   produces these archives should be told directly — this is now the
   second consecutive session where the zip name and the release file
   disagree, by a different amount each time, which rules out a one-off
   typo and points at something systematic in how the archive gets named.
4. **`skill-mastery.js` and `review-scheduler.js`** still have no tests in
   the new harness. Lowest-effort next addition — the harness's module-shim
   pattern (see top of `tests/run.js`) already generalizes to them.

## Suggested order for the next agent
1. Decide the fail-open/fail-closed question (item 1) — this is now the
   only remaining item from the original audit that's a decision rather
   than a bug, so it's the natural next thing to close out.
2. Extend `tests/run.js` to cover `skill-mastery.js` /
   `review-scheduler.js` (item 4) while the harness pattern is fresh.
3. Item 2 (find how `#endHome` vanished) only if there's spare time — it's
   a nice-to-know, not a blocker, since the crash is already fixed.
4. Keep flagging item 3 (zip naming) out-of-band until it stops happening.

## Verification summary
- Real headless Chromium (`/opt/pw-browsers`, no network fetch needed)
  against `python3 -m http.server`, server + script in the same
  `bash_tool` call.
- Fix #1 positive case (stretch link, `recommended=1`): loads cleanly, 0
  errors. Negative control (same level, no `recommended=1`): still
  correctly locked.
- Full 5-question click-through of an ordinary quiz to the results screen
  after the `endHome` fix: 0 page errors, "Try again" clickable.
- `node tests/run.js`: 13/13 passing.
- `node --check` on all three touched/tested `.js` files: pass.
