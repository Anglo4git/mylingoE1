# Agent 238 — Video-first locked lesson player

## Delivered
- Videos are now the first lesson slides when present.
- Every lesson has exactly three text slides:
  1. Intro & explanation
  2. Usage & examples
  3. More details
- Existing `body_content`, `chapters[]`, or revision fallback content is distributed into that three-slide structure.
- YouTube embeds use the IFrame API, autoplay muted, hidden native controls, disabled keyboard controls, disabled native fullscreen button, related-video reduction, and minimal branding parameters.
- A custom learning-mode overlay states that external YouTube controls are hidden.
- Continue is not rendered on a video slide until playback reaches 90% of the measured duration.
- Offline/unavailable video does not deadlock the learner; the lesson can continue into the text deck.
- Browser fullscreen is attempted automatically and the video slide itself fills the viewport as a cinema-mode fallback when browser fullscreen permission is unavailable.
- CSP and offline core packs were updated.

## Important browser limitation
Browser security/user-gesture policies can reject `requestFullscreen()` during initial page load. The implementation attempts fullscreen on load and again on YouTube player readiness; it cannot bypass the browser's fullscreen permission model.

## YouTube lockdown scope
The standard YouTube iframe is configured with native controls and keyboard controls disabled. This removes the normal player controls/Watch-on-YouTube interaction surface as far as YouTube's supported embed parameters allow. The app does not claim that YouTube can be made into a completely independent proprietary player inside an iframe; future stronger lockdown would require a separately licensed/hosted video player and media delivery stack.

## Verification
- `node tests/run.js` → 971 passed, 0 failed
- `node tools/verify-all.js --quick` → all gates passed
- CSP up to date
- Source/dist byte identity → 709 files
- Offline core pack rebuilt from `offline/core-manifest.json`

## Files changed
- `courses/lesson.html`
- `tools/build-csp.js`
- `netlify.toml`
- `tests/run.js`
- `offline/packs/core.zip`
- `offline/core.zip`
- `CHANGELOG.md`
- `AGENT_238_VIDEO_PLAYER_UPDATE.md`
- `HANDOFF_PACKAGE.md`

## Next agent
Agent 239 should inspect the packaged release, optionally perform a browser-level YouTube playback/fullscreen smoke test in an environment with Playwright or a real mobile browser, and preserve the 90% gate + three-text-slide contract.
