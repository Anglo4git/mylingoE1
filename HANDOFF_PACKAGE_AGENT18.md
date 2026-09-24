----- BEGIN HANDOFF PACKAGE -----
AGENT: 18
DATE: 2026-09-24
STEP: CSP verification with service worker active (static/local). Done.
STATUS: 962/962 tests. `node tools/build-csp.js --check` OK. Egress still CLOSED (registry 403 host_not_allowed); axe/Lighthouse last run Agent 14.

## KEY FACTS
- After editing ANY inline <script>: `node tools/build-csp.js` (a stale hash blocks that page's script in production; the suite fails too).
- Publish dir is dist/ (tools/build-dist.js). lesson.html is light-only (no theme.css). Quiz tests need &recommended=1.
- New: `NODE_PATH=$(npm root -g) node tools/csp-sweep.js` (real SW + offline + exact netlify.toml CSP); `--no-hashes` is the control and must fail.

## DONE THIS TURN
1. tools/csp-sweep.js (new, not shipped).
2. tests/run.js +1 (962), mutation-checked.
3. SECURITY.md section; STATE.md rewritten head. No page/pack/sw.js/core.zip/netlify.toml changes.

## VERIFICATION
962/962; sweep 108 loads, 0 CSP violations, 0 console CSP errors, 0 page errors, offline 54/54 = 200; control 108/108 problems.

## OPEN
- UNVERIFIED until a real deploy: Netlify build + dist + headers (hash CSP); GitHub Actions never run.
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; against deployed dist).
- Optional style-src hardening (91 style="" + <style>) — low value/high churn.
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: real drag/drop ranking/matching, TTS in use, screen readers/devices/zoom.
- Standing: git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Check egress fresh. If open: install axe-core + lighthouse outside the tree; run the full sweep against a built dist served with the netlify.toml CSP (tools/csp-sweep.js shows how).
2. Ask the person for git remote, Netlify account/site and domain (or accept the netlify.app URL).
3. If you edit an inline <script>: `node tools/build-csp.js`; if you touch any of the 22 pages keep byte-identity groups and rebuild core.zip + affected level packs.

## ASSUMPTIONS
None beyond stated; all numbers tool-run this turn.

## ARTIFACTS
app-production-agent18.zip; STATE.md; HANDOFF_PACKAGE_AGENT18.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 19. Steps 9, 10, 14 and 15 are done; script-src uses hashes (tools/build-csp.js) and is verified with the service worker active (tools/csp-sweep.js): 962/962 tests. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices), axe/Lighthouse re-run when egress opens, or optional style-src hardening. Check network egress fresh; ask the person for the git remote/Netlify/domain."
----- END HANDOFF PACKAGE -----
