----- BEGIN HANDOFF PACKAGE -----
AGENT: 16
DATE: 2026-09-24
STEP: 14 follow-up — dedicated publish directory (dist) so repo internals are never served. Done (static).
STATUS: 960/960 tests (also green with a locally built dist/). Built dist: 240 files, SW precache 90, 22 pages × online+offline 44/44 clean, tests/tools/handoffs/netlify.toml/.github all 404 locally. Egress still CLOSED (axe/Lighthouse not re-run; last run Agent 14).

## ENVIRONMENT NOTE
Egress closed (npm registry returns x-deny-reason host_not_allowed). Global Playwright 1.56 + Chromium at /home/claude/.npm-global/lib/node_modules/playwright; Node 22. Audit scripts in tools/a11y/ (Agent 15). Preview the publish dir: `node tools/build-dist.js /tmp/dist && cd /tmp/dist && python3 -m http.server 8766`.

## DONE THIS TURN
1. tools/build-dist.js (new): runtime files only, byte-for-byte, into dist/ (root index.html/manifest.json/sw.js/robots.txt/sitemap.xml? + all top-level folders except tests tools .github .git node_modules dist; no *.md). plan()/build() exported; refuses to write over/into the repo root.
2. netlify.toml: publish="dist", command="node tools/build-dist.js"; removed dead /tests/* /tools/* 404 redirects and *.md X-Robots-Tag. Headers/CSP/cache untouched.
3. .github/workflows/deploy.yml: both deploy jobs setup-node 22 + build, publish-dir 'dist'. .gitignore (new): dist/.
4. tests/run.js: +1 test (960): composition, byte identity, reference integrity, safety guard, config pins; walkers now skip dist/.
5. DEPLOY.md + STATE.md updated. No page, pack, sw.js or core.zip changes (byte-identity groups intact).

## VERIFICATION
960/960 (with and without dist/); refcheck 1,619 asset references, 0 missing from dist; dist online+offline sweep 44/44, 0 errors; precache 90; excluded paths 404.

## OPEN
- UNVERIFIED until a real deploy: Netlify runs the build and serves dist with headers intact; the GitHub Actions workflow has never run.
- Re-run axe-core + Lighthouse when egress opens (esp. courses/lesson.html; Lighthouse against the deployed dist URL).
- CSP 'unsafe-inline' removal (33 onclick=, 91 style= attributes) — optional refactor.
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>` (writes sitemap.xml at repo root; build-dist ships it), verify headers live.
- Unaudited: real drag/drop ranking/matching, TTS in use, screen readers/devices/zoom, quiz results beyond the sampled set.
- Standing: git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Check egress fresh. If open: install axe-core + lighthouse outside the tree, re-run the full sweep against a built dist (22 pages × light/dark × 390/1280/320; lesson.html with seeded progress).
2. Ask the person for the git remote, Netlify account/site and domain (or accept the netlify.app URL) — nothing deploy-related is unblocked without them.
3. Optional: CSP hardening refactor (move inline handlers/styles to files, then drop 'unsafe-inline'; keep byte-identity groups, rebuild core.zip + level packs, update the SW/pack tests).
4. If you add a runtime file outside an existing top-level folder, add it to ROOT_FILES in tools/build-dist.js (test enforces pages/manifest coverage).

## ASSUMPTIONS
None beyond stated; all numbers tool-run this turn.

## ARTIFACTS
app-production-agent16.zip; STATE.md; HANDOFF_PACKAGE_AGENT16.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 17. Steps 9, 10, 14 (incl. dedicated publish directory via tools/build-dist.js) and 15 are done: 960/960 tests, dist verified locally online+offline. Remaining work is deploy-gated (repo, Netlify build/serve of dist, domain, devices) or optional (CSP hardening, axe/Lighthouse re-run when egress opens). NOTE lesson.html is light-only (no theme.css); quiz tests need &recommended=1. Check network egress fresh; ask the person for the git remote/Netlify/domain."
----- END HANDOFF PACKAGE -----
