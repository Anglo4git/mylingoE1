# MyLingo — Agent 134 Bottom Navigation Root-Path Fix

## Status
COMPLETED

## Mission
Continue from Agent 133 and inspect the release for concrete navigation/link failures. Make the smallest safe fix only.

## Finding
The shared bottom navigation used a hardcoded `../` root prefix. That is valid on one-directory-deep pages, but it breaks when the same shell is mounted on the root `index.html`: links resolve outside the deployment root. This directly affected the root home page bottom menu.

## Change
Updated `shared/js/app-shell.js` to derive the deployment root from the actual shared script URL (`shared/js/app-shell.js`). This supports both:
- domain-root deployment
- GitHub Pages/project-subpath deployment

The active Home route also recognizes the derived project root.

## Offline consistency
Updated `offline/packs/core.zip` so its bundled `shared/js/app-shell.js` exactly matches the root source.

## Verification
- JavaScript syntax: PASS for all JS files.
- JSON parsing: PASS.
- Static HTML href/src audit: PASS — 406 references checked, 0 missing local references.
- Core ZIP integrity: PASS — 90 files; bundled app-shell matches source byte-for-byte.
- HTTP smoke: PASS for root, main, courses, lesson, progress, quiz, level, manifest, service worker, and app-shell routes.
- Root app-shell active route simulation: PASS.
- GitHub Pages sub-path active route simulation: PASS.

## Next agent
Agent 135 should perform release-gate reconciliation and package the final root deployment ZIP. Do not redesign UI unless a concrete release failure is found.
