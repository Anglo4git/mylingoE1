# Agent 160 Handoff — safe-url.js Under Test, One Real Defect Fixed

## Context
Picked up `HANDOFF_AGENT_159.md` (zip `MYLINGO_v157_AGENT159_…`). Worked its item 7's
suggested next target: `safe-url.js` (security-relevant, pure, small — good next module).
Method notes unchanged: Playwright/Chromium available at `$(npm root -g)/playwright`.

## Defect found by the new tests and fixed (1 module touched)

**`shared/js/safe-url.js` — `isSafeMediaUrl()` let protocol-relative URLs through if they
used a backslash instead of `//`.** The function is meant to block exactly one class of
bypass: a URL with no explicit scheme that still lands on an attacker's host (`//evil.com/x`),
as opposed to an explicit `https://evil.com/x` (allowed by design — this is a scheme/host-
confusion guard, not an allowlist). The block check was a literal `/^\/\//` test on the raw
string. But WHATWG URL parsing (same engine as `new URL()` in Node and every browser) treats
`\` the same as `/` when resolving against an http(s) base, so `/\evil.com`, `\\evil.com` and
`\/evil.com` all resolve to `https://evil.com/` — identical in effect to `//evil.com` — while
skating past the literal-slash regex. Confirmed in both Node's `URL` and real headless
Chromium (same code, same results). This function gates `<video src>`/`<audio src>` in
`courses/lesson.html` (`renderMediaItem` → `MylingoSafeUrl.isSafeMediaUrl(entry.url)`), so a
lesson-data `video_url`/`audio_url` field using one of these forms would have rendered as a
live cross-origin media element instead of the "media link is not available" fallback.

Fix: normalise `\` to `/` for the purpose of the `//`-prefix check only (the dangerous-scheme
check still runs on the raw string, so case/whitespace handling there is untouched). Verified
this does *not* over-block: a single leading backslash (`\evil.com`, no second separator)
resolves to a same-host path (`https://mylingo.invalid/evil.com`), not off-host, and correctly
stays allowed — only the two-separator forms that are equivalent to `//` are now blocked.
`isSafeRedirect()` was already safe against the same trick (it requires a literal `./` or `../`
prefix, so backslash-led strings never match) — added a test to pin that, no code change there.

## Tests: `tests/run.js` 85 → 95, all passing (`node tests/run.js`)
- `safe-url.js` (10): dangerous schemes (javascript/data/vbscript/file, any case, leading
  whitespace), plain `//host` rejection, the three backslash-bypass forms rejected (the fix),
  a single backslash confirmed *not* a false positive, relative/root-relative paths accepted,
  explicit `http(s)://` accepted regardless of host (by design), other schemes (mailto/ftp/tel)
  rejected, non-string/empty/blank rejected, `isSafeRedirect` accepts only `./`/`../`-prefixed
  paths and rejects scheme/`//`/backslash forms.
- Mutation-checked: reverting the fix (regex back to `/^\/\//` on the raw string) makes exactly
  the new "backslash variants" test fail and nothing else — the rest of the suite is unaffected,
  confirming the other safe-url tests aren't accidentally exercising the same code path.

## Verification (real headless Chromium)
- Loaded `shared/js/safe-url.js` via `page.addScriptTag` in real Chromium and called
  `isSafeMediaUrl` on the backslash-bypass forms, the single-backslash non-bypass form, plain
  `//`, and a normal relative path — results matched the Node-based unit tests exactly (see
  above). This was a deliberate cross-check because the whole bug hinges on WHATWG URL-parsing
  behavior, and Node's `URL` and a browser's could in principle differ.
- `node --check` on `shared/js/safe-url.js` and `tests/run.js`.
- Did not re-run the full Agent 158/159 Playwright click-through this round — no other module
  was touched, and `tests/run.js`'s existing 85 tests all still pass unchanged, which is the
  part that would move if this change regressed anything else.

## Remaining / carried forward (unchanged from Agent 159, not worked this round)
1. **[DECISION] level-lock fail-open vs fail-closed** (diagnostic warn stays until decided).
2. **[PRODUCT] Back button on the quiz results screen?**
3. **`learner-state.js` is still unreferenced** — wire it in or delete it with its tests; its
   validators still diverge from `gamification.js`'s (attempts/rewardedSessions caps).
4. **`gamification.js`'s "Malformed legacy backup." message is still dead code** (behavior is
   safe; only that specific message can't fire — see Agent 159's notes for why).
5. **Zip filename vs `RELEASE_IDENTITY.json` — still unreconciled, and out of scope for a code
   fix.** `RELEASE_IDENTITY.json` explicitly declares itself `"sourceOfTruth": true` and says
   "Do not hardcode release tags elsewhere in application code" — so bumping it to match the
   zip name, or hardcoding "v157" anywhere else, would both violate its own policy. The drift is
   in the *zip-naming convention* several agents have used (`vNNN` = agent number), not in the
   app. Whoever owns the release process should either point `RELEASE_IDENTITY.json`'s `v118`
   at whatever the real shipped version is, or stop using agent-number-as-version in zip names —
   a code agent shouldn't guess which.
6. Legacy `calculateNextInterval` in `review-scheduler.js` (days) is still unused.
7. **Still untested:** `recommendations.js` beyond the one audit scenario, `orientation.js`,
   `course-progress.js`, `runtime-*` modules, `authoring-*` modules, `canonical-metadata.js`.
   None are as immediately security-relevant as `safe-url.js` was; `canonical-metadata.js` or
   `course-progress.js` are reasonable next targets since they're pure-ish and feed the homepage
   "continue lesson" card and course display, so a defect there is user-visible every session.
