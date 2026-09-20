# Agent 194 Handoff — carried item 14 FIXED (Ctrl/Cmd/Alt+digit no longer answers a radio question) + cache bump

## Context
Picked up `HANDOFF_AGENT_193.md`, "Next agent — start here" item 1: "pick one low-risk item from the backlog and
implement it with tests". Chose carried item 14 (HANDOFF_AGENT_174): the smallest unambiguous user-visible bug on
the list (one guard line, no product trade-off). Baseline: 770 passed, 0 failed.

## Bug (item 14 — FIXED)
`shared/quiz.html` document-level `keydown` handler answered a radio question from `parseInt(e.key,10)` alone, never
checking modifiers. Ctrl/Cmd+1…9 is the browser's tab-switch shortcut (Alt+digit is used by other browser/OS chords), so
a learner switching tabs on a radio question could submit — and lock — an answer by accident.

## Fix
`shared/quiz.html`: first statement of the handler is now `if(e.ctrlKey||e.metaKey||e.altKey)return;` (before the
`locked`/`data` checks). Plain digits and Shift+digit behave exactly as before; nothing is `preventDefault()`ed, so the
browser's own shortcut still works. No other line touched.

## Source change -> cache bump + core.zip
`shared/quiz.html` is a core-pack file: `sw.js` `CACHE_VERSION` `mylingo-v17` -> **`mylingo-v18`**;
`offline/packs/core.zip` rebuilt from all on-disk sources (same 90 members / order / date_time / compress_type /
external_attr as the previous zip; `unzip -t` clean; the "core.zip byte-identical to source" test passes).
`diff -rq` vs the Agent-193 zip: only `shared/quiz.html`, `sw.js`, `offline/packs/core.zip`, `tests/run.js` (+ this file).

## Tests: 770 -> 771 (+1)
- Flipped the Agent 174 pin ("NOT modifier-aware") into a real assertion: Ctrl / Cmd / Alt / Ctrl+Alt + digit click nothing
  and don't `preventDefault`; Shift+digit and plain digit still answer.
- Updated the Agent 191 cache-version test to `mylingo-v18` (comment records v16->v17 Agent 191, v17->v18 Agent 194).
- New section "quiz.html digit shortcut ignores modifier chords (Agent 194)": 1 static test pinning that the guard is the
  handler's first statement, ahead of the state checks.
`node --check tests/run.js` clean; `node tests/run.js` -> **771 passed, 0 failed**.

## Real-browser verification (Playwright + headless Chromium, python http.server)
`shared/quiz.html?quiz=a1-001&level=a1&recommended=1` (recommended=1 bypasses the lesson gate; without it the quiz
redirects to its owning lesson), Start, 4 options: Ctrl+1, Alt+2, Meta+1, Ctrl+Alt+3 -> 0 options disabled (nothing
answered); plain `1` -> answered (options disabled); no page errors.

## Remaining / carried forward
Items 1/2/10–12/15–29 from HANDOFF_AGENT_186/187 (product / fail-open DECISION list) and optional [INFO] 35 from
HANDOFF_AGENT_192. Items 14, 30, 33, 34 are DONE.

## Next agent — start here
1. Pick the next unambiguous BUG-ISH item and fix it with tests, e.g. item 11 (banner subprompt shows "Choose the best
   answer.", Agent 172), 12 (failed lesson-list load cached as `[]` for the page's lifetime, Agent 173), 15 (missing runtime
   script reported as retryable "Connection problem", Agent 175), or 16 (splash icon path under a sub-path host, Agent 176).
   Read the owning HANDOFF_AGENT_NNN.md finding first; if behaviour is pinned by a test, flip the pin in the same change.
2. Otherwise get a product decision on the DECISION backlog (items 1/2/10/17–29, 35).
3. If a core-pack file changes, bump `CACHE_VERSION` (now `mylingo-v18`) and rebuild `offline/packs/core.zip` from ALL
   on-disk sources (every member, e.g. sw.js and quiz.html — the identity test catches a partial rebuild).

## Blockers
None for items 11/12/15/16; product decisions for the rest.

## Artifacts
- `mylingo-v171-agent194-modifier-digit-fix.zip`, `HANDOFF_AGENT_194.md`.

## Resume command
"Resume from HANDOFF_AGENT_194.md. You are Agent 195. Continue from 'Next agent — start here'."
