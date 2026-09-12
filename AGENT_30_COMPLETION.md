# Agent 30 — Root deployment entry

## Status
DONE

## Files changed
- `site/index.html` — minimal root HTML entry with redirect + visible fallback link.
- `build.py` — clean builds now copy the root `index.html` from the runtime source.

## Checks
- Root entry exists and links to `./main/index.html` — PASS.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent30-build --src-root site` — PASS.
- Built `/tmp/mylingo-agent30-build/index.html` exists and contains the fallback link — PASS.
- `python3 build.py verify-output --out /tmp/mylingo-agent30-build` — PASS.

## Known limitation
No browser deployment test was run; relative-path verification is static and build-artifact based.

## Next agent
Release gating must treat strict Content QA failures as production blockers without weakening the documented thresholds.
