----- BEGIN HANDOFF PACKAGE -----
AGENT: 13
DATE: 2026-09-24
STEP: 14 (SEO/meta) done as far as possible without a domain; 15 (offline integrity) verified with a real offline navigation test.
STATUS: 957/957 tests. Offline: 22/22 pages load from the service worker with the network off (0 errors). Lighthouse re-sweep: perf ≥0.95, a11y 1.0, BP 1.0, CLS 0.000; SEO 1.0 on 14 pages, 0.63–0.66 on the 8 intentionally noindex pages.

## ENVIRONMENT NOTE
Egress open. Tooling outside the tree at /home/claude/lh (lighthouse, chrome-launcher, axe-core; playwright is global). Start the static server in the SAME command as each run, from the tree root: `cd <tree> && (setsid python3 -m http.server 8765 >/dev/null 2>&1 < /dev/null &)`. Long sweeps: `setsid nohup sh -c '...' &` then poll; single calls time out at 300s.

## DONE THIS TURN
1. robots.txt (Allow /, Disallow /tests/ and /tools/). `tools/build-sitemap.js <https-origin>` writes sitemap.xml + the Sitemap: line once a domain exists (validates input; tested).
2. OG + twitter:card=summary on index.html and main/index.html (identical text, per the root/main identity test). No og:image/og:url/canonical (need an absolute URL).
3. `noindex` meta on the 6 dashboards (still byte-identical), main/progress.html, shared/quiz.html, main/practice.html. INTENTIONAL TRADE-OFF: Lighthouse SEO is now 0.63–0.66 on these 8 pages (`is-crawlable`); do not "fix" it by removing noindex without a decision.
4. netlify.toml: `publish="."` exposes tests/, tools/ and ~100 handoff .md files. Added 404 redirects for /tests/* and /tools/* and X-Robots-Tag noindex on /*.md. UNVERIFIED until a real deploy; no 404.html exists (Netlify default should apply). Proper fix = dedicated publish dir (not attempted).
5. Real offline test (Playwright, SW registered, `setOffline(true)`): precache 90 entries; 22/22 pages OK offline; a1/index shows 23 cards offline.
6. Tests +1 (957). core.zip + 6 level packs rebuilt (in-place entry replacement); zip test passes. `LIGHTHOUSE_RESULTS_AGENT13.json` added.

## VERIFICATION
957/957; Lighthouse 22 pages (see STATUS); Playwright status/console sweep 22/22; style= count 91; level index ×6 one md5, dashboards ×6 one md5; diff vs Agent 12 limited to expected files. sw.js untouched.

## OPEN
- Domain-gated: canonical, og:image/og:url, run `node tools/build-sitemap.js https://<domain>`, submit in Search Console, re-run Lighthouse on the live URL.
- Verify the netlify.toml redirect/header additions after deploy (`curl -I https://<site>/tests/run.js`, `/STATE.md`).
- Dedicated publish directory (larger refactor) to stop serving repo internals at all.
- Optional Step 10 leftovers: forced-colors, 200% zoom, text-spacing, keyboard-only walkthrough, real screen readers.
- Standing: no git repo, Netlify account, domain, physical devices; CSP 'unsafe-inline' removal.

## NEXT AGENT — START HERE
1. Nothing further is fully unblockable without the person. Ask for: git remote, Netlify account/site, domain (or accept the netlify.app URL for sitemap/canonical).
2. Meanwhile, worthwhile static work: forced-colors + zoom + keyboard checks (Playwright `forcedColors:'active'`), the publish-directory split (copy only runtime files to a dist folder in CI; keep byte-identity + pack tests), or the CSP hardening refactor.
3. If you touch any of the 22 pages keep byte-identity groups (six level index, six dashboards, root vs main index) and rebuild core.zip + affected level packs.

## ASSUMPTIONS
None beyond stated; all numbers tool-run this turn.

## ARTIFACTS
app-production-agent13.zip; STATE.md; HANDOFF_PACKAGE_AGENT13.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 14. Steps 9, 10, 14 (static portion) and 15 (real offline test) are done: 957/957 tests, axe clean, Lighthouse a11y/BP 1.0, CLS 0, SEO 1.0 except 8 intentionally noindex pages, offline 22/22. Everything left is domain/repo/host/device gated except optional forced-colors/zoom/keyboard checks, a publish-directory split, and CSP hardening. Ask the person for the git remote, Netlify site and domain; then run tools/build-sitemap.js and verify the netlify.toml additions live. Check network egress fresh."
----- END HANDOFF PACKAGE -----
