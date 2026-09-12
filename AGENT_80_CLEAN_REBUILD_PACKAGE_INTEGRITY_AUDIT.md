# AGENT 80 — Clean Rebuild + Package Integrity Audit

## Mission
Clean generated output and build from source. Verify strict QA, manifests, quiz indexes, pack references, service-worker references, PWA icons, duplicate IDs, orphan files, current JS modules and source/generated parity. No stale release artifacts.

## Read first
- `build.py`
- `content_qa.py`
- `ci/release_gate.sh`
- `offline/`
- `site/`
- `dist-release/`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
