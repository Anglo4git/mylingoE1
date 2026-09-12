# AGENT 114 — Route / Redirect / Navigation Audit

## Status
PASS WITH LIMITATION

## Scope completed
Static audit of the full `site/` route graph across all 22 shipped HTML pages, the PWA manifest, and the offline core manifest. No production routing logic was changed; findings were confirmed safe and locked in with regression tests.

Checked:
- Every static `href`/`src` in every HTML page resolves to a real file on disk (template-built URLs, e.g. `'+level+'/index.html`, are excluded from static resolution and instead covered by whitelist checks below).
- Root `site/index.html` redirect uses a `<meta http-equiv="refresh">` **and** a real `<a>` fallback link, so it degrades gracefully for clients that don't honor meta refresh.
- `shared/quiz.html`'s `?redirect=` param (used by course/lesson/journey deep links) is only ever consumed through the `isSafeRedirect()` guard before `backTarget()` — confirmed no navigation handler assigns the raw `redirect` value directly. Guard rejects absolute/scheme URLs and protocol-relative (`//`) URLs, accepting only same-site `./`/`../` paths.
- `VALID_LEVELS` whitelist (`a1,a2,b1,b2,c1,c2`) is identical across `courses/course.html`, `courses/journey.html`, and `courses/lesson.html` — no page trusts an unvalidated `?level=` value.
- `offline/core-manifest.json`'s file list (62 entries) all resolve on disk — this is what the service worker precaches, so drift here would silently break offline navigation.
- `manifest.json` `start_url` and all icon `src` paths resolve.
- Every level app (`a1`..`c2`) index/dashboard pair cross-links to each other and back to `main/index.html`, so no level app is a dead end.

## Files changed
- `tests/unit/test_agent114_route_navigation_audit.py` (new — 7 tests)
- `AGENT_114_ROUTE_NAVIGATION_AUDIT.md` (this file)

## Automated checks
- `python3 -m unittest tests.unit.test_agent114_route_navigation_audit` — 7/7 pass
- `python3 -m unittest discover -s tests/unit -p "test_*.py"` — 89/89 pass (82 prior + 7 new)

## Browser limitation
This audit is static (file-graph + source-pattern based). It does not exercise actual click-through navigation, browser history/back-button behavior, or hash-router timing in a real browser, because Playwright/browser binaries are not installed in this environment (same limitation noted by Agents 112/113). Real-browser click-path verification remains explicitly unclaimed.

## Not in scope / unchanged
- No production routing logic was modified.
- No duplicate quiz content or routes were added.
- Dynamic (template-built) URLs were reasoned about via their whitelist/validation logic rather than filesystem resolution, since they don't exist as literal strings pre-render.

## Next agent
Handoff open for the next audit area (suggested: service-worker cache-vs-route drift under concurrent app updates, or offline-pack route scoping).
