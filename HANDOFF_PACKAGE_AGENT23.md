----- BEGIN HANDOFF PACKAGE -----
AGENT: 23
DATE: 2026-09-24
STEP: Verified Agent 22's zip from a clean unzip (964/964, full gate PASS), re-checked egress (still closed), and added tools/package.js + a pin test (965/965) so the dotfiles-missing-from-zip defect cannot recur. Done.
STATUS: 965/965 tests; verify-all (full, with browser sweep): ALL GATES PASSED (dist byte-identity 240 files; sweep 108 loads / 54 offline 200 / 0 problems). Egress: raw HTTPS to registry.npmjs.org -> 403 host_not_allowed (CLOSED).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep; CI runs `--quick`).
- After editing ANY inline <script>: `node tools/build-csp.js`.
- PACKAGE WITH THE TOOL: `NODE_PATH=$(npm root -g) node tools/package.js <out.zip>` (zip with dotfiles -> required-file check -> fresh unzip -> `verify-all --quick`). Never `zip -r out.zip *`.
- Publish dir is dist/. lesson.html is light-only. Quiz tests need &recommended=1.

## DONE THIS TURN
1. Fresh unzip of app-production-agent22.zip: dotfiles present; `verify-all --quick` 964/964 PASS; full gate PASS.
2. Egress re-checked with raw HTTPS: 403 host_not_allowed.
3. Reviewed the reconstructed `.github/workflows/deploy.yml`: consistent with its pins; unchanged; still never run.
4. NEW tools/package.js + test (965). Mutation-checked.
5. STATE.md, DEPLOY.md updated. No page/pack/sw.js/core.zip/netlify.toml/workflow changes.

## OPEN (unchanged)
- UNVERIFIED until a real deploy: workflow never run (no GitHub repo/secrets); its text is a reconstruction.
- axe-core + Lighthouse re-run when egress opens (esp. courses/lesson.html; deployed dist).
- Optional style-src hardening — still declined.
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: drag/drop ranking/matching, TTS, screen readers/devices/zoom.
- Standing blockers (person has not provided): git remote, Netlify account/site, domain, physical devices.

## NEXT AGENT — START HERE
1. Unzip into a FRESH directory; run `node tools/verify-all.js --quick` there.
2. Check egress fresh with a raw request.
3. Ask the person for git remote, Netlify account/site, domain (or netlify.app URL) — the real blocker; nearly everything reachable without it or egress is done (Agents 16–23).
4. If egress is open: install axe-core + lighthouse outside the tree, sweep a built dist served with the netlify.toml CSP; consider Playwright as a real devDependency so CI can run the full sweep.
5. Deliver via tools/package.js.

## ASSUMPTIONS
- Workflow text is a reconstruction (Agent 22). All numbers above were tool-run this turn.

## ARTIFACTS
app-production-agent23.zip; STATE.md; HANDOFF_PACKAGE_AGENT23.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 24. Steps 9, 10, 14, 15, hash CSP, its SW verification, the local release gate, CI running it (`--quick`), the restored/pinned workflow + .gitignore, and the clean-unzip packaging tool (tools/package.js) are done. 965/965 tests, full local gate passes. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices) or egress-gated (axe/Lighthouse). Unzip into a fresh dir and run verify-all --quick first; check egress fresh with a raw request; ask the person for the git remote/Netlify/domain before attempting more code changes."
----- END HANDOFF PACKAGE -----
