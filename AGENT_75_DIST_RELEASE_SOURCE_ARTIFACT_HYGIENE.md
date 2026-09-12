# AGENT 75 — dist-release Source/Artifact Hygiene

## Mission
Eliminate stale dist-release from source/package distribution. Ensure release builds delete output first and regenerate from source. Add ignore/package hygiene so stale generated files cannot silently ship. Verify current runtime modules and packs appear in fresh output.

## Read first
- `dist-release/`
- `ci/release_gate.sh`
- `package.json`
- `.gitignore`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
