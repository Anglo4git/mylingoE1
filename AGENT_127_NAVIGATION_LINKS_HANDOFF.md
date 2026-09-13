# Agent 127 — Navigation / Link Integrity Handoff

## Status
COMPLETED

## Mission
Remove dead/redundant bottom-navigation destinations and make the remaining navigation essential and stable.

## Changes
- Bottom nav reduced to Home / Courses / Progress.
- Removed the redundant Practice tab from the persistent shell.
- Existing level pages remain directly reachable through course/lesson flows.
- Preserved relative navigation for root deployment and one-level app pages.

## Verification
- Static local href/src audit: PASS — 0 missing local references.
- Node JavaScript syntax: PASS.
- HTTP smoke through Python server: PASS for `/`, `/main/index.html`, `/courses/index.html`, lesson route, level route and quiz route.

## Risks
Browser-level click testing remains environment-dependent.

## Next task
Agent 128: inspect lesson pages and quiz cards. Do not undo the 3-item bottom navigation.
