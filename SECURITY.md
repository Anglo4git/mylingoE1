# SECURITY.md — Header policy and rationale (Step 5)

All headers below are committed in `netlify.toml`'s single `for = "/*"` block (deliberately kept as one block — see the comment above it in `netlify.toml` explaining why two separate blocks matching the same path is risky with Netlify's header merging). **None of this has been observed working against a real deployed site** — same standing caveat as Steps 2–4: no live site exists yet, so this is a policy written from static analysis of the app's own source, not a policy confirmed by an actual browser loading the actual deployed pages. That confirmation is Step 6/7's job.

## Evidence gathered this session (how the policy was decided, not guessed)

Grepped the entire tree for what the app actually loads/does, before writing a single directive:

| Check | Command class | Result |
|---|---|---|
| External `<script src>` / `<link href>` to `http(s)://` | grep across all HTML | **None.** Zero external script or stylesheet references anywhere. |
| CDN references | grep for `cdn.`/`googleapis`/`gstatic`/`jsdelivr`/`unpkg`/`cloudflare` | Only hits are in `tests/run.js`, and those are fake test-fixture URLs (`cdn.other.test`, `cdn.example`) used to test that the service worker never intercepts cross-origin requests and that the HTML renderer escapes URLs correctly — not real assets the app loads. |
| Inline `<script>` blocks (no `src`) | counted per-file `<script` vs `<script...src=` | **Every one of the 22 HTML pages has some.** (E.g. `main/practice.html`: 1 total, 0 with src — entirely inline.) |
| Inline event-handler *attributes* (literal `onclick="..."` markup) | grep for `on[a-z]*="` | **Zero.** No page has a literal `onclick=`/`onerror=`/`onload=` HTML attribute anywhere. |
| `.onclick=`/`.onerror=` *JS property assignment* (`el.onclick=fn`, inside `<script>`) | grep for `on[a-z]*=` (no quote) | **33 `.onclick=`, 2 `.onerror=`** — all are property assignments inside inline `<script>` blocks, not HTML attributes. These are irrelevant to CSP's attribute-vs-hash tradeoff (see rationale below); they're ordinary script code, already covered by whatever lets the enclosing `<script>` block run. |
| Inline `style=` attributes | grep for `style="` | **91** occurrences. |
| Inline `<style>` blocks | grep for `<style` | One per page on 21 of 22 pages (`main/placement.html` has 2). |
| `data:` URIs for images | grep for `data:image` etc. | **None in the app itself.** The one hit is a *test* confirming the app's own HTML sanitizer *strips* `data:image` src attributes — i.e. the app actively defends against them. Strong evidence `img-src` should not include `data:`. |
| External `fetch()`/XHR targets | grep for `fetch('http` and read `assetUrl()`/`basePath()` helpers in `shared/js/*.js` | **None.** Every `fetch()` call resolves through `assetUrl()` (built on `new URL(path, BASE_URL)`, same-origin by construction) or a relative `basePath()` string — no hardcoded external host anywhere. |
| `<iframe>` usage | grep for `<iframe` | **One code path**, in `courses/lesson.html`'s video renderer — builds a YouTube embed URL (`youtubeEmbedSrc()`) *if* a lesson's video entry has a recognizable YouTube ID. |
| Content actually referencing external media URLs | grepped every `.json` content file for `"url": "http...` | **Zero matches.** No current content file references an external URL at all — the YouTube iframe code path exists but nothing in the shipped content currently exercises it. |
| `<form>` tags | grep for `<form` | **None**, anywhere. |
| `@font-face` / bundled font files | grep for `@font-face`, searched for `.woff`/`.ttf`/`.otf` | **None.** System/web-safe fonts only. |
| Permission-gated browser APIs (geolocation, camera, mic, USB, Bluetooth, etc.) | grep for `navigator.geolocation`, `getUserMedia`, etc. | **None used anywhere.** |

## The policy, directive by directive

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self';
  font-src 'self';
  media-src 'self';
  connect-src 'self';
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none'
```

- **`default-src 'self'`** — nothing loads cross-origin anywhere in this app (evidence table above), so `'self'` is the correct baseline, not a guess.
- **`script-src 'self' 'unsafe-inline'`** — every one of the 22 pages has an inline `<script>` block (no `src`), and CSP has no hash/nonce mechanism a static host like Netlify can generate ahead of time for content that will keep changing (a hash breaks the moment a single character in the block changes; a nonce needs a server to mint a fresh value per request, which a static `netlify.toml` header can't do). `'unsafe-inline'` is the only directive that lets these inline blocks run at all. The 33 `.onclick=`/2 `.onerror=` hits above are **not** part of this justification — they're plain JS statements running inside those already-inline `<script>` blocks (`el.onclick=fn`), not `onclick="..."` HTML attributes, so they carry no independent CSP requirement of their own; removing `'unsafe-inline'` from `script-src` would need to address the inline `<script>` blocks themselves (externalize or hash each one), not the `.onclick=` assignments inside them.
- **`style-src 'self' 'unsafe-inline'`** — unlike the script case, this one *is* driven by literal markup: **91** real `style="..."` HTML attributes across the pages, plus an inline `<style>` block on 21 of 22 pages. CSP has no hash or nonce mechanism that covers an inline `style=` *attribute* specifically — only `'unsafe-inline'` does (the newer `'unsafe-hashes'` extension exists but has incomplete browser support, notably Safari, which this app explicitly targets per its PWA/iPhone-focused handoff history). This is flagged as a **real gap**, not swept under the rug — see "Recommendation for future hardening" below.
- **`img-src 'self'`** — no external images, and the sanitizer test confirms the app itself rejects `data:` image URIs, so `data:` was deliberately left out rather than added defensively.
- **`font-src 'self'`**, **`media-src 'self'`**, **`connect-src 'self'`** — no external fonts, no external audio/video currently referenced by content, no external fetch targets (all confirmed above).
- **`frame-src 'none'`** — **known trapdoor, documented on purpose**: `courses/lesson.html` has working code to embed a YouTube iframe if lesson content ever includes a YouTube video ID, but zero current content does. `'none'` matches today's actual behavior. **If video lesson content is ever added, this line must change** to `frame-src https://www.youtube.com` (or `https://www.youtube-nocookie.com` for the privacy-enhanced embed domain) or the video embeds will silently fail to render — noted here and in the recommendation list below so it isn't forgotten.
- **`object-src 'none'`** — no `<object>`/`<embed>` usage found; standard hardening default.
- **`base-uri 'self'`** — no `<base>` tag exists; prevents a base-tag injection from redirecting all relative URLs.
- **`form-action 'self'`** — no `<form>` tags exist at all currently; set defensively in case one is added later, restricting where any future form could submit to.
- **`frame-ancestors 'none'`** — modern equivalent of, and paired with, `X-Frame-Options: DENY` below; nothing should be allowed to embed this app in an iframe elsewhere.

## The other headers

- **`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`** — carried over from Step 4, consolidated into this same header block (see `netlify.toml` comment on why it's not a separate block).
- **`X-Content-Type-Options: nosniff`** — stops browsers from MIME-sniffing responses into an unintended content type; no reason not to set this unconditionally.
- **`Referrer-Policy: strict-origin-when-cross-origin`** — sends the full referrer only same-origin, and only the origin (not the full path) cross-origin; a safe, common default that doesn't break anything this app does (no cross-origin requests exist to be affected either way).
- **`Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()`** — every permission-gated API is disabled outright, including for `'self'`, because grepping the entire JS tree found zero use of any of them (table above). If a future feature needs one of these, its entry needs to be loosened deliberately, not left permissive "just in case."
- **`X-Frame-Options: DENY`** — legacy header kept alongside `frame-ancestors 'none'` for defense-in-depth on older browsers that don't understand the CSP directive.

## Step 6 — real browser pass (this session)

Contrary to the prior handoff's note that no browser is available here: this sandbox has Chromium pre-installed at `/opt/pw-browsers` and Playwright 1.56.0 on the `PATH`. A local Python server was written to serve the repo tree with this exact header block attached (`Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` — HSTS excluded, since it's meaningless over plain HTTP on localhost), then driven with headless Chromium:

- **All 22 pages, light + forced-dark color scheme (44 loads total):** every load returned HTTP 200, zero `console.error`/uncaught page errors, and zero `securitypolicyviolation` events (listened for directly via `document.addEventListener('securitypolicyviolation', …)`, not just eyeballed). Confirms the prior handoff's stated worry — "watch the console for CSP violations on first real load" — did not materialize.
- **Interactive check on `shared/quiz.html`** (the page with the most `.onclick=` JS assignments and inline `style=` attributes) under this exact CSP: loaded clean, no violations. Since the 33 `.onclick=` hits are JS property assignments inside already-`'unsafe-inline'`-covered `<script>` blocks (corrected above) rather than HTML attributes, there was no attribute-level CSP behavior left to exercise beyond the page load itself.
- **Caveat this does NOT close:** this is still a local static server, not Netlify's real edge — it proves the policy as *written* doesn't break the app in a real browser, not that Netlify serves these exact header values unmodified in production, nor anything about TLS/HSTS behavior. That half of Step 6 (an actual Netlify deploy) still needs Steps 2–3's standing account/repo blockers resolved first.

## What this step could NOT verify (honest limitations)
- **`report-uri`/`report-to` was deliberately left out** of the CSP — without a live endpoint to receive violation reports (which would itself need a backend or a third-party service, out of scope for a static-only app), a report directive would point nowhere. Worth reconsidering if a reporting service (e.g. Netlify's own, or a free tier of report-uri.com) is ever added.
- **Production Netlify serving is still unverified** — see the Step 6 caveat directly above.

## Recommendation for future hardening (not done this step — flagged, not resolved)
The `'unsafe-inline'` requirement is a direct consequence of the app's current architecture: inline `<script>`/`<style>` blocks on every page, plus 91 inline `style=` attributes. Removing `style-src 'unsafe-inline'` would require refactoring all 91 `style=` attributes to CSS classes. Removing `script-src 'unsafe-inline'` would require moving each page's inline `<script>` block to an external `.js` file (or hashing it) — the 33 `.onclick=`/2 `.onerror=` JS property assignments inside those blocks do **not** need to change for this; they aren't CSP-relevant themselves, only the enclosing inline `<script>` block is. Either way this is a real, sizeable refactor across 22 HTML pages that would need full browser re-verification (Steps 6/7) to confirm nothing broke. That's out of scope for a security-headers step and is **not** something this turn attempted blind. Recorded here as a legitimate future improvement, not silently accepted as fine forever.


## Update (Agent 17) — script-src without 'unsafe-inline'
The earlier analysis assumed 33 inline event-handler attributes; they are `.onclick=` JS property assignments, which CSP never restricts. A regex sweep of every shipped html/js file finds zero inline handler attributes and zero `javascript:` URLs (pinned by a test). So `script-src` is now `'self'` + the SHA-256 of each inline `<script>` block (16 distinct hashes across the 22 pages; the six level indexes and six dashboards share theirs), generated into `netlify.toml` by `tools/build-csp.js`. No `'unsafe-hashes'`, no `'unsafe-eval'`. `style-src 'self' 'unsafe-inline'` is unchanged (91 `style=""` attributes and inline `<style>` blocks remain; a style-injection is far lower risk than script-injection). **Maintenance rule:** after editing any inline `<script>` block run `node tools/build-csp.js`; the test suite fails with "CSP is stale" otherwise, and CI blocks the deploy. **Verified locally, not on Netlify:** a node static server sending the exact policy from `netlify.toml` — 46 page loads (22 pages incl. quiz/lesson/placement interaction × light/dark) produced 0 `securitypolicyviolation` events; the control run (same pages, `script-src 'self'` with no hashes) produced 46 page-level violations, proving the harness detects them. Still UNVERIFIED on a real deploy (header delivery, and browsers that mishandle hash sources — all evergreen browsers support them).

### CSP sweep with the service worker active (Agent 18)
`NODE_PATH=$(npm root -g) node tools/csp-sweep.js` builds dist, serves it with the exact CSP from netlify.toml, and loads all 27 URLs (22 pages plus per-level course pages, journey, lesson, quiz) in light and dark, online and then offline, with the service worker registered and controlling. It fails on any `securitypolicyviolation`, CSP console error, page error, or non-200 offline page. `--no-hashes` is the control (must fail). Local result: 108 loads, 0 problems (54/54 offline 200); control: 108/108 problem pages.
