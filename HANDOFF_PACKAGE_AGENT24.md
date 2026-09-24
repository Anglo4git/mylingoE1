----- BEGIN HANDOFF PACKAGE -----
AGENT: 24
DATE: 2026-09-24
STEP: Person said skip the Netlify deployment for now and continue (they will answer the deploy questions together later). Audited the ranking (drag/drop) question in shared/quiz.html and added Move up/down buttons + list roles + live-region announcements as a touch and screen-reader alternative to HTML5 drag. Matching reviewed (select-based, already accessible). Done.
STATUS: 967/967 tests; verify-all (full, with browser sweep): ALL GATES PASSED (dist byte-identity 240 files; sweep 108 loads / 54 offline 200 / 0 problems). Real-Chromium touch tap check of the new buttons PASS. Egress not re-probed this turn (closed at Agent 23: 403 host_not_allowed).

## KEY FACTS
- Run before every push: `NODE_PATH=$(npm root -g) node tools/verify-all.js` (`--quick` skips the browser sweep; CI runs `--quick`).
- After editing ANY inline <script>: `node tools/build-csp.js`. After editing a file listed in offline/core-manifest.json: replace its entry in core.zip (`zip offline/packs/core.zip <path>` from the tree root) or the core.zip test fails.
- Package with `NODE_PATH=$(npm root -g) node tools/package.js <out.zip>` (dotfiles + clean-unzip verify). Never `zip -r out.zip *`.
- Publish dir is dist/. lesson.html is light-only; quiz.html is light-only. Quiz tests need &recommended=1.
- Netlify/deploy work is ON HOLD by the person's instruction; do not ask for it again until they raise it.

## DONE THIS TURN
1. renderRanking: per-row `.rank-move` up/down buttons (44px, labelled with position, disabled at ends), role=list/listitem, `.sr-only` role=status live region, sync() after button/keyboard/drop moves, buttons locked in finishAnswer. kbHint and Check-order unchanged; drag still works.
2. build-csp re-run (16 hashes, netlify.toml updated); core.zip quiz.html entry replaced.
3. tests +2 (967), mutation-checked.
4. STATE.md updated. DEPLOY.md, sw.js, level packs, workflow unchanged.

## OPEN
- ON HOLD (person): git remote, Netlify account/site, domain (or netlify.app URL), physical devices. The workflow has never run; its text is a reconstruction (Agent 22).
- Egress-gated: axe-core + Lighthouse (esp. shared/quiz.html ranking card and courses/lesson.html).
- Unaudited: TTS (`speakTts`, quiz.html), screen readers/VoiceOver/TalkBack, real devices, zoom.
- Optional style-src hardening — declined.
- Domain-gated: canonical, og:image/og:url, `node tools/build-sitemap.js https://<domain>`, live header check.

## NEXT AGENT — START HERE
1. Unzip into a FRESH directory; run `node tools/verify-all.js --quick` there.
2. Do NOT chase Netlify/deploy inputs (on hold). Pick the next no-deploy item: audit TTS (`speakTts` and the play button in shared/quiz.html: unsupported speechSynthesis, cancel on next/exit, aria-pressed state, errors), then keyboard/focus/reduced-motion review of remaining interactive widgets (checkbox/radio groups, matching selects, start/end overlays, focus return).
3. If egress is open: install axe-core + lighthouse outside the tree and sweep a built dist.
4. Deliver via tools/package.js.

## ASSUMPTIONS
- sw.js untouched by precedent (Agent 15 edited pages without bumping it). No device/screen-reader result is claimed. All numbers were tool-run this turn.

## ARTIFACTS
app-production-agent24.zip; STATE.md; HANDOFF_PACKAGE_AGENT24.md.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 25. Everything through Agent 23 plus the accessible ranking question (Move up/down buttons, list roles, live region; Agent 24) is done. 967/967 tests, full local gate passes. Deploy work is ON HOLD by the person. Unzip into a fresh dir and run verify-all --quick first; then audit TTS and the remaining interactive widgets (no deploy, no egress needed); package with tools/package.js."
----- END HANDOFF PACKAGE -----
