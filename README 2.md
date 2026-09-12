# Mylingo — v118 Release Package

Canonical release identity: **v118** (see `RELEASE_IDENTITY.json`, the single
source of truth — do not hardcode a release tag anywhere else).

This package is the accumulated output of a long sequential multi-agent
hardening effort (Agents 1–121; see the `AGENT_*_COMPLETION.md` /
`AGENT_*_HANDOFF.md` files for the per-agent history, and
`AGENTS_109_120_FINAL_HANDOFF.md` for the most recent consolidated status).
Those numbered files are historical records of what each agent shipped at
the time and are intentionally left unedited.

Before producing a new release artifact, run:

```bash
npm run release:verify-identity
```

to confirm the directory name, `package.json`, and `README.md` all agree
with `RELEASE_IDENTITY.json`. Prior zips shipped under conflicting names
(`v118`, `v120`, `v121`) precisely because nothing enforced this — see
`AGENT_1_RELEASE_IDENTITY_COMPLETION.md`.

`site/` (the actual deployable static app — `index.html`,
`dashboard.html`, `shared/`, `sw.js`, `main/`, content folders) is
present and populated in this release. A prior artifact shipped with
`site/` empty (0 files, R-009) — that is resolved here; see
`AGENT_0_ORCHESTRATOR_HANDOFF.md` for the verification evidence
(`unittest` suites and file counts) and `MASTER_REMEDIATION_HANDOFF.md`
for the current risk register.
