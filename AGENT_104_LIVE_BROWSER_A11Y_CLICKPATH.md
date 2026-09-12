# Agent 104 — live-browser click-path & accessibility pass (continuing from AGENT_103_POST_ANSWER_FLOW_REVIEW.md)

**Scope completed this pass:** every prior agent (through 103) recorded item
100's remainder — axe-core, focus-order, contrast, live click-path — as
blocked because "needs a real browser, still unavailable in this
container." That assumption was checked this pass instead of re-stated:
a headless Chromium is in fact present in this container
(`/opt/pw-browsers/chromium-1194`, plus a cached Puppeteer Chrome and
system `/opt/google/chrome`), and `playwright@1.56.0` is installed
globally. So instead of one more static-read review, this pass drove the
actual quiz runtime end-to-end in a real browser.

## What was run (real output, not inferred)

Served `site/` over `python3 -m http.server`, launched Chromium via
Playwright, and drove `site/shared/quiz.html` through a full session:

1. **Live click-path**, one full quiz start→finish on `b1-001` (radio
   questions): click Start → answer each question → click Next → reach
   the end screen. Repeated across `a1-010`, `b1-010`, `c2-004` (three
   levels) as a robustness check.
   - Result: `endShown=true` on every run, 0 `pageerror`/console-error
     events, 0 JS exceptions surfaced to Playwright.
2. **Focus-order**, on the same run:
   - First `.option` gets `tabIndex=0` on render (roving tabindex is
     wired correctly) — confirmed `true`.
   - After each submit, focus lands on the `#next` button (0 warnings
     out of 6 answered questions).
   - At the end screen, focus lands on `#result` — confirmed `true`.
   This directly exercises the exact `submitAnswer → finishAnswer →
   next → render/end` path Agent 103 traced statically; nothing here
   contradicts that review.
3. **Contrast**, spot-checked on the four visible end-screen text nodes
   (`#result`, `#message`, `#finalPct`, `#again`) using actual computed
   `color`/`background-color` (walking up the DOM for the first non-
   transparent background) and the real WCAG contrast-ratio formula:
   - `#result` 16.29:1, `#finalPct` 16.29:1 (large text, needs 3:1)
   - `#message` 4.83:1, `#again` 6.19:1 (normal text, needs 4.5:1)
   - All four pass. This is a targeted spot-check of the results screen,
     not a full-page/full-flow contrast sweep.
4. **axe-core**: not run. It isn't installed in the container and
   `bash_tool`'s network is disabled, so it couldn't be fetched to
   verify this pass rather than assumed. Flagging this explicitly
   instead of quietly substituting the custom checks above for it.

## Finding: production content only exercises one question-render path

While picking quizzes for the click-path run: every real quiz file under
`site/{grammar,vocabulary,writing,academic-english,placement}/**/*.json`
leaves `question.type` unset, so `rawType()` always resolves to the
default radio path. `renderChoice`'s checkbox/dropdown branches and
`renderTextLike`, `renderMatching`, `renderRanking` in `quiz.html` are
real, wired-up code — but nothing in the current content set calls them.
They're covered by the unit tests, not by any live content today.

This isn't a bug — the click-path and focus-order results above hold for
every question a learner can actually reach right now — but it means
"live click-path tested" so far only means the radio path. If content
authoring ever ships a matching/ranking/checkbox/free-text quiz, this
pass's coverage doesn't extend to it and a follow-up live run should.

No code changes this pass — the runtime held up under actual execution,
so there's nothing to fix; reporting a clean result honestly rather than
finding something to touch, same standard as Agents 95 and 103.

## Re-verified (real output)

```
$ python3 course_schema.py validate --content-dir site/course_content --master-source master_source.csv --strict
0 error(s), 0 warning(s).

$ python3 course_content_qa.py --content-dir site/course_content --master-source master_source.csv --site-dir site --strict
0 error(s), 0 warning(s), 0 info.

$ find site -name "*.js" | xargs -n1 node --check
(no output — all pass)

$ node a11y_check.js   (Playwright, b1-001, full session)
{
  "errors": [],
  "warnings": [],
  "steps": [
    "loaded http://localhost:8791/shared/quiz.html?quiz=b1-001&level=b1",
    "reached end screen: true after 6 steps",
    "focus on #result at end: true",
    "#result contrast 16.29:1 (needs 3:1) fontPx=32",
    "#message contrast 4.83:1 (needs 4.5:1) fontPx=12",
    "#finalPct contrast 16.29:1 (needs 3:1) fontPx=28",
    "#again contrast 6.19:1 (needs 4.5:1) fontPx=15",
    "first option has tabIndex 0 on render: true"
  ]
}

$ node a11y_check2.js  (a1-010, b1-010, c2-004)
a1-010 endShown= true steps= 6 jsErrors= []
b1-010 endShown= true steps= 6 jsErrors= []
c2-004 endShown= true steps= 6 jsErrors= []
```

## Still open (revised from Agent 102/103)

- 96/97 — content expansion: not attempted.
- 100 — **partially closed this pass**: live click-path, focus-order, and
  a results-screen contrast spot-check are now real-browser-verified
  (see above), for the radio-only path that all current content uses.
  Still open: an actual axe-core automated audit (tool unavailable, not
  faked), a full-page/every-screen contrast sweep, and live coverage of
  the checkbox/matching/ranking/free-text render paths once/if content
  uses them.
- 101 — final release gate: still blocked on the above remainder of 100.

No PASS declared for the overall 87–101 program.
