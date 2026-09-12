# AGENT 79 — Release / Browser Verification Wiring

## Mission
Wire learner E2E and accessibility checks into release against a fresh build where supported. Keep JS syntax, strict QA and pack/index checks. If local browser dependencies are absent, ensure CI wiring is explicit and report the limitation.

## Read first
- `.github/workflows/release.yml`
- `ci/release_gate.sh`
- `tests/e2e/`
- `playwright.config.js`
- `package.json`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
