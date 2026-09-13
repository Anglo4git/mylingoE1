# Agent 129 — Theme / Splash Handoff

## Status
COMPLETED

## Mission
Improve dark-mode readability and add a standard lightweight app splash.

## Changes
- Added `shared/css/theme.css` with high-contrast dark tokens and component overrides.
- Added `shared/js/splash.js` with a one-per-session Mylingo launch splash using the existing brand icon.
- Loaded both shared assets across HTML app surfaces.
- Manifest background color updated for a darker native PWA launch experience while retaining the existing brand theme color.

## Design intent
Dark mode uses a deep navy background, elevated blue-gray cards, bright text, stronger borders, and a brighter brand blue so controls and status states remain visually distinct.

## Verification
- JSON: PASS.
- JavaScript syntax: PASS.
- Local href/src audit: PASS.

## Next task
Agent 130: simplify the home page and verify that the shared theme does not reintroduce layout clutter.
