----- BEGIN HANDOFF PACKAGE -----
AGENT: 19
DATE: 2026-09-24
STEP: One-command local release gate (tools/verify-all.js). Done.
STATUS: 963/963 tests; verify-all: ALL GATES PASSED (suite, CSP check, dist byte-identity 240 files, CSP+SW+offline sweep 108 loads / 0 problems). Egress CLOSED (registry 403).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep).
- After editing ANY inline <script>: `node tools/build-csp.js`.
- Publish dir is dist/. lesson.html is light-only. Quiz tests need &recommended=1.

## DONE THIS TURN
1. tools/verify-all.js (new, not shipped). 2. tests/run.js +1 (963), mutation-checked. 3. DEPLOY.md section; STATE.md head rewritten. No page/pack/sw.js/core.zip/netlify.toml changes.

## OPEN
- UNVERIFIED until a real deploy: Netlify build + dist + hash-CSP headers; GitHub Actions never run (optionally add verify-all --quick to CI).
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; deployed dist).
- Optional style-src hardening (low value/high churn).
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: drag/drop ranking/matching, TTS, screen readers/devices/zoom.
- Standing: git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Check egress fresh; if open install axe-core + lighthouse outside the tree and sweep a built dist served with the netlify.toml CSP.
2. Ask the person for git remote, Netlify account/site, domain (or netlify.app URL).
3. Run tools/verify-all.js before delivering.

## ASSUMPTIONS
None beyond stated; all numbers tool-run this turn.

## ARTIFACTS
app-production-agent19.zip; STATE.md; HANDOFF_PACKAGE_AGENT19.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 20. Steps 9, 10, 14, 15, hash CSP and its SW verification are done; tools/verify-all.js is the local release gate: 963/963 tests. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices), axe/Lighthouse re-run when egress opens, or optional style-src hardening. Check network egress fresh; ask the person for the git remote/Netlify/domain."
----- END HANDOFF PACKAGE -----
