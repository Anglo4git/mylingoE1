# Agent 106 — full-page contrast sweep (real browser) + fixes

**Scope completed this pass:** `AGENT_95_100_PARTIAL_COMPLETION.md` / Agent
105 listed as still open under 100: "a full-page/every-screen contrast
sweep (only the end-screen was spot-checked in Agent 104)" and "full
axe-core automated audit (tool unavailable)." This pass:

1. Re-verified Agent 105's nav-visibility table with a live spot-check
   (real Chromium, same quiz.html) before touching anything — confirmed
   `false` on the start overlay and `true` once a question renders, no
   drift. Not a full re-run of all 14 rows; a sanity check that the prior
   claim still holds post-fix.
2. Confirmed axe-core is still genuinely unavailable: no local copy on
   disk, `npm install axe-core` fails with `403 Forbidden` against
   registry.npmjs.org (network is disabled in this environment, as every
   prior agent reported). Not faked, not worked around.
3. Built the full-page contrast sweep that was named-but-not-done: a
   real Chromium page (390×844, mobile viewport) navigated to every
   major screen, walking the DOM for every element with its own visible
   text, computing the effective background (first non-transparent
   ancestor) and WCAG relative-luminance contrast ratio against the
   foreground, flagging anything under 4.5:1 (or 3:1 for large/bold
   text) — the same math axe-core uses, run directly since axe-core
   itself can't be fetched.

## Pages swept

`/index.html`, `/main/index.html`, `/main/placement.html`,
`/main/practice.html`, `/main/progress.html`, `/courses/index.html`,
`/courses/course.html`, `/a1/index.html`, `/a1/dashboard.html`.

(Quiz screens were already covered by Agent 104's spot-check + this
pass's nav re-check; not re-swept for contrast here — that's still a gap,
see "Not covered" below.)

## What the sweep found (before fix)

Two real, reproducible AA failures, both from color tokens duplicated
inline across every level page rather than a single shared stylesheet:

- `.chip` / `.best` / `.status.completed` text — `#3e8f08` green on
  `#e9f8df` soft-green background → **3.69:1** (needs 4.5:1). Hit on
  `/index.html`, `/main/index.html`, `/main/placement.html`,
  `/a1/index.html` (20 chip instances on that page alone), plus the same
  pattern present (per grep) in `b1/b2/c1/c2` index/dashboard pages and
  `courses/*.html`.
- `.answer .num` step-number text and dashboard "muted" text —
  `--muted:#6b7280` on `#f1f3f5` → **4.35:1**, and on `#eaf1fc` → **4.26:1**
  (both need 4.5:1). Same duplicated-token pattern, 18 files.
- The "Online" network-status badge (`shared/js/offline-packs-ui.js`,
  injected inline style, not in any HTML file — this is why it didn't
  show up in a per-file grep) used the same failing green-on-green pair.

## Fix applied

- `color:#3e8f08` → `color:#2f6d06` everywhere it appears inline (15
  HTML files) — same green family, now **5.73:1** on the soft-green
  background.
- `--muted:#6b7280` → `--muted:#4b5563` everywhere it's declared as a
  root token (18 HTML files) — now **6.79:1** / **6.65:1** on the two
  backgrounds that were failing. This only ever raises contrast on this
  site's light backgrounds, so no other `--muted` usage can regress from
  the darker value.
- `shared/js/offline-packs-ui.js`: `.offline-network.online` color and
  the `.offline-network` fallback color updated to match (this is a
  shared component injected at runtime, not caught by the HTML-file
  greps above — worth remembering for the next sweep).

## Re-verified after fix (real output)

```
Contrast sweep, same 9 pages: TOTAL REMAINING FAILS: 0

$ python3 course_schema.py validate --content-dir site/course_content --master-source master_source.csv --strict
0 error(s), 0 warning(s).

$ python3 course_content_qa.py --content-dir site/course_content --master-source master_source.csv --site-dir site --strict
0 error(s), 0 warning(s), 0 info.

$ find site -name "*.js" | xargs -n1 node --check
(no output — all pass)

Nav-visibility spot-check (unaffected by CSS-only change, confirmed anyway):
  start overlay -> false
  after start click -> true
  pageerrors: []
```

## Not covered by this pass

- Quiz-screen (`shared/quiz.html`) states weren't run through the
  automated contrast sweep itself — only the nav-hide attribute was
  re-checked. Agent 104 spot-checked the end-screen only; a full
  question/answer/result contrast pass on quiz.html is still open.
- Real axe-core (rule coverage beyond color contrast — ARIA roles,
  focus order, landmark structure, etc.) is still blocked on network
  access, same as every prior pass.
- 96/97 content expansion: not attempted.
- Non-radio question types: still no live content exercising those
  render paths (per Agent 104/105).
- The duplicated-inline-token pattern itself (`:root` vars and
  `.chip`/`.status` rules copy-pasted into 15-18 separate HTML files
  instead of one shared stylesheet) is a maintainability risk, not just
  an accessibility one — the next agent touching color tokens should
  grep across *all* level pages, not just the one being edited, or this
  class of bug will resurface piecemeal the way it was introduced.

## Still open (revised from Agent 105)

- 96/97 — content expansion: not attempted.
- 100 (rest): full axe-core automated audit (blocked on network), quiz-
  screen contrast pass, live coverage of non-radio question types if/when
  content ever uses them. The full-page contrast sweep for the 9 core
  screens is now closed (this pass); the color-contrast class of finding
  it was meant to catch is fixed.
- 101 — final release gate: still blocked on the remainder of 100 above.

No PASS declared for the overall 87–101 program.
