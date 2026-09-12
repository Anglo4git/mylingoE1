# Agent 77 Completion — Generation Pipeline Enforcement

## Files changed
- `generation/promote.py`
- `generation/test_promote.py`

## What changed
- `promote()` now also runs `content_qa.audit_rows()` against the same post-promotion
  candidate row set already used for `build.py.validate()`, and blocks promotion of any
  quiz with an `"error"`-severity content-QA finding (executable-content injection, an
  explanation that contradicts the marked answer, empty/malformed required fields, ...).
- Deliberately runs in diagnostic mode, **not** `--strict`: Agent 76's strict-mode
  warnings (short explanation, answer-position pattern, etc.) are legitimate at
  promotion time for a maturing content library and are enforced later, at release
  time, by `ci/release_gate.sh`. Using `--strict` here would have broken ~15
  pre-existing tests whose minimal fixtures are valid-but-not-yet-polished.
- Added `--skip-content-qa` / `enforce_content_qa=False` for explicit, reviewed
  overrides. Structural `build.py` validation is never bypassable.
- `generate.py` was not touched: it already only ever writes `status=draft`, so
  content from it (or from the authoring app's export path) still must pass through
  this `promote.py` gate before it can reach `published`.

## Verification
- `python3 -m unittest discover -p "test_*.py"` → 80/80 pass (76 pre-existing + 4 new).
- New bad fixture: explanation explicitly claims the wrong answer is correct (CQ-X01)
  — a defect `build.py.validate()` has no way to see — is rejected, quiz stays `draft`.
- New valid fixture (the existing `quiz_rows()` helper) still promotes.
- One bad quiz among several requested still doesn't block a clean one.
- `--skip-content-qa` bypass verified to restore prior (structural-only) behavior.

## Limitation
Did not modify the authoring app's own export path (JS, larger surface, not in the
read-first list) — content exported there is covered transitively (it still must pass
through this gate or the release gate before going live) but is not directly enforced
at export time.

## Next dependency
Agent 78 (scale regression benchmarks + bounded QA).
