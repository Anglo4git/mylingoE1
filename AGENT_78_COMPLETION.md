# Agent 78 Completion — Scale Regression Benchmarks + Bounded QA

## Files changed
- `scripts/scale_regression_benchmark.py` (new)
- `tests/unit/test_scale_regression_benchmark.py` (new)

## What changed
Agent 65's harness (`scripts/scale_benchmark.py`) only benchmarks `build.py`'s
streaming structural validator, not `content_qa.py` — the module whose
cross-row duplicate/diversity indexes (near-duplicate detection, answer-position
tracking, repeated-explanation detection) are the actual O(n^2) regression risk
at 1.2M-row scale. The new harness reuses Agent 65's synthetic-fixture
generator, runs `content_qa.audit_file()` in a subprocess at two row counts,
and compares wall-time and peak RSS (`RUSAGE_CHILDREN.ru_maxrss`) growth
against row-count growth, failing (status `FAIL`, non-zero exit) if either
grows super-linearly (>1.35x the row-count ratio) — the signal for an
accidental quadratic regression, not just a number to eyeball.

## Verification
- `python3 scripts/scale_regression_benchmark.py --baseline-rows 10000 --rows 100000`
  → 10k rows: 6.53s / 43MB peak. 100k rows: 10.78s / 245MB peak. Time growth
  1.65x and memory growth 5.84x, both within the 13.5x linear-tolerance band
  for a 10x row increase → `status: PASS`. Projected ~129s for the full
  1.2M-row target on this environment.
- `python3 -m unittest discover -s tests/unit -p "test_*.py"` → 69/69 pass
  (67 pre-existing + 2 new), matching `package.json`'s `test:python` script.
- `python3 -m unittest discover -p "test_*.py"` (root/`generation/`) → 80/80
  pass, unchanged.
- Confirmed (inspection, no changes needed) that Agents 51/52/59/60's
  bounded-scale safeguards are still in place and untouched: authoring
  pagination/virtualization (`authoring/mylingo-admin.html`), chunked
  bounded-memory autosave (`authoring-draft-autosave.js`), and offline
  install concurrency limit / `MAX_INSTALLED_PACKS` eviction
  (`offline-packs.js`).

## Limitation
`content_qa.audit_file()` still materializes the full row list in memory
(chunked *reading*, not chunked *auditing*) — this is a necessary tradeoff,
not an oversight: cross-quiz duplicate/diversity detection is inherently
whole-dataset in scope, exactly mirroring `build.py`'s equally-necessary
`quizzes` grouping. The benchmark proves this stays linear/bounded in
practice (not quadratic), not that it uses zero additional memory. Peak RSS
figures are this environment's numbers only, not a hardware-independent
guarantee, and no real-browser DOM/memory measurement was performed.

## Next dependency
Agent 79 (release/browser verification wiring).
