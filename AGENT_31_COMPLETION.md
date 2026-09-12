# Agent 31 — Strict Content QA release gate

## Status
DONE

## Files changed
- `ci/release_gate.sh` — production content QA invocation is now `--strict`.
- `.github/workflows/release.yml` — CI content QA step now uses `--strict`.

## Checks
- `bash -n ci/release_gate.sh` — PASS.
- `python3 content_qa.py --input master_source.csv --out-dir /tmp/mylingo-agent31-cq --strict` — correctly BLOCKS current starter content: 62 strict errors (60 underfilled quizzes + 2 short explanations).
- `python3 content_qa.py --input master_source.csv --out-dir /tmp/mylingo-agent31-diagnostic` — diagnostic mode remains non-blocking: 0 errors, 65 warnings, 1 info.
- A clean strict-ready fixture using `tests/unit/test_content_qa.py` behavior was not promoted by changing production thresholds; existing strict unit coverage remains authoritative.

## Known limitation
Full Playwright/browser stages remain unavailable in this sandbox.

## Next agent
Preserve strict QA as the production promotion contract and fix content-quality findings rather than weakening thresholds.
