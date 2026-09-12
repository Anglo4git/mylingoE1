# Mylingo Project Audit

## Summary
- Static deployable site is under `site/` and does not require a production build step.
- Removed historical agent handoffs, merge logs, duplicate design documentation, and generated reports that were not required at runtime.
- Kept operational documentation: `BUILD.md`, `DEPLOYMENT.md`, `RELEASE_CHECKLIST.md`, `QA_REPORT.md`, `DESIGN_SYSTEM.md`, schema/authoring docs, and generation documentation.

## Findings
1. **Documentation bloat:** 23 Markdown files were present; several were historical handoffs or overlapping reports. Cleanup reduces this to 12.
2. **Runtime footprint:** The largest assets are audio files and static quiz data. These are expected runtime assets, but audio should be lazy-loaded only after user interaction.
3. **No production bundler:** This is appropriate for the current static architecture, but shared JavaScript should remain centralized to avoid duplicated logic.
4. **Test execution:** Tests could not run in this environment because dependencies are not installed (`vitest: not found`). Run `npm ci` before QA.
5. **Efficiency priorities:**
   - Keep one shared quiz shell and shared JS modules.
   - Lazy-load quiz JSON and audio assets.
   - Avoid loading all vocabulary/grammar datasets on the landing page.
   - Use cache-friendly immutable asset names or query-versioning on deployment.
   - Minify/compress production HTML, CSS, JS, JSON, and SVG where hosting permits.
   - Add automated checks for broken JSON paths, duplicate quiz IDs, and oversized assets.

## Recommended next steps
1. Run `npm ci && npm test` and `npm run test:e2e`.
2. Add a lightweight `npm run audit` script for JSON validation, duplicate IDs, broken links, and asset-size warnings.
3. Add `loading="lazy"` to non-critical images and preload only the primary brand asset.
4. Load sound effects on demand rather than at initial page load.
5. Consolidate any remaining duplicated inline CSS/JS into `site/shared/`.
