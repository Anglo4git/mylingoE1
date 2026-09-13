# Agent B — Root Entry / Repository Access Handoff

## Status
COMPLETED

## Mission
Make Mylingo directly accessible from the repository's deployed root while preserving the existing `/main/` entry.

## Changes
- `site/index.html`
  - Replaced the meta-refresh-only shell with the real Mylingo home entry.
  - Rebased shared assets from `../shared/...` to `./shared/...`.
  - Rebased service-worker registration to `./sw.js`.
  - Rebased level and course navigation to root-safe paths.
  - Kept placement under `./main/placement.html`.
  - Updated the continue-learning redirect to `./index.html`.
- `site/manifest.json`
  - Changed `start_url` from `./main/index.html` to `./index.html`.
- `site/offline/core-manifest.json`
  - Added `index.html` so the root entry is included in the offline app shell.

## Compatibility
`site/main/index.html` was not modified. Existing `/main/` access remains available.

## Target deployment
The repository can expose the **contents of `site/`** as its deployed root, making:
`/index.html` and `/` resolve to the actual Mylingo entry instead of requiring `/main/index.html`.

This is the intended layout for a dedicated deployment repository: copy `site/*` into that repo's root rather than nesting the app under `/site/`.

## Verification performed
- Confirmed root entry contains no `../` references.
- Confirmed all root entry HTML `href`/`src` references are repository-local.
- Confirmed `manifest.json` points to `./index.html`.
- Confirmed `offline/core-manifest.json` includes `index.html`.

## Known limitation
A real browser/Playwright deployment test was not run in this handoff environment.

## Exact next task
Agent C: perform a deterministic link/path integrity audit from `site/index.html` through its first-hop destinations. Check for dead links and path assumptions; make only minimal fixes.

## Do not touch
- Generated quiz/content data.
- Offline-pack cache ownership logic.
- Historical agent handoffs.
- Unrelated UI/features.
