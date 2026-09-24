----- BEGIN HANDOFF PACKAGE -----
AGENT: 10
DATE: 2026-09-23
STEP: 9 — LIGHTHOUSE. Real Lighthouse 13.5.0 now run on all 22 pages (twice: baseline + final). All CLS and unsized-image findings fixed and measured. Step 9 is complete for the static tree.
STATUS: 954/954 tests. Final sweep: perf 0.95–1.0, a11y 1.0, best-practices 1.0, SEO 1.0, CLS 0.000 on all 22 pages, no Lighthouse runtime errors. Playwright console/status sweep clean (22/22).

## ENVIRONMENT NOTE
Network egress was OPEN this turn (confirmed: `curl -I https://registry.npmjs.org/lighthouse` → 200) — it was closed for Agent 9, so re-check each turn. Lighthouse 13.5.0 + chrome-launcher were installed OUTSIDE the deliverable tree (/home/claude/lh) and run against Playwright's bundled Chromium 1194 (`--headless=new --no-sandbox`), pages served by `python3 -m http.server`. Mobile emulation, simulated throttling, all four categories. Netlify-only behaviour (gzip/brotli, HTTP/2, netlify.toml headers/CSP) is NOT exercised — these are static-file scores, not deployed-site scores.

## DONE THIS TURN
1. Baseline real Lighthouse sweep of Agent 9's tree: SEO = 1.0 on all 22 (meta-description fix from Agent 9 confirmed with the real tool; Agent 8 had ~0.90–0.91). Also exposed what Agent 9's Playwright probe missed: dashboards CLS 0.107 (not 0.0799), level index pages 0.140, main/progress.html 0.060, and `unsized-images` failing on 15+ pages.
2. Logo `<img>` width/height added everywhere they were missing (81x26 / 84x27 / 75x24 / 62x20 by each page's CSS height; quiz.html splash icon 64x64). Ratio from the SVG's real 3401x1095 size.
3. Level index pages (6, byte-identical): `main{min-height:100vh}`, `.sub{min-height:18px}`, `.count{min-height:15px}` → CLS 0.140 → 0.000.
4. main/progress.html: `#levels` min-height 204px (311px under the existing max-width:520px breakpoint) → CLS 0.060 → 0.000.
5. Dashboards (6, byte-identical — verified md5sum): `main{min-height:100vh}`, `.reset{min-height:47px}`, and a `main.pending` visibility gate (JS adds it after the level-lock check; `load()` is now a try/finally wrapper around the unchanged original body, renamed `render()`, that removes it). While pending, `#body,#resetWrap,#masteryReviewMount,#offlinePacksMount` are `visibility:hidden` (space still reserved).
   - DISCLOSURE: Agent 9's min-height-only fix covered just the empty first-time-learner state. A seeded returning learner (5 / 40 attempted quizzes in `mylingo.progress.v1`) had dashboard CLS 0.26 / 0.22 — never measured before. With the gate: 0.0000 for 0 / 5 / 40 seeded quizzes (Playwright layout-shift probe, 412x823) and 0.000 in Lighthouse. The fetch-failure path was tested (aborted `quizzes.json` → gate lifts, mounts visible).
   - Trade-off: those sections now appear together when `quizzes.json` resolves. Dashboard perf 0.96–0.99 → 0.97–0.98; LCP ~1.7–1.9s → ~2.0–2.4s (simulated). Accepted for zero layout jump; revisit if the dashboard LCP matters.
6. Rebuilt `offline/packs/core.zip` + the six level packs by in-place entry replacement (order/compression preserved) — the project's byte-for-byte zip test passes.
7. Added `LIGHTHOUSE_RESULTS_AGENT10.json` (raw per-page scores, CLS/LCP/TBT, failing audit ids) at the tree root. STATE.md updated (Agent 10 section + current position).

## VERIFICATION (all tool-run this turn)
- `node tests/run.js` → 954 passed, 0 failed; run after the first edit pass (1 expected failure: stale zips), after the pack rebuild, after the dashboard gate + rebuild, and after the docs edit.
- Full Lighthouse sweep ×3 (baseline, post-CLS-fix, final); repeat-run variance check on placement.html (a single 0.036 in one sweep was noise — 0.000 on 3 reruns) and a1/dashboard.html.
- Playwright sweep, 22 pages @390x844: all 200, 0 console errors, 0 page errors, meta description present, no logo `<img>` without width+height.
- `grep -c 'style="'` across HTML still 91 (SECURITY.md count unaffected).
- `diff -rq` against Agent 9's tree: only the 20 HTML pages (dashboards ×6, level index ×6, courses ×3, index, main/index, placement, progress, quiz), the 7 pack zips, STATE.md, and the two new files (this handoff, LIGHTHOUSE_RESULTS_AGENT10.json) differ. sw.js untouched (documents are network-first, so no CACHE_VERSION bump is needed for HTML-only edits — same as Agents 8/9).

## OPEN / NOT FIXED
- `label-content-name-mismatch` on the 6 level index pages, courses/index.html and main/practice.html: card `<a aria-label="Title, Status">` doesn't contain all visible text (WCAG 2.5.3). Lighthouse a11y stays 1.0 (unweighted audit), but it's a real voice-control concern. The label format is pinned by tests (tests/run.js ~10863, ~11443–11472), so changing it is a deliberate decision: drop the aria-label (verbose SR name) or reorder so it contains the visible text; update the pinned tests with it.
- shared/quiz.html is the lowest perf page (0.95, LCP ~2.7s) — no fix attempted.
- Unweighted insights (render-blocking, unminified JS/CSS, document-latency, cache-insight, unused JS): re-measure after a real Netlify deploy, since compression/caching headers change several of them.
- Standing: no git repo, no Netlify account/domain, no live deploy, no physical-device testing (Steps 1–4, 7, 8), CSP `'unsafe-inline'` removal (Step 5/6 recorded-not-attempted).

## NEXT AGENT — START HERE
1. Step 9 is done for the static tree; don't re-diagnose CLS. To re-run: `mkdir /tmp/lh && cd /tmp/lh && npm i lighthouse chrome-launcher`, serve the tree, launch Chrome via chrome-launcher with `chromePath` = Playwright's chromium (`/opt/pw-browsers/chromium-*/chrome-linux/chrome`), `--headless=new --no-sandbox`.
2. Decide the label-in-name item above (small, test-pinned, real a11y value) — or defer it explicitly.
3. If you touch ANY of the 22 HTML pages: (a) the two byte-identity groups (six `<level>/index.html`, six `<level>/dashboard.html`, and root vs main index after normalisation) must stay identical; (b) rebuild `offline/packs/core.zip` + affected level packs — the zip test fails otherwise (an in-place entry-replacement script is trivial: read each pack's entries, swap in the tree's bytes, keep order/compression).
4. Move to the next protocol step / the standing blockers (repo, host, domain) if the person can unblock them; post-deploy, re-run Lighthouse against the live URL.

## BLOCKERS
Same standing Steps 1–4 blockers (no git repo, Netlify account, domain). Real-hardware testing still needed for install-flow and device rendering.

## ASSUMPTIONS
None beyond what is stated inline; every number above came from a tool run this turn.

## ARTIFACTS
- app-production-agent10.zip — current tree.
- STATE.md, HANDOFF_PACKAGE_AGENT10.md, LIGHTHOUSE_RESULTS_AGENT10.json.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 11. Step 9 (Lighthouse) is complete for the static tree: real Lighthouse 13.5.0, all 22 pages, perf ≥0.95, a11y/BP/SEO 1.0, CLS 0.000 (dashboards fixed for returning learners too, via the main.pending gate). Open: the test-pinned label-content-name-mismatch on card links; post-deploy Lighthouse; standing repo/host/domain/device blockers. Don't re-diagnose CLS. Check network egress fresh."
----- END HANDOFF PACKAGE -----
