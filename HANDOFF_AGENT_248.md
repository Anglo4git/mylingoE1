----- BEGIN HANDOFF PACKAGE -----
AGENT: 248
DATE: 2026-09-27
TASK: AUDIT_AGENT_244.md item 6.2 — theme.css class-drift audit (previously unattempted)
STATUS: complete

## DONE THIS TURN
- Continued from `HANDOFF_AGENT_247.md`.
- Audited `shared/css/theme.css`'s dark-mode coverage against every page's own `<style>` block and dynamic `className` assignments (not just static `class="..."` attributes, since several relevant classes — `.answer`, `.node`, `.rank-num`, `.rank-move`, etc. — are only ever set via JS). Built the class list programmatically, then hand-verified every candidate against the actual CSS cascade (including `!important`/specificity interactions and existing state-variant rules) before treating anything as a real gap, to avoid both false positives and accidentally clobbering already-correct `var()`-based state styling.
- Found and fixed 11 confirmed-live dark-mode gaps in `shared/css/theme.css`: `.level-lock-overlay` (shared across 17 pages via `shared/js/level-lock.js`), the lesson-trail `.node` and unit `.unit-icon` (upcoming/base state only), `.unit-bar`, `.video-next-locked`, `.btn.ghost`, `.answer`/`.answer .num` (unselected state only), `.levels a`, `.myl-theme-toggle`, `.rank-item .rank-move`/`.rank-num`, and a text-contrast fix on `.lesson-complete` (hardcoded green text over a background that goes dark-green in dark mode — was on track to become unreadable, not just unstyled).
- Where a class already has a correctly-working `var()`-based state override (e.g. `.lesson.completed .node`, `.unit.current .unit-icon`, `.answer.selected`), the new rules are scoped with `:not(.completed)`/`:not(.current)`/`:not(.selected)` so they only catch the base/unstyled state and don't fight the existing correct behavior.
- Also identified — and deliberately left untouched — 3 dead selectors that match zero elements anywhere in the shipped app: theme.css's own pre-existing `.hero-card` and `.mini-flow`, and `courses/index.html`'s `.card.is-level-locked .btn`. These are harmless no-ops (nothing renders them), not part of what item 6.2 asked for, and removing dead CSS carries its own small risk for no visual benefit, so I documented them instead of touching them.
- Surfaced one pre-existing architectural note for whoever picks this up later (explicitly NOT fixed this turn, out of scope for item 6.2): every dark-mode rule in `theme.css` — old and new — lives inside `@media (prefers-color-scheme:dark)`, so it only fires when the OS itself is set to dark. The manual `data-theme="dark"` toggle (currently only wired up on `main/placement.html`) only flips the page-level background/text; none of the component-level dark styling in `theme.css` applies when someone manually forces dark while their OS is in light mode. This affects every class theme.css already covered before this turn too, not just the ones added here — it's a separate, larger piece of work.
- `shared/css/theme.css` is loaded as an external stylesheet, not inlined, so no CSP hash regeneration was needed — confirmed with `node tools/build-csp.js --check`.
- Rebuilt `offline/packs/core.zip`'s `shared/css/theme.css` entry in place.
- CHANGELOG.md — entry appended.

## CURRENT STATE
- App runs: yes (static site, no build step)
- Build: n/a
- Typecheck: n/a
- Lint: n/a (tools/csp-sweep.js and build-csp.js --check are the closest static checks; both still pass)
- Tests: pass (`node tests/run.js` — **977 passed, 0 failed** — unchanged count from Agent 247; this turn's fix was CSS-only, no new tests added)
- `node tools/verify-all.js --quick`: **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files)

## FILES CHANGED
- shared/css/theme.css — new `@media (prefers-color-scheme:dark)` block (11 selectors) added at the end, before the forced-colors block
- offline/packs/core.zip — shared/css/theme.css entry replaced in place
- CHANGELOG.md — entry appended

## FILES CREATED
- HANDOFF_AGENT_248.md — this handoff

## NEXT AGENT — START HERE
1. AUDIT_AGENT_244.md item 6.2 is now closed. Item 6 overall still has its other half open: a dark-mode logo asset is needed from the person (unchanged blocker).
2. AUDIT_AGENT_244.md's remaining open items (unchanged from Agent 247's handoff, all still blocked on something outside this sandbox): item 1 (audio icon asset, needs the person), item 2 (offline/core.zip stray duplicate at the repo top level, needs the person's confirmation before deleting), item 3 (forced-colors verification, needs a real browser), item 4 (style-src CSP hardening — investigated by Agent 247, no clean path without a live Netlify deploy or the full 95-attribute elimination Agents 19/20/27 already priced out and declined).
3. New, optional follow-up surfaced this turn (not urgent, not part of any open audit item): the manual dark-mode toggle / system-dark-mode architectural gap described above. If a future agent wants to fix it properly, the likely approach is duplicating (or restructuring into a shared selector list with) every `@media (prefers-color-scheme:dark)` block in theme.css under an equivalent `html[data-theme="dark"] ...` block — a bigger, more mechanical change than this turn's scope, worth doing as its own dedicated turn with its own test coverage.
4. Also noted, not acted on: 3 dead CSS selectors (`.hero-card`, `.mini-flow` in theme.css; `.card.is-level-locked .btn` in courses/index.html) that match nothing in the shipped app. Harmless as-is; flag again in case a future cleanup pass wants them gone.
5. Standing blockers unchanged: git remote / Netlify account+site / domain / physical devices; axe-core + Lighthouse (npm install blocked, registry.npmjs.org 403 as of last check); domain-gated canonical/og:image/og:url/sitemap; real screen reader (VoiceOver/TalkBack) pass; no browser/Playwright harness reachable in this sandbox — so none of this turn's dark-mode fixes were screenshot/browser-verified, only verified by CSS-cascade reasoning and confirming each targeted class is actually rendered by the live app (via grep against static markup and dynamic className assignments in the JS).

## ARTIFACTS
- MYLINGO_AGENT248_THEME_CLASS_DRIFT.zip — full source + CHANGELOG.md + this HANDOFF_PACKAGE.md
- CHANGELOG.md entry — "2026-09-27 — Agent 248 — AUDIT_AGENT_244.md item 6.2: theme.css class-drift audit + fix"

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 249."
----- END HANDOFF PACKAGE -----
