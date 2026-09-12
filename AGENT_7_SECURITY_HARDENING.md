# Agent 7 — Security Hardening

## Status
COMPLETE

## Verified findings
- URL/redirect handling was already largely guarded: level query parameters are allowlisted, generated IDs are encoded, and quiz redirects reject schemes/protocol-relative hosts.
- Lesson YouTube embeds are parsed to a YouTube video ID before embedding.
- No obvious private-key or common API-key material was found in deployable `site/` JS/HTML/JSON during the regression scan.
- No verified XSS vulnerability was introduced by the audited dynamic markup paths: content-facing text is escaped where interpolated, and the quiz redirect path is same-site relative.

## Changes
- Added `site/shared/js/safe-url.js` with explicit safe media URL and same-site redirect predicates.
- Applied the media URL predicate to lesson presentation images so dangerous `javascript:`, `data:`, `vbscript:`, `file:`, and protocol-relative values are not rendered.
- Reused the helper for the existing quiz redirect guard without changing its accepted contract.
- Added `tests/unit/security-hardening-agent7.test.mjs` covering dangerous URL schemes, valid media URLs, redirect traversal/scheme cases, and obvious secret material.

## Regression
`node --test tests/unit/learner-state-integrity-agent6.test.mjs tests/unit/security-hardening-agent7.test.mjs`
→ 9/9 passed.

Existing offline regression also passes: 9/9 Node tests and 25/25 Python tests.

## Remaining needs-verification
A browser-backed CSP/header deployment audit remains environment-dependent; this release does not invent a CSP that could break the existing inline-script architecture.

## Next owner
Agent 8 — Content / Authoring QA.
