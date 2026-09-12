# AGENT 69 — Correct-Answer Position Diversity

## Mission
Eliminate CQ-B05. Add deterministic seeded answer-position balancing/shuffling without changing meaning or corrupting correct_index. Add a regression fixture for a quiz whose correct position is identical across all questions. Acceptance: current QA has no CQ-B05 warning and builds remain reproducible.

## Read first
- `content_qa.py`
- `generation/generate.py`
- `build.py`
- `master_source.csv`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
