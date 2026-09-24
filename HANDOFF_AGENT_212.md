# Agent 212 Handoff — canonical shared/js sweep-status inventory built (all 20 files confirmed swept); sw.js mutation-swept for the first time (real gap: non-ok network responses could be cached, plus an unpinned fallback-HTML byte), 2 tests added closing all real gaps; 939 -> 954 tests

## Context
Picked up `HANDOFF_AGENT_211.md` item 1: build one canonical list of which files have/haven't had a generic-generator mutation pass, since this has been tracked ad hoc across ~15 handoffs and could have silent gaps.

## Part 1 — canonical shared/js/ sweep-status inventory
Cross-referenced all 20 files in `shared/js/` against every `HANDOFF_AGENT_*.md` mentioning "mutation" (grep + manual read of the actual result lines, not just name co-occurrence — most files are mentioned in unrelated backlog-list sentences too, so name-matching alone is noisy). Result: **every one of the 20 `shared/js/*.js` files has a documented, corrected-criterion mutation sweep with a concrete kill count.** Specifically:

| file | swept by | result |
|---|---|---|
| app-shell.js | Agent 211 | 29/29 killed |
| authoring-draft-autosave.js | Agent 210 | 56/56 killed |
| authoring-validation.js | Agent 208 | confirmed clean |
| canonical-metadata.js | Agent 204 | swept (part of runtime-v2-adapter.js pass) |
| course-progress.js | Agent 199, corrected by Agent 200 | 84 mutants, real gaps closed |
| gamification.js | Agent 205 (backup half, 293/293) + Agent 206 (non-backup half, 66/66) | both halves 0 survived |
| learner-state.js | Agent 206 | 150/150 after closing 46 real gaps |
| level-lock.js | Agent 198, corrected by Agent 200 | 69 mutants, gaps closed |
| mastery-review-ui.js | Agent 202 | 106 mutants, 7 equivalent survivors |
| offline-packs-ui.js | Agent 204 | 212 mutants, 38 survivors (mostly cosmetic/equivalent, real gaps closed) |
| offline-packs.js | Agent 204 | 234 mutants, 19 survivors (2 real gaps closed, rest equivalent) |
| orientation.js | Agent 203 | 178 mutants (63 in a QUESTIONS literal covered by a hash pin instead), rest closed/equivalent |
| placement.js | Agent 203 | 713 mutants, gaps closed, 51 equivalent remain |
| quiz-packer.js | Agent 209 | gaps closed, 6 equivalent remain |
| recommendations.js | Agent 202 | 116 mutants, 13 equivalent survivors |
| review-scheduler.js | Agent 201 | 138 mutants, 26 real gaps closed, 16 equivalent remain |
| runtime-content-loader.js | Agent 207 | 1 real gap closed, 1 equivalent |
| runtime-v2-adapter.js | Agent 204 | 402 mutants, 12 equivalent survivors |
| safe-url.js | Agent 203 | swept clean |
| skill-mastery.js | Agent 201 | 94 mutants, 14 real gaps closed, 8 equivalent remain |
| splash.js | Agent 211 | 7/7 killed |

Also checked page-level inline `<script>` blocks (not `shared/js/`, but the same kind of untested-logic risk): per Agents 176-188's own inventory table, every page with a non-trivial inline script (`<level>/index.html` ×6, `<level>/dashboard.html` ×6, `courses/{index,course,journey,lesson}.html`, `main/{index,progress}.html`, root `index.html`, `main/placement.html`) has been run for real against a harness and/or hand-mutated. `main/practice.html` is a pure static redirect (no logic to sweep).

**Conclusion: `shared/js/` and every page's inline script are fully covered.** The Agent-207-era backlog of "unswept files" is closed. This directory-level inventory should stand until a new file is added or a file is meaningfully rewritten — no need to re-derive it from scratch again.

## Part 2 — sw.js (the one file with NO dedicated section anywhere) mutation-swept for the first time
`sw.js` lives outside `shared/js/`, so it wasn't on the older per-directory checklists, and no handoff shows a dedicated sweep for it (only two generic tests existed: one fetch-routing behavioral test and the `CACHE_VERSION` string/core.zip-identity tests). 27 candidate mutants (pure JS, no markup noise — no scope exclusion needed).

**`sw.js` is a core-manifest file**, so a naive sweep falsely "kills" every mutant via the `offline/packs/core.zip contains exactly the manifest files, byte-identical to source` identity check (the exact false-kill bug Agents 199-206 documented for other core-pack files). Reused their corrected criterion: a mutant only counts as killed if a test *other than* that identity check also fails. First corrected pass: **27 mutants → only 5 genuinely killed, 22 survived** — most of `sw.js`'s logic (activate's cache-cleanup filter, `offlineFallbackResponse`'s document/json branches, `cacheFirst`'s full cached/network paths, `coreManifestUrls` validation, the navigate/JSON/immutable-asset fetch routes) had zero real test coverage.

Added a new section "sw.js: install/activate lifecycle + fetch routing strategies (Agent 212 mutation-sweep hardening)" (14 tests) exercising, against a proper in-memory fake Cache Storage (not the old single-cache stub): `install`'s manifest fetch/validation/`addAll`/`skipWaiting` sequencing and its 4 malformed-manifest rejection shapes; `activate`'s cache-cleanup filter (protects every `PACK_CACHE_PREFIX` cache, protects unrelated caches, deletes only stale `mylingo-v*` shell caches, still calls `clients.claim()` on an empty list); every `fetch` route (non-GET/cross-origin pass-through, navigate-or-document network-first with online caching + offline fallback-HTML + cached-copy-wins-over-fallback, `.json` network-first with the synthetic error body, cache-first for immutable assets both with and without a pre-cached copy, the generic empty-503 fallback for other kinds, unrecognized extensions passing through untouched).

Re-swept: **27 mutants → 23 killed, 4 survived.** Diagnosed each survivor:
- **2 real gaps**: `if (response && response.ok)` in both `cacheFirst` and `networkFirst` — no test exercised a non-ok (error) network response, so nothing proved a 404/500 is never written into the cache (a `&&`→`||` mutant here would start caching error pages as if they were good content). Added one test asserting a non-ok response is still returned to the caller but never cached, in both strategies.
- **1 real-but-cosmetic gap**: the synthetic offline HTML page's literal `<!doctype html>` was unpinned (only the "You're offline" text and status/content-type were checked). Added a `startsWith('<!doctype html>')` assertion.
- **1 genuine equivalent**: a `!` inside the file's opening `/*! ... */` doc comment. Removing it still leaves a syntactically valid, semantically identical comment — no test can or should distinguish `/*!` from `/*` since neither affects runtime behavior.

Final re-sweep: **27 mutants → 26 killed, 1 documented equivalent.** `sw.js` confirmed byte-identical (md5 `14350c32da468b413655fc6ac4d3f743`) to its pre-sweep original throughout — only `tests/run.js` changed.

## Tests: 939 -> 954 (+15, all in the new sw.js section: 13 initial behavioral tests + 1 non-ok-response-not-cached test + the doctype assertion folded into the existing offline-fallback test, no separate count)

## Cache / pack
No source file changed (`sw.js` untouched). `CACHE_VERSION` stays `mylingo-v27`. `offline/packs/core.zip` untouched and still passes its byte-identity test (confirmed: full suite is 954 passed / 0 failed with `sw.js` unmodified).

## Files changed vs Agent 211 zip
`tests/run.js` only — new "sw.js: install/activate lifecycle + fetch routing strategies" section inserted right after the existing offline-precache/core.zip-identity block and before the `quiz.html end()` section. No `shared/js/*` or page file touched.

## Not done / carried forward
- Decision-gated backlog (unchanged, still blocked on product decisions): `normalizeQuestion`/`normalizeQuiz`/`normalizeHierarchy` throwing on malformed input; Pages' duplicate `readProgress` copies; `calculateSkillProfile`/`resolvePlacement`/`calculateResult`/`normalizeLevel`/`readStored`/validation-tautology observations (full list carried in Agent 203/210/211 notes).
- The mutation-sweep methodology's `mutate.js` driver (this pass's version, with the `CORE_PACK_MODE` identity-failure-discount flag) lives only in this agent's scratch dir, not the shipped tree — same as every prior agent's sweep tooling. Worth considering whether a `tools/mutate.js` should be checked into the repo itself so the identity-aware logic doesn't get silently rebuilt (and possibly re-broken) by every future agent.

## Next agent — start here
1. With `shared/js/`, all page inline scripts, and now `sw.js` all confirmed swept, there is no more low-hanging "was this file ever mutation-tested" work in this codebase's JS surface, to this agent's knowledge. Two honest paths forward:
   (a) Re-open the *equivalent-survivor* lists left by 203/204/207/208/209/210 (e.g. placement.js's 51, offline-packs-ui.js's 38, offline-packs.js's 19, gamification.js's — wait, gamification has 0 — orientation.js's, mastery-review-ui.js's 7, recommendations.js's 13, skill-mastery.js's 8, review-scheduler.js's 16, runtime-v2-adapter.js's 12, runtime-content-loader.js's 1) and re-verify a sample are still genuinely equivalent rather than assumed — these were mostly verified by hand at the time, but it's been many passes since some of them.
   (b) Work the decision-gated backlog if a product decision has arrived.
2. If picking up (a): don't re-sweep from scratch — re-read each file's specific handoff (203, 204, 207, 208, 209, 210) for the exact equivalence argument given at the time, and spot-check 2-3 per file by hand-applying the mutation and confirming the reasoning still holds against the CURRENT test suite (which has grown since some of those passes).
3. Methodology note carried forward: any core-manifest file (check `offline/core-manifest.json`) needs the identity-failure-discount treatment before its sweep results mean anything — `sw.js` was nearly mis-reported as 100% killed for exactly this reason on the first pass this turn.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call).

## Artifacts
`mylingo-v183-agent212-swjs-mutation-sweep.zip`, `HANDOFF_AGENT_212.md`.

## Resume command
"Resume from HANDOFF_AGENT_212.md. You are Agent 213. Continue from 'Next agent — start here'."
