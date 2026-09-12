# Agent 1 Handoff — Release Identity

## Status
PARTIAL — release-identity drift (my assigned scope) is fixed and gated.
A separate, more severe, out-of-scope defect was discovered during the
mini-audit and is NOT fixed here (see "Critical finding outside scope").

## Mission
Eliminate release/package identity drift and make it mechanically
impossible for the shipped zip name, `package.json`, and `README.md` to
disagree about what release this is.

## Mini-Audit

### Scope
`RELEASE_IDENTITY.json` (new), `package.json`, `README.md`, on-disk root
directory name, and every `AGENT_*`/`AGENTS_*` `.md` file at the repo root
(read-only, for evidence — not edited).

### Findings

- **ID:** R-002 (as listed in the orchestration plan)
  **Severity:** Medium
  **Evidence:** No single canonical version source existed.
  `package.json` `version` was a generic `"1.0.0"` unrelated to release
  naming. `README.md` opened with `"# Mylingo v42 — 20-Agent Hardening
  Pack"` (stale from early in the project). The repo's own history shows
  the `vNNN` token was never a real semantic version — it tracked
  whichever agent number last produced a shipped zip
  (`AGENT_118_RELEASE_GATE.md` → `MYLINGO_v118_FINAL_RELEASE.zip`,
  `AGENT_120_FINAL_RELEASE_GATE.md` → `MYLINGO_v120_FINAL_RELEASE.zip`),
  which is exactly why the task brief for this session lists the input
  artifact as `MYLINGO_v121_FINAL_RELEASE.zip` while the actual root/zip
  received was `MYLINGO_v118_FINAL_RELEASE`. Nothing enforced agreement
  between any of these.
  **Status:** Fixed (see below). Root-caused: there was no gate, so
  nothing ever caught the mismatch before shipping.

- **New — R-009 (added to risk register, not in original 8)**
  **Severity:** CRITICAL — blocks everything downstream
  **Evidence:** `site/` — the actual deployable static app
  (`index.html`, `dashboard.html`, `shared/`, `sw.js`, `main/`, per-level
  folders, etc.) — is present as a directory but contains **0 files** in
  this artifact. Confirmed independently two ways:
  1. `unzip -l` on the original uploaded zip shows exactly one `site/`
     entry (the empty directory) and no files under it.
  2. Running the repo's own pre-existing test suites against the
     unmodified checkout: `python3 -m unittest discover -p "test_*.py"`
     → 11 failures/errors; `python3 -m unittest discover -s tests/unit
     -p "test_*.py"` → 33 failures/errors, all tracing back to missing
     `site/...` files (e.g. `offline_packs.py` raising
     `FileNotFoundError: core manifest missing required runtime assets:
     sw.js, manifest.json, main/index.html, ...` — a 50+ file list).
  Per `BUILD.md`/`package.json`, `site/` is **hand-authored source**
  (`build.py` reads *from* `site/` into `dist-release/`, not the other
  way around), so this cannot be regenerated from `master_source.csv` or
  any other artifact present in this zip. The content is simply not in
  this package.
  **Status:** NOT fixed — outside Agent 1's mandate (release *identity*,
  not release *content*) and not something I can safely reconstruct
  without inventing files. Flagging for Agent 0/reassignment; this
  should almost certainly block release regardless of what any other
  agent finds, and makes several of this session's other exit gates
  (E2E, offline, accessibility) unverifiable as written until it's
  resolved, since there's no app to test.

## Changes Made
- `RELEASE_IDENTITY.json` (new) — single canonical source:
  `releaseId: "v118"`, `packageDirName`, `artifactFilename`. Chosen as
  `v118` because that's what the actual delivered root directory and zip
  filename are; relabeling to `v121` was rejected as out of scope since I
  cannot verify what a "true" v121 artifact should contain when `site/`
  is empty regardless of label.
- `package.json` — added `"release": "v118"` field and a
  `"release:verify-identity"` script.
- `README.md` — rewritten (was 7 lines, entirely stale, referencing
  "Agents 28–47" and `v42`). Now states the canonical release id, points
  at `RELEASE_IDENTITY.json`, and documents the `site/`-empty critical
  finding up front so nobody misses it.
- `scripts/verify_release_identity.py` (new) — reads
  `RELEASE_IDENTITY.json`, checks it against the on-disk root directory
  name, `package.json`, and `README.md`'s title line. Exits 1 with a
  specific message per mismatch. Does **not** scan/modify historical
  `AGENT_*_COMPLETION.md` / `AGENT_*_HANDOFF.md` files — those are
  point-in-time records and are left alone by design.
- `tests/unit/release-identity.test.js` (new) — vitest wrapper that runs
  the script and asserts exit 0, so the check runs as part of the normal
  JS test suite, not just as a standalone script.

## Tests Added
- `tests/unit/release-identity.test.js` — layer: unit/regression,
  assertion: `verify_release_identity.py` exits 0 and prints `PASS`.
- `scripts/verify_release_identity.py` itself is the enforcement logic
  (runnable standalone via `npm run release:verify-identity` or
  `python3 scripts/verify_release_identity.py`).

## Commands Run
```bash
python3 scripts/verify_release_identity.py
# → PASS: release identity is consistent (v118).

npm run release:verify-identity
# → PASS: release identity is consistent (v118).

# Negative-control: deliberately set package.json "release" to "v999"
# and re-ran the script to confirm it actually fails when it should.
# → FAIL: package.json 'release' field is 'v999', expected 'v118' ...
# Reverted, re-ran, confirmed PASS again.

python3 -m unittest discover -p "test_*.py"
python3 -m unittest discover -s tests/unit -p "test_*.py"
# (regression evidence for the site/ finding above; not something
# Agent 1 is fixing)
```

## Results
- Release identity gate: PASS (positive case) / correctly FAILS on
  injected drift (negative case). Both verified.
- `npm install` could not be run in this sandbox (no network egress —
  registry returned 403), so `vitest` itself could not execute here.
  `release-identity.test.js` is written and wired into
  `package.json`'s existing `"test"` script; it needs to be run once in
  an environment with `npm install` access as final confirmation, but
  the logic it calls has been verified directly.
- Pre-existing Python suites: NOT green, but the failures are 100%
  attributable to the pre-existing missing `site/` content (R-009), not
  to anything changed in this handoff. Ran before AND conceptually
  unaffected by my changes, since I touched no test-relevant application
  code.

## Regression Check
- Previous tests: unaffected by my changes (I did not touch any
  application/runtime files, only identity metadata + new test).
- New tests: 1 added (`release-identity.test.js`), verified via direct
  script execution (see Results — vitest itself unrunnable in this
  sandbox due to no network).
- Build: not run (would fail immediately on missing `site/`, same as
  the pre-existing suites — see R-009).
- Lint: none configured yet (Agent 2's mandate).
- Typecheck: none configured yet (Agent 3's mandate).
- E2E: not run (Agent 4's mandate; also blocked by R-009 regardless).

## Known Limitations
- `scripts/verify_release_identity.py`'s README check only inspects the
  title line for conflicting `vNNN` tokens (not the whole file), so
  README prose is free to discuss historical version tags without
  tripping the gate. Only the asserted "current" tag is enforced.
- The directory-name check only activates when the root directory
  actually matches the `MYLINGO_v\d+_FINAL_RELEASE` shape, so it's a
  no-op in throwaway/CI checkout paths with different names — intentional,
  but worth knowing.
- `vitest` execution itself is unverified in this sandbox (see Results).

## Files Next Agent Must Inspect
- `RELEASE_IDENTITY.json` — read this first, it's now the source of
  truth for the release tag.
- This file, for the R-009 finding — whoever picks it up (recommend
  Agent 0 reassigns it explicitly; it doesn't cleanly fit any single
  numbered agent's original mandate since it's a missing-source-content
  problem, not a code-quality/test/security problem).

## Files Next Agent Must Not Touch
- `AGENT_*_COMPLETION.md`, `AGENT_*_HANDOFF.md`,
  `MASTER_HANDOFF_AGENTS_*.md` at the root — historical records,
  intentionally left as-is.

## Remaining Risks
- R-009 (new, critical) as described above — this is now the top risk in
  the project, above everything in the original 8-item register.
- Until R-009 is resolved, no later agent should declare the release
  "verified" based on anything other than static analysis of the
  non-`site/` parts of the repo.

## Exact Next Task
Either: (a) locate/restore the actual `site/` source tree from wherever
it was lost before continuing with Agents 2+, or (b) if `site/` truly
cannot be recovered, escalate to whoever owns the source repository — no
agent in this chain can safely fabricate ~296 files of hand-authored
HTML/CSS/JS from the assets present in this zip alone.

---

## Addendum — R-009 resolved, R-010 found and fixed (Agent 0, follow-up session)

`site/` is populated in the artifact reviewed this session (145 files;
105/105 `tests/unit` + 128/128 root-level `unittest` all pass — see
`AGENT_0_ORCHESTRATOR_HANDOFF.md` for full evidence). R-009 is closed.

Separately, this artifact was found to contain a full shadow-duplicate
copy of the repository (9 top-level `" 2"`-suffixed directories plus
205 duplicated files, including a second `package.json`/`README.md`
that actually carried this agent's own fixes instead of the canonical
copies). Logged and fixed as R-010 — see
`AGENT_0_ORCHESTRATOR_HANDOFF.md`. `package.json` and `README.md` at
the repo root are now the single canonical copies;
`scripts/verify_release_identity.py` re-run against the merged tree
still PASSes.
