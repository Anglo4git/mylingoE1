----- BEGIN HANDOFF PACKAGE -----
AGENT: 20
DATE: 2026-09-24
STEP: Fresh re-verification of Agent 19's release gate. No code changes — every open item is deploy-gated or egress-gated and neither became available this turn.
STATUS: 963/963 tests; verify-all (full, with browser sweep): ALL GATES PASSED (suite, CSP check, dist byte-identity 240 files, CSP+SW+offline sweep 108 loads / 0 problems). Egress re-checked directly (raw HTTP to registry.npmjs.org) — still CLOSED (403).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep).
- After editing ANY inline <script>: `node tools/build-csp.js`.
- Publish dir is dist/. lesson.html is light-only. Quiz tests need &recommended=1.

## DONE THIS TURN
1. Unzipped Agent 19's package fresh (not reusing any prior working directory) and re-ran the full local release gate from scratch — same numbers Agent 19 reported, confirming the release is reproducible, not an artifact of one session.
2. Re-checked egress independently of npm (raw `http.request` to `registry.npmjs.org:80`) — 403, still closed.
3. STATE.md updated with this turn's entry. No page/pack/sw.js/core.zip/netlify.toml/tools/ changes.

## OPEN (unchanged from Agent 19 — nothing became actionable this turn)
- UNVERIFIED until a real deploy: Netlify build + dist + hash-CSP headers; GitHub Actions never run (optionally add verify-all --quick to CI).
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; deployed dist).
- Optional style-src hardening (low value/high churn — declined again this turn, see STATE.md for reasoning).
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: drag/drop ranking/matching, TTS, screen readers/devices/zoom.
- Standing (still not provided by the person): git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Check egress fresh (don't trust a cached result — use a raw request, not just npm, as npm's own error can be misleading).
2. Ask the person for git remote, Netlify account/site, domain (or netlify.app URL) — this is the actual blocker now, not code.
3. If egress is open: install axe-core + lighthouse outside the tree and sweep a built dist served with the netlify.toml CSP.
4. Run tools/verify-all.js before delivering, regardless of what changed.

## ASSUMPTIONS
None. All numbers tool-run this turn from a fresh unzip.

## ARTIFACTS
app-production-agent20.zip; STATE.md; HANDOFF_PACKAGE_AGENT20.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 21. Steps 9, 10, 14, 15, hash CSP, its SW verification, and the local release gate (tools/verify-all.js) are all done and re-confirmed twice now (Agents 19 and 20): 963/963 tests, full gate passes from a clean unzip. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices) or egress-gated (axe/Lighthouse). Check network egress fresh with a raw request; ask the person for the git remote/Netlify/domain before attempting more code changes — there is nothing left to build blind."
----- END HANDOFF PACKAGE -----
