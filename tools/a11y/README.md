# Ad-hoc accessibility audits (Agent 15)
Playwright (global install) scripts, no axe-core needed. Edit ROOT (tree path) and start `python3 -m http.server 8765` from the tree root first.
- lesson-contrast-names.js — seeds `mylingo.progress.v1` so every lesson unlocks, opens all 62 published lessons x light/dark x 390/320, every slide tab: computed-colour contrast (text, solid backgrounds only), unnamed controls, h1/main count, duplicate ids, overflow. `.sep` is decorative (aria-hidden) and is expected in its output.
- lesson-keyboard-spacing-forced.js — Tab-order focus visibility + skip link first, WCAG 1.4.12 text spacing (clip/overflow), forced-colors cue on the trail.
- quiz-result-contrast.js — drives quizzes (needs `&recommended=1`) to the result screen with mixed right/wrong answers (0-100%) and runs the contrast check there. Sampled 6 quizzes per level + placement-120.
- forced-colors-verify.js — Agent 252: focused real-Chromium (`forcedColors:'active'` context) check of the trail's active-item outline on 3 real shipped lessons (one per level a1/a2/b1), without the full exhaustive per-lesson sweep in lesson-keyboard-spacing-forced.js (which times out in this sandbox — 300+ lessons x 30 tab presses each). Confirmed `.trail-item.active{outline:3px solid Highlight}` actually computes as `solid 3px` under forced-colors in a real browser. Did not reach a `.term` chip on the sampled slides (nav-button selector didn't advance past slide 1) — that half of the CSS (`.term{border:1px solid CanvasText}`) is still only statically asserted by tests/run.js, not live-browser-verified.


## Note (Agent 254)
See `tools/video-gate-verify.js` (in `tools/`): end-to-end video "Continue" gate check under the shipped CSP with a stubbed YouTube network.
