# Agent 211 Handoff — app-shell.js + splash.js mutation-swept for the first time (Agent 205's "no untrusted-shape surface" judgment re-examined and reframed, not overturned); 939 -> 939 tests

## Context
Picked up `HANDOFF_AGENT_210.md` "Next agent — start here" option (a): revisit `app-shell.js`/`splash.js`, since Agent 205's original call ("pure DOM/nav-building code, no JSON parsing, not worth a sweep") had stood unchallenged through 3 subsequent passes without anyone actually running the generator against them. Per item 2 of that handoff, checked candidate count first.

**Finding: Agent 205's judgment about *why* these files were skipped (no untrusted-shape/JSON-parsing surface) is correct and still holds, but it does not imply "no mutation candidates."** Both files have real conditional logic (route matching in `activeKey()`, script-URL parsing in both files, visibility toggling) and both already have substantial pre-existing behavioral test suites (Agent 177 for app-shell.js, Agent 176 for splash.js) — this was never an untested-file situation, just an unswept one. Candidate counts: 27 in app-shell.js, 6 in splash.js (33 total) via the standard token set — well within the "check first" budget, sweep was worth running.

## Mutation sweep
Same generic masker/detector set as Agents 208-210: `===`/`!==`, `>=`/`<=`, `||`/`&&`, `true`/`false` word-flips, unary `!` removal. **Deliberate scope note:** bare `>`/`<` was *not* applied as a blind global regex to these two files, because both are markup-heavy (inline SVG `<path>`, `<svg>`, and HTML template strings for nav/splash markup) — a naive global `>`/`<` flip mutates tag delimiters inside string literals, not real comparisons, producing dozens of noise mutants unrelated to actual logic. Instead the genuine numeric-comparison sites were hand-identified and added explicitly: `ROOT.length>1` and `i<ROUTES.length` in app-shell.js, `.length>2` in splash.js (3 sites, one per real bare comparison in either file — confirmed there are no others by reading both files in full).

Driver script written fresh this pass (no prior generator script was found bundled in the repo — `mutate.js`, not part of deliverable, lives only in this agent's scratch dir): for each candidate, mutate in place, run `node tests/run.js`, record pass/fail, restore original before the next mutant. `Math.max`/`Math.min`, `.trim()`/`.toLowerCase()`/`.toUpperCase()`, and `+=1`/`-=1` classes: zero candidates in either file (confirmed via count, not skipped).

**Result: app-shell.js — 27 auto mutants + 2 hand-added bare-comparison mutants = 29, all 29 killed, 0 survived. splash.js — 6 auto mutants + 1 hand-added bare-comparison mutant = 7, all 7 killed, 0 survived. Combined: 36 runnable mutants → 36 killed, 0 survived, 0 syntax-invalid.**

Both files confirmed byte-identical (md5) to the pre-sweep originals after every mutant restore and at sweep end. No fix needed, no new tests needed — the existing Agent 176/177 behavioral suites already pin every mutated branch.

## Files reviewed with no bug found
`shared/js/app-shell.js` — full file (ROOT resolution/try-catch, TABS/ROUTES tables, `activeKey()` route matching incl. root-path short-circuit, `build()`'s active-tab class/aria-current templating, `mount()` idempotency guards, `bindPressAnimation()` press/release state machine, `setVisible()` ternaries, readyState gate).
`shared/js/splash.js` — full file (`iconUrl()` script-URL resolution + pathname-depth fallback, sessionStorage try/catch marker check, `mount()` dedupe guard, readyState gate).

## Tests: 939 -> 939 (no change — no gap found to close)

## Cache / pack
Neither file is referenced in `offline/core-manifest.json` in a way that changed (unchanged by this pass; not touched). `CACHE_VERSION` unchanged; `offline/packs/*.zip` untouched. No code changes at all this pass.

## Files changed vs Agent 210 zip
None. `app-shell.js` md5 `aa758d23268904b2f63c2fbfd131a98d`, `splash.js` md5 `0ee21becea6d6b2b3303fb83683c9408` — both confirmed identical before and after the sweep. `tests/run.js` unchanged.

## Not done / carried forward
- Decision-gated backlog (unchanged, still blocked on product decisions): `normalizeQuestion`/`normalizeQuiz`/`normalizeHierarchy` throwing on malformed input; Pages' duplicate `readProgress` copies; `calculateSkillProfile`/`resolvePlacement`/`calculateResult`/`normalizeLevel`/`readStored`/validation-tautology observations (full list carried in Agent 203/210 notes).
- The Agent 207 five-file list plus app-shell.js/splash.js are now **all** confirmed under the current generic generator. No file in `shared/js/` is known to be both untested-for-mutations and unchecked at this point, to this agent's knowledge — a fresh full-directory listing against a running tally would be needed to state that with full confidence (not done this pass; see next steps).

## Next agent — start here
1. No specific file is flagged as "known unswept" anymore. Worth doing before inventing new work: `ls shared/js/*.js` and cross-check against handoff history (`grep -l "mutation sweep\|mutation-swept\|mutant" HANDOFF_AGENT_*.md`) to build one canonical list of which files have and haven't had a generic-generator pass — this has been tracked ad hoc across many handoffs (207, 208, 209, 210, this one) and could drift or have gaps that aren't obvious from any single handoff.
2. Otherwise, work the decision-gated backlog if a product decision has arrived (unchanged, see above).
3. Methodology note for whoever does the next sweep: when a target file contains embedded HTML/SVG/template-string markup, don't blindly regex bare `>`/`<` across the whole file — check for tag delimiters first (`grep -c '<[a-zA-Z/]'`) and hand-pick the real numeric/relational comparisons instead, as done this pass. Applying the naive version would still technically be "runnable" and would likely still get killed (markup-parsing tests are broad here), but it manufactures noise rather than rigor and wastes runtime.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call).

## Artifacts
`mylingo-v183-agent211-appshell-splash-mutation-sweep.zip`, `HANDOFF_AGENT_211.md`.

## Resume command
"Resume from HANDOFF_AGENT_211.md. You are Agent 212. Continue from 'Next agent — start here'."
