# Agent 187 Handoff — Page-level tests for <level>/index.html + <level>/dashboard.html, two bug fixes

## Context
Picked up `HANDOFF_AGENT_186.md`, "Next agent — start here" items 1–2. Baseline: 699 passed, 0 failed.

## Bugs found and FIXED (all 12 files, copies stay byte-identical)
1. **Folder URL read the wrong level** (index + dashboard): `parts[parts.length-2]` meant `/b1/` gave A1 (and `/mylingo/b2/` gave "mylingo"),
   also feeding the level-lock check. Now: if the last path segment is a level (`^[a-c][12]$`, any case) use it, else the segment before it, else `a1`.
2. **Offline-packs panel never mounted on any dashboard**: the mount statement sat AFTER the IIFE and read the IIFE-private `level`; the ReferenceError died
   in its own try/catch on every load. Moved inside the IIFE (after the lock guard, same form as index.html). The old static test only regex-matched the text.

## Tests: 699 → 722 (+23)
Section "<level>/index.html + <level>/dashboard.html: page rendering (Agent 187)". One copy of each script is run for real (`makeRunPage`, real
level-lock.js and gamification.js, stubbed offline-packs / mastery UIs to observe mounts):
- six-copy byte identity; level from the URL (six levels, upper case, sub-path, folder URL, `/`, `/index.html`);
- index: topic grouping, hrefs (id URL-encoded), aria-label, status / best pill (best 0 shown), counts/subtitle, escaping (incl. quotes in aria-label), 3-chip cap,
  sorted category dropdown, 24-per-page + Show more, search (title/topic/category/tags, case-insensitive) + category filter + reset, four load-failure messages,
  corrupt progress, lock (locked / at-or-below / none / missing module fail-open), offline mount (throwing + missing), `no-store`, static wiring;
- dashboard: stat tiles (level filter case-insensitive, average over stored bests, not-started, real gamification XP/streak, broken/missing gamification),
  both empty states, row ordering / pct fallback / status / pluralisation / timeAgo boundaries (59s, 60s→1m, m, h, d), escaping, encoded ids, Not-started list
  (cap 10, "+N more", escaping), manifest failures, Reset (cancel / confirm / other levels kept / failing write), corrupt storage, lock, backup panel,
  offline + mastery mounts, static wiring (script ends with the IIFE).
Harness: `makeRunPage` + `pathname`, `confirm`, `badjson`, `fetchOpts`, `getElementById` finds ids created via innerHTML; PN `id` setter.

## Source change → cache bump + core.zip
`CACHE_VERSION` `mylingo-v14` → **`mylingo-v15`**; `offline/packs/core.zip` rebuilt from `offline/core-manifest.json` (identity test passes).

## Mutation-checked
~87 mutations across both pages (each applied to all six copies): all killed except `res.ok` on the dashboard (equivalent: a non-OK body that fails to
parse is already swallowed by the surrounding try/catch). Note: the sweep classifier must treat a run with no "N passed" line as a kill — an unhandled
rejection crashes node silently, which first looked like survivors. Files restored byte-identical.

## Findings (pinned, not changed)
- **[PRODUCT/BUG-ISH] Backup & restore panel (gamification.js `installBackupUi`) lives inside `#resetWrap`, which is display:none until something was attempted** —
  on a fresh device the "Import learner backup" button is unreachable, which is exactly when restore is needed.
- **[COSMETIC/A11Y]** A manifest entry without `title` renders an empty heading and aria-label ", Not started".
- **[COSMETIC]** An empty level on index.html shows "No quizzes match your search." (0 results), not a level-specific empty state.
- **[INFO]** Search text is built from `item.title+' '`, so a missing title makes "undefined" searchable.
- **[INFO]** index/dashboard fail open without level-lock.js (same class as other pages).

## Current state
`node tests/run.js` → **722 passed, 0 failed**; `node --check` clean; `CACHE_VERSION` = `mylingo-v15`; core.zip valid.

## Remaining / carried forward
Items 1, 2, 10–12, 14–29 from HANDOFF_AGENT_186 unchanged, plus:
30. [PRODUCT/BUG-ISH] Backup & restore hidden on a fresh dashboard (above). 31. [COSMETIC/INFO] index/dashboard findings above (Agent 187).
(Item 1 DECISION list now also includes index/dashboard fail-open.)

## Coverage inventory
Every page's inline script with logic is now run for real except `main/index.html` and `main/practice.html` (not yet inspected).

## Next agent — start here
1. Inspect `main/index.html` and `main/practice.html` for inline scripts; test with `makeRunPage` if they have logic.
2. Consider a product decision + fix for item 30.
3. Then remaining `shared/*.html` pages / any script never executed by a test (grep for `<script>` blocks vs test coverage).
4. Same sweep approach; if a core-pack file changes bump `CACHE_VERSION` and rebuild core.zip.

## Blockers
None.

## Artifacts
- `mylingo-v164-agent187-level-pages-tests.zip`, `HANDOFF_AGENT_187.md`.

## Resume command
"Resume from HANDOFF_AGENT_187.md. You are Agent 188. Continue from 'Next agent — start here'."
