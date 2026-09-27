# Agent 240 — CSP regression fix: real-browser sweep found the video player was dead on arrival

## What was wrong
Agent 238's CSP regeneration (carried forward unchanged by Agent 239) shipped a Content-Security-Policy with:
- `script-src 'self' <hashes-only>` — no allowance for `https://www.youtube.com`.
- `frame-src 'none'`.

The lesson player (`courses/lesson.html`) unconditionally loads
`<script src="https://www.youtube.com/iframe_api">` and, for any lesson with a video, renders
`<iframe src="https://www.youtube.com/embed/...">`. Under the shipped CSP, a real browser blocks both:
the IFrame API script never loads (`onYouTubeIframeAPIReady` never fires, so `whenYouTubeReady` — which
gates player creation, `onReady` playback, fullscreen entry, and the 90% watch-progress poll — never runs),
and the video iframe itself would also be blocked outright.

This was invisible to the existing safety net because:
- `tests/run.js` runs against a simulated DOM and does not enforce real CSP — it only checks the CSP *string*
  is well-formed and consistent (no `unsafe-inline`, hashes present, etc.), not that a browser accepts it.
- `tools/verify-all.js` has a real-Chromium CSP+SW+offline sweep (`tools/csp-sweep.js`) that *would* have
  caught this, but Agent 238 and Agent 239 both ran it in a mode that skipped that step — either
  `--quick`, or because Playwright appeared unresolvable in their session. In this session Playwright is
  installed and resolvable (`NODE_PATH=$(npm root -g) node tools/verify-all.js` runs it), and running it for
  real reproduced the failure immediately: 4 problem pages, all `courses/lesson.html?...`, all
  `script-src-elem` violations on `https://www.youtube.com/iframe_api`.

A second, independent bug compounded the risk: the sweep's own page list pointed at lesson id
`a1-unit-01-lesson-01`, but real lesson ids are prefixed (`course-a1-unit-01-lesson-01`). The swept page was
therefore rendering "This lesson isn't available yet." — meaning even a correctly-run sweep was only ever
checking a page with **no video iframe present**, so a `frame-src` violation could never have been observed
even if frame-src had been fixed and script-src left broken, or vice versa. Both bugs are fixed together in
this release.

## The fix
- `tools/build-csp.js`: `policy()` now appends `https://www.youtube.com` to `script-src` (after all inline
  hashes, preserving the `"'self' 'sha256-"`-prefix invariant a unit test depends on) and sets
  `frame-src https://www.youtube.com` in place of `frame-src 'none'`. No other origin, anywhere.
- `netlify.toml` regenerated from the above.
- `tools/csp-sweep.js`: corrected the one lesson URL in its page list to the real, prefixed lesson id so the
  sweep actually exercises a lesson with a video.

## Verification performed
1. `node tests/run.js` → 971 passed, 0 failed (unchanged).
2. `NODE_PATH=$(npm root -g) node tools/verify-all.js` (full, not `--quick`) → all 4 gates pass, including
   the real-Chromium sweep: 108 page loads (54 online + 54 offline, light + dark), 54/54 offline pages
   served 200, **0 problem pages** (was 4 before the fix).
3. A standalone Playwright script loaded the real lesson page against the fixed CSP and confirmed:
   `securitypolicyviolation` events = 0; one `<iframe>` mounted with
   `src="https://www.youtube.com/embed/wDchsz8nmbo?...&enablejsapi=1..."` — the correct, required sample
   video; a `.video-card` element is present. (Two unrelated console messages remain and are expected in this
   sandboxed, network-isolated environment: a 403 fetching the real YouTube API — this container has no
   outbound internet access — and a `requestFullscreen()` rejection because headless automation has no user
   gesture. Neither is caused by, or related to, the CSP.)

## Scope discipline
No lesson content, quiz mapping, HTML markup, or client-side JS behavior was changed. `course_content/*`
audited and confirmed unchanged (308 lessons, 76/54/50/60/58/10 distribution, sample video URL intact).
`dist` remains byte-identical to source (709 files) — the CSP fix lives entirely in `tools/` (not shipped)
and `netlify.toml` (a server-header config file, not part of the SPA bundle or offline packs), so no offline
pack rebuild was necessary this round.

## Real-device QA disclosure
No physical iPhone Safari / Android Chrome device or device farm is reachable from this environment. What
*was* verified for real: an actual Chromium browser engine (Playwright), enforcing the exact production CSP
header end-to-end, with the service worker active, online and offline, in both color schemes. This is
explicitly not the same as on-device Safari/Chrome QA, and is documented as such rather than overstated.
