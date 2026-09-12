# Agent 49 — Review Interval Schema

## DONE
Fixed the review backup validation mismatch: the scheduler can emit fractional `interval_days` (for example 0.25 days / 6 hours), but backup validation previously required integer days.

## Files changed
- `site/shared/js/gamification.js`
- `tests/unit/progress-backup.test.js`
- `AGENT_49_COMPLETION.md`

## What changed
- `interval_days` is now validated as finite, non-negative, and <= 30 days rather than integer-only.
- Added optional `interval_hours` validation for the current scheduler schema (0–720 hours).
- When both fields are present, their values must agree (`interval_days * 24 === interval_hours` within floating-point tolerance).
- Existing day-only backups remain compatible.

## Checks
- `node --check site/shared/js/gamification.js`: PASS.
- `node --check tests/unit/progress-backup.test.js`: PASS.
- Direct Node harness against the real module: fractional 6-hour interval accepted; inconsistent hour/day pair rejected: PASS.
- Vitest unavailable because `node_modules`/registry access is unavailable in this environment.

## Known limitation
Not verified in an actual browser.
