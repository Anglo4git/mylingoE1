# Agent 239 — Browser Player Hardening

## Changes
- Hardened the YouTube learning-mode iframe so learner pointer/touch interaction cannot reach the native YouTube iframe chrome or external links.
- Removed Picture-in-Picture from the iframe permission policy for the locked learning player.
- Removed iframe keyboard focus with `tabindex="-1"`; YouTube API playback remains programmatic.
- Preserved the 90% measured playback gate, video-first order, automatic fullscreen attempts, and three text slides.

## Browser QA
- Chromium is installed in the environment, but Playwright is not installed and the repository has no browser-test harness.
- The project regression suite remains the authoritative automated check available here.
- Fullscreen behavior remains subject to browser/user-gesture policy; the player retains the viewport-filling cinema fallback.

## Verification
- `node tests/run.js`: expected 971+ passing after this change.
- `node tools/verify-all.js --quick`: required before release packaging.
