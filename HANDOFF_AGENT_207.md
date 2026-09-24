# Agent 207 Handoff — runtime-content-loader.js mutation-swept (first time ever), 1 real gap closed, 1 documented equivalent mutant; 932 -> 933 tests

## Context
Picked up HANDOFF_AGENT_206.md item 1: no file was flagged as the obvious next target, so selected `runtime-content-loader.js` by the same highest-value-first logic Agent 204/205/206 used — it handles untrusted network-response shapes (quiz manifest JSON, grammar/vocab content JSON) and had 12 hand-written tests but had never been through a *mutation-tested* pass. Baseline 932 passed, 0 failed. Now **933 passed, 0 failed**.

## Bug found + fixed
### `shared/js/runtime-content-loader.js` — `load()` memoization key silently dropped `explicitFile`
`var key = level + '|' + id + '|' + String(explicitFile || '');` — the mutation sweep's `|| -> &&` flip on this line survived on the first pass. Tracing it: the flip made `String(explicitFile && '')` collapse to `''` for any truthy `explicitFile`, so every explicit-file load for a given `level`/`id` pair shared one cache slot regardless of *which* file was requested. The **existing source code is correct** (uses `||`, not `&&`) — this was a coverage gap, not a live bug: no test exercised two different `explicitFile` values against the same `level`/`id`, so a future regression here (e.g. an accidental `&&`, or reordering the key parts) would have shipped undetected, silently serving the wrong cached quiz JSON.

Added one regression test (`loader: explicitFile is part of the memoization key — two different explicit files under the same level/id are NOT treated as the same cache entry`) that loads `x.json` then `y.json` via the same `level='a1', id='ignored'` and asserts both are actually fetched.

## Mutation sweep (same criterion as Agent 203-206: core.zip identity FAIL ignored since this file IS in `offline/core-manifest.json`, any other FAIL/stderr/crash/timeout = killed)
File is small (91 lines) so a bespoke lightweight generator was written for this pass (not reused from a prior agent — the recipe says the tooling isn't committed to the app tree and prior agents' scripts weren't in this zip either). Same design: comments/strings/regex-literal contents masked before scanning for operator sites (`===`/`!==`/`>=`/`<=`/`||`/`&&`), plus a curated list of structural mutations (negations, ternary swaps, `.toLowerCase()`/`.replace()`/`encodeURIComponent()` removal) verified against the real source. Runner restores the original file after every mutant regardless of outcome, wraps each `node tests/run.js` in `timeout -k 5 60`, validated with a clean control run first (933 passed, 0 failed, no FAIL lines) before mutating.

**First pass: 24 runnable mutants → 22 killed, 2 survived.**
- Survivor 1 (real gap): the `explicitFile` memoization-key `||`, fixed above.
- Survivor 2: `VALID_LEVELS.indexOf(level) >= 0 ? level : 'a1'` mutated `>=` to `>`. **This is a genuine equivalent mutant, not a coverage gap** — `VALID_LEVELS[0]` is `'a1'`, which is also the function's own fallback value. The `>=`/`>` distinction only changes behavior at `indexOf === 0` (i.e. `level === 'a1'`), and at that exact point both branches return `'a1'` — the "correct" branch returns the matched level (`'a1'`) and the "wrong" branch returns the fallback (`'a1'`), which are identical. No possible test/input can distinguish original from mutant here; do not chase this with a test. (Same bug-class boundary Agent 206 flagged in `learner-state.js`'s `level()` — there it was a real gap because the fallback differed from index 0's value; here it happens not to be.)

Added the one test above, regenerated mutants against the updated test file, re-swept: **24 runnable mutants → 23 killed, 1 survived (the documented equivalent mutant, expected).**

## Tests: 932 -> 933 (+1)
- `loader: explicitFile is part of the memoization key — two different explicit files under the same level/id are NOT treated as the same cache entry (Agent 207 mutation-sweep hardening)`

## Cache / pack
No core-pack file's **source** changed (only `tests/run.js`, which is not in `offline/core-manifest.json`). `sw.js` `CACHE_VERSION` stays `mylingo-v27`; `offline/packs/core.zip` untouched and its byte-identity test still passes (confirmed in the final sweep's clean control run: 933 passed, 0 failed).

## Files changed vs Agent 206 zip
`tests/run.js`, `HANDOFF_AGENT_207.md`. (`shared/js/runtime-content-loader.js` itself is unmodified — verified byte-identical to the Agent 206 zip's copy after the sweep restored it.)

## Not done / carried forward
- Decision-gated backlog (items 1, 2, 10, 17, 19, 21-29, 35 from Agent 203's list, carried unchanged since): `normalizeQuestion`/`normalizeQuiz`/`normalizeHierarchy` throwing on any single malformed question (product/refactor call); Pages' duplicate `readProgress` copies (refactor call); observations left alone (`calculateSkillProfile` unanswered-as-0%, `resolvePlacement`/`calculateResult` treating `complete: 0 | null | 'false'` as complete, `normalizeLevel(' b1')` is A1, `readStored` not range-checking score, `validatePlacementBlueprint`/`recommendations.validateProfile` tautologies).
- Still not mutation-swept at all: `app-shell.js`, `splash.js` (Agent 205 judged these have no untrusted-shape surface worth a sweep — pure DOM/nav-building code, no JSON parsing). This judgment was not revisited this pass.

## Next agent — start here
1. No specific file is flagged as the obvious next target. Pick a re-verification target using the same highest-value-first logic (a file that handles untrusted input shapes and hasn't had a *mutation-tested* pass yet), or work the decision-gated backlog if a product decision has arrived. Candidates with untrusted-input surface not yet confirmed mutation-swept: `quiz-packer.js`, `authoring-validation.js`, `canonical-metadata.js`, `safe-url.js` — verify against handoff history before assuming any of these is actually unswept, since coverage claims drift across 200+ handoffs.
2. If a core-pack file changes: bump `CACHE_VERSION` (currently `mylingo-v27`) and rebuild `offline/packs/core.zip` from ALL on-disk sources (python `zipfile`, same member order, keep each `ZipInfo` date/compress type/attrs).
3. Decision-gated backlog above; if a product decision arrives, implement it and flip the pin in the same change.

Sweep recipe used this pass (bespoke, file-scoped — not the full generic tool prior agents describe as living outside the tree, since it wasn't available in this zip): a small `generate.js` masks comment/string/regex-literal contents in the target file, finds `===`/`!==`/`>=`/`<=`/`||`/`&&` operator sites plus a hand-curated list of structural mutations (negations, ternary swaps, method-removal), and writes `mutants.json`. `run_sweep.js` takes each mutant, patches the file in a private `worker/` copy, runs `node tests/run.js` wrapped in `timeout -k 5 60`, restores the original file unconditionally, and counts a mutant as SURVIVED only when the result is `N passed, 0 failed` or the single failure is by name `FAIL - offline/packs/core.zip contains exactly the manifest files, byte-identical to source` (this file is in the core manifest, so that exclusion was live). Validated with a clean control run first. Both sweeps (24 mutants each) completed in well under a minute total — this file is small enough that a full sweep-fix-resweep cycle costs almost nothing; worth doing routinely on any small file before reaching for a bigger target.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call).

## Artifacts
`mylingo-v180-agent207-runtime-content-loader-mutation-sweep.zip`, `HANDOFF_AGENT_207.md`.

## Resume command
"Resume from HANDOFF_AGENT_207.md. You are Agent 208. Continue from 'Next agent — start here'."
