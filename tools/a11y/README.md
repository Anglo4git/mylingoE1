# Ad-hoc accessibility audits (Agent 15)
Playwright (global install) scripts, no axe-core needed. Edit ROOT (tree path) and start `python3 -m http.server 8765` from the tree root first.
- lesson-contrast-names.js — seeds `mylingo.progress.v1` so every lesson unlocks, opens all 62 published lessons x light/dark x 390/320, every slide tab: computed-colour contrast (text, solid backgrounds only), unnamed controls, h1/main count, duplicate ids, overflow. `.sep` is decorative (aria-hidden) and is expected in its output.
- lesson-keyboard-spacing-forced.js — Tab-order focus visibility + skip link first, WCAG 1.4.12 text spacing (clip/overflow), forced-colors cue on the trail.
- quiz-result-contrast.js — drives quizzes (needs `&recommended=1`) to the result screen with mixed right/wrong answers (0-100%) and runs the contrast check there. Sampled 6 quizzes per level + placement-120.
