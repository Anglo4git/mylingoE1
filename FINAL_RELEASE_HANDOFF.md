# MyLingo — UI Hardening Release Handoff

## Status
COMPLETED WITH KNOWN LIMITATIONS

## Release identity
Preserve the existing canonical release identity (v118). Do not hardcode a new release tag.

## User-requested fixes delivered
- Bottom navigation reduced to essential Home / Courses / Progress destinations; dead/redundant Practice tab removed.
- Quiz descriptions now appear on quiz cards.
- Quizzes are presented as exercises inside their lesson; lesson pages remain the primary guided path into quiz activity.
- Dark mode receives stronger contrast and clearer visual separation.
- Standard one-per-session Mylingo splash screen added, using the existing brand icon.
- Home screen simplified to essential entry actions and Continue Learning; repeated content moved out of the main page.
- Offline core manifests and `core.zip` reconciled with the new shared theme/splash/navigation assets.

## Verification
- JSON parse: PASS.
- JavaScript syntax: PASS.
- Static local href/src audit: PASS — 0 missing local references.
- HTTP route smoke: PASS for root, main, courses, lesson, level and quiz routes.
- Offline core packaging: PASS — 67 canonical core files present in regenerated core ZIP.
- Browser/Playwright smoke: NOT VERIFIED — headless Chromium timed out in this environment. No browser PASS is claimed.

## Deployment
Use the ZIP contents directly at repository root. Do not create an enclosing `site/` directory.

## Latest continuation
Agent 134 fixed a concrete root-home bottom-navigation path bug caused by the old hardcoded `../` prefix. Agent 135 completed the final release gate.

## Agent continuity
The implementation is divided into Agents 126–135. If a free-tier agent stops, continue from the latest numbered handoff rather than repeating earlier missions.

## Next agent rule
Only perform browser/CI verification from this point. Do not redesign or modify production code unless a concrete release-gate failure is found.
