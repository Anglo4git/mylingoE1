----- BEGIN HANDOFF PACKAGE -----
AGENT: 253
DATE: 2026-09-27
TASK: Continue from HANDOFF_AGENT_252.md — item 2 on its NEXT AGENT list (live-verify the `.term` forced-colors rule; try the full csp-sweep now that Playwright/Chromium is confirmed reachable)
STATUS: complete — found and fixed a real production bug along the way

## DONE THIS TURN
- **`.term{border:1px solid CanvasText}` live-verify attempt:** Agent 252's `tools/a11y/forced-colors-verify.js` stalled on slide 1 because the 3 sampled lessons all open on a video slide, and the "Continue" affordance there is a `<span>` (locked, no button) until 90% watched — so `#playerNav button:not([disabled])` correctly found nothing. Fixed by adding the same `navigator.onLine=false` init-script override the app itself already uses as its real offline fallback (`lesson.html`: `if(!navigator.onLine){unlockVideoNext();return}`), which lets a real browser advance past the video slide the same way the app already handles offline learners.
  - With that fixed, checked all 3 text slides on **10 published lessons** (a1 + a2, all with non-empty `key_terms`) in a real forced-colors Chromium context: **`.term` never rendered on any of them.**
  - Traced why: `splitIntoThreeTextSlides()` only emits `<span class="term">` as a *fallback* for a text-slide group with no natural `body_content`, and every sampled lesson's `body_content` is long enough to fill all three groups. The terms/examples fallback branch is currently dead code with real content — not a bug, just unreachable right now. Documented this honestly in `tools/a11y/README.md` (neither claimed "verified" nor "broken" — it genuinely can't be exercised with the content that exists today).

- **Ran the full (non-`--quick`) `tools/csp-sweep.js` for the first time — it completed inside this sandbox's budget** (no timeout this run; prior handoffs assumed it would time out). It flagged 4 problem-page reports, all one root cause:
  - `courses/lesson.html` unconditionally contains `<script src="https://www.youtube.com/iframe_api">` (loaded on every page visit, not gated on whether the lesson has a video), but the shipped `netlify.toml` CSP's `script-src` never allowlisted `youtube.com` — so **that script was CSP-blocked on every single load.**
  - Traced the real-world impact: with `window.YT` never defined, `whenYouTubeReady()`'s ready-callback queue is never drained, so `videoWatchReady` never becomes `true` for any learner whose browser reports `navigator.onLine === true`. **The "Continue" button on every video slide would stay locked forever in production, for every online learner, on every video lesson, site-wide.** This is a severe bug that had gone undetected because no prior agent had a working browser to enforce CSP and click through a real lesson.
  - Root cause of why the existing sweep never caught it: `tools/csp-sweep.js`'s own `PAGES` list used a stale lesson id (`a1-unit-01-lesson-01`) that doesn't match real content (real ids are `course-a1-unit-01-lesson-01`), so the sweep was silently hitting the "This lesson isn't available yet" error page on every run and never actually rendered a video slide/iframe to test against.
- **Fix:**
  - Added `https://www.youtube.com` to both `script-src` (fixes the iframe_api block) and `frame-src` (was `'none'`, which would have separately blocked the actual `<iframe src="https://www.youtube.com/embed/...">` video embed itself once script-src was fixed) in `tools/build-csp.js`'s `policy()` template — the single source of truth `netlify.toml`'s CSP is regenerated from.
  - Regenerated `netlify.toml` (`node tools/build-csp.js` — 16 script hashes, no hash changes, only the new allowlisted domains).
  - Fixed the stale lesson id in `tools/csp-sweep.js`'s `PAGES` list to `course-a1-unit-01-lesson-01`, so the sweep now genuinely exercises the video-lesson/iframe path going forward instead of silently no-op'ing on an error page.
  - Updated the matching CSP assertion in `tests/run.js` (script-src prefix now includes `https://www.youtube.com`; added a `frame-src https://www.youtube.com` check).
- Updated `CHANGELOG.md` and `STATE.md`.

## CURRENT STATE
- App runs: yes (static site, no build step)
- Tests: `node tests/run.js` — **977 passed, 0 failed**
- `node tools/verify-all.js --quick`: **ALL GATES PASSED** (CSP up to date; dist byte-identical, **711 files** — unchanged from Agent 252, since only `netlify.toml`/`tools/`/`tests/` were touched this turn, none of which ship in `offline/packs/core.zip`)
- Full `node tools/csp-sweep.js` (non-`--quick`): **run for real this turn — 0 problem pages** (was 4, all the youtube.com CSP block above). Confirmed Playwright/Chromium is reliably usable in this sandbox for a fixed-page sweep like this one.
- `offline/packs/core.zip`: not rebuilt this turn — nothing in its manifest (HTML/CSS/JS/media) changed; only `netlify.toml` (Netlify-only config, not shipped in the offline pack) and two `tools/`/`tests/` files changed.

## FILES CHANGED
- `tools/build-csp.js` — `policy()` template: `script-src` now includes `https://www.youtube.com`; `frame-src` changed from `'none'` to `https://www.youtube.com`
- `netlify.toml` — CSP regenerated from the above (`node tools/build-csp.js`)
- `tools/csp-sweep.js` — `PAGES` list: fixed stale lesson id `a1-unit-01-lesson-01` -> `course-a1-unit-01-lesson-01` so the sweep actually tests a real video lesson
- `tests/run.js` — CSP test (`'CSP (Agent 17): ...'`) updated: script-src-prefix assertion and new frame-src assertion, to match the fixed policy
- `tools/a11y/forced-colors-verify.js` — added `navigator.onLine=false` init-script override so the browser can advance past the video slide (same fallback path the app itself already uses for real offline learners); now checks all text slides across 3 lessons for `.term`, not just up to 4 clicks from slide 0
- `tools/a11y/README.md` — documented this turn's `.term` finding (unreachable with current content) and the csp-sweep fix
- `CHANGELOG.md`, `STATE.md` — entries added

## FILES CREATED
- `HANDOFF_AGENT_253.md` — this handoff

## FILES DELETED
- none

## NEXT AGENT — START HERE
1. **No open blockers from this turn's work.** The YouTube-iframe-API CSP block was the significant find; it's fixed and verified (`csp-sweep.js` clean, `tests/run.js` clean).
2. Optional follow-up, not blocking: now that a real video-lesson page is actually reachable in `csp-sweep.js` (previously it silently wasn't), it would be worth extending that sweep — or a small dedicated script — to actually click "play" via the (now CSP-unblocked) `window.YT.Player` and confirm `unlockVideoNext()` really fires end-to-end in a real browser, not just that the API script loads without a CSP violation. This turn confirmed the *load* path; it did not simulate real video playback (YouTube itself is unreachable from this sandbox's network regardless of CSP, per the existing `[network_configuration]`/egress-proxy constraint, so full playback can't be simulated here — only the CSP-blocking layer could be, and was).
3. The `.term{border:1px solid CanvasText}` forced-colors rule remains real, correct, defensive CSS — but is unreachable with all currently-published lesson content (confirmed across 10 lessons this turn, not just assumed). If a future content update ever ships a lesson whose `body_content` is short enough to leave a text-slide group empty, the terms/examples fallback (and this CSS rule) would start rendering — worth a quick recheck if/when lesson content authoring changes.
4. Standing blockers unchanged (none of this turn's work touched them): git remote / Netlify account+site / domain / physical iOS/Android devices; axe-core + Lighthouse (npm install blocked, registry.npmjs.org 403 as of last check); domain-gated canonical/og:image/og:url/sitemap; real screen reader (VoiceOver/TalkBack) pass.

## ARTIFACTS
- MYLINGO_AGENT253_HANDOFF.zip — full source + CHANGELOG.md + this HANDOFF_AGENT_253.md, packaged via `tools/package.js` (dotfile-safe `zip -X`, self-verified from a clean unzip)
- CHANGELOG.md entry — "2026-09-27 — Agent 253 — Critical production bug found & fixed: CSP blocked the YouTube IFrame API on every video lesson"

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 254."
----- END HANDOFF PACKAGE -----
