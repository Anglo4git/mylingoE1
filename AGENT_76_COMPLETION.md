# Agent 76 Completion — Strict QA Warning-to-Blocking Policy

## Files changed
- `content_qa.py`
- `test_content_qa_agent76.py` (new)

## What changed
- Added a single canonical `STRICT_BLOCKING_CODES` set (CQ-S02, CQ-C08, CQ-B01, CQ-B05,
  CQ-C06, CQ-D02) as the one source of truth for which codes `--strict` promotes to
  `error`, replacing three scattered ad hoc ternaries.
- Centralized the promotion into one pass in `audit_rows()`, applied after every check
  has run, and restricted it to `"warning"`-severity issues only — `"info"`-severity
  issues are never promoted, so they stay observational by design.
- CQ-D02 (repeated explanation) now distinguishes legitimate single-quiz reuse (one
  grammar point explained once for every question in a quiz — stays `"info"`, never
  blocking) from reuse spread across multiple *different* quizzes (template-drift
  signal — now `"warning"`, blocked under `--strict`). This split was necessary: the
  real `master_source.csv` has 57 legitimate single-quiz reuse instances that a naive
  "always promote CQ-D02" policy would have wrongly failed.

## Verification
- `python3 -m unittest discover -p "test_*.py"` → 75/75 pass (71 pre-existing + 4 new).
- `python3 content_qa.py --input master_source.csv --strict` → still 0 errors, 0 warnings
  (real baseline unaffected).
- New test injects a deliberate CQ-B05 + cross-quiz CQ-D02 + CQ-C06 violation:
  diagnostic mode reports all three but exits 0; `--strict` promotes all three to
  `error` and the CLI exits non-zero. A companion regression test proves legitimate
  single-quiz CQ-D02 reuse is never blocked even under `--strict`.

## Limitation
Did not re-run `ci/release_gate.sh` end-to-end (no browser/npx in this environment);
verified via `content_qa.py --strict` directly instead, which is the stage that script
already invokes.

## Next dependency
Agent 77 (content-generation pipeline enforcement).
