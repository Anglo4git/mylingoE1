----- BEGIN HANDOFF PACKAGE -----
AGENT: 14
DATE: 2026-09-24
STEP: 10 leftovers — real quiz-screen audit, keyboard, text spacing, forced colors. Done.
STATUS: 958/958 tests. axe clean on the full tree (22 pages × light/dark × 390/1280/320), on every quiz question type, and on quiz start/feedback/result in both schemes. Lighthouse: perf ≥0.95, a11y 1.0, BP 1.0, CLS 0.000; SEO 1.0 except the 8 intentional noindex pages. Offline 22/22 (Agent 13).

## IMPORTANT CORRECTION
Agent 12 reported "quiz start/question/answered clean". Those runs actually audited the LESSON player: `quiz.html?quiz=a1-001&level=a1` is lesson-gated and redirects to `lesson.html`. Real quiz screens need `&recommended=1`. They were audited for the first time this turn and had real failures (fixed below). Any future "quiz" test must use `&recommended=1` (or mode=placement) and assert `location.pathname` ends with quiz.html.

## ENVIRONMENT NOTE
Egress open. Tooling outside the tree at /home/claude/lh (lighthouse, chrome-launcher, axe-core; playwright global). Start the static server IN THE SAME command as each run, from the tree root: `cd <tree> && (setsid python3 -m http.server 8765 >/dev/null 2>&1 < /dev/null &)`. Long sweeps: `setsid nohup sh -c '...' &`, poll for a flag file; single calls time out at 300s.

## DONE THIS TURN
1. quiz.html: `#start`/`#end` overlays labelled (`aria-labelledby`); `.blank.filled` text #58cc02 (2.08:1) → #2f6d06 (light) / dark success (dark).
2. theme.css dark block: `.icon-btn` dark surface; `.check-answer,.lesson.current .node,.navlinks a.primary,.skip-link,.skip,.answer.selected .num` get a dark label on the light-blue brand (`.check-answer` was 2.11:1, only visible on question screens).
3. theme.css `@media (forced-colors:active)` (new): bordered progress tracks + Highlight fills (every progress bar was invisible on 8 pages), 3px Highlight outline for selected/correct/current, dashed CanvasText outline for wrong, underlined active nav label.
4. Verified clean, no change needed: keyboard focus visibility + no traps + skip link (21 pages × 2 schemes), WCAG 1.4.12 text spacing (0 clipped, 0 overflow), reflow at 320/360.
5. Test +1 (958). core.zip rebuilt (level packs unchanged). `LIGHTHOUSE_RESULTS_AGENT14.json` added.

## VERIFICATION
958/958; axe full sweep NO VIOLATIONS; a1-011 (13 questions, all types) clean light+dark after fixes; Lighthouse 22 pages (see STATUS; SEO<1 set identical to Agent 13, no perf regression); Playwright status/console sweep 22/22; style= count 91; level index ×6 and dashboards ×6 each one md5; diff vs Agent 13 = theme.css, quiz.html, core.zip, tests/run.js + docs/results.

## OPEN
- Unaudited: lesson slides beyond a1 lesson 1 (lessons 2–4 show no chapter trail when opened directly — sequential unlock; to audit, seed progress or use the lesson-gate bypass), video/practice slide types, other levels' lessons; quiz result variants; real drag/drop for ranking/matching; listening/TTS in use; real screen readers/devices/browser zoom.
- Domain-gated: canonical, og:image/og:url, run `node tools/build-sitemap.js https://<domain>`, verify netlify.toml 404/noindex additions live, Lighthouse on the live URL.
- Publish-directory split (repo internals are served with publish="."), CSP 'unsafe-inline' removal.
- Standing: git remote, Netlify account, domain, physical devices.

## NEXT AGENT — START HERE
1. Ask the person for the git remote, Netlify account/site and domain (or accept the netlify.app URL). Nothing else is unblocked without them except optional work below.
2. Optional static work: audit remaining lesson slide types (seed `mylingo.progress.v1`/lesson completion so lessons unlock, or look at how the gate reads state), the publish-directory split (CI copies runtime files to dist; keep byte-identity + pack + SW tests green), or the CSP hardening refactor.
3. If you touch any of the 22 pages keep byte-identity groups (six level index, six dashboards, root vs main index) and rebuild core.zip + affected level packs (in-place entry replacement).

## ASSUMPTIONS
None beyond stated; all numbers tool-run this turn.

## ARTIFACTS
app-production-agent14.zip; STATE.md; HANDOFF_PACKAGE_AGENT14.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 15. Steps 9, 10 (incl. real quiz screens, keyboard, text spacing, forced colors), 14 (static) and 15 are done: 958/958 tests, axe clean, Lighthouse a11y/BP 1.0, CLS 0, offline 22/22. NOTE Agent 12's 'quiz' axe states were really the lesson player; quiz tests need &recommended=1. Remaining work is deploy-gated (repo, Netlify, domain, devices) or optional (other lesson slide types, publish-dir split, CSP hardening). Ask the person for the git remote/Netlify/domain. Check network egress fresh."
----- END HANDOFF PACKAGE -----
