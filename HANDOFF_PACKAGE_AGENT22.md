----- BEGIN HANDOFF PACKAGE -----
AGENT: 22
DATE: 2026-09-24
STEP: Found and fixed a packaging defect in Agent 21's deliverable — `.github/workflows/deploy.yml` and `.gitignore` were missing from app-production-agent21.zip, so a clean unzip failed the suite (962/963). Restored both, added a pin test, re-ran the full gate. Done.
STATUS: 964/964 tests; verify-all (full, with browser sweep): ALL GATES PASSED (suite, CSP check, dist byte-identity 240 files, CSP+SW+offline sweep 108 loads / 54 offline 200 / 0 problems). Egress re-checked fresh (raw HTTP to registry.npmjs.org) — still CLOSED (403 host_not_allowed).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep; CI runs `--quick`).
- After editing ANY inline <script>: `node tools/build-csp.js`.
- Publish dir is dist/. lesson.html is light-only. Quiz tests need &recommended=1.
- PACKAGING RULE (new): the archive must include dotfiles. Use `zip -r -X out.zip . -x '.git/*' 'dist/*' 'node_modules/*'` (never `zip -r out.zip *`), then unzip into a fresh directory and run `node tools/verify-all.js --quick` there BEFORE delivering. Agent 21 verified its working directory, not its zip.

## DONE THIS TURN
1. Clean unzip of Agent 21's zip + `verify-all.js` -> FAIL 962/1: "publish directory (Agent 16)" ENOENT `.github/workflows/deploy.yml`. `unzip -l` confirmed no `.github/` and no `.gitignore` in the archive.
2. `.github/workflows/deploy.yml` RECONSTRUCTED (no surviving copy anywhere): jobs `test` (checkout, setup-node 22, `node tools/verify-all.js --quick`), `deploy-preview` (PR only) and `deploy-production` (push to main), both `needs: test`, Node 22, `node tools/build-dist.js`, `nwtgck/actions-netlify@v3`, publish-dir 'dist', secrets NETLIFY_AUTH_TOKEN / NETLIFY_SITE_ID. Anything the docs never recorded (action version, alias/message text, permissions block) is my choice — review before the first real run. File header says it is reconstructed.
3. `.gitignore` recreated (`dist/`).
4. `tests/run.js` +1 (964): one `--quick` gate step, no plain `node tests/run.js` step, both deploy jobs `needs: test`, three jobs, `.gitignore` present, no dotfile shipped in dist. Mutation-checked (old step -> 963/1; missing .gitignore -> 962/2).
5. STATE.md and DEPLOY.md updated. No page, pack, sw.js, core.zip or netlify.toml changes.

## OPEN (unchanged — nothing else became actionable)
- UNVERIFIED until a real deploy: the workflow has never run (no GitHub repo/secrets) and its text is now a reconstruction, not the original.
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; deployed dist).
- Optional style-src hardening (91 `style=""` attrs + `<style>` blocks) — still declined (low value / high churn).
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.
- Unaudited: drag/drop ranking/matching, TTS, screen readers/devices/zoom.
- Standing (still not provided by the person): git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Unzip this package into a FRESH directory and run `node tools/verify-all.js --quick` there first (confirms the dotfiles are present).
2. Check egress fresh with a raw request (not just npm).
3. Ask the person for git remote, Netlify account/site, domain (or netlify.app URL) — the real blocker. Nearly everything reachable without it or without egress has been done across Agents 16–22.
4. If egress is open: install axe-core + lighthouse outside the tree and sweep a built dist served with the netlify.toml CSP; consider making Playwright a real devDependency so CI can run the full sweep.
5. Run tools/verify-all.js before delivering, and package with the PACKAGING RULE above.

## ASSUMPTIONS
- The workflow text is reconstructed (see DONE 2). The cause of the missing dotfiles (a `*` glob in the zip command) is inferred, not observed. All test/gate numbers were tool-run this turn.

## ARTIFACTS
app-production-agent22.zip; STATE.md; HANDOFF_PACKAGE_AGENT22.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 23. Steps 9, 10, 14, 15, hash CSP, its SW verification, the local release gate, CI running that gate (`--quick`), and the restored/pinned workflow + .gitignore are done. 964/964 tests, full local gate passes. Remaining work is deploy-gated (repo, Netlify build/serve of dist + headers, domain, devices) or egress-gated (axe/Lighthouse). Unzip into a fresh dir and run verify-all --quick first; check egress fresh with a raw request; ask the person for the git remote/Netlify/domain before attempting more code changes."
----- END HANDOFF PACKAGE -----
