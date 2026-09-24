# STATE.md — Production Readiness Protocol

## Current position
- AGENT: 27
- STEP: Deploy work still ON HOLD by the person's instruction. Applied the person's revised brand SVGs (icon, logo-horizontal, logo-stacked) and regenerated the raster icons derived from icon.svg; bumped the service-worker cache to v28 so installed clients drop the old cached logos. 970/970 tests; full gate PASS (dist 240 files byte-identical; sweep 108 loads / 54 offline 200 / 0 problems). Egress not re-probed (closed at Agent 23). Remaining: deploy-gated (repo, Netlify, domain, devices; ON HOLD), egress-gated (axe-core + Lighthouse), real screen-reader/device pass, unaudited pages listed in HANDOFF_PACKAGE_AGENT27.md, optional style-src hardening (declined).

## Agent 27 — revised brand logos

**Changed:** `shared/brand/icon.svg`, `logo-horizontal.svg`, `logo-stacked.svg` replaced with the person's files (byte-identical for the two logos; icon.svg was supplied inline and written out from that text). Regenerated with sharp from the new icon.svg: `favicon-32.png`, `favicon-192.png`, `favicon-512.png` (RGBA, transparent rounded corners), `apple-touch-icon.png` (180px, flattened on white so iOS shows no black corners), and `favicon.ico` (16/32/48/64 PNG entries, same layout as before). `sw.js` CACHE_VERSION `mylingo-v27` -> `mylingo-v28` (netlify.toml comment and the CACHE_VERSION test updated) because shell assets are cache-first; core.zip entries for all 8 brand files + sw.js replaced. No inline script changed (build-csp: unchanged, 16 hashes). tests: count unchanged at 970.

**Notes:** the new horizontal logo is slightly wider (aspect 3.31 vs 3.11 before). Pages size it by CSS height with `width:auto`, so it renders correctly; the HTML `width`/`height` attributes on the `<img>` tags were left at the old ratio (harmless intrinsic-size hints; pages/level packs not churned). The new icon.svg is a blue owl on a white rounded square (previous icon differed); anything assuming a dark/coloured icon background (splash, dark mode) was not visually re-checked in a browser.

**Tool-run verification:** `verify-all` full ALL GATES PASSED; rendered icon.svg to PNG and visually checked it.

## Agent 26 — lesson player + placement a11y

**Findings (code read):** (1) `#chapterTrail` was `<nav role="tablist">` with `role="tab"` buttons but no tabpanel, `aria-controls`, roving tabindex or arrow keys: a broken ARIA pattern that also erased the nav landmark. (2) Not-yet-reached trail items looked/announced as active controls but silently ignored clicks. (3) `goToSlide` replaced `#content` and re-rendered the nav, destroying the focused Continue/Back button, so keyboard/SR focus fell to `<body>` on every slide change. (4) `window.scrollTo({behavior:'smooth'})` ignored `prefers-reduced-motion`. (5) The disabled final "Pass lesson & continue" button explained itself only via `title` (invisible to touch/most SR). (6) placement.html answer buttons showed the chosen answer only via a CSS class (no state exposed when navigating Back).

**Changed:** `courses/lesson.html`: trail is a plain `<nav aria-label>` of buttons; active = `aria-current="step"`; unreached = `aria-disabled="true"` (click still gated by `maxReached`); each `.slide` is `tabindex=-1 role=region aria-label="Slide N of M: <label>"` and receives focus (preventScroll) on user-initiated Continue/Back/trail moves only (not first load); scroll behaviour is `auto` under reduced motion (guarded `matchMedia`); `.sr-only` CSS added, `#navHint` + `aria-describedby` on the disabled final button. `main/placement.html`: answer buttons set `aria-pressed`. build-csp re-run (16 hashes, netlify.toml updated); core.zip entries for both pages replaced. tests/run.js +2 (970); the Agent-lesson navigation test was updated from `aria-selected` to `aria-current`; harness gained an optional `matchMedia` flag. Mutation-checked (Continue not passing focus flag -> new test fails).

**Tool-run verification:** `verify-all` full: ALL GATES PASSED. Playwright Chromium check as above.

**Not changed / not claimed:** sw.js untouched (precedent). No VoiceOver/TalkBack/physical device run; forced-colors rules for the trail untouched (existing `.trail-item.active` outline still keyed on class). placement.html `aria-pressed` not exercised in a real browser (verified by source-pattern test only). Progressbar `aria-valuetext` on placement left as is.

## Agent 25 — TTS play button: lock on unsupported/failed instead of staying re-clickable

**Finding (code read):** `shared/quiz.html`'s `#qttsBtn` click handler called `speakTts(au.tts)` and, on a falsy return (no `speechSynthesis` in `window`, or the try/catch in `speakTts` throwing), only rewrote the button's text to "Audio unavailable on this device." The button itself stayed enabled and still carried `aria-pressed="false"`, so it looked like a working toggle that a user could keep pressing with no effect and no further feedback.

**Changed (shared/quiz.html only + core.zip entry + hashes):**
1. `renderMedia`'s TTS branch now resets the button to `disabled=false` / no `aria-disabled` on every render (each new question starts with a fresh attempt), in addition to the existing `aria-pressed="false"` / "🔊 Play audio" reset.
2. The click handler, on a failed `speakTts` call, now also sets `disabled=true`, `aria-disabled="true"`, and removes `aria-pressed` (it's no longer a meaningful toggle once dead), alongside the existing "Audio unavailable on this device" text.
3. `node tools/build-csp.js` re-run (16 script hashes; netlify.toml CSP updated); `offline/packs/core.zip`'s `shared/quiz.html` entry replaced in place. No other page, pack, or sw.js change.
4. `tests/run.js` +1 (968): new test renders a TTS-only question, confirms the button starts enabled, locks (disabled/aria-disabled/no aria-pressed/error text) after a failed `speakTts`, and comes back to the normal enabled state on the next `renderMedia` call for a new question.

**Tool-run verification:** `NODE_PATH=$(npm root -g) node tools/verify-all.js` (full, with browser sweep): ALL GATES PASSED — unit suite 968/968, CSP up to date, dist byte-identical to source (240 files), sweep 108 page loads / 54 offline 200s / 0 problem pages.

**Reviewed, not changed:** keyboard/focus/reduced-motion across radio/checkbox/dropdown options (`renderChoice`), matching (`renderMatching`, select-based), text/number/date inputs (`renderTextLike`), ranking (`renderRanking`, Agent 24's work), and the start/error/end overlays — each already sets a sensible initial focus target on render (`select.focus()`, `box.children[0]?.focus()`, `input.focus()`, `grid.querySelector('select')?.focus()`, `list.children[0]?.focus()`, `startBtn`/`retryBtn`/`errHomeBtn`/`next`/`.focus()` on show/finish) and the page's single `@media(prefers-reduced-motion:reduce)` block already covers every animated class used by these widgets (progress bar, spinner, result ring, option enter/grow/shake, card/overlay/modal entrance, feedback, text-pop). No gaps found.

**Assumptions / not done:** sw.js untouched (consistent with precedent for quiz.html-only edits). No real screen reader (VoiceOver/TalkBack) or physical device exercised this turn — the fix is verified via the Node test harness's `speakTts` spy (stands in for both "unsupported" and "threw"), not a real browser without-speechSynthesis environment, so "confirmed with a real unsupported browser" is NOT claimed.

## Agent 24 — ranking question: touch + screen-reader alternative to drag

**Finding (code read):** `renderRanking` made each row `draggable` (HTML5 DnD; not dependable on touch browsers) with only an ArrowUp/ArrowDown handler as the non-pointer path. The rows were bare `div`s (no list semantics), gave no spoken feedback when order changed, and touch users had no reliable way to reorder.

**Changed (shared/quiz.html only + core.zip entry + hashes):**
1. Each row gets two `button.rank-move` (up/down, 44x44px, `aria-label` "Move X up, currently position N of M"); first row's up and last row's down are disabled. Clicking swaps with the neighbour, renumbers, refreshes labels, and keeps focus on the used button (or the other one if it just became disabled).
2. `list` gets `role="list"` + an instruction `aria-label`; rows `role="listitem"`. A visually hidden `.sr-only` `role="status" aria-live="polite"` node (third child of the ranking card) announces "<item>, position N of M". Keyboard arrows and drop also call the same `sync()`.
3. `finishAnswer` disables `.rank-move` buttons (with the existing aria-disabled/draggable=false).
4. The kbHint text and the Check-order behaviour are unchanged; drag-and-drop still works.
5. `node tools/build-csp.js` re-run (16 script hashes; netlify.toml CSP updated); `offline/packs/core.zip` shared/quiz.html entry replaced in place (`zip offline/packs/core.zip shared/quiz.html`); level packs unchanged.
6. `tests/run.js` +2 (967): move-button structure/labels/disabled ends/renumber/live region/focus behaviour/submit order; keyboard + drop refresh button state, finishAnswer locking, 44px CSS. Mutation-checked (top-row up not disabled -> fail; drop not syncing -> fail).

**Tool-run verification:** `node tests/run.js` 967/967; `verify-all` full: ALL GATES PASSED (dist 240 files byte-identical; sweep 108 loads / 54 offline 200 / 0 problems). Real Chromium 375x740 with touch: `page.tap` on Move down / Move up reordered `She, tea, always, drinks` as expected, live region read "always, position 2 of 4", focus landed on the used button, no page errors, row did not overflow (screenshot checked).

**Assumptions / not done:** sw.js was not touched (same as Agent 15's quiz/lesson edits); no real iOS/Android device or screen reader was used, so "works with VoiceOver/TalkBack" is NOT claimed. Dark mode: quiz.html is light-only (no dark/forced-colors rules exist in it), so the new buttons follow the page's light styling.

## Agent 23 — clean-unzip check + packaging tool

**Tool-run this turn:** fresh unzip of app-production-agent22.zip (`.github/workflows/deploy.yml` and `.gitignore` present) -> `verify-all --quick` 964/964 ALL GATES PASSED; full `verify-all` ALL GATES PASSED (dist 240 files byte-identical; sweep 108 loads, 54 offline 200, 0 problems). Egress: HTTP 403 `host_not_allowed` from registry.npmjs.org.

**Reviewed, not changed:** `.github/workflows/deploy.yml` (reconstructed by Agent 22). Reads consistently with the test pins (one `--quick` gate step; both deploy jobs `needs: test`; publish dir `dist`; secrets NETLIFY_AUTH_TOKEN / NETLIFY_SITE_ID). Still never run — action version, alias/message text and the `permissions` block are Agent 22's choices; review before the first real run.

**Done:**
1. `tools/package.js` (new, not shipped in dist): `NODE_PATH=$(npm root -g) node tools/package.js <out.zip>` -> `zip -r -X . -x '.git/*' 'dist/*' 'node_modules/*'`, requires `.github/workflows/deploy.yml`, `.gitignore`, `netlify.toml`, `sw.js`, `STATE.md` in the archive, unzips into a fresh temp dir, runs `verify-all --quick` there, exits 1 on any failure.
2. `tests/run.js` +1 (965): pins that package.js uses `-r -X` with `.` and excludes, has no `'*'` glob, requires the dotfiles, verifies via `mkdtempSync` + `verify-all --quick`, and is not a runtime/dist file. Mutation-checked (`'*'` glob -> 964/1; dropping `.gitignore` from the required list -> 964/1).
3. STATE.md, DEPLOY.md updated. No page, pack, sw.js, core.zip, netlify.toml or workflow changes; dist still 240 files.

**Assumptions:** package.js was run (Agent 23 delivered zip built with it) — result recorded in HANDOFF_PACKAGE_AGENT23.md. Nothing else in this turn was inferred.

## Agent 22 — packaging defect found and fixed (dotfiles missing from the Agent 21 zip)

**Finding (tool-run):** unzipping `app-production-agent21.zip` into a clean dir and running `node tools/verify-all.js` gave `FAIL unit suite — 962 passed, 1 failed`. The failing test was "publish directory (Agent 16)": `ENOENT … .github/workflows/deploy.yml`. `unzip -l` confirmed the archive contains neither `.github/` nor `.gitignore` (441 files). Agent 21's "963/963, ALL GATES PASSED" was true of its working directory but not of the delivered zip — the zip was never re-verified from a clean unzip. Agent 21's edit to the workflow (test job -> `verify-all.js --quick`) therefore did not reach the deliverable.

**Done:**
1. `.github/workflows/deploy.yml` **reconstructed** (not recovered — no other copy existed in the zip or any handoff): three jobs (`test`, `deploy-preview`, `deploy-production`); `test` = checkout, setup-node 22, `node tools/verify-all.js --quick`; both deploy jobs `needs: test`, set up Node 22, run `node tools/build-dist.js`, publish `dist` with `nwtgck/actions-netlify@v3` using `NETLIFY_AUTH_TOKEN`/`NETLIFY_SITE_ID`. Reconstructed from STATE.md, DEPLOY.md, HANDOFF_PACKAGE_AGENT16/21 and the Agent 16 test pins; details the docs never recorded (action version, alias/message text, permissions block) are my choices — review them before the first real run. A header comment in the file says it was reconstructed.
2. `.gitignore` recreated: `dist/`.
3. `tests/run.js` +1 test (964/964): the `test` job has exactly one `node tools/verify-all.js --quick` step and no plain `node tests/run.js` step; both deploy jobs `needs: test`; three jobs; `.gitignore` exists; no dotfile/dot-directory is shipped in dist. Mutation-checked: reverting the step to `node tests/run.js` fails the suite (963/1), removing `.gitignore` fails it (962/2).
4. DEPLOY.md: short Agent 22 note. No page, pack, `sw.js`, `core.zip`, `netlify.toml` changes; dist still 240 files, byte-identical.
5. **Packaging rule (new):** build the archive with dotfiles included (`zip -r -X out.zip . -x '.git/*' 'dist/*' 'node_modules/*'`, NOT `zip -r out.zip *`), then unzip into a fresh dir and run `node tools/verify-all.js --quick` there before delivering.

**Verified (tool-run):** egress raw HTTP to registry.npmjs.org:80 -> 403 `host_not_allowed` (still closed). YAML parses (3 jobs, test step = `node tools/verify-all.js --quick`, both deploy jobs `needs: test`). `NODE_PATH=$(npm root -g) node tools/verify-all.js` (full): 964 passed / 0 failed; CSP up to date; dist byte-identical (240 files); sweep 108 page loads, 54/54 offline 200, 0 problem pages; ALL GATES PASSED. The delivered zip was then unzipped into a fresh directory and `--quick` re-run there (see handoff).

**UNVERIFIED until a real deploy:** the workflow has never run (no GitHub repo / secrets), and its deploy jobs are now a reconstruction, not the original text. Netlify build + dist + headers reaching browsers.

**Open (unchanged):** git remote, Netlify account/site, domain (or netlify.app URL), physical devices — the real blocker; axe + Lighthouse when egress opens (esp. courses/lesson.html, deployed dist); optional style-src hardening (declined); domain-gated canonical/og:image/og:url/sitemap; unaudited drag/drop ranking/matching, TTS, screen readers, devices, zoom.

## Agent 21 — CI runs verify-all --quick instead of just the unit suite

**Why this, not something else:** everything else open is deploy-gated (needs the person's git remote/Netlify/domain) or egress-gated (axe/Lighthouse need `npm install`, egress re-checked this turn — still 403). This item wasn't gated on either: `tools/verify-all.js --quick` uses only Node built-ins (confirmed by reading the script: `child_process`/`fs`/`os`/`path`, `require('playwright')` only reached in the non-`--quick` branch), so it can run in GitHub Actions with zero install step, same as the plain unit suite it replaces.

**Done:**
1. `.github/workflows/deploy.yml`: the `test` job's single step changed from `node tests/run.js` to `node tools/verify-all.js --quick`. This adds the CSP-staleness check and the dist byte-identity check (240 files) to CI, on top of the unit suite — so a PR that edits an inline `<script>` without re-running `build-csp.js`, or that breaks what `build-dist.js` ships, now fails CI instead of only failing a local run someone forgot to do. Deliberately kept `--quick`: the full CSP+SW+offline sweep needs Playwright (a browser download), which is a real CI-cost/CI-time tradeoff not worth taking on for a workflow that has never even run once yet — revisit once a real repo/CI history exists.
2. `DEPLOY.md`: updated the CI section to describe the new step, and added a short "Update (Agent 21)" note explaining the `--quick` tradeoff. No deploy jobs, secrets, or triggers touched.
3. No page, pack, `sw.js`, `core.zip`, or `netlify.toml` changes — `.github/workflows/deploy.yml` and `.md` files aren't shipped (`build-dist.js` excludes both), so dist byte-identity (240 files) is unaffected, confirmed below.

**Verification:** workflow YAML parses (`python3 -c "import yaml; yaml.safe_load(...)"` → 3 jobs, `test` step confirmed as `node tools/verify-all.js --quick`). `NODE_PATH=$(npm root -g) node tools/verify-all.js` (full, including the browser sweep) re-run after the edit: 963/963 unit tests, CSP up to date, dist byte-identical (240 files — unchanged, since the edited files aren't shipped), sweep 108 loads / 54 offline / 0 problems. ALL GATES PASSED.

**Not attempted (unchanged from Agent 20):** style-src hardening (91 `style=""` attributes + `<style>` blocks) — still low value/high churn (all inline scripts are already hashed; 0 inline event-handler attributes; would touch every shipped page's byte-identity group for a directive that isn't currently exploitable). Egress re-checked fresh this turn (raw `http.request` to `registry.npmjs.org:80`) — still 403, so axe/Lighthouse remain out of reach.

## Agent 20 — fresh re-verification, no code changes

## Agent 20 — fresh re-verification, no code changes

**Why no code changes:** every open item left by Agent 19 is either deploy-gated (needs a git remote, Netlify account/site, and domain from the person — not yet provided) or egress-gated (axe-core/Lighthouse need npm install). Neither became available this turn, so there was nothing safe to build without guessing at infrastructure that doesn't exist yet. Rather than touch shipped pages/CSP/service-worker/packs speculatively, this turn re-ran the full verification suite from a clean unzip to confirm the release Agent 19 left is still good, and re-checked egress directly (raw HTTP request to registry.npmjs.org, not npm) instead of trusting the prior turn's result.

**Done:**
1. Egress re-check (raw `http.request` to `registry.npmjs.org:80`, bypassing npm/DNS caching): **403** — still closed, same as every agent since 15.
2. `NODE_PATH=$(npm root -g) node tools/verify-all.js --quick`: unit suite 963/963, CSP up to date, dist byte-identical (240 files). PASS.
3. `NODE_PATH=$(npm root -g) node tools/verify-all.js` (full, including the CSP + service worker + offline browser sweep via global Playwright): 108 page loads, 54/54 offline pages status 200, **0 problem pages**. ALL GATES PASSED — identical shape to Agent 19's numbers, confirming the release is stable and reproducible from a fresh unzip, not just an artifact of Agent 19's working directory.
4. No page, pack, `sw.js`, `core.zip`, `netlify.toml`, or `tools/` changes. Only `STATE.md` and this handoff added.

**Not attempted:** the optional style-src hardening (91 `style=""` attributes + `<style>` blocks) — still assessed as low value / high churn (would touch every shipped page's byte-identity group for a directive that isn't currently exploitable, since all inline `<script>`s are already hashed and there are 0 inline event-handler attributes / `javascript:` URLs). Left open rather than done speculatively.

**Verification:** `node tests/run.js` → 963/963 (unchanged count). `diff -rq` against the Agent 19 zip = only `STATE.md` and the new `HANDOFF_PACKAGE_AGENT20.md`. No other files differ.
- Carried: lesson.html is light-only and does not load theme.css; quiz tests need `&recommended=1`; axe-core and Lighthouse last run by Agent 14 (Agents 15–19 had no egress); after editing any inline `<script>` run `node tools/build-csp.js`.
- SEO caveat unchanged: 8 per-learner pages are intentionally `noindex`.

## Release gate (Agent 19)

**Done:** `tools/verify-all.js` (new, dependency-free apart from optional Playwright; not shipped): (1) `tests/run.js`, (2) `build-csp.js --check`, (3) builds dist to a temp dir and byte-compares all 240 files with the source, (4) `csp-sweep.js` (skipped with `--quick` or when Playwright cannot be resolved, and says so). Exit 1 on first failure. `tests/run.js` +1 test (963/963), mutation-checked (renaming `--quick` fails it). DEPLOY.md section added. No page, pack, sw.js, core.zip or netlify.toml changes.

**Verified (tool-run, local):** full run: 963 passed; CSP up to date; dist byte-identical (240 files); sweep 108 loads, 0 CSP violations, 0 page errors, offline 54/54 = 200; ALL GATES PASSED.

**UNVERIFIED until a real deploy:** Netlify build + dist + headers reaching browsers; GitHub Actions never run (the workflow does not yet call verify-all; optional follow-up once a repo exists).

**Open:** axe + Lighthouse re-run when egress opens (esp. courses/lesson.html, deployed dist); optional style-src hardening; domain-gated canonical/og:image/og:url/sitemap; git remote / Netlify / domain / devices; unaudited: real drag/drop ranking/matching, TTS in use, screen readers, devices, zoom.

## CSP + service worker sweep (Agent 18)

Agent 17 left "not tested with the service worker active under the new CSP" open. Closed locally.

**Done:**
1. `tools/csp-sweep.js` (new; needs global Playwright; not shipped, not in dist): builds dist to a temp dir, serves it with the exact `Content-Security-Policy` read from `netlify.toml`, registers the real service worker, waits for precache, then loads 27 URLs (22 pages + `courses/course.html?level=` ×6, journey, lesson, quiz with `&recommended=1`) in light and dark, online and then `setOffline(true)`, with a `securitypolicyviolation` listener. Exit 1 on any violation, CSP console error, page error, or non-200 offline page. `--no-hashes` = control.
2. `tests/run.js`: +1 test (962/962): harness parses, reads netlify.toml CSP, uses dist build, keeps SW allowed, offline pass, control flag, not shipped. Mutation-checked (renaming `setOffline` fails the suite).
3. SECURITY.md: short section describing the sweep. No page, pack, sw.js, core.zip or netlify.toml changes (byte-identity groups intact); `node tools/build-csp.js --check` OK.

**Verified (tool-run, local):** 962/962; sweep: 108 page loads, **0 violations / 0 CSP console errors / 0 page errors**, offline 54/54 status 200 (service worker serving under the hash CSP); control (`--no-hashes`): 108/108 problem pages (no inline script runs → SW never registers → offline fails), so the harness detects breakage.

**UNVERIFIED until a real deploy:** Netlify build + dist + headers actually reaching browsers; GitHub Actions never run. Lesson URL uses a sequential-gate lesson id; the sweep does not seed progress, so the lesson may redirect (still a same-origin page, still CSP-checked).

**Open:** axe + Lighthouse re-run when egress opens (esp. courses/lesson.html, against deployed dist); optional style-src hardening (91 `style=""` + `<style>`); domain-gated canonical/og:image/og:url/sitemap (`node tools/build-sitemap.js https://<domain>`); git remote / Netlify account / domain / physical devices; unaudited: real drag/drop ranking/matching, TTS in use, screen readers, devices, zoom.

## CSP hardening (Agent 17)

**Key correction:** Step 5 assumed "33 onclick= attributes" forced `'unsafe-inline'`. Those 33 are `.onclick=` JS property assignments, which CSP does not restrict. A sweep of all shipped html/js finds **0** inline event-handler attributes and **0** `javascript:` URLs (pinned by a test). Only the ~40 inline `<script>` blocks needed `'unsafe-inline'`, and those can be hashed.

**Done:**
1. `tools/build-csp.js` (new, dependency-free): SHA-256 of every inline `<script>` block in the shipped pages (16 distinct hashes; six level indexes and six dashboards share theirs) → rewrites the `Content-Security-Policy` line in `netlify.toml`: `script-src 'self' 'sha256-…'…` (no unsafe-inline / unsafe-eval / unsafe-hashes). `--check` exits 1 when stale. `style-src 'self' 'unsafe-inline'` unchanged (91 `style=""` attributes + `<style>` blocks); all other directives unchanged; other headers unchanged.
2. Test +1 (961/961): policy equals the regenerated one; script-src is self+hashes only; independent recomputation for index.html; every inline script in every shipped page is covered; no inline handler attributes / `javascript:` URLs; style-src/default-src/frame-ancestors/object-src pinned. Mutation-checked: a corrupted hash fails the suite.
3. SECURITY.md, DEPLOY.md and a note in netlify.toml updated. **Maintenance rule: after editing any inline `<script>` run `node tools/build-csp.js`.**
4. No page, pack, sw.js or core.zip changes (byte-identity groups intact).

**Verified (tool-run, local):** node static server sending the exact policy from netlify.toml; Playwright, service worker blocked, light+dark, 23 URLs each (all 22 pages plus a second quiz, with quiz answering and placement start): **0 `securitypolicyviolation` events, 0 CSP console errors, 0 page errors**. Control: same pages with `script-src 'self'` only (no hashes) → 46/46 page loads report blocked inline scripts, proving the harness detects violations.

**UNVERIFIED until a real deploy:** the header actually reaching browsers from Netlify; the header is ~1.4 KB longer than before (well within limits). Not tested with the service worker active under the new CSP (SW is same-origin `sw.js`, unchanged, no inline script involved).

**Open:** style-src hardening (move 91 inline `style=""` attributes and `<style>` blocks to CSS files or hashes; low value vs. risk and byte-identity groups); axe + Lighthouse re-run when egress opens (also against a deployed `dist`); canonical/og:image/og:url/sitemap (domain-gated); git remote / Netlify / domain / devices.

## Publish-directory split (Agent 16)

**Problem (Agent 13 open item):** `publish = "."` served the whole repo (tests/, tools/, ~110 handoff `*.md`, result JSON). Agent 13 only hid tests/ and tools/ with unverified 404 redirects.

**Done:**
1. `tools/build-dist.js` (new, dependency-free): copies only runtime files, byte-for-byte, into `dist/` — root `index.html manifest.json sw.js robots.txt sitemap.xml?` + every top-level folder except `tests tools .github .git node_modules dist`, minus `*.md`. Exports `plan(root)` and `build(root,out)`; refuses an output dir that is or contains the repo root. 240 files, 3.6 MB.
2. `netlify.toml`: `publish="dist"`, `command="node tools/build-dist.js"`; removed the dead `/tests/*` `/tools/*` 404 redirects and the `*.md` X-Robots-Tag block. Headers, CSP and cache rules untouched. `.github/workflows/deploy.yml`: both deploy jobs set up Node 22, run the build, publish `dist`. `.gitignore` (new): `dist/`. DEPLOY.md documents it.
3. Tests: +1 (960/960): plan excludes internals/markdown/results, includes every page, every manifest file, all six level packs and their pages; temp-dir build is byte-identical with nothing extra; reference-integrity scan (any relative asset a shipped file mentions that exists in the source also ships); refuses to wipe the repo; netlify.toml/CI/.gitignore pins. Test walkers now skip a local `dist/` (they double-counted pages), and the suite is green with or without a built `dist/`.
4. sw.js, core.zip, level packs, and all 22 pages untouched (no page or pack changed), so byte-identity groups and offline manifests are unaffected.

**Verified (tool-run, local):** built `dist` served on a fresh static server: service worker registered, precache 90 entries (same as Agent 13), 22 pages × online and offline (`setOffline`) = 44/44 status 200, real content, 0 page errors / console errors / failed requests; `/tests/run.js`, `/tools/…`, `/STATE.md`, handoffs, `/netlify.toml`, `/RELEASE_IDENTITY.json`, `/.github/…` all 404; independent reference crawl of 1,619 asset references: 0 files present in the source but missing from dist.

**UNVERIFIED until a real deploy:** that Netlify runs the build command and serves `dist` with the existing header rules; the GitHub Actions workflow has still never run. `robots.txt` still disallows `/tests/` and `/tools/` (harmless, now non-existent paths).

**Open:** everything from Agent 15 — re-run axe + Lighthouse when egress opens (especially `courses/lesson.html`, plus Lighthouse against a `dist` deploy), CSP `'unsafe-inline'` removal (33 `onclick=`, 91 `style=` attributes), canonical/og:image/og:url/sitemap (domain-gated), git remote / Netlify / domain / devices.

## Step 10 leftovers, round 2 (Agent 15) — lesson player audit, quiz result screens

**Environment:** egress was CLOSED this turn (npm/axe-core/Lighthouse not installable). Used global Playwright + Chromium and a custom in-page audit (`tools/a11y/`): computed text colour vs effective solid background (WCAG 4.5:1, 3:1 large; gradient/image backgrounds skipped, off-screen elements skipped), unnamed controls, h1/main count, duplicate ids, horizontal overflow, target size <24px. This is NOT axe-core and NOT Lighthouse: no Lighthouse re-sweep was run, no axe re-run; the previous Agent 14 numbers for those stand for the untouched pages.

**Finding that reshapes earlier work:** `courses/lesson.html` intentionally does NOT load `shared/css/theme.css` (light-only fullscreen player, see the comment in the file). So Agent 12/14's dark-theme and forced-colors rules in theme.css never applied to the lesson player; it is light in both OS schemes.

**Method:** seeded `mylingo.progress.v1` with every exercise + lesson quiz id `{status:'completed',best:100}` — this unlocks the sequential lesson gate for direct URLs (all 62 lessons rendered, zero gate/error screens). Then 62 lessons × light/dark × 390/320 × every slide tab (lesson text + practice; NO lesson has video/audio/presentation/youtube content, so those slide types do not occur in shipped data — code path only).

**Findings and fixes (all in `courses/lesson.html`):**
1. Skip-link (visible on focus) and the ACTIVE chapter-trail dot: `#0b0c0d` on `#1959d1` = 3.16:1 → `#fff` (≈6:1). `.done` dot (dark on green) was fine and is kept.
2. Key-term chips (`.term`, shown on a2-unit-02-lesson-02 and c1-unit-04-lesson-03): `#8fe04a` on `#e9f8df` = **1.47:1** → `#2f6d06` (≈5.7:1).
3. Decorative `·` separator in the course header (`.sep`, 1.17:1) → `aria-hidden="true"`; one pinned test string updated.
4. Forced colors: new `@media (forced-colors:active)` block in lesson.html (active trail item 3px Highlight outline + underline, bordered dots, done dot gets a check mark, bordered term chips). Verified with Playwright `forcedColors:'active'`.
5. Test +1 (959/959): pins the white labels, done-dot label, term colour (and absence of `#8fe04a`), aria-hidden separator, forced-colors block, and that lesson.html still does not load theme.css. `core.zip` rebuilt (courses/lesson.html entry replaced in place); level packs unchanged.

**Clean results (nothing to fix):** all 248 lesson runs — no unnamed controls, exactly one `h1` and one `main` per slide, no duplicate ids, no horizontal overflow (320), no targets <24px; keyboard — visible focus indicator on every focused control in all 62 lessons, skip link first; WCAG 1.4.12 text spacing — 0 clipped, 0 overflow in all 62; quiz result screens — 72 result screens (6 quizzes per level × 6 levels × light/dark, mixed right/wrong answers giving 0/20/33/40/60/100 %) with no contrast issues or overflow; placement-120 driven end-to-end to its result (25 %) in light and dark, clean. Static grep: no other light-green text colours (`#58cc02`/`#8fe04a`/…) remain in html/css/js outside tests.

**Verification:** `node tests/run.js` 959/959; six level indexes one md5, six dashboards one md5; lesson.html `style="` count unchanged (4); `diff -rq` vs Agent 14 = courses/lesson.html, offline/packs/core.zip, tests/run.js, tools/a11y/ (new), LESSON_A11Y_RESULTS_AGENT15.json, STATE.md, this handoff. sw.js untouched.

**Not covered / open:** axe-core and Lighthouse were not re-run (no egress) — re-run both once egress is open, especially on courses/lesson.html; the custom audit skips gradient/image backgrounds and off-screen text; quiz result screens sampled (6/level) not exhaustive; real drag/drop ranking/matching, listening/TTS in use, real screen readers/devices/zoom; standing repo/host/domain/deploy, publish-directory split, CSP `'unsafe-inline'` removal.

## Step 10 leftovers summary (Agent 14) — real quiz screens, keyboard, text spacing, forced colors

**Method (tool-run):** Playwright + axe-core. To reach the real quiz page the URL needs `&recommended=1` (it bypasses the lesson gate; without it `quiz.html` redirects to `lesson.html?lesson=…` — verified). Walked a1-001 (start → question → answered-feedback → result) and a1-011 (13 questions covering banner, radio, checkbox, dropdown, fill-in-the-blank, matching, ranking) in light and dark, running axe at every screen before and after interaction. Keyboard: 70 Tab presses on 21 pages × light/dark checking every focused element for a visible focus indicator (outline or box-shadow), wrap-around (no trap) and skip link first. Text spacing (WCAG 1.4.12 CSS injected, seeded data): clipped text / page overflow scan on all 22 pages. Forced colors (`forcedColors:'active'`): progress fills vs tracks, and selected/current/correct/wrong states vs siblings.

**Findings and fixes (all in `shared/css/theme.css` and `shared/quiz.html`):**
1. Quiz `#start` and `#end` overlays were content outside landmarks (`region`) → `aria-labelledby="startTitle"` / `="result"`.
2. Light mode: quiz fill-in-the-blank answer text `.blank.filled` was #58cc02 on white (2.08:1) → `#2f6d06` (border keeps the brand green); dark: `var(--my-dark-success)`.
3. Dark mode: `.icon-btn` (speed/sound) light icon on a light-grey background (1.43:1) → dark surface; `.check-answer` (the "Check" button, white on light blue, 2.11:1 — only visible on question screens) plus `.lesson.current .node`, `.navlinks a.primary`, `.skip-link`, `.skip`, `.answer.selected .num` → dark label on the light-blue brand.
4. Forced colors (none existed): the UA flattens backgrounds, so **every progress bar's fill equalled its track — invisible on 8 pages** — and selected/current/correct/wrong states were indistinguishable (placement answer, lesson trail, journey unit/lesson, quiz options, nav tab). Added one `@media (forced-colors:active)` block: bordered tracks + `Highlight` fills; 3px `Highlight` outline for selected/correct/current, dashed `CanvasText` outline for wrong (so it differs from correct without relying on colour); underlined active nav label. Quiz feedback also has visible text ("Not quite. The correct answer is …"), so this is defence in depth, not the only cue.
5. Test +1 (958/958): forced-colors coverage list, the dashed wrong outline, `.check-answer` dark label, labelled start/end overlays. `core.zip` rebuilt (2 entries changed in total across rounds); level packs unchanged.

**Clean results (nothing to fix):** keyboard — every focused control on every page/scheme had a visible indicator, no keyboard traps, skip link first (placement intentionally starts with focus on the question heading, so its first Tab lands on the first answer); text spacing — 0 clipped elements, 0 overflow on 22 pages; axe over every question type in light and dark after fixes — clean; full-tree axe sweep (22 pages × light/dark × 390/1280/320) NO VIOLATIONS; overflow at 320/360 = 0.

**Final verification:** `node tests/run.js` 958/958; full Lighthouse re-sweep (raw `LIGHTHOUSE_RESULTS_AGENT14.json`): perf min 0.95, a11y 1.0, BP 1.0, CLS 0.000, no runtime errors, SEO<1 on exactly the same 8 intentional noindex pages, no perf regression >0.02 vs Agent 13; Playwright status/console/description/logo sweep 22/22; `style="` count 91; level indexes and dashboards each still one md5; `diff -rq` vs Agent 13 = theme.css, quiz.html, core.zip, tests/run.js, STATE.md, this handoff, results file. sw.js untouched.

**Not covered / open:** lessons 2–4 of a1 show no chapter trail when opened directly (sequential unlock), so only lesson 1's two slides were audited beyond the first screen — other lesson slide types (video, practice) and other levels' lessons are unaudited; the quiz result screen for every quiz variant, ranking/matching drag interactions beyond a click-through, listening/TTS controls in use; real screen readers, physical devices, 200% browser zoom on real hardware; standing repo/host/domain/deploy, publish-directory split, CSP `'unsafe-inline'` removal.

## Step 14/15 summary (Agent 13) — SEO/meta and offline integrity

**Audit first (tool-run):** all 22 pages already had `lang="en"`, a `<title>`, viewport, theme-color (except the practice redirect stub) and (Agent 9) a meta description. Missing: robots.txt, sitemap, canonical, Open Graph / Twitter tags, any noindex. Static titles on the six level index pages and six dashboards are generic ("Mylingo", "Mylingo Dashboard") because those files must be byte-identical (level comes from the URL; JS sets the real title at runtime) — left as is.

**Done:**
1. `robots.txt` (new): `Allow: /`, `Disallow: /tests/`, `Disallow: /tools/`. No `Sitemap:` line yet — it needs the production origin.
2. `tools/build-sitemap.js` (new, dependency-free): `node tools/build-sitemap.js https://<domain>` writes `sitemap.xml` (/, placement, courses index, 6 level indexes, 6 `course.html?level=`) and rewrites robots.txt with the `Sitemap:` line. Refuses non-https / non-bare-origin input (a wrong-host sitemap is worse than none). Excludes `/main/index.html` (duplicate of `/`), per-learner pages and the practice stub. **Run it once a domain exists.**
3. Open Graph (`og:type/site_name/title/description`) + `twitter:card=summary` on `index.html` and `main/index.html` (identical text in both, as the root-vs-main identity test requires). No `og:image` / `og:url` / canonical: those must be absolute URLs and no domain exists.
4. `<meta name="robots" content="noindex">` on the six dashboards (still byte-identical), `main/progress.html`, `shared/quiz.html`, `main/practice.html` (redirect stub). Rationale: per-learner or parameterised or stub pages with no standalone search value. Lesson/course/journey pages left indexable (content pages; canonical for their query-string variants is a domain-gated follow-up).
5. `netlify.toml`: `publish = "."` serves the entire repo root, i.e. `tests/`, `tools/` and ~100 handoff `*.md` files would be public (nothing secret, but noise). Added `/tests/*` and `/tools/*` 404 redirects (`force=true`) and `X-Robots-Tag: noindex` on `/*.md`. **UNVERIFIED until a real Netlify deploy** (also: no `404.html` exists; Netlify should fall back to its default 404). The proper fix — a dedicated publish directory — is a larger change, not attempted.
6. Tests: +1 (robots.txt content; sitemap tool paths exist / origin validation / robots line; noindex set is EXACTLY the 9 expected pages across every HTML page in the tree; OG tags on both landing pages). 956 → **957/957**.
7. Packs: `core.zip` (10 entries) and all six level packs (1 entry each) rebuilt; the byte-for-byte zip test passes.

**Step 15 — real offline test (Playwright + real service worker, `context.setOffline(true)`):** registered the SW, waited for precache (`mylingo-v27-static`: 90 entries), reloaded, went offline, navigated to all 22 pages (with the params quiz/lesson/course/journey need): 22/22 returned 200 from the SW with real content, zero page errors, zero failed requests; `a1/index.html` showed all 23 cards offline. This is real evidence for the core shell offline; the per-level pack install flow was verified by Agent 8 and the pack zips are byte-checked by the test suite.

**Verification:** `node tests/run.js` 957/957; full Lighthouse re-sweep (raw: `LIGHTHOUSE_RESULTS_AGENT13.json`): perf min 0.95, a11y 1.0, BP 1.0, CLS 0.000, no runtime errors, SEO 1.0 on 14 pages and 0.63–0.66 on the 8 noindex pages (only `is-crawlable` differs, intentionally; the perf dip on c2/dashboard 0.99→0.97 is run-to-run LCP variance, 2.0s vs 2.4s, seen before); Playwright status/console/description/logo sweep 22/22; `style="` count 91; six level index pages one md5; dashboards one md5; `diff -rq` vs Agent 12 = the 9 pages above + the 6 dashboards, netlify.toml, robots.txt, tools/, tests/run.js, 7 zips, STATE.md, handoff, results file. sw.js untouched.

**Open / not done:** canonical + og:image + og:url + sitemap deployment (all need the domain); dedicated publish directory; real search-engine behaviour (Search Console) is only observable after deploy; forced-colors / zoom / keyboard-only checks from Step 10 still optional; standing repo/host/domain/device/CSP-`unsafe-inline` items.

## Step 10 summary (Agent 12) — axe-core accessibility pass: light/dark × 3 viewports × states

**Method (tool-run):** axe-core (npm, egress open) injected via Playwright on all 22 pages, tags wcag2a/2aa/21a/21aa/22aa + best-practice, in light and dark colour schemes at 390, 1280 and 320px wide (the `xs` width doubles as a reflow check); plus seeded returning-learner data (`mylingo.progress.v1`) on 7 data-driven pages; plus interactive states (quiz start / question / answered / error, lesson player, course, journey, filtered level index, placement question / result / manual chooser); plus placement across all four OS-scheme × manual-theme combinations. Tooling lives outside the tree (/home/claude/lh; reinstall with `npm i axe-core`).

**Finding:** light mode was clean everywhere, but **dark mode had many real failures (contrast as low as 1.07:1)**, invisible to Lighthouse: components with hard-coded white surfaces (`.stat`, `.empty`, `.row`, mastery-review and offline-pack sections and their buttons/chips) receiving the dark theme's light text; white-on-light-blue buttons (`.mr-action`, `.offline-btn.primary`, `.findlevel a`); bottom-nav labels resolving `--muted`/`--brand` at `:root` (the light values); pale status chips (`.state.upcoming`, `.status.not-started`, `.badge`); quiz error text. The placement page's manual theme toggle defaulted to LIGHT even on a dark OS, which mixed light text onto white cards (`.answer` buttons weren't themed at all). Also: result and manual-chooser views of placement had no `h1`; journey unit bars were `div[aria-label]` without a role (`aria-prohibited-attr`); lesson `.player-top` and the quiz error overlay were content outside landmarks (`region`).

**Fixes:**
1. `shared/css/theme.css` — one appended, commented `@media (prefers-color-scheme:dark)` block (all `!important`, same convention as the existing dark block): dark surfaces for `.stat,.empty,.mr-section,.offline-section,.row`; `.offline-btn`; dark-on-light-blue for `.offline-btn.primary,.mr-action,.findlevel a`; `.mr-chip` (non-status), `.mr-meter`, `.offline-network`, `.badge`, `.badge.neutral`, `.state.upcoming`, `.status.not-started`; `.errbox`; nav `--as-muted/--as-brand` set on `.mylingo-appshell`.
2. `main/placement.html` — theme defaults to the OS preference (guarded `typeof matchMedia`) when there is no valid saved choice; a saved choice always wins; a full token set (`--brand/--ink/--muted/--line/--bg/--surface/--surface2/--track/--on-brand`) is defined for BOTH `data-theme` values with explicit surface rules, so every OS × manual combination is legible; `#resultTitle` and the manual chooser heading are now `h1` (only one of the three views is ever visible; CSS selectors updated `.manual h2`→`.manual h1`, `.result h1,.result h2`).
3. `courses/journey.html` — unit bars get `role="progressbar"` + `aria-valuemin/max/now`; existing `aria-label` kept (pin unchanged).
4. `courses/lesson.html` — `.player-top` gets `role="region" aria-label="Lesson navigation"`; `shared/quiz.html` — error overlay gets `aria-labelledby="errTitle"`.
5. `tests/run.js` — two new tests (OS-default theme incl. saved-choice-wins and junk-falls-back; result/manual `h1` + both theme token blocks); the h1-count pin is 3 (intro, result, manual chooser). 954 → **956 tests, 956 pass**.
6. `offline/packs/core.zip` rebuilt after each edit round (in-place entry replacement); byte-for-byte zip test passes. Level packs unchanged.

**Final verification (this turn):** axe full-tree sweep (22 pages × light/dark × 390/1280/320) → only one hit, `courses/course.html` dark @320 "no h1" (page contains an `<h1>`; a timing artifact — re-run with course/journey/lesson URLs → NO VIOLATIONS); seeded-data sweep on 7 pages → NO VIOLATIONS (after `.status.not-started` fix); interactive-state sweep → clean in both schemes; placement 4 combos × question/result → clean; horizontal-overflow check at 320 and 360px on all 22 pages with seeded data → 0 overflowing pages; full Lighthouse re-sweep (raw `LIGHTHOUSE_RESULTS_AGENT12.json`) → 22/22, perf min 0.95 (shared/quiz.html), a11y/BP/SEO 1.0, max CLS 0.000, no runtime errors, no perf regression >0.02 vs Agent 11; Playwright status/console/description/logo sweep 22/22 clean; `grep -c 'style="'` still 91; six level index pages and six dashboards each still one md5; `diff -rq` vs Agent 11's tree = journey, lesson, placement, quiz, theme.css, tests/run.js, core.zip, STATE.md, the new handoff and results file. sw.js untouched.

**Behaviour changes to know about (deliberate):** placement's default theme now follows the OS (previously always light); placement result/manual headings are `h1` not `h2`; card aria-labels were removed in Agent 11 (unchanged).

**Not verified / open:** real screen-reader (VoiceOver/TalkBack/NVDA) and voice-control behaviour, physical-device rendering, keyboard-only walkthrough beyond axe's automated rules, forced-colors/high-contrast mode, text-spacing/200% zoom beyond the 320px reflow check, and any state not reachable by the scripted flows (e.g. quiz result screen with every question type). axe finds roughly a third of WCAG issues; this is a strong automated floor, not a conformance claim. Dark-mode fixes live in one theme.css block; new components with hard-coded white surfaces will need adding to it. Post-deploy Lighthouse, repo/host/domain, devices, CSP `'unsafe-inline'` removal unchanged.

## Step 9 addendum (Agent 11) — WCAG 2.5.3 Label in Name on card links

**Finding (Agent 10's only open item):** `label-content-name-mismatch` on the 6 level `index.html` pages, `courses/index.html` and `main/practice.html` (which redirects to courses/index). Level quiz cards carried `aria-label="Title, Status"` and course cards `aria-label="Open Title course"`, neither of which contains the card's other visible text (best pill, category, description, tags / level badge, stats, CTA). Lighthouse's a11y score was 1.0 regardless (audit is unweighted) but voice-control users saying a card's visible words would not match its accessible name.

**Fix:** removed the `aria-label` from both card templates (6 byte-identical level index pages: one string each; `courses/index.html`: one string). A link with no `aria-label` is named from its content, which by construction contains all visible text. Trade-off, stated plainly: the screen-reader name is now longer (verified name/text for an a1 card: "Present Simple / Grammar / Practice Present Simple. / Not started / Grammar / A1" as visible text; the old label was just "Present Simple, Not started") but strictly more informative, and status still comes through because the visible "Completed / In progress / Not started" text is in the card.

**Tests changed (deliberately — these were behaviour pins, not regressions):** four assertions in `tests/run.js` that pinned the old aria-label strings (courses/index card content; `<level>/index.html` card content ×3 incl. the "PINNED: accessible name is just ', Not started'" case and the quote-escaping case) now assert NO aria-label and keep their intent (a title with quotes cannot break the `href`; the untitled card's name comes from its visible status text). Still 954 tests, 954 pass; count unchanged because assertions were replaced, not deleted.

**Verification (tool-run this turn):** `node tests/run.js` 954/954; Lighthouse on a1/index, c2/index, courses/index, main/practice — label-content-name-mismatch gone, a11y 1.0, CLS 0; full 22-page Lighthouse re-sweep after the change (raw: `LIGHTHOUSE_RESULTS_AGENT11.json`): perf min 0.93 (shared/quiz.html, run-to-run 0.93–0.95, LCP ~2.7s), a11y/BP/SEO 1.0 all, max CLS 0.000, no runtime errors, no flagged layout-shift/unsized-images/label-content-name-mismatch on any page; Playwright console/status/description/logo-dimension sweep 22/22 clean; `grep -c 'style="'` still 91; six level index pages still one md5; offline packs rebuilt by in-place entry replacement (core.zip 7 entries updated, each level pack 1) and the byte-for-byte zip test passes. `diff -rq` vs Agent 10's tree: only the 7 HTML files above, `tests/run.js`, the 7 pack zips, STATE.md, the new handoff and results file. sw.js untouched (documents are network-first).

**Environment:** network egress open again (same Lighthouse 13.5.0 / Playwright Chromium 1194 / local `python3 -m http.server` setup as Agent 10; note a background server did not survive between tool calls — start it in the same command as the run). Static-file scores only; not the deployed site.

**Still open (not Lighthouse-fixable locally):** post-deploy Lighthouse (render-blocking, unminified JS/CSS, document-latency, cache insights are unweighted here and depend on Netlify headers); shared/quiz.html perf 0.93–0.95 (LCP ~2.7s) — no fix attempted; standing repo/host/domain/device/CSP-`unsafe-inline` items unchanged.

## Step 9 summary (Agent 10) — real Lighthouse sweep of all 22 pages, and the CLS/unsized-image findings it surfaced fixed

**Environment (checked, not assumed):** network egress was OPEN this turn (`curl -I https://registry.npmjs.org/lighthouse` → HTTP/2 200), unlike Agent 9's turn. Installed `lighthouse@13.5.0` + `chrome-launcher` under `/home/claude/lh` (outside the deliverable tree) and drove it against Playwright's bundled Chromium (`/opt/pw-browsers/chromium-1194`) with `--headless=new --no-sandbox`. Pages served by `python3 -m http.server` from the tree root, so Netlify-only behaviour (compression, HTTP/2, the `netlify.toml` header/CSP policy) is NOT exercised — scores are for the static files, not the deployed site. Lighthouse defaults: mobile emulation, simulated throttling; categories performance/accessibility/best-practices/seo.

**Result 1 — the missing-SEO finding is confirmed closed with real Lighthouse:** SEO = 1.0 on all 22 pages (Agent 8 measured ~0.90–0.91 before Agent 9's meta descriptions). This is the first time all 22 pages have had an actual Lighthouse run (previously 5/22, all pre-fix).

**Result 2 — baseline sweep of Agent 9's tree (before any edit this turn)** found what Agent 9's Playwright-only probe could not: perf 0.94–1.0; a11y 1.0, BP 1.0, SEO 1.0 everywhere; CLS still failing "good" in Lighthouse on 11 pages — the 6 dashboards at 0.107 (Agent 9's Playwright probe read 0.0799 at a different viewport/emulation), the 5 of 6 level `index.html` pages at 0.140 (b2 0.044, i.e. run-to-run variance), `main/progress.html` 0.060; and the `unsized-images` audit failing on 15+ pages (the header logo `<img>` had no width/height everywhere except the 6 dashboards).

**Fixes this turn (all HTML-only, no JS-module or CSS-file changes):**
1. `<img width height>` on every header logo that lacked them (ratio from the SVG's real 3401x1095 intrinsic size at each page's CSS height): 81x26 (`.brand-logo` 26px: 6 level index pages, courses/course, courses/index, courses/journey), 84x27 (`.logo` 27px: index.html, main/index.html, main/progress.html), 75x24 (main/placement.html), 62x20 (shared/quiz.html `.brand-logo-sm`), plus quiz.html's splash `icon.svg` 64x64. `main/practice.html` and `courses/lesson.html` have no logo `<img>` of their own (practice redirects to courses/index).
2. Level `index.html` (6, byte-identical): `main{min-height:100vh}` so the footer starts below the fold (shifts of below-the-fold nodes are not scored), `.sub{min-height:18px}`, `.count{min-height:15px}` (measured: 18px/15px at 320–768px wide) — these two empty `<p>` lines gaining text after the fetch pushed `#grid`/controls down. CLS 0.140 → 0.000.
3. `main/progress.html`: `#levels{min-height:204px}` plus `@media(max-width:520px){#levels{min-height:311px}}` (measured final heights of the 6 level cards at both layouts; the existing 520px breakpoint is where the height flips). CLS 0.060 → 0.000.
4. Dashboards (6, byte-identical, verified by `md5sum`): `main{min-height:100vh}` and `.reset{min-height:47px}`, plus a new `pending` gate: JS adds `main.pending` right after the level-lock check and removes it in a `finally` around the (now `render()`-wrapped) original `load()` body; CSS makes `#body,#resetWrap,#masteryReviewMount,#offlinePacksMount` `visibility:hidden` only while pending (layout space is still reserved, so nothing moves, and hidden nodes are not scored). The fetch-failure path was tested (route-aborted `quizzes.json` → `pending` removed, mounts visible).
   - **Important disclosure — why this went beyond Agent 9's CSS-only fix:** Agent 9's `min-height` values only cover the *empty* (first-time learner) state. Testing with a seeded `mylingo.progress.v1` (5 and 40 attempted quizzes) — a state neither Agent 8 nor Agent 9 measured — showed dashboard CLS of **0.26 / 0.22** for a returning learner (`#body` grows 118px→1,360px+; `#progressBackupWrap` and `#masteryReviewMount` jump off-screen). Real learners are mostly returning learners, so the earlier "0.08 fixed" claim did not hold for them. With the `pending` gate: 0.0000 for 0, 5 and 40 seeded quizzes (Playwright layout-shift probe, 412x823 mobile emulation) and 0.000 in Lighthouse.
   - Trade-off, stated plainly: the below-stats sections (progress rows, mastery review, offline packs, reset button) now appear together once `quizzes.json` resolves instead of popping in and shoving each other down. Dashboard Lighthouse perf went from 0.96–0.99 to 0.97–0.98 and LCP from ~1.7–1.9s to ~2.0–2.4s in the final sweep (simulated throttling; dashboards are not the landing page).
5. Rebuilt `offline/packs/core.zip` and the six level packs (in-place entry replacement from the tree, preserving order/compression; core.zip: 20 entries updated, each level pack: 2). Verified by the project's own byte-for-byte zip test.

**Final full 22-page Lighthouse sweep (after all fixes), mobile, Lighthouse 13.5.0, local static server:** min perf 0.95 (shared/quiz.html, LCP 2.7s — lowest, unchanged, no fix attempted), a11y 1.0 / best-practices 1.0 / SEO 1.0 on every page, max CLS 0.000, no runtime errors. Raw results are in `LIGHTHOUSE_RESULTS_AGENT10.json`.

| Page | Perf | A11y | BP | SEO | CLS (before this turn's fixes) | LCP ms | TBT ms |
|---|---|---|---|---|---|---|---|
| a1/dashboard.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.107) | 2067 | 13 |
| a1/index.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.140) | 1842 | 26 |
| a2/dashboard.html | 0.97 | 1 | 1 | 1 | 0.000 (was 0.107) | 2435 | 46 |
| a2/index.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.140) | 1777 | 16 |
| b1/dashboard.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.107) | 2058 | 13 |
| b1/index.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.140) | 1776 | 11 |
| b2/dashboard.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.107) | 2149 | 0 |
| b2/index.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.044) | 1690 | 0 |
| c1/dashboard.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.107) | 2156 | 0 |
| c1/index.html | 1 | 1 | 1 | 1 | 0.000 (was 0.140) | 1738 | 5 |
| c2/dashboard.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.107) | 2084 | 12 |
| c2/index.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.140) | 1671 | 9 |
| courses/course.html | 1 | 1 | 1 | 1 | 0.000 (was 0.000) | 1378 | 8 |
| courses/index.html | 1 | 1 | 1 | 1 | 0.000 (was 0.000) | 1652 | 15 |
| courses/journey.html | 1 | 1 | 1 | 1 | 0.000 (was 0.000) | 1369 | 0 |
| courses/lesson.html | 1 | 1 | 1 | 1 | 0.000 (was 0.000) | 1705 | 0 |
| index.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.000) | 1838 | 0 |
| main/index.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.000) | 1981 | 32 |
| main/placement.html | 0.98 | 1 | 1 | 1 | 0.000 (was 0.000) | 1906 | 0 |
| main/practice.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.000) | 1859 | 6 |
| main/progress.html | 0.99 | 1 | 1 | 1 | 0.000 (was 0.060) | 1741 | 0 |
| shared/quiz.html | 0.95 | 1 | 1 | 1 | 0.000 (was 0.000) | 2735 | 3 |

**Playwright full-tree regression sweep (390x844, all 22 pages):** every page 200, zero console errors, zero page errors, description meta present, no header-logo `<img>` left without width+height. `grep -c 'style="'` across the tree still 91 (SECURITY.md count unaffected — no inline style attributes added).

**Open, NOT fixed (and why):**
- `label-content-name-mismatch` still reported on the 6 level `index.html` pages, `courses/index.html` and `main/practice.html` (quiz/course card `<a>` elements whose `aria-label` = "Title, Status" does not contain all the visible text). Lighthouse a11y score is still 1.0 (audit carries no weight there), but it is a real WCAG 2.5.3 (Label in Name) concern for voice-control users. The `aria-label` format is pinned by existing tests (tests/run.js ~10863, ~11443–11472), so changing it is a deliberate accessibility/behaviour decision, not a drive-by edit. Options: drop the `aria-label` (name becomes the full card text — more verbose for screen readers), or reorder it so it starts with/contains the visible text.
- Informational (unweighted or low) insights unchanged: render-blocking, unminified JS/CSS, document-latency, cache-insight, unused JS. Netlify compression/caching headers will change several of these; re-measure post-deploy.
- Nothing about a real deployment, physical devices, or the standing Step 1–4 blockers has changed.

## Step 9 summary (Agent 9) — fixed both of Agent 8's real, open findings

**Environment note, checked not assumed:** this sandbox has no network egress at all (confirmed: `curl registry.npmjs.org` and `curl api.anthropic.com` both refused by the egress proxy). Agent 8's turn apparently had npmjs.org allowed; this turn didn't. `npm install lighthouse` was not possible here. Playwright 1.56.0 + its bundled Chromium (`/opt/pw-browsers`) were already installed locally (no install needed), so all verification this turn used a direct Playwright `PerformanceObserver({type:'layout-shift'})` probe and a Playwright console/nav-error sweep instead of the Lighthouse CLI. This gives real, measured CLS numbers and real console-error/status data — just not an actual Lighthouse composite score. Flagging this plainly so nobody mistakes "sweep passed" for "Lighthouse re-run and confirmed the score."

**Finding #1 (meta descriptions) — FIXED, all 22 pages.**
- Added a distinct, accurate `<meta name="description">` to every page, inserted right after the viewport meta tag.
- Constraint discovered by running the test suite (not assumed): two existing tests require byte-identical HTML across certain page groups —
  1. `<level>/index.html` must be byte-identical across all six levels (a1–c2), and likewise `<level>/dashboard.html` — the level comes only from the URL, never from page content.
  2. `index.html` (root) and `main/index.html` must be identical once each file's own path-depth idioms are normalised — the normalisation table has no rule for meta-description text, so the two pages' descriptions must be identical text, not just similar.
- First pass wrote a different description per level and per landing page, which broke both of those tests (951/954). Corrected to: one shared description for the two landing pages (`index.html` + `main/index.html`), one shared description for all six level `index.html` files, one shared description for all six level `dashboard.html` files, and distinct descriptions for the remaining 8 pages (courses/*, shared/quiz.html, main/placement.html, main/progress.html, main/practice.html) which have no such identity constraint.
- Rebuilt `offline/packs/core.zip` and all six level packs (`a1.zip`–`c2.zip`) after the change, since core.zip bundles 21 of the 22 edited pages and each level pack bundles its own `index.html`/`dashboard.html`. Verified via the project's own byte-for-byte zip-integrity test, not just re-zipping and assuming it matched.
- Not independently verified against an actual SEO audit score (see environment note above) — verified structurally (every page has a distinct-where-required, accurate, present `<meta name="description">`) and functionally (954/954 tests, full page sweep below).

**Finding #2 (CLS on the 6 level dashboards) — FIXED and measured, not just theorized.**
- Used Agent 8's own real, already-root-caused diagnosis as the starting point (did not re-diagnose from scratch, per the resume instructions): (a) `<img class="brand-logo">` has no explicit width/height, so the browser can't reserve its space before the SVG loads; (b) `#stats` and `#body` start empty in the static markup and are filled by the page's own inline script measurably after first paint, pushing everything below them (`#resetWrap`, `#masteryReviewMount`, `#offlinePacksMount`) down after the page has already painted.
- Independently re-confirmed (b) with a fresh Playwright `PerformanceObserver` probe against the untouched `a1/dashboard.html` before touching anything: measured CLS = **0.5575**, with the dominant shift's `sources[]` showing `masteryReviewMount`'s box moving from `y:164,h:429` to `y:676,h:168` — i.e. ~512px of content appeared above it after first paint. This matches Agent 8's diagnosis; did not need to re-derive it, just checked it was still true before building on it.
- Fix applied, to all six dashboards identically (verified via md5sum: all six `dashboard.html` are byte-identical, all six `index.html` are byte-identical):
  1. `<img class="brand-logo">` now carries `width="81" height="26"` (81×26 matches the SVG's real intrinsic aspect ratio, 3401×1095, at the CSS-rendered height of 26px), so the browser reserves the right box before the image loads. The existing `.brand-logo{height:26px;width:auto}` CSS is untouched and still controls the actual rendered size — the width/height attributes only supply the aspect ratio for space reservation, a standard technique.
  2. `.stats` given `min-height:267px` and `#body` given `min-height:118px`. These aren't arbitrary guesses: 267px is the dashboard's actual, deterministic rendered height for its 6 stat tiles (gamification.js is loaded on every dashboard with no error path that skips its 2 tiles, so it's always 6 tiles → 3 rows at this viewport width, not a variable count) — measured directly via `getBoundingClientRect()` on the live page, not estimated from CSS math. 118px is the measured height of `#body`'s minimum real state (the "no quizzes yet" empty message) — a learner with actual quiz history will still see some residual shift as their list renders in, since a user's list length is inherently unbounded; this is a real, disclosed limitation, not a claim of full elimination.
  - Deliberately did NOT touch `#masteryReviewMount`'s CSS — Agent 8 already established it's a downstream bystander, not the source, and re-patching it would repeat the exact mistake that turned out to do nothing last turn.
  - Deliberately did NOT restructure `load()`'s async logic (e.g., rendering stats synchronously from localStorage before awaiting the `quizzes.json` fetch) even though that would likely close the gap more precisely than a min-height guess — that's a behavior change to code exercised by the existing dashboard test suite, and the current CSS-only fix gets a real, verified, large improvement with zero behavioral risk. Left as a possible sharper follow-up for whoever owns this next, not attempted blind.
- **Measured result, before/after, same probe, same page, same viewport (390×844, matching the earlier iPhone-class emulation used in Steps 7/9):** CLS **0.5575 → 0.0799** — an 86% reduction, and under Lighthouse's own "good" CLS threshold (<0.1). The one remaining shift (0.0799) is the page's `<footer>` being pushed below the viewport fold as `#masteryReviewMount`/`#offlinePacksMount` finish mounting — a real, disclosed, much smaller residual, not hidden or rounded away.
- This was iterative and measured, not one-shot: an initial `min-height:180px`/`96px` guess for `.stats`/`#body` got CLS to 0.1325 (just above the "good" line); re-measured the actual rendered heights, corrected to 267px/118px, re-measured again, got 0.0799. Recording this so the next agent trusts the final numbers as measured, not as a first guess that happened to sound plausible.
- Rebuilt `offline/packs/core.zip` and all six level packs again after this edit (core.zip bundles all six dashboards; each level pack bundles its own). Confirmed via the zip-integrity test both times (once after the first CSS guess, once after the corrected values) — not skipped just because "it was rebuilt already this turn."
- `SECURITY.md`'s inline-`style=`-attribute count (91) is unaffected — this fix used a `<style>` block CSS rule and HTML `width`/`height` attributes, not new `style="..."` attributes. Checked with a repo-wide `grep -c 'style="'` before and after (still 91), not assumed unaffected because "we didn't touch SECURITY.md."

**Full-tree regression sweep after both fixes** (Playwright, headless Chromium, 390×844 viewport, local static server — same page set Steps 6/7/9 have used): all 22 pages load with **200 status, zero console errors, zero page errors**, and every page's `<meta name="description">` is present and non-empty. This isn't a Lighthouse a11y/best-practices re-certification (see environment note), but it does rule out the fixes having broken page load, script execution, or the meta tags themselves.

`node tests/run.js`: **954/954**, re-run after every edit (both meta-description passes, both CLS-value passes, both pack rebuilds) and confirmed clean at the end — same discipline as prior agents.

**Diff against Agent 8's tree, confirmed with `diff -rq`, no surprises:** exactly the 22 HTML pages (meta description), the 6 dashboard.html files additionally (CLS fix — already counted in the 22), and the 7 offline pack zips (rebuilt to match). Nothing else in the 344-file tree changed.

**What Step 9 still has NOT done:**
- The full 22-page Lighthouse sweep (still only 5/22 have ever been run through actual Lighthouse, all by Agent 8, before either fix). This turn's verification is real but is Playwright-probe-based, not Lighthouse-based, because Lighthouse could not be installed in this environment (see environment note). If a future turn has npm registry access, running `npm install lighthouse` and re-auditing all 22 pages (or at least the remaining ~17) would give an actual before/after SEO and performance score instead of the structural/console-error/CLS-probe evidence gathered here.
- No independent confirmation of the SEO score improvement specifically (expected to move off ~90-91 now that the meta description gap is closed, but not measured with Lighthouse itself this turn).

## Step 8 + 9 summary (Agent 8)
- Checked the toolset before assuming either step was blocked, per Agent 7's own closing note (this is now the 4th time in a row "impossible here" turned out false). `npm install lighthouse` worked directly (npmjs.org is in the sandbox's allowed egress) — Lighthouse 13.5.0 installed clean, no network issues.
- Built a throwaway local server replicating netlify.toml's exact header block (same approach as Steps 6/7's browser/device servers), so both Lighthouse and Playwright audited the real production headers. Not committed — ephemeral tool for this turn, deleted after use (same treatment as Step 6/7's ad hoc server, which was also never committed).
- **Step 9 (Lighthouse), real audits against 5 key pages** (`index.html`, `main/index.html`, `shared/quiz.html`, `courses/lesson.html`, `a1/dashboard.html`): accessibility=100 and best-practices=100 on every page checked. Performance 95-100 except `a1/dashboard.html` (see finding below). SEO ~90-91 everywhere.
  - **Real, unfixed finding: all 22 pages are missing `<meta name="description">`.** This is what's holding SEO to ~90 across the board. Confirmed via grep across the whole tree, not just the 5 audited pages. Not fixed this turn — each page needs genuinely distinct, accurate copy (a template/copy-paste description across 22 different pages would be its own SEO anti-pattern), which is a content-writing task outside a quick verification pass. Left as an open, scoped, real item for the next agent — see NEXT AGENT below.
  - **Real finding investigated, attempted fix reverted after it proved ineffective:** `a1/dashboard.html` scored 77 on performance, driven by CLS=0.569 (all six level dashboards — a1/a2/b1/b2/c1/c2 — share the exact same markup/script structure, so this affects all six, not just a1). Initially misdiagnosed the cause as `#masteryReviewMount` (a `<div>` filled synchronously by `mastery-review-ui.js`) starting empty and growing on fill; added `style="min-height:340px"` to reserve space on all six dashboards as a fix. **This measurably did nothing** — re-ran Lighthouse after the change and got the exact same CLS score (0.569→0.529, and the specific node's shift score was unchanged to 13 decimal places), which was the signal something was wrong with the diagnosis, not the measurement.
  - Root-caused for real using a direct `PerformanceObserver({type:'layout-shift'})` probe in Playwright (not just Lighthouse's summary) with `sources[].previousRect/currentRect` for each shift. The actual causes are two, neither of which the min-height patch touched:
    1. The header's `<img class="brand-logo" src="../shared/brand/logo-horizontal.svg">` has no explicit width/height, so `.headrow{flex-wrap:wrap}` initially guesses wrong and the nav wraps to a second line; once the SVG loads, the header re-flows to one line, shifting the logo and nav (~0.34 CLS on its own).
    2. `#stats` and `#body` (both empty in the static markup, filled in later by the same page's inline script) render measurably **after** first paint, not before it as their position-in-source-order would suggest — so everything below them (`#resetWrap`, `#masteryReviewMount`, `#offlinePacksMount`) gets pushed down by however much `#stats`/`#body` end up being tall, well after the page has already painted (~0.35 CLS on its own). `#masteryReviewMount`'s own box is mostly innocent bystander here — it's not "starting empty and growing," it's being carried along by a shift that originates above it.
  - **Reverted the ineffective min-height fix** on all six dashboards rather than leave it in place looking like a fix when it measurably wasn't one. Also reverted the `SECURITY.md` inline-style-attribute count bump (91→97) that the patch had caused, back to 91, and rebuilt `offline/packs/core.zip` and all six level packs (`a1.zip`–`c2.zip` — confirmed this turn that each level's own pack bundles its own `dashboard.html`, unlike the three files Agent 7 touched in Step 7, which weren't in any level pack) back to match. Net result: **no source files changed this turn** — the tree is byte-content-identical to Agent 7's, only the two real findings above are new, accurate, and unfixed.
  - `node tests/run.js` re-run after every edit and after the revert: 954/954 throughout, confirmed clean at the end.
- **Step 8 (PWA install), real event captured, not just manifest/SW inspection:**
  - First attempt (Playwright's default ephemeral browser context) never fired `beforeinstallprompt`. Used Chrome DevTools Protocol's `Page.getInstallabilityErrors` to get the real reason instead of guessing: `in-incognito` — Chromium refuses to fire the install prompt in Playwright's default (incognito-like) profile, regardless of whether the app is actually installable.
  - Switched to `chromium.launchPersistentContext()` with a real temp user-data dir, ran **headed** (`headless:false`) under `xvfb-run` (Xvfb is available in this sandbox) → `beforeinstallprompt` **fired for real** on both `index.html` and `main/index.html`, with `Page.getInstallabilityErrors` reporting zero errors on both.
  - Also checked: headless mode + persistent profile still does NOT fire the event even with zero installability errors — a real, understood Chromium/automation limitation (no compositor surface driving the app-banner pipeline in headless), not an app bug. So: **the app itself is genuinely installable** (confirmed by the real event firing, not inferred from static manifest/SW checks); the remaining gap is real physical-device install-flow behavior (icon appearance, OS-level "Add to Home Screen" chrome), which still needs actual hardware, same standing blocker as Step 7.
- What Step 9 still has NOT done: audited the other ~17 pages with Lighthouse (5 of 22 sampled, matching the sampling scale of Steps 6/7); fixed the meta-description gap; fixed the real (now root-caused, not yet fixed) CLS issue on the six level dashboards.

## Step 7 summary (Agent 7)

## Step 7 summary (Agent 7)
- Checked what's actually available before assuming Step 7 needed physical hardware (per Agent 6's own closing note about Agent 5's mistake). Playwright ships real device profiles (viewport, UA, device-scale-factor, touch) for iPhone SE/13/15/15 Pro Max, Pixel, Galaxy S24, iPad Mini, etc. — genuine emulation, not just a resized browser window.
- Swept 6 device profiles (iPhone SE, iPhone 15, iPhone 15 Pro Max, Pixel 7, Galaxy S24, iPad Mini) x 12 key pages (72 loads) against the Step 6 local server with the real header block attached: 200 status, zero console errors, zero horizontal overflow (`document.documentElement.scrollWidth` vs `window.innerWidth`), no undersized (<24px) primary tap targets.
- Checked PWA install-readiness under iPhone 15 emulation: manifest linked, service worker registers and reaches `active` state (localhost counts as a secure context), theme-color meta present and matches manifest.json.
- **Found and fixed a real bug:** `<link rel="apple-touch-icon">` was missing from `index.html`, `main/index.html`, and `main/progress.html` — the icon file itself (`shared/brand/apple-touch-icon.png`, referenced in `manifest.json`) exists and is already correctly linked on 18 of the other 21 pages (a1–c2 index/dashboard, courses/*, shared/quiz.html, main/placement.html). Without the tag, iOS Safari's "Add to Home Screen" falls back to a screenshot/generic icon instead of the app's real icon — a real gap on an app whose own SECURITY.md documents explicit iPhone/Safari targeting. `main/practice.html` was deliberately left alone — it's a bare meta-refresh redirect stub with no icon/manifest links at all by design, not a page anyone would install from.
- Fixing this surfaced two real, legitimate test failures (not flakiness): (1) the depth-normalization test comparing `index.html` vs `main/index.html` didn't know about the new line — extended `tests/run.js`'s `rootRules`/`mainRules` normalization tables with the new `apple-touch-icon.png` href pair, per the test's own maintenance comment ("extend the normalisation rules above if the new difference is an intentional, depth-only one"); (2) `offline/packs/core.zip` (which bundles all three edited files per `offline/core-manifest.json`) held stale byte-for-byte copies — rebuilt it from the manifest's exact 90-file list with standard `zip`. Confirmed no other offline pack (`a1`–`c2.zip`) bundles any of the three edited files.
- Re-ran both the device sweep and the PWA check after the fix: still 72/72 clean, and `appleTouchIcon` now correctly resolves on `index.html`.
- `netlify.toml` re-validated with `tomllib`; `node tests/run.js`: 954/954.
- What Step 7 still has NOT verified: real physical-device behavior (haptics, real touch precision, actual home-screen install flow, real Safari/Chrome mobile rendering quirks emulation can't catch) — Playwright's device profiles are accurate for viewport/UA/touch-event-shape but are still Chromium under the hood, not real WebKit-on-iOS.

## Step 6 summary (Agent 6)
- Prior handoff (Agent 5) stated no real browser was available in this environment. That was checked, not assumed: this sandbox has Chromium pre-installed at `/opt/pw-browsers` and Playwright 1.56.0 on `PATH` (same setup Agent 150/151 used earlier in this project's history).
- Served the repo tree from a local Python server that attaches Step 5's exact header block (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options), then drove headless Chromium across all 22 pages x light + forced-dark color scheme (44 loads): 200 status, zero console errors, zero securitypolicyviolation events on every load.
- Ran an interactive check on shared/quiz.html (heaviest .onclick=/inline-style page) under the same headers: loads clean, no CSP violations.
- Correction to Step 5's SECURITY.md and this file: the "33 onclick=, 2 onerror=" evidence line was mischaracterized as HTML event-handler attributes. A targeted regrep found zero such attributes anywhere in the tree - all 33+2 hits are JS property assignments (el.onclick=fn) inside the pages' inline <script> blocks, not HTML markup. This doesn't change the CSP config (script-src still needs 'unsafe-inline' because of the inline <script> blocks themselves, on every page), but it changes why, and it changes the future-hardening path: removing script-src 'unsafe-inline' means externalizing/hashing the inline <script> blocks, not refactoring .onclick= to addEventListener. The 91 style="..." attribute count was independently verified and is correct - that part of the original reasoning holds. SECURITY.md's evidence table, directive rationale, and future-hardening section were all corrected in place this turn.
- What Step 6 still has NOT verified: actual Netlify edge serving of these headers (requires a live deploy - same standing Steps 1-4 account/repo blockers), and real HTTPS/HSTS behavior (meaningless to test over local plain HTTP).
- netlify.toml re-validated with tomllib, tests re-run after all doc edits: 954/954, unchanged.

## Step 5 summary (Agent 5)
- Evidence-gathered before writing any policy: grepped entire tree for external script/style/font/media refs (none), CDN mentions (none real — test fixtures only), inline `<script>` blocks (present on every page), inline `onclick=`/`onerror=` attributes (33 + 2 — see Step 6 correction above: these are JS property assignments, not HTML attributes), inline `style=` attributes (91), `data:` image URIs (none — sanitizer actively strips them), external `fetch()` targets (none — all same-origin via `assetUrl()`/`basePath()`), `<iframe>` usage (one dormant YouTube-embed code path, zero current content uses it), `<form>` tags (none), `@font-face`/bundled fonts (none), permission-gated browser APIs (none used).
- Added a single consolidated `for = "/*"` headers block to `netlify.toml` (merged with Step 4's HSTS to avoid two blocks matching the same path — documented risk) containing: CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options.
- CSP is `'self'`-only everywhere except `script-src`/`style-src`, which need `'unsafe-inline'` for the reasons corrected in Step 6 above (inline `<script>` blocks and real inline `style=` attributes respectively — not an onclick-attribute/hash conflict, which doesn't apply here since there are no onclick attributes).
- Documented a known trapdoor: `frame-src 'none'` matches current reality (no content uses the YouTube-embed code path) but will need loosening if video lesson content is ever added.
- Wrote `SECURITY.md` — full evidence table + per-directive rationale + honest "what this could not verify" + a recorded future-hardening recommendation (updated in Step 6 to describe the correct refactor).
- `netlify.toml` re-validated with `tomllib` after the merge (single `/*` block, 6 header keys). Tests re-run: 954/954, unchanged.

## Step 4 summary (Agent 4)
- No custom domain exists anywhere in the repo/history (re-confirmed this turn). Documented placeholder per protocol: site will use its Netlify-assigned `*.netlify.app` subdomain until a real domain is chosen.
- Added HSTS header (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`) to `netlify.toml`, applied to `/*`.
- Added a commented, inactive `[[redirects]]` template for www→apex canonicalization, using `example.com` as an explicit placeholder — will do nothing until a real domain replaces it and it's uncommented.
- Documented that Netlify's TLS auto-provisioning and "Force HTTPS" toggle are platform defaults requiring dashboard action once a site exists — not something this repo's config can do on its own.
- **Unverified, same pattern as Steps 2–3**: no live site exists, so none of this has been observed working with a real request.
- `netlify.toml` validated with Python's `tomllib` (parses clean, 7 header rules, `build`/`headers` top-level keys). Tests re-run: 954/954, unchanged.

## Step 3 summary (Agent 3)
- Committed `.github/workflows/deploy.yml`: test job (`node tests/run.js`, no deps to install) gates two deploy jobs — PR preview and main-branch production deploy — via `needs: test`.
- Assumed GitHub as git host (not yet a confirmed user decision — flagged decision-gated).
- **This workflow has never actually run.** No repo exists on GitHub yet, no `NETLIFY_AUTH_TOKEN`/`NETLIFY_SITE_ID` secrets exist. Documented explicitly in DEPLOY.md so this isn't mistaken for a verified pipeline.
- Rollback path extended: dashboard rollback (Step 2) + git-revert-and-push rollback (goes through the same test gate).
- YAML validated with Python's `yaml.safe_load` — syntactically correct. Tests re-run: 954/954, unchanged.

## Step 2 summary (Agent 2)
- Host chosen: **Netlify** (default pick, no prior account/preference on record — full rationale in DEPLOY.md).
- Committed: `netlify.toml` (publish dir `.`, no build command, conservative cache-header baseline pending Step 5's full security/header audit).
- Committed: `DEPLOY.md` (decision rationale, rollback path, and explicit list of what the project owner must do outside this environment: create the Netlify account, `git init` + push to a chosen git host, connect the repo).
- Hard limitation re-confirmed: this tool environment has **no network egress** (bash tool network access disabled), so no account creation, git push, or API call to any host is possible from here. Step 2's deliverable is therefore the config + decision doc, not a live deployment.
- Tests re-run after adding both files: 954/954, unchanged.

## Tree state (evidence: commands run this turn, Sep 23 2026)
- Total files in tree (excluding node_modules): **344**.
- Entry points confirmed present: `index.html` (root), `main/index.html`.
- Service worker present: `sw.js` (8,940 bytes) — header comment identifies it as "Agent 32: offline cache consistency + freshness", strategy = cache-first for static assets, network-first-with-cache-fallback for mutable JSON/HTML navigations. Cache ownership split documented in-file: `STATIC_CACHE`/`RUNTIME_CACHE` (shell) vs. `PACK_CACHE_PREFIX + <packId>` (per-pack, owned by `shared/js/offline-packs.js`).
- `manifest.json` present and valid JSON: name "Mylingo — Language Practice", `start_url: "./index.html"`, `scope: "./"`, `display: standalone`, 4 icon sizes (32/192/512/apple-touch-180), theme/background colors set. No `id` field (optional, not blocking).
- Offline packs: `offline/core-manifest.json` + 7 pack archives present (`core.zip`, `a1.zip`, `a2.zip`, `b1.zip`, `b2.zip`, `c1.zip`, `c2.zip`) plus `offline/packs.json` index.
- Top-level content directories: `a1/ a2/ b1/ b2/ c1/ c2/ academic-english/ course_content/ courses/ grammar/ lesson_content/ main/ offline/ placement/ shared/ tests/ vocabulary/ writing/`.
- **22 HTML pages, 23 JS files** in the tree.
- **No `package.json`, no lockfile, no `.env`/`.env.example`.** Confirms: pure static HTML/CSS/JS, zero build step, zero npm dependencies. `node tests/run.js` runs directly against plain JS with Node's built-in `assert`, no test framework installed.
- **No `.git` directory.** The tree is not currently a git repository. This is a prerequisite gap for STEP 3 (CI pipeline) — CI needs a git remote (GitHub/GitLab/etc.) to trigger from, so repo initialization + choice of git host is an implicit dependency of Step 2/3, not yet a decision that's been made.

## Test suite
- Command: `node tests/run.js`
- Result: **954 passed, 0 failed** (re-run after every edit and pack rebuild in Agent 10's turn)
- Node version in this environment: v22.22.2

## Baseline claims re-verified (not re-litigated, per protocol instruction, but spot-checked for internal consistency this turn)
- 954/954 test count matches the given baseline exactly. ✅ consistent.
- Service worker and manifest.json both exist and are well-formed. ✅ consistent with "static release gate passed at Agent 147" claim.
- Mutation sweep backlog as given (placement.js ~half, offline-packs-ui.js, offline-packs.js, gamification.js mostly untouched) — not re-verified line-by-line this turn (out of scope for Step 1; Steps 17–19 own this).

## Blockers / open questions surfaced this turn
- **Hosting/git platform choice is undecided** and blocks Step 3 (CI) even after Step 2 (host config) is done — Step 2 can still produce host-agnostic config (e.g. `netlify.toml`) without a live account, but actually deploying requires an account/token which I don't have. Flagging now so Step 2 doesn't silently stall on it.
- **No real browser/device access in this environment** — Steps 6 and 7 cannot produce real evidence here. This was already known (Agent 203 item 17) and is restated per the "never claim a browser/device result you did not observe" hard rule. Will need to be done outside this sandboxed tool environment, or via a BrowserStack-equivalent connector if one becomes available.

## Assumptions
- Treated the absence of any `HANDOFF_PACKAGE.md`/`STATE.md` in the delivered tree as "no prior protocol run" rather than a lost file, since the tree also has no `.git` history to check for a deleted one. If a prior STATE.md exists elsewhere, this assumption should be corrected by whoever finds it.

## Artifacts this turn
- `STATE.md` (this file) — created.
