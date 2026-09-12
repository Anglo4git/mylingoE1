# AGENT 76 — Strict QA Warning-to-Blocking Policy

## Mission
Make production release fail on release-quality warnings covered by the canonical policy. Strict Content QA must be the source of truth; diagnostic mode remains available. Inject a deliberate CQ-B05/D02/C06 failure and prove the gate rejects it.

## Read first
- `content_qa.py`
- `ci/release_gate.sh`
- `build.py`
- `.github/workflows/release.yml`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
