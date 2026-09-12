# Agent 64 — Skill/objective canonical metadata

## Status
COMPLETED

## Changed
- `site/shared/js/canonical-metadata.js`: added one canonical six-skill vocabulary, category mapping, objective alias normalization, and numeric metadata normalization.
- `site/shared/js/runtime-v2-adapter.js`: normalizes `skill`, `objective`/`learning_objective`, `subskill`, `difficulty`, `cefr`, and `estimated_time_seconds` additively; legacy rows remain unchanged when metadata is absent.
- `site/shared/quiz.html`: loads the metadata normalizer before the v2 adapter.
- `build.py`: accepts optional canonical metadata columns and emits them into runtime question metadata without changing the frozen 23-column source contract.
- `tests/unit/canonical-metadata.test.js`: focused coverage.

## Verification
- Canonical metadata Vitest tests pass.
- Python source validation and existing focused runtime tests pass.

## Limitation
Current `master_source.csv` has no canonical skill/objective columns, so existing generated quiz files are intentionally not mass-regenerated.
