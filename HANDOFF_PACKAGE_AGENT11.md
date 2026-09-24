----- BEGIN HANDOFF PACKAGE -----
AGENT: 11
DATE: 2026-09-23
STEP: 9 — LIGHTHOUSE, closed for the static tree. Agent 10's last open item (label-content-name-mismatch) fixed.
STATUS: 954/954 tests. Real Lighthouse 13.5.0, all 22 pages, mobile: perf 0.93–1.0, a11y 1.0, best-practices 1.0, SEO 1.0, CLS 0.000, no runtime errors, no flagged layout-shift / unsized-images / label-content-name-mismatch audit on any page. Playwright console/status sweep 22/22 clean.

## ENVIRONMENT NOTE
Network egress open (as for Agent 10; it was closed for Agent 9 — check each turn). Lighthouse + chrome-launcher live OUTSIDE the tree (/home/claude/lh; reinstall with `npm i lighthouse chrome-launcher` if the sandbox reset), Playwright's Chromium (`/opt/pw-browsers/chromium-*/chrome-linux/chrome`, `--headless=new --no-sandbox`), pages served by `python3 -m http.server` from the tree root. A background server did not survive between tool calls: start it in the same command as the Lighthouse run. Static-file scores; Netlify headers/compression/HTTP2 not exercised.

## DONE THIS TURN
1. Removed `aria-label` from quiz cards (6 byte-identical `<level>/index.html`: `aria-label="Title, Status"`) and course cards (`courses/index.html`: `aria-label="Open Title course"`). Neither label contained the card's other visible text (WCAG 2.5.3 Label in Name), so voice-control users' spoken visible words would not match. A link without aria-label is named from its content, which contains all visible text; the status still reaches screen readers via the visible status text. Cost: longer SR names (more informative, more verbose).
2. Updated the 4 `tests/run.js` assertions that pinned the old labels (courses/index card content; `<level>/index.html` card content, the "accessible name is just ', Not started'" pin, and the quote-escape pin). They now assert no aria-label and keep the original intent (quote in a title can't break the href; untitled card is named by its visible status). Test count unchanged: 954/954.
3. Rebuilt `offline/packs/core.zip` (7 entries) and the six level packs (1 entry each) by in-place entry replacement; the project's byte-for-byte zip test passes.
4. Re-audited: a1/index, c2/index, courses/index, main/practice → label-content-name-mismatch gone. Full 22-page sweep re-run; raw results in `LIGHTHOUSE_RESULTS_AGENT11.json` (Agent 10's file kept for comparison). Lowest perf is shared/quiz.html (0.93–0.95 run to run, LCP ~2.7s) — unchanged, no fix attempted.
5. Checks: `grep -c 'style="'` still 91; six level index pages still one md5 (and six dashboards, from Agent 10); `diff -rq` vs Agent 10's tree = 7 HTML files (6 level index + courses/index), tests/run.js, 7 pack zips, STATE.md, this handoff, LIGHTHOUSE_RESULTS_AGENT11.json. sw.js untouched (documents are network-first; no CACHE_VERSION bump needed for HTML-only edits).

## OPEN / NOT FIXED
- Post-deploy Lighthouse: render-blocking, unminified JS/CSS, document-latency, cache and unused-JS insights are unweighted locally and depend on Netlify compression/caching headers — re-run against the live URL after a deploy.
- shared/quiz.html perf 0.93–0.95 (LCP ~2.7s): optional; not investigated.
- Dashboard LCP is ~2.0–2.4s (simulated) because of Agent 10's `main.pending` gate; accepted trade-off for CLS 0 with returning-learner data.
- Standing, need the person / real hardware: no git repo (Step 3 CI), no Netlify account / domain / live deploy (Steps 2–4), physical-device install-flow and rendering checks (Steps 7–8), CSP `'unsafe-inline'` removal (22 inline scripts, 91 `style=` attributes) recorded-not-attempted from Steps 5/6.

## NEXT AGENT — START HERE
1. Lighthouse work is done for the static tree; don't re-diagnose CLS or a11y names.
2. Unblock deploy: ask the person for (a) a git remote (GitHub/GitLab) so CI can be set up, (b) a Netlify account/site, (c) a domain or accept the netlify.app placeholder in DEPLOY.md. Without these, the remaining honest options are the CSP-hardening refactor (externalize inline scripts, move `style=` to classes — large, test-heavy) or mutation-sweep backlog items named in earlier handoffs.
3. If you touch any of the 22 HTML pages: keep the byte-identity groups (six level index, six level dashboard, root vs main index after normalisation) and rebuild `offline/packs/core.zip` + affected level packs (the zip test fails otherwise; in-place entry replacement preserving order/compression works).
4. After any deploy: re-run Lighthouse on the live URL (mobile + desktop) and compare with `LIGHTHOUSE_RESULTS_AGENT11.json`.

## ASSUMPTIONS
None beyond what is stated inline; every number came from a tool run this turn.

## ARTIFACTS
- app-production-agent11.zip — current tree (with STATE.md, this file, LIGHTHOUSE_RESULTS_AGENT10/11.json).
- STATE.md, HANDOFF_PACKAGE_AGENT11.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 12. Step 9 (Lighthouse) is closed for the static tree: 22/22 pages, perf ≥0.93, a11y/BP/SEO 1.0, CLS 0.000, label-in-name fixed (card aria-labels removed, 4 test pins updated, 954/954). Remaining work is deploy-gated (repo, Netlify, domain), hardware-gated (devices), or the large CSP-hardening refactor; post-deploy re-run Lighthouse against the live URL. Check network egress fresh."
----- END HANDOFF PACKAGE -----
