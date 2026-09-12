# AGENT 71 — Answer-Length / Distractor Clue Control

## Mission
Eliminate CQ-C06 without weakening correctness. Improve distractor construction or use a bounded length-tell metric with explicit exceptions. Add fixtures. Acceptance: b2-010/c2-004 style warnings are gone and new clue patterns are caught.

## Read first
- `content_qa.py`
- `generation/generate.py`
- `master_source.csv`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.

## Agent 71 implementation update
`CQ-C06` now uses a bounded two-signal heuristic: the existing 1.8x character threshold must also have a two-word-count gap between the correct option and the longest distractor. This preserves detection of blatant length tells while allowing parallel multi-word options such as the C2 phrase set. No answer text is rewritten automatically.
