# Agent 2 Handoff — Static Quality Gate

## Status
COMPLETED (for what's currently in the artifact) — but see Known
Limitations: the production-code scope is nearly empty because of R-009
(`site/` is empty), inherited unchanged from Agent 1.

## Mission
Introduce enforceable lint/static-quality validation without a broad
refactor.

## Mini-Audit

### Scope
All `.js`/`.mjs`/`.cjs` files in the repo (`site/`, `scripts/`, `tests/`,
root config files), excluding `node_modules`/vendor/minified.

### Findings
Baseline scan of the untouched checkout, before any changes:
- `console.log`: 0 occurrences
- `debugger`: 0 occurrences
- `eslint-disable`: 1 occurrence (`tests/e2e/accessibility.spec.js:39`,
  already has an inline justification comment)
- `TODO`/`FIXME`/`XXX`: 0 occurrences
- Files > 800 lines: 0
- No existing lint config of any kind (`.eslintrc*`, `eslint.config.*`)
  was present.
- The equivalent Python-side smells (`pdb.set_trace()`/`breakpoint()`,
  bare `except:`, TODO markers) were also checked as a sanity pass and
  are all 0 across 46 `.py` files — noted for context, not acted on
  (Python static-quality gate is not this agent's assigned command;
  `npm run lint` is).

**Root cause of the near-empty findings:** `site/` — where essentially
all production JavaScript would live — has 0 files (R-009, logged by
Agent 1). The only "production" JS in scope by this gate's own
definition (`site/**` + `scripts/**`) is a single file,
`scripts/placement_coverage_report.mjs`, which is clean.

## Implementation Decision — no external lint package installed

`npm install eslint` fails in this sandbox: no network egress (registry
returns 403 — confirmed by Agent 1's handoff and re-confirmed here).
Rather than leave `npm run lint` undefined or write a config nobody can
run, I wrote a small dependency-free scanner
(`scripts/lint.js`, ~200 lines, Node built-ins only) that enforces the
same rule intent as a normal ESLint setup would, and wired it as
`npm run lint`. It runs today, in CI, with zero install step.

I also added `eslint.config.js` (flat config, ESLint 9 shape) so that
the moment an environment *does* have registry access, `npm install -D
eslint && npx eslint .` is a drop-in upgrade to a real parser instead of
regex heuristics — no redesign needed later. It is inert until then and
is not wired into `npm run lint`.

### Rules enforced by `scripts/lint.js`
- **Blocking, production scope only** (`site/**`, `scripts/**`):
  `debugger` statements, `console.log` calls, `TODO`/`FIXME`/`XXX`
  markers.
- **Warning everywhere** (production + `tests/**` + root configs):
  unexplained `eslint-disable` comments, files > 800 lines, heuristic
  runs of 3+ consecutive commented-out lines that look like real
  statements.
- Test/config files never fail the gate on blocking rules — `console.log`
  and stub markers are common and legitimate in test diagnostics, so
  those stay warning-only there. `debugger` is still only blocking in
  production; a stray `debugger` in a test file would be a warning, not
  a hard fail, since it's the kind of thing you'd actually want while
  writing a test.
- String/template literal contents are stripped before matching, so a
  string like `"remove any console.log before shipping"` doesn't
  self-trigger.
- The scanner excludes itself from its own production-scope walk (it
  lives in `scripts/`) — its own doc-comments mention `debugger` and
  `console.log` by name, which otherwise false-positive against itself.

## Changes Made
- `scripts/lint.js` (new) — the enforcement logic described above.
- `eslint.config.js` (new) — forward-compatible flat config, not
  currently executable in this sandbox, documented as such at the top of
  the file.
- `package.json` — added `"lint": "node scripts/lint.js"` script.
- No application/test files were modified. No broad formatting churn.

## Tests Added
- The scanner is self-verifying by construction (exit code IS the test),
  but I also ran an explicit positive/negative control (see Commands Run)
  rather than relying on "it happened to pass once."

## Commands Run
```bash
npm run lint
# → 0 blocking, 1 warning (the pre-existing, already-justified
#   eslint-disable in accessibility.spec.js). exit 0.

node scripts/lint.js
# → same result, confirming it needs no npm/install step (CI-safe).

# Negative control: dropped a throwaway file into scripts/ containing
# console.log(...), debugger;, and a TODO comment.
npm run lint
# → 3 blocking findings, all three correctly identified and located.
# exit 1.
# Removed the throwaway file, re-ran, back to exit 0.

python3 scripts/verify_release_identity.py
# → PASS: release identity is consistent (v118).  (Agent 1's gate,
#   confirmed unaffected by this handoff.)
```

## Results
PASS/FAIL: **PASS**. `npm run lint` exits 0 on the current tree; exits 1
and correctly localizes findings when a real violation is present
(verified via negative control above).

## Regression Check
- Previous tests: Agent 1's `release:verify-identity` re-run and
  confirmed still green (see Commands Run). No application/runtime files
  touched, so the pre-existing Python `unittest` failures from R-009 are
  unchanged (not re-run in full here since Agent 1 already captured and
  attributed them; nothing in this handoff could affect them).
- New tests: the lint gate itself, positive + negative control both
  verified.
- Build: not run (blocked by R-009, unrelated to this agent's scope).
- Lint: **now exists and passes** (this was the point).
- Typecheck: none configured yet (Agent 3's mandate).
- E2E: not run (Agent 4's mandate; blocked by R-009 regardless).

## Known Limitations
- This is a regex/heuristic scanner, not a real parser. It cannot catch
  everything a proper ESLint setup would (unused variables, unreachable
  code, scoping bugs, etc.) — it only covers the specific mini-audit
  items in scope for this agent (console.log, debugger, eslint-disable,
  TODO/FIXME, oversized files, obviously-commented-out code).
  `eslint.config.js` is there for when a real parser becomes runnable.
- The "commented-out code" heuristic is intentionally conservative
  (warning-only, 3+ consecutive lines, specific shape) to avoid false
  positives on ordinary multi-line comments; it will miss some real
  cases and could rarely still flag a legitimate multi-line comment that
  happens to look code-shaped. Worth a human glance on any warning it
  produces, not worth hardening further without real usage data.
- **Coverage is only as good as what exists.** With `site/` empty
  (R-009), this gate is currently validating almost nothing of what will
  eventually be the actual application. It needs to be re-run — not
  reconfigured, just re-run — once `site/` is restored, and any findings
  at that point are real, not something this handoff pre-cleared.

## Files Next Agent Must Inspect
- `scripts/lint.js` if extending rules — it's short and commented,
  intentionally not clever.
- `eslint.config.js` if/when real ESLint installation becomes possible.

## Files Next Agent Must Not Touch
- Same historical-docs exclusion as Agent 1's handoff
  (`AGENT_*_COMPLETION.md`, `AGENT_*_HANDOFF.md`,
  `MASTER_HANDOFF_AGENTS_*.md`).

## Remaining Risks
- R-009 (unchanged, still critical, still unowned) makes this gate's
  current scope nearly vacuous. Flagging again rather than re-solving —
  not this agent's mandate.
- No CI wiring yet to actually *run* `npm run lint` automatically on
  every change (that's `.github/workflows/release.yml` / Agent 12's
  release-pipeline mandate) — the command exists and works, but nothing
  currently calls it automatically.

## Exact Next Task
Agent 3: close the missing static-analysis/coverage enforcement gap
(`@ts-check` + JSDoc where useful, coverage baseline + threshold on
grading/persistence/placement/recommendation/offline/scheduling/content
modules) — same caveat applies: most of that logic lives under `site/`,
which is currently empty.

---

## Addendum — re-run against restored `site/` (Agent 0, follow-up session)

`site/` was empty when this handoff was originally written (see
Known Limitations above), so the lint gate's production scope was
effectively 1 file. In the artifact reviewed this session, `site/` is
populated (145 files; R-009 resolved — see
`AGENT_0_ORCHESTRATOR_HANDOFF.md`). Re-ran `node scripts/lint.js`
against the real tree:

```
0 blocking, 1 warning finding(s) across 19 production + 38 test/config file(s).
```

Same single pre-existing warning as before (the justified
`eslint-disable` in `accessibility.spec.js`), now against real
production scope rather than a vacuous one. Gate result: still PASS,
and this time it means something. No changes to `scripts/lint.js`
itself were needed.
