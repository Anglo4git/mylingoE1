# Agent 73 — Cross-Question & Content Diversity Regression Gates

## Completed
- Added three new deterministic, bounded content_qa.py checks:
  - `CQ-D05`: repeated answer-option set + correct-answer text reused across ≥3 distinct quizzes (≥4 occurrences), dataset-scope, mirrors the CQ-D04 threshold shape.
  - `CQ-D06`: within-quiz near-duplicate signature (stem frame + answer set + correct-answer text repeated ≥2× in one quiz) — a precise three-way match so legitimate single-dimension reuse (e.g. an "am/is/are" paradigm) never fires.
  - `CQ-D07`: within-quiz question-stem diversity ratio (<50% unique stems, quizzes ≥6 questions only).
- All warning-severity, scoped with `_row_ref`/`_quiz_ref`, reusing existing `_diversity_frame`/`normalize_text` helpers — no new O(n²) scans.

## Files changed
- `content_qa.py` (indexes + 3 new checks)
- `test_content_qa_agent73.py` (new, 6 tests incl. false-positive guards)

## Verification
- `python3 -m unittest discover -s tests/unit`: 67 passed.
- `python3 -m unittest test_content_qa_agent72 test_content_qa_agents70_71 test_content_qa_agent73`: 13 passed.
- `build.py validate --input master_source.csv`: 300 rows, 60 quizzes, 0 errors, 0 warnings (unchanged).
- `content_qa.py audit --input master_source.csv`: 0 errors, **7 new warnings**, 62 info, score 93/100. Manually verified all 7 are genuine near-duplicate items (same distractor set + correct word, reworded sentence) in b2-007, c1-007, c1-010, c2-002, c2-004, c2-007, c2-010 — real content-diversity gaps, not false positives.

## Limitation / next dependency
Thresholds are tuned conservatively (warning-only); a future agent could promote to `--strict` errors and/or resolve the 7 flagged near-duplicates.
