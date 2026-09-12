# AGENT 78 — Scale Regression Benchmarks + Bounded QA

## Mission
Prove the quality fixes do not regress 1.2M-scale architecture. Benchmark 100k+ synthetic rows where feasible. Verify no full-DOM editor, whole-dataset localStorage autosave, unbounded offline install or all-at-once export regression. Record memory/time.

## Read first
- `content_qa.py`
- `build.py`
- `authoring/mylingo-admin.html`
- `site/shared/js/authoring-draft-autosave.js`
- `site/shared/js/offline-packs.js`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
