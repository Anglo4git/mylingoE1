# Agent 191 Handoff — dead-code cleanup in shared/quiz.html (item 33) + cache bump

## Context
Picked up `HANDOFF_AGENT_190.md`, "Next agent — start here" item 2 (delete dead `valuesEqual`
from `shared/quiz.html`, carried item 33). Baseline: 766 passed, 0 failed.

## What changed
- `shared/quiz.html`: removed `function valuesEqual(a,b,type){...}` (defined, never called —
  `submitAnswer` inlines its own per-type comparison) **and** `let qGlobalTolerance=0;`, whose only
  reader was `valuesEqual` (verified by grep: 2 occurrences, both in the removed block). Nothing else
  in the file touched. The test sandboxes in `tests/run.js` that pre-declare `qGlobalTolerance`
  are unaffected (harmless extra declaration in their own vm scope).
- `sw.js`: `CACHE_VERSION` `mylingo-v16` → `mylingo-v17` (quiz.html is a core-pack file).
- `offline/packs/core.zip`: rebuilt from on-disk sources (python zipfile, same member order,
  date_time, compress_type, external_attr as the previous zip). Both `shared/quiz.html` and `sw.js`
  members refreshed; the existing "core.zip byte-identical to source" test caught the first attempt
  where only quiz.html had been refreshed (sw.js also lives in the pack) — fixed.
- `tests/run.js`: updated the now-stale Agent 189 comment about `valuesEqual`; added section
  "quiz.html dead-code removal pin + cache bump (Agent 191)" with 2 sync tests (valuesEqual /
  qGlobalTolerance absent and `submitAnswer` still present; `CACHE_VERSION` = `mylingo-v17`).

## Tests: 766 → 768 (+2)
`node tests/run.js` → **768 passed, 0 failed**; `node --check tests/run.js` clean.

## Current state
`CACHE_VERSION` = `mylingo-v17`; `core.zip` rebuilt and matches manifest byte-for-byte.
No behaviour change (removed code was unreachable).

## Remaining / carried forward
Items 1/2/10–12/14–29 carried list from HANDOFF_AGENT_186/187, plus:
34. [INFO] redirect self-reference resolution question (from HANDOFF_AGENT_190) — check whether
    Continue link → quiz → exit "back to home" misfires in a real browser (Playwright is available
    at /opt/pw-browsers per Agent 150/151 notes). Item 33 is now DONE.

## Next agent — start here
1. Item 1/2/10–12/14–29 carried list (decisions: fail-open modules etc.) — the long-standing backlog.
2. Optional: investigate item 34 with a real-browser round trip if in scope.
3. If a core-pack file changes, bump `CACHE_VERSION` and rebuild `offline/packs/core.zip` from ALL
   on-disk sources (sw.js and quiz.html are both members — refresh every member, not just the one
   you edited).

## Blockers
None.

## Artifacts
- `mylingo-v168-agent191-dead-code-cleanup.zip`, `HANDOFF_AGENT_191.md`.

## Resume command
"Resume from HANDOFF_AGENT_191.md. You are Agent 192. Continue from 'Next agent — start here'."
