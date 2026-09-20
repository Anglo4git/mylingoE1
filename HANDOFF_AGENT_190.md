# Agent 190 Handoff — normalised-diff drift guard between index.html and main/index.html

## Context
Picked up `HANDOFF_AGENT_189.md`, "Next agent — start here" item 1 (originally flagged as
HANDOFF_AGENT_188 item 32 / "Next agent" item 2). Baseline: 764 passed, 0 failed.

## What this does
`index.html` (root) and `main/index.html` are near-duplicates that differ **only** by path depth:
root uses `./`-relative paths, `main/index.html` uses `../`-relative paths (plus a couple of
same-folder-relative ones for files that live alongside it). Nothing previously enforced that the
two stay in sync — Agent 188 hit exactly this when root's card silently 404'd because it inherited
`main/index.html`'s `../course_content/...` path unchanged.

Added a test that normalises **both known-different depth idioms** in each file to shared markers,
via exact, count-checked substring replacements (15 rules per file, each asserting how many times
the literal it targets appears before rewriting it — so if a rule's target text no longer exists,
or now exists a different number of times, the test fails with exactly which literal moved, not just
"mismatch somewhere"), then asserts the two normalised results are **byte-identical**. Two of the
15 rules per file aren't simple path-depth swaps — they're genuinely different call sites that need
their own explicit mapping:
- `resolveHomepageState('./')` (root, explicit base — the Agent 188 fix) vs `resolveHomepageState()`
  (main, relies on the function's own `'../'` default)
- each file's own-URL self-reference inside the Continue link's `redirect` param:
  `encodeURIComponent('./index.html')` (root) vs `encodeURIComponent('../main/index.html')` (main)

Everything else in both files — copy, markup structure, CSS, the whole inline script's logic — must
now be **completely identical** for the test to pass. A second, smaller test pins that the nav
"home" link (`<a href="./index.html" aria-label="Mylingo home">`) is intentionally *literally*
identical text in both files (each level-folder page treats its own index as "home"), so that
identical-looking line doesn't get miscategorised as a depth-relative path needing a rule of its own.

## Tests: 764 → 766 (+2)
New section "index.html vs main/index.html: normalised-diff drift guard (Agent 190, HANDOFF_AGENT_188
item 32/188:2)", added right after the Agent 189 section (same end-of-file placement — before
`finish()`/`report()`; placement doesn't matter for execution order, see Agent 189's handoff for why).
Both tests are synchronous (`test()`, not `testAsync()` — they just read and diff two static files).

Mutation-verified: temporarily changed one word of copy in `main/index.html` only (not root) and
confirmed the drift test fails with a clean, pinpointed diff showing exactly the line that moved
(`Pick up where you left off.` vs `Pick up right where you left off.`) rather than a vague mismatch.
File restored byte-identical afterward (hash-verified).

No harness changes were needed beyond the new section; no source/shipped file was touched — verified
byte-identical against the Agent 189 zip for `shared/quiz.html`, `sw.js`, `index.html`,
`main/index.html`, and `offline/core-manifest.json`.

## Source change → cache bump + core.zip
**None.** Only `tests/run.js` changed this round (plus this handoff doc). `CACHE_VERSION` stays at
`mylingo-v16`, `offline/packs/core.zip` unchanged.

## Findings (pinned / not changed)
- **[INFO]** The redirect self-reference literals (`'./index.html'` on root, `'../main/index.html'`
  on main) are forwarded verbatim through `courses/lesson.html`'s `redirect` query param into
  `shared/quiz.html`'s `redirect`/`backTarget()`, which resolves it relative to `/shared/quiz.html`'s
  own location when actually navigated. Neither literal is `/shared/`-relative, so if/when
  `backTarget()` is actually reached with one of these values, the browser will resolve it relative
  to wherever the link is clicked from, not necessarily back to the homepage the user started on.
  Not investigated further or changed — out of scope for a coverage/drift-guard task, and the two
  files are at least *consistent with each other* in using this same self-referential idiom (which is
  exactly what the new drift test pins going forward). Worth a dedicated look by a future agent if
  the "Continue" → quiz → back-to-home flow is ever reported as landing somewhere wrong.

## Current state
`node tests/run.js` → **766 passed, 0 failed**; `node --check tests/run.js` clean; `CACHE_VERSION` =
`mylingo-v16` (unchanged); `core.zip` unchanged.

## Remaining / carried forward
Items 1/2/10–12/14–29 carried list from HANDOFF_AGENT_186/187, plus:
33. [INFO] `valuesEqual` dead code in `shared/quiz.html` (line 945) — safe to delete in a cleanup pass.
34. [INFO] the redirect self-reference resolution question above — worth checking if the
    Continue-link → quiz → exit flow's "back to home" ever actually misfires in a real browser.

## Next agent — start here
1. Item 1/2/10–12/14–29 carried list (decisions: fail-open modules etc.) — the long-standing backlog.
2. Optional cleanup: delete dead `valuesEqual` from `shared/quiz.html` (item 33) if in scope.
3. Optional: look into item 34 (redirect self-reference) if it's ever reported as a real symptom.
4. If a core-pack file changes, bump `CACHE_VERSION` and rebuild `offline/packs/core.zip` (python
   zipfile, same member order/attrs as the existing zip).

## Blockers
None.

## Artifacts
- `mylingo-v167-agent190-index-drift-guard.zip`, `HANDOFF_AGENT_190.md`.

## Resume command
"Resume from HANDOFF_AGENT_190.md. You are Agent 191. Continue from 'Next agent — start here'."
