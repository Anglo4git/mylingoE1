----- BEGIN HANDOFF PACKAGE -----
AGENT: 17
DATE: 2026-09-24
STEP: CSP hardening — script-src no longer needs 'unsafe-inline' (SHA-256 hashes of inline scripts). Done (static).
STATUS: 961/961 tests. Local CSP browser sweep: 0 violations (46 page loads, light+dark, with quiz/placement interaction); control without hashes: 46/46 pages violate (harness works). Egress still CLOSED (axe/Lighthouse last run Agent 14).

## KEY FACTS
- The "33 onclick= attributes" in SECURITY.md/Step 5 were `.onclick=` JS property assignments — never blocked by CSP. There are 0 inline handler attributes and 0 javascript: URLs (test-pinned).
- MAINTENANCE RULE: after editing ANY inline <script> block in any page, run `node tools/build-csp.js` (rewrites netlify.toml). The test suite ("CSP is stale") and the CI test job fail otherwise. A stale hash = that page's script is blocked in production.
- Publish dir is dist/ (Agent 16, tools/build-dist.js). lesson.html is light-only (no theme.css). Quiz tests need &recommended=1.

## ENVIRONMENT NOTE
Egress closed (registry 403 host_not_allowed). Global Playwright 1.56 + Chromium; Node 22. Audit scripts in tools/a11y/. CSP harness idea: tiny node static server sending the policy read from netlify.toml + a `securitypolicyviolation` listener (addInitScript); build dist first with `node tools/build-dist.js /tmp/dist`.

## DONE THIS TURN
1. tools/build-csp.js (new): hashes → netlify.toml CSP; `--check`. 16 distinct hashes. style-src still 'unsafe-inline'; all other directives/headers unchanged.
2. tests/run.js: +1 test (961), mutation-checked.
3. SECURITY.md, DEPLOY.md, netlify.toml comment updated. No page/pack/sw.js/core.zip changes.

## VERIFICATION
961/961; `node tools/build-csp.js --check` OK; local CSP sweep 0 violations / 0 page errors; control 46/46 violations; byte-identity groups intact (no page touched).

## OPEN
- UNVERIFIED until a real deploy: Netlify build + dist + headers (incl. the hash CSP); GitHub Actions never run.
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; against deployed dist).
- Optional: style-src hardening (91 style="" attributes + <style> blocks) — low value/high churn.
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: real drag/drop ranking/matching, TTS in use, screen readers/devices/zoom, quiz results beyond the sampled set.
- Standing: git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Check egress fresh. If open: install axe-core + lighthouse outside the tree; run the full sweep against a built dist served WITH the netlify.toml CSP header (so any CSP-related regression shows up).
2. Ask the person for the git remote, Netlify account/site and domain (or accept the netlify.app URL) — nothing deploy-related is unblocked without them.
3. If you edit an inline <script>: `node tools/build-csp.js`; if you touch any of the 22 pages keep byte-identity groups and rebuild core.zip + affected level packs (in-place entry replacement).

## ASSUMPTIONS
None beyond stated; all numbers tool-run this turn.

## ARTIFACTS
app-production-agent17.zip; STATE.md; HANDOFF_PACKAGE_AGENT17.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 18. Steps 9, 10, 14 (incl. dist publish directory) and 15 are done, and script-src no longer uses 'unsafe-inline' (hashes via tools/build-csp.js; re-run it after editing any inline <script>): 961/961 tests. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices), axe/Lighthouse re-run when egress opens, or optional style-src hardening. Check network egress fresh; ask the person for the git remote/Netlify/domain."
----- END HANDOFF PACKAGE -----
