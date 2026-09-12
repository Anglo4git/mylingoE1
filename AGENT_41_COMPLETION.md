# Agent 41 — Review scheduler granularity

DONE

- Added hour-level scheduling while preserving legacy `interval_days` and v1 storage shape.
- Very weak evidence (under 40%) now reviews in 6 hours; 40–59% in 24 hours; stronger bands remain 3/7/14 days, with successful repetition still doubling up to 30 days.
- Added `interval_hours`, `accuracyBandHours()`, and `calculateNextIntervalHours()` for precise due timestamps.

Changed: `site/shared/js/review-scheduler.js`, `tests/unit/review-scheduler.test.js`.
