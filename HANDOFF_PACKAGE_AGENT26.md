----- BEGIN HANDOFF PACKAGE -----
AGENT: 26
DATE: 2026-09-24
STEP: Deploy work still ON HOLD by the person's instruction (do not raise it). Audited courses/lesson.html and main/placement.html (keyboard/focus/reduced-motion). Fixed: lesson trail's orphan tablist/tab roles -> plain nav + aria-current/aria-disabled; focus now moves to the slide region on user navigation (was lost to body); smooth scroll respects prefers-reduced-motion; disabled final CTA has an accessible reason (sr-only + aria-describedby); placement answers expose aria-pressed.
STATUS: 970/970 tests; verify-all (full): ALL GATES PASSED (dist byte-identity 240 files; sweep 108 loads / 54 offline 200 / 0 problems). Real Chromium 375x740 reduced-motion check: focus on slide after Continue/Back, none on load, 0 page errors. package.js clean-unzip self-check: see ARTIFACTS. Egress not re-probed (closed at Agent 23).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep; CI runs `--quick`).
- After editing ANY inline <script>: `node tools/build-csp.js`. After editing a file in offline/core-manifest.json: `zip offline/packs/core.zip <path>` from the tree root.
- Package with `NODE_PATH=$(npm root -g) node tools/package.js <out.zip>`. Never `zip -r out.zip *`.
- Publish dir is dist/. lesson.html and quiz.html are light-only. Quiz tests need &recommended=1.
- Deploy work is ON HOLD; do not ask again until the person raises it.

## DONE THIS TURN
1. lesson.html: `<nav aria-label>` of buttons; `aria-current="step"` on active; `aria-disabled="true"` on unreached; `.slide` = tabindex -1, role region, aria-label "Slide N of M: label", focused (preventScroll) only on Continue/Back/trail click; reduced-motion-aware scroll; `.sr-only` + `#navHint`/aria-describedby on the disabled final button.
2. placement.html: answer buttons carry `aria-pressed`.
3. build-csp re-run (16 hashes); core.zip entries for both pages replaced.
4. tests 968 -> 970 (+ lesson a11y test, + placement aria-pressed pattern test; nav test moved aria-selected -> aria-current; harness `matchMedia` flag). Mutation-checked.
5. STATE.md updated. sw.js, DEPLOY.md, level packs, workflow unchanged.

## OPEN
- ON HOLD (person): git remote, Netlify account/site, domain, physical devices. Workflow has never run (reconstruction, Agent 22).
- Egress-gated: axe-core + Lighthouse.
- Unaudited for real: VoiceOver/TalkBack, physical devices, browser zoom, forced-colors on the new lesson slide focus target, placement aria-pressed in a real browser.
- Not yet given the keyboard/focus/reduced-motion lens: courses/course.html, courses/journey.html, courses/index.html, main/practice.html, main/progress.html, main/index.html, index.html.
- Optional style-src hardening — declined. Domain-gated: canonical, og tags, build-sitemap, live header check.

## NEXT AGENT — START HERE
1. Unzip into a FRESH dir; run `node tools/verify-all.js --quick`.
2. Do NOT chase deploy inputs. Next no-deploy items: audit the pages listed under OPEN (course.html/journey.html first) with the same lens; if egress opens, run axe-core + Lighthouse on a built dist.
3. Deliver via tools/package.js.

## ASSUMPTIONS
- sw.js untouched by precedent. No device/screen-reader result is claimed. All numbers were tool-run this turn.

## ARTIFACTS
app-production-agent26.zip; STATE.md; HANDOFF_PACKAGE_AGENT26.md; COMPLETION_SUMMARY_AGENT26.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 27. Everything through Agent 25 plus the Agent 26 lesson-player/placement a11y fixes is done. 970/970 tests, full local gate passes. Deploy is ON HOLD. Unzip into a fresh dir, run verify-all --quick, then audit courses/course.html, courses/journey.html and the other unaudited pages with the keyboard/focus/reduced-motion lens, or run axe-core/Lighthouse if egress is open; package with tools/package.js."
----- END HANDOFF PACKAGE -----
