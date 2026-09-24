----- BEGIN HANDOFF PACKAGE -----
AGENT: 8
DATE: 2026-09-23
STEP: 8 complete; STEP 9 partially complete (real audits done, two real findings, neither fixed)
STATUS: Step 8 (PWA install) genuinely verified via a real captured event. Step 9 (Lighthouse) ran real audits on 5 pages, surfaced two real bugs, fixed neither — one turned out to need more than a quick patch, the other needs content work outside a verification pass.

## DONE THIS TURN
- Checked the toolset before assuming Step 9 needed a live URL (per Agent 7's explicit prompt to do this). `npm install lighthouse` worked directly — no blocker.
- Built and used (then deleted) a throwaway local server replicating netlify.toml's header block, same pattern as Steps 6/7.
- Step 9: ran Lighthouse (perf/a11y/best-practices/SEO) against 5 key pages. a11y=100, best-practices=100 everywhere checked.
- Step 9 real finding #1 (NOT fixed): all 22 pages lack `<meta name="description">` — holds SEO to ~90-91 everywhere. Needs 22 pieces of distinct, accurate copy — a genuine content task, not a config fix. Left for you.
- Step 9 real finding #2 (root-caused, fix attempted and REVERTED because it didn't work): `a1/dashboard.html` (and its 5 siblings a2/b1/b2/c1/c2 — identical markup) has CLS≈0.57, tanking performance to 77.
  - First hypothesis (wrong): `#masteryReviewMount` starts empty and grows on fill. Patched with `style="min-height:340px"` on all 6 dashboards. Re-ran Lighthouse: CLS barely moved (0.569→0.529) and the specific shift's score was IDENTICAL to 13 decimal places — proof the patch didn't touch the actual mechanism, not just an incremental improvement.
  - Used a direct Playwright `PerformanceObserver({type:'layout-shift'})` probe (real `sources[].previousRect/currentRect`, not just Lighthouse's summary number) to find the real causes:
    1. `<img class="brand-logo" src="../shared/brand/logo-horizontal.svg">` has no explicit width/height. `.headrow{flex-wrap:wrap}` guesses wrong before the SVG loads (wraps to 2 lines), then reflows to 1 line once it loads — shifts the whole header (~0.34 CLS alone).
    2. `#stats` and `#body` (empty in the static markup) get filled by the page's own inline script measurably AFTER first paint, not before — so everything below them (`#resetWrap`, `#masteryReviewMount`, `#offlinePacksMount`) gets pushed down well after the page already painted (~0.35 CLS alone). `#masteryReviewMount` itself is mostly an innocent bystander in this — it's not "empty-then-grows," it's being carried by a shift that starts above it.
  - Reverted the ineffective min-height patch on all 6 dashboards, reverted the SECURITY.md style-attribute-count edit it caused (97 back to 91), rebuilt `offline/packs/core.zip` AND all six `offline/packs/{a1,a2,b1,b2,c1,c2}.zip` back to match (confirmed this turn: unlike Agent 7's Step 7 fix, each level's own pack bundles its own `dashboard.html`, so touching those files means rebuilding 7 zips, not 1 — check `offline/packs.json`'s per-pack `files` array before assuming which packs are affected by any dashboard edit).
  - Net result: **no source files differ from Agent 7's tree.** The value delivered this turn is the two accurately root-caused, still-open findings — not a landed fix. Don't mistake "STATE.md discusses a CLS fix" for "the CLS fix shipped"; it didn't, on purpose, because it was wrong.
- Step 8: confirmed the app is genuinely installable, not just plausible-looking.
  - Playwright's DEFAULT browser context never fires `beforeinstallprompt`. Checked why via CDP `Page.getInstallabilityErrors` instead of guessing: `in-incognito` — Chromium treats Playwright's default profile as incognito-like and refuses the prompt on principle, independent of whether the app qualifies.
  - Used `chromium.launchPersistentContext()` with a real temp profile dir, ran HEADED under `xvfb-run` (Xvfb is installed in this sandbox) → `beforeinstallprompt` fired for real on both `index.html` and `main/index.html`, zero installability errors both times.
  - Headless + persistent profile still never fires it, even with zero installability errors — a known Chromium/automation limitation (headless has no compositor surface for the app-banner UI pipeline), not an app defect. Documented so nobody re-discovers this and worries it's a real gap.
- `node tests/run.js`: 954/954 (re-run after every edit and after the full revert — clean throughout, not just at the end).

## CURRENT STATE
- Tests: pass (954/954)
- Deployed: no
- Browser pass: yes (Step 6)
- Device pass: yes, emulation only (Step 7)
- PWA install pass: **yes, genuinely verified** — real `beforeinstallprompt` captured in a real (non-incognito-like) browser profile, zero CDP installability errors, on both entry points (Step 8, this turn)
- Lighthouse pass: **partial** — 5/22 pages audited; a11y/best-practices clean; SEO and one performance issue (CLS, 6 dashboards) are real, open findings, not yet fixed (Step 9, this turn)
- Open blockers: same standing account/repo/network blockers from Steps 1–4. Real physical-device install-flow behavior (icon rendering, actual OS "Add to Home Screen" chrome) still needs real hardware — same gap Steps 6/7 already flagged, now also true for Step 8's install flow specifically.

## FILES CHANGED / CREATED
- **None, net.** All edits made this turn (6× dashboard.html min-height, SECURITY.md count, 7× offline pack zips) were reverted after the min-height fix was proven ineffective. The tree's source files are byte-content-identical to what Agent 7 handed off.
- STATE.md — Step 8/9 summary added (this is a real, kept change — it documents findings, not code).
- This file — created.

## NEXT AGENT — START HERE
1. **Fix the meta-description gap (Step 9, finding #1):** all 22 pages need a distinct, accurate `<meta name="description">`. This is content work — read each page's actual purpose before writing its description; don't templatize identical copy across pages, that's its own SEO problem. Re-run Lighthouse's `seo` category after to confirm the score change (was ~90-91 across the 5 pages checked).
2. **Fix the CLS bug on the 6 level dashboards (Step 9, finding #2) — the root cause is already found for you, don't re-diagnose it:**
   - Give the header logo (`shared/brand/logo-horizontal.svg`, used via `<img class="brand-logo">`) explicit `width`/`height` attributes (or CSS `aspect-ratio`) matching its rendered `height:26px` so the browser doesn't have to guess before it loads.
   - The bigger piece: `#stats` and `#body` render after first paint even though they're synchronously filled by an inline `<script>` right there in the markup. Before touching this, actually trace WHY — check whether the 6 external `<script src>` tags before that inline script (`gamification.js`, `skill-mastery.js`, `review-scheduler.js`, `mastery-review-ui.js`, `offline-packs.js`, `offline-packs-ui.js`) are the ones creating the paint-then-mutate gap (likely candidate: the browser paints once while blocked fetching/parsing those 6 scripts, then the inline script mutates `#stats`/`#body`/`#masteryReviewMount` all at once after they finish loading). If so, the real fix is likely about script loading strategy (e.g., only load what's needed before first render, or reserve real space for `#stats`/`#body` specifically, not `#masteryReviewMount`), not a min-height on the wrong element. This touches all 6 dashboards and needs full Step 6/7 re-verification (browser + device sweep) after, since it's script-loading-order-adjacent — don't fix it "blind" the way Steps 5/6 explicitly declined to blind-refactor the CSP inline-script situation.
   - This affects all 6 level dashboards identically (same markup/script structure) — confirm the fix on all 6, not just a1.
   - If you touch any of these 6 files: check `offline/packs.json`'s per-pack `files` arrays FIRST. Each level's own pack (`offline/packs/{level}.zip`) bundles its own `dashboard.html` — you'll need to rebuild that pack AND `offline/packs/core.zip` (which bundles all 6). This is different from Agent 7's Step 7 fix (3 files, none in any level pack) — don't assume the same "only rebuild core.zip" logic applies.
3. Finish the Lighthouse sweep — only 5/22 pages have been audited so far (roughly Step 6/7's sampling scale). Worth doing the rest, or at least the remaining course/level pages, before calling Step 9 done.
4. Recorded-not-attempted from Step 5/6 still stands (CSP `'unsafe-inline'` removal — externalizing 22 pages' inline `<script>` blocks, refactoring 91 `style=` attributes to classes). Out of scope here, same as before.

## BLOCKERS / DECISION-GATED
- Same standing blockers from Steps 1–4 (no git repo, no Netlify account, no domain).
- Live Netlify deploy still does not exist.
- Real physical-device testing for install flow (Step 8) and rendering quirks (Step 7) both still need actual hardware.

## ASSUMPTIONS
- None new. Every claim above (the CDP `in-incognito` error, the `PerformanceObserver` shift sources, the ineffectiveness of the min-height patch, the per-level-pack file lists) was verified with a tool, not inferred.

## ARTIFACTS
- app-production-agent8.zip — current tree. Source-identical to Agent 7's tree (see FILES CHANGED above) except STATE.md and this handoff file.
- STATE.md — Step 8/9 log appended.

## RESUME COMMAND
"Resume from HANDOFF PACKAGE above. You are Agent 9. Step 8 is genuinely done — don't re-verify PWA installability from scratch, the beforeinstallprompt event was actually captured. Step 9 has two real, already-root-caused findings waiting to be fixed (meta descriptions, dashboard CLS) — read NEXT AGENT items 1-2 before re-diagnosing anything; the CLS root cause in particular took real investigation to find and an initial fix attempt was tried and proven wrong, don't repeat that path."
----- END HANDOFF PACKAGE -----
