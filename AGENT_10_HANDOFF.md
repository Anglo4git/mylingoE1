# Agent 10 Handoff — Accessibility / Mobile

## Status
COMPLETED

## Mission
Harden the shared mobile navigation and add enforceable mobile/accessibility regression contracts across the deployable HTML surface.

## Mini-Audit
### Scope
- `site/**/*.html`
- `site/shared/js/app-shell.js`
- `site/shared/css/app-shell.css`
- `tests/unit/test_mobile_accessibility.py`
- Playwright accessibility suite reviewed: `tests/e2e/accessibility.spec.js`

### Findings
- All 22 HTML pages already declare a mobile viewport.
- Existing pages generally expose `:focus-visible`; shared-shell pages inherit the shared rule.
- Shared bottom navigation had 56px minimum tab height, but its visibility state was represented only by `data-hidden`; it did not expose matching `aria-hidden`/`inert` state.
- Mobile touch-target behavior was not explicitly regression-tested.
- No demonstrated fixed-width page control over 320px was found by the added static contract.

## Changes Made
- `site/shared/js/app-shell.js`
  - Sets `data-hidden="false"` on mount.
  - Synchronizes `aria-hidden` with visibility.
  - Uses `inert` while hidden so the navigation cannot participate in keyboard interaction if its visual state changes.
- `site/shared/css/app-shell.css`
  - Added explicit visible keyboard focus treatment for navigation tabs.
  - Added coarse-pointer 48px minimum tab height.
  - Added narrow 360px tuning.
  - Preserved reduced-motion behavior.
- `tests/unit/test_mobile_accessibility.py`
  - Added viewport coverage.
  - Added focus-visible coverage.
  - Added shared-nav touch/visibility contract.
  - Added fixed-width overflow guard.

## Tests
Command intended:
```bash
python3 -m unittest tests/unit/test_mobile_accessibility.py -v
```

Environment limitation: the repository's Node dependencies are not installed in this runtime, so the existing Vitest/Playwright suites could not be executed here. The new checks are Python stdlib-only and should execute without npm dependencies.

## Regression Check
- Production behavior changed only in shared navigation accessibility state and touch/focus CSS.
- No content, quiz, scoring, persistence, or routing logic changed.
- Existing reduced-motion rule retained.

## Known Limitations
- Full 320/375/390/768/1024 browser matrix still requires the Playwright dependency/browser runtime.
- Automated axe audit remains the authoritative DOM accessibility regression suite already present in `tests/e2e/accessibility.spec.js`.

## Files Next Agent Must Inspect
- `AGENT_10_HANDOFF.md`
- `site/shared/js/app-shell.js`
- `site/shared/css/app-shell.css`
- `tests/unit/test_mobile_accessibility.py`

## Files Next Agent Must Not Touch
- Quiz scoring/persistence logic unless a later adversarial test demonstrates a defect.
- Content datasets unless owned by the content QA agent.

## Remaining Risks
- Browser-level verification remains environment-dependent until npm dependencies and Playwright browsers are installed.

## Exact Next Task
Agent 11 — Failure / adversarial testing: exercise malformed state, duplicate actions, rapid navigation, reload/save races, offline transitions, and corrupt learner state, adding regression tests for confirmed defects.

## Handoff Gate
- [x] status explicit
- [x] evidence recorded
- [x] tests reproducible
- [x] changed files listed
- [x] known limitations recorded
