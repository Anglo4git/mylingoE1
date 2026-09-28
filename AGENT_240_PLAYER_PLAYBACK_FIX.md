# Agent 240 — YouTube Player & Playback Fix

**Date:** 2026-09-27

## Changes

- Removed the custom/cinema fullscreen implementation from `courses/lesson.html`.
- Restored the standard YouTube player controls and native YouTube fullscreen (`controls=1`, `fs=1`).
- Restored pointer interaction with the YouTube iframe so tapping/clicking the video can use the native play/pause controls.
- Enabled normal keyboard interaction with the embedded YouTube player.
- Kept muted autoplay attempt for browser autoplay compatibility.
- Reworked the 90% watch gate to accumulate only normal forward playback time; large seek jumps are not credited as watched time.
- Preserved video-first ordering and the three text-slide structure.
- Regenerated CSP after the lesson-player source change.
- Rebuilt offline core packs so `offline/packs/core.zip` matches source bytes.
- Updated regression tests for the standard YouTube player and anti-seek watch accounting.

## YouTube branding limitation

The standard YouTube iframe/player is intentionally retained so its native fullscreen works correctly, including for 9:16 content. YouTube controls, the YouTube logo, and channel/creator UI are controlled by YouTube and cannot be reliably removed while retaining the standard native player/fullscreen. Deprecated `modestbranding` behavior is not treated as a guarantee.

The app continues to suppress unnecessary external navigation through app-controlled surfaces, but it does not claim complete removal of YouTube-controlled UI.

## Verification

- `node tests/run.js` — **971 passed, 0 failed**
- CSP regenerated successfully.
- Offline core pack rebuilt and byte-identity checks pass through the test suite.
- No custom `requestFullscreen` / `webkitRequestFullscreen` calls remain in the lesson player.
- Native YouTube fullscreen is enabled through `fs=1` and `allowfullscreen`.

## Known limitation

Real browser/device playback behavior should still be verified on iPhone Safari and Android Chrome when a browser/device harness is available. Autoplay and fullscreen are subject to browser gesture policies.
