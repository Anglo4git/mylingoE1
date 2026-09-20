# Agent 188 Handoff — home "Continue learning" card tests, three bug fixes

## Context
Picked up `HANDOFF_AGENT_187.md`, "Next agent — start here" items 1–4. Baseline: 722 passed, 0 failed.

## Bugs found and FIXED
1. **Root `index.html` continue card was broken under a sub-path deploy** (`/<project>/`): `course-progress.js` `resolveHomepageState()` / `fetchAllLessons()`
   hard-coded `../course_content/...`, and fetch() resolves against the PAGE URL, so the root page asked for `/course_content/...` (outside the app -> 404 ->
   empty card, swallowed by the catch). Fine only on a domain root. Now both take an optional `base` (default `'../'`, so `main/index.html` is unchanged);
   root `index.html` calls `resolveHomepageState('./')`.
2. **Backup & restore unreachable on a fresh device** (Agent 187 item 30): all six `<level>/dashboard.html` hid `#resetWrap` (which holds gamification.js's
   panel) until progress existed. Now `#resetWrap` is always visible and only `#resetBtn` starts `display:none` (shown as `inline-block` when there is progress).
   The panel is reachable in every state: data, empty manifest, no attempts, manifest failure, no manifest file.
3. (Test-only correction) the old Agent 187 "PINNED unreachable" test was rewritten to assert the fix.

## Tests: 722 → 742 (+20)
Section "index.html + main/index.html (+ main/practice.html): the "Continue learning" card (Agent 188)", run once per page (`S` = main / root), via
`makeRunPage` with real `course-progress.js`, fake course_content fetches, fake localStorage:
static wiring (script order, ids, links exist, SW path per depth, root passes `'./'`); card content (level upper-case, unit/lesson title, `Lesson N · cat · p%`,
bar width, Continue href with encoded id / lower-cased level / redirect back to the page); empty states (no progress, complete, draft course/lesson, nothing
published); fallback branch (started-but-unmastered quiz); ordering across levels; escaping incl. missing order/category/level; failure paths (both fetches,
bad JSON, per-level failure -> lessons.json fallback, missing module, missing mount); garbage progress; every shipped lesson; **every fetch stays inside the
app folder for the page's depth**. `main/practice.html` redirect pinned once (meta refresh + location.replace + fallback link, target exists).
Dashboard: backup panel reachable in 5 states + static markup pin.
No harness changes were needed.

## Source change → cache bump + core.zip
`sw.js` `CACHE_VERSION` `mylingo-v15` → **`mylingo-v16`**; `offline/packs/core.zip` rebuilt from `offline/core-manifest.json` (same member order/attrs,
`unzip -t` clean, identity test passes). Changed core files: `index.html`, `shared/js/course-progress.js`, six `dashboard.html`, `sw.js`.

## Mutation-checked
~50 mutations (main/index.html script ×28, root index ×6, course-progress base handling ×5, dashboard reset button/wrapper ×4): all killed except none.
(Two NOMATCH string typos in the sweep only.) Files restored byte-identical.

## Findings (pinned / not changed)
- **[INFO]** `main/index.html` and root `index.html` are near-duplicates (differ only by path prefixes) — easy to drift; consider a byte-diff-after-normalising test.
- **[COSMETIC]** A lesson without `order` renders "Lesson  · Category · N% complete" (double space); a course without `level` renders " · Unit x" (empty level chip).
- **[INFO]** The continue card only rewrites on success; the empty-state markup lives in the HTML (no flash-free loading state).
- **[COSMETIC]** Backup panel now sits under `.reset` (right-aligned wrapper) with its own left-aligned box; visual check on a real browser not possible here.

## Current state
`node tests/run.js` → **742 passed, 0 failed**; `node --check` clean; `CACHE_VERSION` = `mylingo-v16`; core.zip valid.

## Remaining / carried forward
Items 1, 2, 10–12, 14–29, 31 from HANDOFF_AGENT_186/187 unchanged (item 30 DONE), plus:
32. [INFO/COSMETIC] home-page findings above (Agent 188).

## Coverage inventory
Every page's inline script with logic is now run for real except `shared/quiz.html` (covered by the Agent 160–170 loader/page tests — verify no inline branch is unexecuted).
`main/practice.html` is a pure redirect (static pin).

## Next agent — start here
1. Audit `shared/quiz.html` inline script coverage (list functions/branches never hit; add tests via `makeRunPage` if feasible).
2. Consider a normalised-diff test between `index.html` and `main/index.html` (item 32).
3. Then item 1/2/10–12/14–29 carried list (decisions: fail-open modules etc.).
4. If a core-pack file changes bump `CACHE_VERSION` and rebuild `offline/packs/core.zip` (script idea: python zipfile, same order/attrs as the old zip).

## Blockers
None.

## Artifacts
- `mylingo-v165-agent188-home-card-backup-fix.zip`, `HANDOFF_AGENT_188.md`.

## Resume command
"Resume from HANDOFF_AGENT_188.md. You are Agent 189. Continue from 'Next agent — start here'."
