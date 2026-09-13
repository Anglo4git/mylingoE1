# Mylingo — Root Repository Deployment

## Recommended deployment layout
For a repository whose web root is the repository root, deploy the **contents of `site/` as the repository web root**:

- `index.html`
- `a1/` … `c2/`
- `courses/`
- `main/`
- `shared/`
- `offline/`
- `placement/`
- `manifest.json`
- `sw.js`
- other site content folders

The updated `site/index.html` is already written for this layout: it uses `./shared/...`, `./a1/...`, `./courses/...`, etc.

## Important
Do not put the `site/` directory itself between the repository root and these app folders if the goal is direct `/index.html` access.

The original project/tooling remains under its existing `site/` source tree in this handoff ZIP. When creating the deployment repository, copy the contents of `site/` into that repository's root.

## PWA/offline
`manifest.json` now uses `./index.html` as `start_url`, and `offline/core-manifest.json` includes `index.html`. `sw.js` remains at the app web root so its scope covers the full application.

## Validation
- Root-entry static references: PASS
- Content validation: PASS — 300 rows / 60 quizzes / 0 errors / 0 warnings
- Content QA: PASS — 0 errors / 0 warnings
- Python unit suite: PASS — 109/109
- Browser/Playwright: not run in this environment
