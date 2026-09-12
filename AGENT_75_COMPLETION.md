# Agent 75 Completion — dist-release Source/Artifact Hygiene

## Files changed
- Removed: `dist-release/` (2.5MB committed build artifact). Confirmed stale: it was missing `shared/js/canonical-metadata.js` and `shared/js/runtime-content-loader.js`, both present in current `site/` source (post-Agent 62-64 runtime lazy loading / canonical metadata work).
- Added: `.gitignore` — ignores `/dist-release/`, `/dist-release-a11y-report/`, `node_modules/`, `playwright-report/`, `test-results/`, `/content_qa/` so generated output can't be silently re-committed/shipped.

## Verification
- `python3 build.py validate --input master_source.csv` → 300 rows, 60 quizzes, 0 errors/warnings.
- `python3 build.py build --input master_source.csv --out /tmp/dist-fresh --src-root site --report ...` → 74 files (66 written).
- `python3 build.py verify-output --out /tmp/dist-fresh` → 0 errors, 0 warnings.
- `python3 build.py release-gate --input master_source.csv --site /tmp/dist-fresh --report ...` → PASS, 0 errors/warnings.
- Fresh `shared/js/` output confirmed to contain all 15 current modules (vs. 13 in the stale committed copy).
- `ci/release_gate.sh` already does `rm -rf "$BUILD_DIR"` before building — output-delete-first behavior was already correct; the gap was purely the stale committed copy plus missing ignore rules.

## Limitation
Did not re-run the full CI script (Playwright a11y/E2E, npx) — no network/browser install in this environment; build/validate/verify/release-gate stages were run directly via `build.py` instead.

## Next dependency
Agent 76 (strict QA warning→blocking policy).
