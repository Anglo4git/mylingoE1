# Ad-hoc accessibility audits (Agent 15)
Playwright (global install) scripts, no axe-core needed. Edit ROOT (tree path) and start `python3 -m http.server 8765` from the tree root first.
- lesson-contrast-names.js — seeds `mylingo.progress.v1` so every lesson unlocks, opens all 62 published lessons x light/dark x 390/320, every slide tab: computed-colour contrast (text, solid backgrounds only), unnamed controls, h1/main count, duplicate ids, overflow. `.sep` is decorative (aria-hidden) and is expected in its output.
- lesson-keyboard-spacing-forced.js — Tab-order focus visibility + skip link first, WCAG 1.4.12 text spacing (clip/overflow), forced-colors cue on the trail.
- quiz-result-contrast.js — drives quizzes (needs `&recommended=1`) to the result screen with mixed right/wrong answers (0-100%) and runs the contrast check there. Sampled 6 quizzes per level + placement-120.
- forced-colors-verify.js — Agent 252: focused real-Chromium (`forcedColors:'active'` context) check of the trail's active-item outline on 3 real shipped lessons (one per level a1/a2/b1), without the full exhaustive per-lesson sweep in lesson-keyboard-spacing-forced.js (which times out in this sandbox — 300+ lessons x 30 tab presses each). Confirmed `.trail-item.active{outline:3px solid Highlight}` actually computes as `solid 3px` under forced-colors in a real browser. Did not reach a `.term` chip on the sampled slides (nav-button selector didn't advance past slide 1) — that half of the CSS (`.term{border:1px solid CanvasText}`) is still only statically asserted by tests/run.js, not live-browser-verified.


## Note (Agent 254)
See `tools/video-gate-verify.js` (in `tools/`): end-to-end video "Continue" gate check under the shipped CSP with a stubbed YouTube network.
- quiz-audio-probe.js — Agent 313: the six `*-media-01` quizzes (TTS Listening questions) x 390/320 x speechSynthesis stub/absent: button size/focus/click/fallback, overflow, page errors. Needs the static server on :8765.
- sw-audio-range-probe.js — Agent 315: registers /sw.js in Chromium and checks Range fetches on sample.mp3 return 206/416 slices and that <audio> loads. Needs the static server on :8765.
- csp-audio-probe.js — Agent 316: serves dist/ with the real netlify.toml CSP + Range support, loads the audio slide of 5 lessons with the SW blocked/allowed; checks audio loads and no CSP violations. Run `node tools/build-dist.js` first.
- quiz-audio-contrast.js — Agent 318: contrast/focus/overflow of the quiz TTS audio question (idle, playing, after answer) for the six *-media-01 quizzes in light/dark. Needs the static server on :8765.
- lesson-audio-contrast.js — Agent 319: contrast on every slide of audio lessons (STEP=n sampling, ONLY=ids) in light/dark at 390 px; seeds all level quizzes as passed to bypass lesson gating. Needs the static server on :8765.
