----- BEGIN HANDOFF PACKAGE -----
AGENT: 12
DATE: 2026-09-24
STEP: 10 — ACCESSIBILITY (real axe-core pass). Complete for the static tree. Step 9 re-confirmed.
STATUS: 956/956 tests. axe-core clean across 22 pages × light/dark × 390/1280/320px, seeded returning-learner data, interactive states, and placement's 4 OS×theme combos; 0 horizontal-overflow pages at 320/360px. Lighthouse re-sweep 22/22: perf ≥0.95, a11y/BP/SEO 1.0, CLS 0.000, no regression.

## ENVIRONMENT NOTE
Network egress open. Tooling lives OUTSIDE the tree at /home/claude/lh (lighthouse, chrome-launcher, axe-core; reinstall with `npm i lighthouse chrome-launcher axe-core` if reset). Serve the tree with `cd <tree> && python3 -m http.server 8765` started in the SAME shell command as the run (background servers died between tool calls; also make sure the server's cwd is the tree — a server started from the wrong dir 404s silently). Long sweeps: run under `setsid nohup ... &` and poll (single calls time out at 300s).

## DONE THIS TURN
1. Real finding: dark mode had many WCAG failures (contrast down to 1.07:1) invisible to Lighthouse (light-mode only). Fixed in one commented block appended to `shared/css/theme.css` (surfaces `.stat,.empty,.row,.mr-section,.offline-section`; buttons `.offline-btn(.primary),.mr-action,.findlevel a`; chips/badges `.mr-chip,.mr-meter,.offline-network,.badge,.state.upcoming,.status.not-started`; `.errbox`; nav `--as-muted/--as-brand`).
2. `main/placement.html`: theme default follows OS when no valid saved choice (saved choice wins); full token set for both `data-theme` values so every OS×manual combination is legible; result + manual-chooser headings are `h1`.
3. `courses/journey.html` unit bars → `role="progressbar"` + aria-value*; `courses/lesson.html` `.player-top` → labelled region; `shared/quiz.html` error overlay `aria-labelledby`.
4. Tests: +2 (OS-default theme; result/manual h1 + theme blocks); h1-count pin = 3. Total 956/956.
5. `core.zip` rebuilt (in-place entry replacement; level packs unchanged).
6. `LIGHTHOUSE_RESULTS_AGENT12.json` added (Agent 10/11 files kept).

## VERIFICATION (tool-run)
axe full sweep (only hit was a timing artifact on course.html, cleared on rerun); seeded-data sweep clean (found and fixed `.status.not-started` after the first seeded run); interactive-state sweep clean both schemes; placement 4 combos × question/result clean; reflow 0 overflow @320/360; Lighthouse 22/22 as above; Playwright status/console sweep 22/22; `style="` count 91; level index ×6 one md5, dashboards ×6 one md5; diff vs Agent 11 = journey, lesson, placement, quiz, theme.css, tests/run.js, core.zip + docs/results.

## BEHAVIOUR CHANGES
Placement default theme follows OS (was always light); placement result/manual headings h1 (were h2).

## OPEN / NOT VERIFIED
- Real assistive-tech testing (VoiceOver/TalkBack/NVDA, voice control), physical devices, forced-colors mode, 200% zoom/text-spacing beyond the 320px reflow, keyboard-only walkthrough, quiz result screen for every question type. axe is an automated floor, not a conformance claim.
- New components with hard-coded white surfaces must be added to the theme.css dark block (or, better, converted to CSS variables — a larger refactor not attempted).
- Post-deploy Lighthouse; shared/quiz.html perf 0.95; standing repo/host/domain/device/CSP `'unsafe-inline'` items.

## NEXT AGENT — START HERE
1. Optional Step 10 extension: forced-colors + 200% zoom + text-spacing Playwright checks (`forcedColors:'active'` context option), and keyboard-only tab-order/focus-visible walkthroughs via Playwright.
2. Next protocol steps that don't need a live URL: Step 14 (SEO/meta beyond description: canonical, OG/Twitter tags, robots.txt, sitemap, unique titles/lang — check what exists first), Step 15 (offline-pack integrity re-check).
3. If you touch any of the 22 pages: keep byte-identity groups (six level index, six dashboards, root vs main index after normalisation) and rebuild core.zip + affected level packs (in-place entry replacement).
4. Deploy-gated items need the person (git remote, Netlify account, domain).

## ASSUMPTIONS
None beyond what is stated; all numbers are from tool runs this turn.

## ARTIFACTS
app-production-agent12.zip; STATE.md; HANDOFF_PACKAGE_AGENT12.md; LIGHTHOUSE_RESULTS_AGENT12.json (in zip).

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 13. Step 10 (real axe-core accessibility pass) is complete for the static tree: dark-mode contrast/landmark/heading/role failures fixed (theme.css block, placement token sets, journey progressbar), 956/956 tests, axe clean, Lighthouse unchanged at a11y/BP/SEO 1.0. Next: optional forced-colors/zoom/keyboard checks, then Step 14 SEO/meta and Step 15 offline-pack integrity; deploy-gated items need the person. Check network egress fresh."
----- END HANDOFF PACKAGE -----
