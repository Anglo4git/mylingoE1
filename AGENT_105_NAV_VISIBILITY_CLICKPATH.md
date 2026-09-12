# Agent 105 — live nav-visibility click-path table (continuing from AGENT_104_LIVE_BROWSER_A11Y_CLICKPATH.md)

**Scope completed this pass:** `AGENT_95_100_PARTIAL_COMPLETION.md` named
one specific still-open item under 100: "an actual click-path table for
the mid-question nav-hide case" (the interaction Agent 99 was scoped
closest to but couldn't verify without a browser). Agent 104 confirmed a
real Chromium is available; this pass uses it to build that exact table
instead of leaving it as a named-but-undone item.

## What the nav-hide contract is (read before testing it)

`shared/quiz.html`'s `show(section)` (line 328) hides the bottom nav
(`window.MylingoAppShell.setVisible`) whenever `section` is falsy, and
`section` is only ever `null`/omitted for the in-progress-question state —
every overlay (`start`, `end`, `error`, `loading`) passes a truthy section
name. So the nav should read `data-hidden="true"` only while a question is
on screen (answered or not) and `"false"` on every overlay.

## Live table (real Chromium, `data-hidden` read directly off `#mylingoAppShell`)

```
NAV VISIBILITY TABLE (data-hidden: true = nav hidden, false = nav visible)
  start overlay (pre-click)                     -> false
  question rendered (unanswered, Q1)            -> true
  answered, Next visible (Q1)                   -> true
  next question rendered (Q2)                   -> true
  answered, Next visible (Q2)                   -> true
  next question rendered (Q3)                   -> true
  answered, Next visible (Q3)                   -> true
  next question rendered (Q4)                   -> true
  answered, Next visible (Q4)                   -> true
  next question rendered (Q5)                   -> true
  answered, Next visible (Q5)                   -> true
  end/results overlay                           -> false
  after Again -> Q1 rendered directly           -> true
  invalid quiz -> error overlay shown=true      -> false
pageerrors: []
```

Every row matches the contract above. Two cases worth calling out because
they're easy to get wrong and weren't obviously covered by Agent 99's
static read:

- **"Again" restart** (`$('again').onclick = () => startFresh()`) skips the
  `start` overlay entirely and drops straight back into Q1 — nav correctly
  re-hides on that direct transition, not just on the normal
  overlay→question path.
- **Error path** (bad `?quiz=` id): nav stays visible (`false`) on the
  error overlay, matching every other overlay — a learner who lands on a
  broken quiz link isn't also trapped with the nav hidden.

No gap found: the mid-question nav-hide behavior holds across the full
lifecycle this pass could reach (fresh start, every question in a 5-question
quiz, restart, and the error overlay). This closes the specific item named
in `AGENT_95_100_PARTIAL_COMPLETION.md`.

## Not covered by this table

- The mid-question *throw* scenarios Agent 102/103 already handled via
  try/finally (`end()` guarded, `finishAnswer`/`render` traced as safe) —
  this pass checked the normal-path *state machine*, not exception
  recovery; those two areas are complementary, not overlapping.
- Non-radio question types (checkbox/matching/ranking/text) — per Agent
  104, no live content exercises those render paths, so this table is
  radio-path-only, same limitation as the prior pass.
- Full axe-core audit — still not installed, still not fetched over a
  disabled network, still not faked.

No code changes this pass — the behavior matched its contract on every
row tested, so there's nothing to fix. Reporting the clean result rather
than manufacturing a change, same standard as 95/103/104.

## Re-verified (real output)

```
$ python3 course_schema.py validate --content-dir site/course_content --master-source master_source.csv --strict
0 error(s), 0 warning(s).

$ python3 course_content_qa.py --content-dir site/course_content --master-source master_source.csv --site-dir site --strict
0 error(s), 0 warning(s), 0 info.

$ find site -name "*.js" | xargs -n1 node --check
(no output — all pass)
```

## Still open (revised from Agent 104)

- 96/97 — content expansion: not attempted.
- 100 (rest): full axe-core automated audit (tool unavailable), a
  full-page/every-screen contrast sweep (only the end-screen was spot-
  checked in Agent 104), and live coverage of non-radio question types
  if/when content ever uses them. The mid-question nav-hide click-path
  item is now closed (this pass).
- 101 — final release gate: still blocked on the remainder of 100 above.

No PASS declared for the overall 87–101 program.
