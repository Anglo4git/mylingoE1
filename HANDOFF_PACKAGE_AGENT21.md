----- BEGIN HANDOFF PACKAGE -----
AGENT: 21
DATE: 2026-09-24
STEP: CI test job upgraded from `node tests/run.js` to `node tools/verify-all.js --quick` — closes the one open item from Agent 19 that needed neither a deploy target nor egress. Done.
STATUS: 963/963 tests; verify-all (full, with browser sweep): ALL GATES PASSED (suite, CSP check, dist byte-identity 240 files, CSP+SW+offline sweep 108 loads / 0 problems). Egress re-checked fresh (raw HTTP to registry.npmjs.org) — still CLOSED (403).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep — this is now also what CI runs, sans NODE_PATH, since --quick needs no Playwright).
- After editing ANY inline <script>: `node tools/build-csp.js`.
- Publish dir is dist/. lesson.html is light-only. Quiz tests need &recommended=1.

## DONE THIS TURN
1. `.github/workflows/deploy.yml`: `test` job now runs `node tools/verify-all.js --quick` (unit suite + CSP staleness + dist byte-identity) instead of just `node tests/run.js`. No install step needed (`--quick` never touches Playwright — confirmed by reading tools/verify-all.js). Deploy jobs/secrets/triggers untouched.
2. `DEPLOY.md` updated to match (CI section + an Agent 21 note on why `--quick` in CI, not the full sweep).
3. `STATE.md` updated. Re-ran the full local gate after the edit (workflow/docs aren't shipped, so dist byte-identity was unaffected, confirmed at 240 files).
4. No page, pack, sw.js, core.zip, or netlify.toml changes.

## OPEN (unchanged — nothing else became actionable this turn)
- UNVERIFIED until a real deploy: this workflow (including the new step) has never actually run — no GitHub repo exists yet. It's config, not an observed result.
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; deployed dist).
- Optional style-src hardening (91 `style=""` attrs + `<style>` blocks) — still assessed low value/high churn, declined again.
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: drag/drop ranking/matching, TTS, screen readers/devices/zoom.
- Standing (still not provided by the person): git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Check egress fresh with a raw request (not just npm).
2. Ask the person for git remote, Netlify account/site, domain (or netlify.app URL) — this is the real blocker now. Almost everything reachable without it or without egress has been done across Agents 16–21.
3. If egress is open: install axe-core + lighthouse outside the tree and sweep a built dist served with the netlify.toml CSP; also consider whether Playwright should become a real devDependency so CI can run the full sweep instead of `--quick`.
4. Run tools/verify-all.js before delivering, regardless of what changed.

## ASSUMPTIONS
None. All numbers tool-run this turn.

## ARTIFACTS
app-production-agent21.zip; STATE.md; HANDOFF_PACKAGE_AGENT21.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 22. Steps 9, 10, 14, 15, hash CSP, its SW verification, the local release gate, and now CI running that gate (`--quick`) are all done. 963/963 tests, full local gate passes. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices) or egress-gated (axe/Lighthouse). Check network egress fresh with a raw request; ask the person for the git remote/Netlify/domain before attempting more code changes."
----- END HANDOFF PACKAGE -----
