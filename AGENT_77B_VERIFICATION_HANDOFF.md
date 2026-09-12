# Agent 77b — Generation Pipeline Enforcement (Verification Pass)

## Files changed
- None. Agent 77's implementation (`generation/promote.py`,
  `generation/test_promote.py`) was inspected and re-verified as-is.

## What was checked
- Re-read `AGENT_77_GENERATION_PIPELINE_ENFORCEMENT.md` mission and
  `AGENT_77_COMPLETION.md` report against the actual code.
- Confirmed `promote()` runs `content_qa.audit_rows()` (diagnostic mode) on the
  post-promotion candidate set and blocks promotion on any `"error"`-severity
  finding, with `--skip-content-qa` / `enforce_content_qa=False` as the only
  explicit override. Structural `build.py` validation remains non-bypassable.
- Confirmed `generate.py` still only ever writes `status=draft`, so both CLI
  generation and the authoring app's export path must clear this `promote.py`
  gate (or the later release gate) before content reaches `published`.
- Checked the noted limitation (authoring app's own JS export path,
  `authoring/mylingo-admin.html` / `authoring-validation.js`): it runs
  structural checks only (mirrors `build.py`), not `content_qa`-level semantic
  checks (injection, answer/explanation contradiction). This is intentional,
  not a gap: the authoring UI's export is soft-warn-and-confirm for a human
  author, while the hard content-quality gate is enforced server-side by
  `promote.py` (this agent) and again at `ci/release_gate.sh`. No content can
  reach `published` without passing one of those two enforcement points.

## Verification
- `cd generation && python3 -m unittest discover -p "test_*.py"` → 62/62 pass.
- `python3 -m unittest discover -p "test_*.py"` (full repo) → 80/80 pass.

## Limitation
Same as Agent 77: authoring export UI itself has no client-side content-QA
enforcement; it is enforced transitively via `promote.py`/`release_gate.sh`.

## Next dependency
Agent 78 (scale regression benchmarks + bounded QA) — unchanged.
