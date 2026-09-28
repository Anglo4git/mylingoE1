----- BEGIN HANDOFF PACKAGE -----
AGENT: 249
DATE: 2026-09-27
TASK: Follow-ups from HANDOFF_AGENT_248.md — verify the architectural-gap note, clean up confirmed-dead selectors
STATUS: complete

## DONE THIS TURN
- Continued from `HANDOFF_AGENT_248.md`.
- Before acting on anything, re-verified Agent 248's "optional follow-up" note (manual `data-theme` toggle allegedly missing component-level dark coverage outside `@media(prefers-color-scheme:dark)`). Found the note was wrong: `data-theme` is used on exactly one page in the whole app (`main/placement.html`, confirmed via a full-repo grep), and that page has always had its own complete, independent manual-theme system predating this turn (an "Agent 12 / Step 10" block using `--surface`/`--surface2`/`--track` custom properties, applied via `html[data-theme] ...` selectors, and the page's own init script sets the `data-theme` attribute unconditionally on every load — falling back to OS preference when nothing is saved — so those rules are never dormant). No page with a manual toggle is under-covered; the gap Agent 248 described doesn't exist anywhere in the shipped app today. Recorded the correction in CHANGELOG.md instead of silently dropping it, so the record stays accurate for whoever reads back through it.
- Removed the 3 dead selectors Agent 248 found but deliberately left alone: `.hero-card` and `.mini-flow div` dropped from their selector lists in `shared/css/theme.css` (both were confirmed to match zero elements anywhere in the shipped app; every other class sharing those selector lists is untouched and still live), and `courses/index.html`'s standalone `.card.is-level-locked .btn{...}` rule deleted outright (the sibling `.card.is-level-locked{opacity:.55}` rule is live and was left alone — only the nested, never-rendered `.btn` rule was dead).
- Re-confirmed via `node tools/build-csp.js --check` that no CSP hash regeneration was needed (the `courses/index.html` change was inside an inline `<style>` block; per Agent 247's audit this repo's `style-src` is `'unsafe-inline'`-based, not hash-based, so inline `<style>` edits don't touch the CSP hash list the way inline `<script>` edits do).
- Rebuilt `offline/packs/core.zip`'s `shared/css/theme.css` and `courses/index.html` entries in place.
- CHANGELOG.md — entry appended.

## CURRENT STATE
- App runs: yes (static site, no build step)
- Build: n/a
- Typecheck: n/a
- Lint: n/a (tools/csp-sweep.js and build-csp.js --check are the closest static checks; both still pass)
- Tests: pass (`node tests/run.js` — **977 passed, 0 failed** — unchanged count; this turn removed dead CSS/markup only, no behavior changed, so no test additions were needed)
- `node tools/verify-all.js --quick`: **ALL GATES PASSED** (CSP up to date; dist byte-identical, 709 files)

## FILES CHANGED
- shared/css/theme.css — removed `.hero-card` and `.mini-flow div` from two existing selector lists; updated the Agent 248 comment block to reflect the cleanup
- courses/index.html — removed the dead `.card.is-level-locked .btn{...}` rule
- offline/packs/core.zip — shared/css/theme.css and courses/index.html entries replaced in place
- CHANGELOG.md — entry appended (includes the correction of Agent 248's note)

## FILES CREATED
- HANDOFF_AGENT_249.md — this handoff

## NEXT AGENT — START HERE
1. AUDIT_AGENT_244.md is now fully closed out or externally blocked: item 4 (CSP style-src re-scope — Agent 247, no clean path without a live Netlify deploy), item 5 (chapter-trail slide count — Agent 246, done), item 6.2 (theme.css class-drift — Agent 248/249, done). Still genuinely blocked on the person or a real device/browser: item 1 (audio icon asset), item 2 (offline/core.zip top-level stray duplicate — needs the person's confirmation before deleting), item 3 (forced-colors verification), item 6.1 (dark-mode logo asset).
2. No new open technical thread was created this turn — this was verification + cleanup, not new feature work. If nothing else is queued, the next agent should check in with the person for one of the person-gated items above (audio icon, logo asset, or the offline/core.zip duplicate) rather than inventing further scope, since everything independently actionable in this sandbox has now been worked through.
3. Standing blockers unchanged: git remote / Netlify account+site / domain / physical devices; axe-core + Lighthouse (npm install blocked, registry.npmjs.org 403 as of last check); domain-gated canonical/og:image/og:url/sitemap; real screen reader (VoiceOver/TalkBack) pass; no browser/Playwright harness reachable in this sandbox.

## ARTIFACTS
- MYLINGO_AGENT249_DEAD_SELECTOR_CLEANUP.zip — full source + CHANGELOG.md + this HANDOFF_PACKAGE.md
- CHANGELOG.md entry — "2026-09-27 — Agent 249 — Dead-selector cleanup + correction of an Agent 248 note"

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 250."
----- END HANDOFF PACKAGE -----
