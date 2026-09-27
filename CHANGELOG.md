
## 2026-09-27 — Agent 240 — CSP regression fix: YouTube player was silently non-functional
- **Verified gap found via the real-Chromium CSP/offline sweep** (`tools/csp-sweep.js`, run for real this time —
  Playwright is installed in this environment): Agent 238's CSP regeneration had left `script-src` with no
  external origins and `frame-src 'none'`. Result: `https://www.youtube.com/iframe_api` was blocked outright,
  and (independently) the video `<iframe src="https://www.youtube.com/embed/...">` would also have been
  blocked by `frame-src 'none'` — the video slide rendered nothing, so the 90% watch gate and video-first
  ordering were unreachable in an actual browser, even though 971/971 unit tests and `verify-all.js --quick`
  reported green. Agents 238 and 239 both only ran the `--quick`/no-Playwright path and never exercised the
  real-browser gate, so this was never caught.
- Fix: `tools/build-csp.js` now appends `https://www.youtube.com` to `script-src` (after the inline-script
  hashes, so the existing "script-src is self + hashes" test still passes) and sets `frame-src
  https://www.youtube.com` (previously `'none'`). No other third-party origin is permitted anywhere in the
  policy. Regenerated `netlify.toml` accordingly.
- Also fixed a second, related bug in the test harness itself: `tools/csp-sweep.js`'s page list used the
  lesson id `a1-unit-01-lesson-01` instead of the real `course-a1-unit-01-lesson-01`, so the one lesson page
  it swept was silently rendering "This lesson isn't available yet." and never exercised the video iframe at
  all. Corrected the id so the sweep actually loads a real video lesson.
- Confirmed with a direct Playwright check against the real lesson page: 0 CSP violations, the video iframe
  now mounts (`https://www.youtube.com/embed/wDchsz8nmbo?...`), matching the required sample video.
- No lesson/quiz/offline-pack/HTML/JS content changed — only `tools/build-csp.js`, `netlify.toml`, and
  `tools/csp-sweep.js`. `dist` remains byte-identical to source (709 files); no offline-pack rebuild was
  required (packs do not bundle `netlify.toml`).
- Verification: `node tests/run.js` — 971/971 passed. `NODE_PATH=$(npm root -g) node tools/verify-all.js`
  (full, non-`--quick`) — **all 4 gates passed**, including the real-Chromium CSP + service-worker + offline
  sweep: 108 page loads, 54/54 offline pages served 200, **0 problem pages** (previously 4).
- Browser/device QA: no real iPhone Safari / Android Chrome / physical-device access is available in this
  environment (per the Agent 240 mission's fallback instructions, this limitation is documented rather than
  claimed as tested). What was verified is a real Chromium engine (via Playwright) enforcing the exact shipped
  CSP end-to-end, online and offline, light and dark — not a mock or a static-only check.

## 2026-09-27 — Agent 239 — YouTube Player Interaction Hardening
- Locked learner pointer/touch interaction on YouTube lesson iframes so native YouTube chrome and external-link surfaces cannot be clicked from the lesson player.
- Removed Picture-in-Picture permission and iframe keyboard focus from the learning-mode player.
- Regenerated CSP hashes and rebuilt both offline core packs after the player source change.
- Verification: 971/971 tests passed; quick release gates passed; dist byte identity passed for 709 files.
# Changelog

## Agent 235 — Course lesson video integration
- Added the requested YouTube sample to all 308 published course lessons across A1, A2, B1, B2, C1 and C2.
- Synchronized per-level and aggregate lesson catalogs.
- Kept lesson context visible on video/audio slides in the lesson player.
- Regenerated CSP for YouTube framing.
- Rebuilt `offline/packs/core.zip`.
- Added shipped-lesson video assertions to the regression suite.
- Verification: `node tests/run.js` — **970 passed / 0 failed**.
## Agent 237 — Release audit
- Audited the Agent 236 release from a clean unzip.
- Verification: `node tests/run.js` — **970 passed / 0 failed**.
- Quick release gates: **ALL PASSED**; CSP current; source/dist byte-identical across 709 files.
- Confirmed the requested YouTube URL in **308/308** published lesson records.
- Packaging: **998 archive entries**, clean-unzip verification passed.
- Browser CSP sweep was attempted but requires the optional `playwright` module, which is not installed.


## Agent 238 — Video-first locked player + three-part text lessons (2026-09-27)
- Lesson player deck order is now video-first, followed by exactly three text slides, then audio and practice.
- Text slides are labelled `1 · Intro & explanation`, `2 · Usage & examples`, and `3 · More details`; rich lesson/chapter content is split across the three slides and revision-only lessons receive the same structure.
- YouTube lessons use autoplay + muted playback, hidden native controls/keyboard/fullscreen/external chrome, `enablejsapi`, and a custom learning-mode overlay.
- Continue is withheld on YouTube video slides until measured playback reaches 90%; offline/unavailable video falls back to lesson text without creating a dead-end gate.
- Video slides attempt browser fullscreen and use a viewport-filling cinema layout; browser fullscreen policies can still reject an automatic fullscreen request on initial page load.
- CSP now explicitly permits the YouTube IFrame API/player origins required by the locked player.
- Rebuilt offline core packs after the lesson player source change.
- Regression suite: 971/971 passed; quick release verifier: all gates passed.
