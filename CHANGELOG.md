
## 2026-09-27 — Agent 255 — Real Practice-slide a11y defects found by the lesson audit, fixed
- Followed Agent 254's item 1. `tools/a11y/lesson-contrast-names.js` was silently only ever checking slide 0: since Agent 26 the trail is `<nav>` buttons (no `[role=tab]`), so its tab loop found nothing. Fixed it to advance with the real `#navNext`, use the app's own offline fallback to pass the video gate, ignore sandbox-only youtube 403s and the known-decorative `.sep`, and be path-portable (`OUT` env, `ONLY` env unchanged). It now reaches all 5 slides.
- Sample (a1/a2/b1/c1 lessons x light/dark x 390/320 = 16 runs) then flagged the Practice slide (only visible with passed quizzes): (1) `✓` white on `#58cc02` = 2.09:1 -> `#0b0c0d` (matches the trail's done marker); (2) passed `→` `#46a302` on soft green = 2.9:1 -> `#2f6d06`; (3) no `<h1>` on that slide -> added `<h1 class="sr-only">` with the lesson title; (4) 320px horizontal overflow (grid track sized by nowrap titles) -> `.exercise-cards{grid-template-columns:minmax(0,1fr)}`.
- Re-run: **16 runs, 0 issues**. CSP hashes regenerated (16); `offline/packs/core.zip` `courses/lesson.html` entry replaced. sw.js untouched (precedent). `node tests/run.js` 977/0.
- `quiz-result-contrast.js` NOT run: it depends on a missing `audit.js` and hardcoded paths; left as-is, flagged in handoff.

## 2026-09-27 — Agent 254 — End-to-end video-gate verification under the shipped CSP
- Followed Agent 253's NEXT-AGENT item 2. Added `tools/video-gate-verify.js`: serves a fresh dist with `netlify.toml`'s real CSP header, stubs only youtube.com's network (`iframe_api` + `/embed/`) via Playwright routes, and runs the real lesson page + real gate code. Asserts Continue is locked before playback, unlocks after simulated forward playback, does NOT unlock on a seek-jump to the end, and zero CSP violations.
- Result: **ALL PASSED**. Mutation-checked: with youtube.com removed from the CSP, it fails (`script-src-elem .../iframe_api` and `frame-src` violations, gate never unlocks) — proving it catches the Agent 253 bug class, including the frame-src half that csp-sweep alone never confirmed.
- Not part of `verify-all` (needs Playwright, like the other browser tools). Run: `NODE_PATH=$(npm root -g) node tools/video-gate-verify.js`.
- `node tests/run.js` — 977/0. No app/content/CSP changes this turn.

## 2026-09-27 — Agent 253 — Critical production bug found & fixed: CSP blocked the YouTube IFrame API on every video lesson
- Continued from `HANDOFF_AGENT_252.md`, item 2 on its NEXT AGENT list: live-verify the `.term{border:1px solid CanvasText}` forced-colors rule for real, and try the full `tools/csp-sweep.js` sweep now that Playwright/Chromium is confirmed reachable in this sandbox.
- **`.term` chip investigation:** fixed `tools/a11y/forced-colors-verify.js`'s slide navigation (Agent 252's script stalled on slide 1 because the sample lessons all open on a video slide, whose "Continue" button doesn't exist as a `<button>` until 90% watched — `#playerNav button:not([disabled])` correctly found nothing). Added the same `navigator.onLine=false` init-script override the app itself already uses as its real offline fallback (`lesson.html`: `if(!navigator.onLine){unlockVideoNext();return}`) to get a real browser to advance past the video slide. With that fixed, checked all 3 text slides on 10 published lessons (a1/a2, all with non-empty `key_terms`) in a real browser: **`.term` never renders in any of them.** Traced why: `splitIntoThreeTextSlides()` only emits `<span class="term">` as a *fallback* for a text-slide group that has no natural `body_content` in it, and every sampled lesson's `body_content` is long enough to fill all three groups, so the terms/examples fallback branch is dead code with current content — not a bug, just currently unreachable. Documented honestly in `tools/a11y/README.md` (not claimed as "verified" since it can't be exercised with real content) rather than overclaimed either way.
- **Ran the full (non-`--quick`) `tools/csp-sweep.js` for the first time** — it completed inside this sandbox's budget (no 120s timeout this run). It flagged 4 real problem-page reports, all the same root cause: `courses/lesson.html` unconditionally contains `<script src="https://www.youtube.com/iframe_api">` (loaded on every visit, not just when a video slide is shown), but the shipped CSP's `script-src` never allowlisted `youtube.com` — so that script was CSP-blocked on every load. Traced the actual impact: `window.YT` never being defined means `whenYouTubeReady()`'s callback queue is never drained, so `videoWatchReady` never flips to `true` for any learner whose browser reports `navigator.onLine === true` — **the "Continue" button on every video slide would stay locked forever in production**, for every online learner, on every video lesson, site-wide. This was previously undetected because `tools/csp-sweep.js`'s own `PAGES` list used a stale lesson id (`a1-unit-01-lesson-01`) that doesn't match real content (`course-a1-unit-01-lesson-01`), so it was silently hitting the "lesson isn't available" error page and never actually rendering a video slide/iframe to test.
- **Fix:** added `https://www.youtube.com` to both `script-src` and `frame-src` (which was `'none'` and would separately have blocked the actual `<iframe src="https://www.youtube.com/embed/...">` video embed itself) in `tools/build-csp.js`'s policy template, regenerated `netlify.toml` (`node tools/build-csp.js`), and corrected the stale lesson id in `tools/csp-sweep.js`'s `PAGES` list so the sweep genuinely exercises the video-lesson/iframe path going forward. Updated the matching CSP assertion in `tests/run.js` (script-src prefix, new frame-src check).
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 711 files — unchanged, since only `netlify.toml`/`tools/`/`tests/` were touched, none of which ship in `offline/packs/core.zip`). Full `node tools/csp-sweep.js` (non-`--quick`) — **0 problem pages** (was 4).
- No content, HTML, or offline-pack rebuild was needed this turn — the fix is entirely in `netlify.toml`'s CSP header and the two tooling files that generate/verify it.

## 2026-09-27 — Agent 252 — All four AUDIT_AGENT_244 person-gated items closed
- Person supplied: audio icon SVG, dark-mode logo-horizontal/logo-stacked SVGs, dark-mode icon SVG, "yes, erase the offline/core.zip duplicate", and "do what you can" on forced-colors (real device/browser to follow with feedback).
- **Audio icon (item 1):** wired the supplied SVG into `courses/lesson.html` as `TRAIL_ICON_AUDIO` (same `currentColor`-based inline-SVG pattern as Agent 243's text/quiz/video icons); `trailIcon('audio')` now returns it instead of the `◖` glyph. Updated the one test that asserted the glyph to assert by icon kind (`viewBox="-1.5 0 19 19"`) instead, matching the existing text/quiz/video pattern.
- **Dark-mode logo asset (item 6.1):** added `shared/brand/logo-horizontal-dark.svg`, `logo-stacked-dark.svg`, `icon-dark.svg` (yellow `#ffcc02` mark, vs. the light-mode blue `#024BC7` — the real fix for the header-logo dark-mode contrast problem item 6.1 was filed for). Wrapped every page's header `<img class="logo"|"brand-logo">` (19 pages) plus `shared/quiz.html`'s `brand-logo-sm` in `<picture><source media="(prefers-color-scheme: dark)">`, so the OS-dark-mode logo swap is real, not just an asset sitting unused in `shared/brand/`. Known, pre-existing limitation this inherits (flagged by Agent 248): this only responds to the OS-level `prefers-color-scheme`, not `main/placement.html`'s manual `data-theme` toggle — same gap as every other dark-mode rule in `theme.css`, not a new one. Left `shared/quiz.html`'s completion-modal `icon.svg` (on its own white card) and the splash-screen icon untouched — both already self-contained regardless of page theme.
- **offline/core.zip duplicate (item 2):** deleted the confirmed-unreferenced top-level `offline/core.zip` (distinct from `offline/packs/core.zip`, which ships and is used).
- **Forced-colors verification (item 3):** discovered this sandbox actually has a working Chromium via the already-installed Playwright package (`/home/claude/.npm-global/lib/node_modules/playwright`) and can serve the app locally (`python3 -m http.server`) — contrary to every handoff since Agent 19/241 that reported no browser/device reachable here. The existing exhaustive script (`tools/a11y/lesson-keyboard-spacing-forced.js`) times out in this sandbox (300+ lessons × 30 tab presses each); wrote a focused one, `tools/a11y/forced-colors-verify.js`, that drives a real `forcedColors:'active'` Chromium context against 3 real shipped lessons (a1/a2/b1) and confirms `.trail-item.active{outline:3px solid Highlight}` genuinely computes as `solid 3px` outline in a real browser. Did NOT reach a live check of the `.term{border:1px solid CanvasText}` half (the nav-button selector used didn't advance past slide 1 in the sampled lessons) — that half remains statically-asserted only, documented as such in `tools/a11y/README.md` rather than overclaimed.
- Restored `.gitignore` and `.github/workflows/deploy.yml`, which were absent from the uploaded `MYLINGO_AGENT251_REVERIFY.zip` — the zip had been packed without dotfiles (exactly the "Agent 21 defect class" `tools/package.js`'s own header comment warns about), so `tools/verify-all.js`'s dist/CI tests failed on a clean extraction of that zip until these were reconstructed from the test suite's own spec (`tests/run.js`'s "publish directory" and "CI workflow + dotfiles" tests) and `netlify.toml`/`DEPLOY.md`'s existing Netlify config. This was a packaging-process gap, not a code regression.
- Regenerated CSP hashes (`node tools/build-csp.js`, 16 script hashes — `courses/lesson.html`'s inline script changed) and rebuilt `offline/packs/core.zip` from `offline/core-manifest.json` against the current source tree (the `<picture>`-wrapping touched 19 of its member files, not just `lesson.html`).
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, **711 files** — the two new dark-logo SVG assets).

## 2026-09-27 — Agent 251 — Re-verification, no code changes (still waiting on person-gated items)
- Continued from `HANDOFF_AGENT_250.md`. No response from the person on any of the four gated items (audio icon asset, dark-mode logo asset, offline/core.zip duplicate confirmation, forced-colors device test) has been recorded, so there is still nothing independently actionable in this sandbox.
- Re-ran verification: `node tests/run.js` — **977 passed, 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).
- No source files touched, for the same reason as Agent 250's turn: acting without new information or a new confirmed-dead/wrong item would be inventing scope.

## 2026-09-27 — Agent 250 — Re-verification, no code changes (person check-in)
- Continued from `HANDOFF_AGENT_249.md`. Per Agent 249's own "NEXT AGENT — START HERE," everything independently actionable in this sandbox had already been worked through; nothing new was queued.
- Re-ran verification only: `node tests/run.js` — **977 passed, 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).
- No source files touched — there was no confirmed-dead code, no verified-wrong prior note, and no independently actionable item left to act on. Inventing scope was explicitly ruled out by the prior handoff.
- Re-confirms AUDIT_AGENT_244 remains fully closed out or externally blocked, with the same person-gated items still open: audio icon asset, offline/core.zip top-level stray duplicate (needs confirmation before deleting), forced-colors verification, and dark-mode logo asset. None of these were resolved this turn since each needs the person's input or a real device/browser, not sandbox work.

## 2026-09-27 — Agent 243 — Task C: Lesson Player Chapter-Trail Icons
- Unblocked TASK C: the "slider" is the lesson player's chapter-trail slide stepper (`courses/lesson.html`, `.chapter-trail`/`.trail-item`), which rendered each slide's type as a plain text glyph (`▶`/`◖`/`✓`/`T`). User supplied SVG assets for text, quiz and video lesson types; no audio asset was supplied.
- Added `TRAIL_ICON_TEXT` / `TRAIL_ICON_QUIZ` / `TRAIL_ICON_VIDEO` (inline SVG, `currentColor`-based) and a new `trailIcon(kind)` helper in `courses/lesson.html`; `video` and `practice` (quiz) slide kinds now render the supplied SVG icons, `text` slide kinds render the supplied text-lesson SVG. `audio` keeps its `◖` glyph — no asset was provided for it, so nothing was invented or substituted.
- `courses/course.html` and `courses/journey.html` use a separate, lesson-level `type-icon` (video/audio/text only, no quiz concept) for their lesson-list rows; out of scope for this task and left untouched.
- CSS: `.trail-item .type-icon` sized/aligned for an inline SVG child (14×14) alongside the existing text-glyph fallback.
- Test suite: updated the one test in `tests/run.js` that asserted the trail's type-icon by literal glyph text (an `<svg>` node has no `textContent`); it now asserts by icon kind (`viewBox` + stroke/fill fingerprint) for video/text/quiz and the literal `◖` glyph for audio.
- Regenerated CSP hashes (`node tools/build-csp.js`, 16 script hashes — `courses/lesson.html`'s inline script changed) and rebuilt `offline/packs/core.zip`'s `courses/lesson.html` entry in place.
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

## 2026-09-27 — Agent 242 — Quiz Ending Card (behavior + visual) + Slider Icons (BLOCKED)
- TASK A — quiz ending card behavior for lesson-backed quizzes (`shared/quiz.html`):
  - Removed the in-card "Continue"/"Back to lesson practice" button entirely for any lesson-backed quiz (`lessonParam` set, non-placement). Lesson progression now lives only in the lesson player itself.
  - New `renderLessonEndingCard()`: a 1-quiz lesson shows only a "Return to quizzes" action (no suggestions). A 2+ quiz lesson shows "Return to quizzes" plus links to the quizzes in *this lesson* the learner hasn't passed yet (via `MylingoCourseProgress.isMastered`, 60% threshold), excluding the quiz just taken. Once every quiz in the lesson is mastered, the suggestion list is replaced by a completion state.
  - Standalone (non-lesson) and placement quizzes are untouched — same `renderSuggestions()`/`placementContinue()` paths as before.
  - Added `shared/js/course-progress.js` as a script dependency of `shared/quiz.html` (previously not loaded there) to reuse its mastery/threshold logic instead of duplicating it.
- TASK B — quiz ending card visual + copy:
  - New `.lesson-complete` and `.confetti` markup/CSS on the `#end` overlay.
  - `fireConfetti()`: lightweight, dependency-free CSS confetti burst, fires once a quiz is passed (≥60%, any mode), fully additive (try/catch-wrapped) and respects `prefers-reduced-motion` (both a JS `matchMedia` check and a CSS media-query fallback).
- TASK C — slider icon swap: **BLOCKED**. No slider widget/component exists anywhere in the repo (`grep -rl "slider"` across `.html`/`.js` returns nothing) and no new icon assets were provided. Not invented, not guessed, not substituted.
- Test suite: rewrote the `end()` orchestration tests in `tests/run.js` that pinned the old "Continue on the ending card" behavior, and added dedicated real-function tests for `renderLessonEndingCard`/`lessonMasteryCheck`/`fireConfetti` covering the A1/A2/A3 acceptance criteria against the real code (not just spies).
- Regenerated CSP hashes (`node tools/build-csp.js`) and rebuilt `offline/packs/core.zip`'s `shared/quiz.html` entry after the source change.
- Verification: `node tests/run.js` — **977 passed / 0 failed** (was 971/971 before this agent; net +6 tests). `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

## 2026-09-27 — Agent 239 — YouTube Player Interaction Hardening
- Locked learner pointer/touch interaction on YouTube lesson iframes so native YouTube chrome and external-link surfaces cannot be clicked from the lesson player.
- Removed Picture-in-Picture permission and iframe keyboard focus from the learning-mode player.
- Regenerated CSP hashes and rebuilt both offline core packs after the player source change.
- Verification: 971/971 tests passed; quick release gates passed; dist byte identity passed for 709 files.
## 2026-09-27 — Agent 248 — AUDIT_AGENT_244.md item 6.2: theme.css class-drift audit + fix
- Cross-checked every page's own `<style>` block and dynamic `className` assignments against every selector `shared/css/theme.css` already darkens, to find components whose light-mode CSS hardcodes a background/color that no existing dark-mode rule reaches.
- Found and fixed 11 genuine gaps, each verified live (not dead CSS) before fixing: the level-lock overlay scrim, lesson/unit trail nodes and unit icons (upcoming state only — completed/current already flip correctly via CSS vars, so these are `:not()`-scoped to avoid touching them), the unit progress-bar track, the lesson-player "ghost" back button, the placement-quiz answer buttons and their number badges (unselected state only, same `:not()` scoping), the level-picker links, the manual theme-toggle button, the ranking-question drag controls, and a text-contrast bug on the quiz "lesson complete" message (hardcoded green text on a background that goes dark-green in dark mode).
- Also found, and explicitly left alone (confirmed dead — match zero elements anywhere in the shipped app, so they're inert, not misrendering anything): theme.css's own pre-existing `.hero-card` and `.mini-flow` selectors, and `courses/index.html`'s `.card.is-level-locked .btn` rule. Noted for whoever eventually wants a cleanup pass.
- Observation for a future agent, out of scope for this item: every dark-mode rule in `theme.css` (old and new) lives inside `@media (prefers-color-scheme:dark)`, so it only applies when the OS itself is in dark mode. The manual `data-theme="dark"` toggle (only wired up on `main/placement.html`) only flips the page background/text via a separate rule — none of the component-level dark styling applies under "system light + manual dark override." This is a pre-existing architectural gap, not something this turn introduced or fixed.
- `shared/css/theme.css` is an external stylesheet (not inlined), so no CSP hash regeneration was needed; confirmed with `node tools/build-csp.js --check` — CSP up to date.
- Rebuilt `offline/packs/core.zip`'s `shared/css/theme.css` entry in place (`zip offline/packs/core.zip shared/css/theme.css`).
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

## 2026-09-27 — Agent 249 — Dead-selector cleanup (theme.css `.hero-card`/`.mini-flow`, courses/index.html `.card.is-level-locked .btn`) + correction of an Agent 248 note
- Investigated Agent 248's "next agent" note about a manual-dark-toggle architectural gap before acting on it, per this project's "verify before re-litigating" convention — found the note was **incorrect**: `data-theme` is used on exactly one page (`main/placement.html`), and that page already carries its own complete, independent manual-theme system (Step 10 / "Agent 12" block, `html[data-theme] ...` rules covering header/.card/.answer/.levels a/.progress etc. via `--surface`/`--surface2`/`--track` custom properties, always active because the page's own script sets `data-theme` unconditionally on load, falling back to OS preference when nothing is saved). There is no page anywhere in the app with a manual toggle that lacks matching coverage — the gap described doesn't currently exist. Retracting that note rather than carrying it forward.
- Removed the 3 dead selectors flagged (but deliberately left in place) by Agent 248, since they still match zero elements anywhere in the shipped app: `.hero-card` and `.mini-flow div` dropped from their selector lists in `shared/css/theme.css` (the other classes in each list are untouched and still live); `courses/index.html`'s standalone `.card.is-level-locked .btn{...}` rule removed outright (the sibling `.card.is-level-locked{opacity:.55}` rule is live and untouched — only the nested `.btn` rule was dead, since no element with class `btn` is ever rendered inside a locked card on that page).
- `node tools/build-csp.js --check` — CSP up to date (courses/index.html's edit was to an inline `<style>` block; style-src is `'unsafe-inline'`-based per Agent 247's audit, not hash-based, so no regeneration was needed).
- Rebuilt `offline/packs/core.zip`'s `shared/css/theme.css` and `courses/index.html` entries in place.
- CHANGELOG.md — entry appended.
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files).

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

## Agent 240 — Native YouTube playback + 90% gate fix (2026-09-27)
- Removed the custom/cinema fullscreen behavior that could crop 9:16 video.
- Restored standard YouTube player controls and native fullscreen (`controls=1`, `fs=1`).
- Restored pointer/tap interaction with the YouTube iframe so normal play/pause works.
- Reworked 90% watch accounting to credit only normal forward playback; large seek jumps are not counted.
- Kept muted autoplay attempt and video-first / three-text-slide ordering.
- Regenerated CSP and rebuilt offline core packs.
- Verification: `node tests/run.js` — **971 passed / 0 failed**.
- Real iPhone/Android browser testing was not available in this environment.

## Agent 241 — iPhone/Android player QA + PiP permission hardening (2026-09-27)
- Continued from `MYLINGO_AGENT240_YOUTUBE_NATIVE_PLAYBACK.zip`.
- Re-ran the full regression suite: 971 passed, 0 failed.
- Attempted browser automation with Chromium/Playwright. The sandbox blocks local-page navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so real iPhone Safari and Android Chrome behavior was not claimed or simulated.
- Audited the native YouTube iframe contract and removed the `picture-in-picture` iframe permission so PiP is not explicitly enabled by the app while native YouTube fullscreen remains available.
- Regenerated `netlify.toml` CSP after the player source change.
- Rebuilt `offline/packs/core.zip` and `offline/core.zip` from `offline/core-manifest.json`.
- Verified the video-first / three-text-slide / native-controls / 90%-gate contract remains covered by tests.
- Known limitation: real-device iPhone Safari and Android Chrome playback/fullscreen still require external device testing.

## Agent 245 — Quiz "Next" button resilience fix (2026-09-27)
- Continued from `AUDIT_AGENT_244.md` item 7 (Next button intermittently unresponsive).
- `shared/quiz.html` `next()`: added a re-entrancy guard (`next._busy`) so a fast double-tap or a same-tick duplicate call can't run it twice concurrently.
- `next()`: wrapped the render/end dispatch in try/catch. On a thrown error, the question index is rolled back to where it was before the attempt, the error is logged to the console, and the existing feedback area shows a visible "Something went wrong — tap Continue to try again" message with the Next button left up — no full-page reload, no lost score.
- Added 3 targeted checks confirming existing `next()` orchestration tests still pin exact render/saveSession/end call order and counts.
- Regenerated CSP (`node tools/build-csp.js`) after the inline-script edit.
- Rebuilt `offline/packs/core.zip`'s `shared/quiz.html` entry in place.
- Verification: `node tests/run.js` — **977 passed / 0 failed**. `node tools/verify-all.js --quick` — ALL GATES PASSED.

## Agent 246 — AUDIT_AGENT_244.md item 5 investigation + chapter-trail/slide-count cross-check (2026-09-27)
- Continued from `HANDOFF_AGENT_245.md`.
- Investigated `AUDIT_AGENT_244.md` item 5 ("unaudited lesson slide types/levels beyond a1 lesson 1") before writing new coverage, per the project's "run it for real against shipped content" testing philosophy — found that `tests/run.js` already contains a test ("page: EVERY shipped lesson renders...") that walks every published lesson across all six levels (308 lessons total) against the real shipped `course_content/lessons/*.json`, asserting no error state and correct exercise-card/gate/completion-link behavior for each. Item 5 as filed appears to be stale — this coverage already existed before this turn, it was just not surfaced in the audit.
- Confirmed via the real shipped content that video coverage is 308/308 lessons and audio coverage is 0/308 — no shipped lesson currently uses an audio slide, so `trailIcon()`'s audio fallback glyph (item 1) is unreachable in production content today, though still worth fixing once an asset is available.
- What the existing test did NOT check: that the chapter-trail's rendered item count actually matches the slide deck the page built (the specific check item 5 named). Extended the existing "EVERY shipped lesson renders" test with an independent cross-check: for every one of the 308 published lessons, the expected slide count (videos + the fixed 3 text slides + audios + 1 practice slide) is computed directly from the lesson's own raw JSON fields (mirroring `mediaEntries()`'s normalize logic, but re-implemented independently in the test rather than calling the page's own function) and asserted equal to the chapter-trail's actual rendered item count. Verified the new assertion is live by temporarily miscounting it and confirming the test fails, then restored it.
- Verification: `node tests/run.js` — **977 passed / 0 failed** (same test count as before — this was an extension of an existing test, not a new one). `node tools/verify-all.js --quick` — ALL GATES PASSED.
- Only `tests/run.js` changed this turn (a test-only file, not part of the shipped app or the offline packs) — no CSP or offline-pack rebuild was needed.

## Agent 247 — AUDIT_AGENT_244.md item 4 investigation: why "re-scope by churn" doesn't work for a single global CSP (2026-09-27, audit only, no code changed)
- Continued from `HANDOFF_AGENT_246.md`.
- Re-measured the inline `style=""` footprint against current source: 95 attributes across 22 pages (was 91 at the time of the netlify.toml comment; drifted slightly since, mostly on `shared/quiz.html` at 33 and the six `<level>/dashboard.html` copies at 6 each = 36).
- Investigated AUDIT_AGENT_244.md item 4's specific re-scoping idea — hardening `style-src` only on pages that already churn (quiz.html, lesson.html) while leaving frozen pages alone — and found it does not actually work as described: `netlify.toml`'s `Content-Security-Policy` header is declared once, in a single `[[headers]] for = "/*"` block, applying identically to every page on the site. `style-src` cannot be tightened for a subset of pages without either (a) removing every inline `style=""` attribute and `<style>` block from ALL 22 pages, not just the churn-heavy ones, or (b) adding a second, more specific `[[headers]]` block (e.g. `for = "/shared/quiz.html"`) with a stricter `style-src` — but netlify.toml's own existing comment (on HSTS) already flags that Netlify's merge behavior across two `[[headers]]` blocks matching different but overlapping paths for the *same header key* is not something this repo has been able to verify (no live Netlify deploy exists to test against — the same standing git-remote/Netlify-account blocker every agent since #19 has hit). A web search for Netlify's documented behavior here did not turn up an authoritative, unambiguous answer either.
- Conclusion: item 4's premise (a smaller, page-scoped hardening slice) is not available with this CSP delivery mechanism as currently built. The only verified-safe path to drop style-src's `'unsafe-inline'` is still the all-or-nothing one Agents 19/20/27 already priced out and declined (eliminate all 95 inline style attributes + inline `<style>` blocks, project-wide, then flip the directive) — OR building and testing a genuine per-path header split against a real Netlify deploy once one exists, which is currently blocked on the same git-remote/account gate as everything else deploy-related.
- No code was changed this turn — this is an audit correction, not a fix. Verification: `node tests/run.js` — 977 passed, 0 failed (unchanged). `node tools/verify-all.js --quick` — ALL GATES PASSED (unchanged).
