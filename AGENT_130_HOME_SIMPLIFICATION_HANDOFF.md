# Agent 130 — Home Simplification Handoff

## Status
COMPLETED

## Mission
Reduce home-screen density so the main page is an entry point, not a dashboard full of repeated content.

## Changes
- Removed the large Explore-by-level, recommended-course and explanatory blocks from the home screen.
- Kept only the primary hero actions and Continue Learning card.
- Bottom navigation now carries the essential global destinations.
- Applied the same simplification to the root deployment entry and `/main/index.html`.

## Result
The home page now answers three questions quickly: what is Mylingo, how do I find my level, and where do I continue?

## Verification
- Local href/src audit: PASS.
- HTTP smoke endpoints: PASS.
- JavaScript syntax: PASS.

## Next task
Agent 131: reconcile offline manifests/core ZIP with the new shared assets and run the final release gate.
