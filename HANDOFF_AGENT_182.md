# Agent 182 Handoff — Test Coverage for courses/lesson.html, course.html + journey.html helpers (no source change)

## Context
Picked up `HANDOFF_AGENT_181.md`, "Next agent — start here": items 1 and 2.
Baseline verified first: `node tests/run.js` → 570 passed, 0 failed.

## What was done
Two new sections in `tests/run.js` (after the Agent 181 section, before the Agent 159 offline-packs section) plus a header-comment extension.

**courses/lesson.html: 48 tests** (+ 1 static wiring test), two layers:
- *Lifted helpers* (`extractFn` + vm): `esc`, `levelFromLessonId`, `youtubeId`, `youtubeEmbedSrc`, `estimateMinutes`, `mediaEntries`, `renderMediaItem`, `quizUrl`, `renderError`, `sanitizeHtml`
  (`ALLOWED_TAGS` / `ALLOWED_ATTRS` / `$` lifted by regex). Includes a check that every parameter `quizUrl` sends is read by `shared/quiz.html`, and that every shipped rich body sanitises clean.
- *The WHOLE inline script run for real* (`runPage`) against the REAL `level-lock.js`, `course-progress.js`, `safe-url.js`, a fake `fetch` (per-URL data / 404 / network throw), fake localStorage and a purpose-built
  mini DOM (`PN`: tolerant HTML tokenizer with void / raw-text / comment / boolean-attribute handling, serialisation, `remove()`, `outerHTML`, `attributes`, and a `DOMParser` that mirrors the real
  `<div>…</div>` first-child behaviour). Covers: no `?lesson`, level-file routing (convention id / `?level=` / invalid level / scan-all fallback), every "not available" branch, generic error on fetch / render failure,
  the sequential lesson gate (90 % of the previous lesson's quizzes, unit_id-then-order sort, per-level chain, unpublished skipped), the level lock, fail-open / fail-closed without modules, header + chip + Skip link,
  full HTML escaping of every dynamic value, revision cards / body_content / chapters[] (aliases, filtering, sanitising), deck order + trail icons, media online / offline / unsafe / no safe-url, the offline event,
  practice cards (titles, pluralisation, passed state, return link), `?slide=practice`, Continue / Back / trail clicks + `maxReached`, the disabled last-slide button, the completion link (next lesson / "Finish lesson"),
  and **every one of the 62 shipped lessons rendering** with quiz links that resolve to real quizzes.
- Static wiring: modules load before the inline script; every shipped lesson id matches the naming convention of its level file.

**courses/course.html + journey.html: 12 tests.** The duplicated `esc` (also lesson.html and `course-progress.js`), `readProgress`, `fetchJson`, `statusFor` (11-row table, with / without `course-progress.js`, with a stub lacking
`lessonCompletionRecord`) and `renderError` are lifted side by side and asserted identical in behaviour; plus static wiring (level-lock use, lessons.json fallback).

`node tests/run.js`: 570 → **641** (+71). `node --check` clean.

## No source change → no cache bump
`courses/lesson.html`, `course.html`, `journey.html` and every other app file are byte-identical to the input zip (`diff -rq`); only `tests/run.js` and this handoff changed. `core.zip` untouched; `sw.js` `CACHE_VERSION` stays `mylingo-v13`.

## Mutation-checked
68 hand-written mutations of `courses/lesson.html` (level-id regex, level param case, estimateMinutes rounding / finite check, youtubeId regex / shorts, embed encoding + params, allow-lists, href / src / mailto rules,
node-type / recursion / non-string guards, media aliases and fallbacks, offline / unsafe branches, every `quizUrl` encoding and optional part, gate boundary / sort / status checks, level precedence and lock argument,
title, chip trim / case, trail-click gating, slide clamp / maxReached / `?slide=`, Continue guard, CTA labels / hrefs / next-lesson lookup, outerHTML swap, practice pluralisation / passed state, summary / examples /
key-term / chapter filters, trail clearing in `renderError`, `cache:'no-store'`, `!r.ok`, `esc`, onLine default, source-list filter, found / unit / course / previous-lesson guards): **68 killed, 0 survivors, 1 pattern
not found** (the sweep script's `e.filter(...)` mutant text didn't exist; the real filter was mutated separately and killed). The first mutant pass also exposed a test-sandbox bug (missing `URL` made every
`isSafeMediaUrl` call return false, so the "unsafe url" assertions passed for the wrong reason) — fixed before the sweep. File restored byte-identical (`cmp`).

## Findings (not changed — pinned by test)
- **[LOW/PRODUCT] `?level=` overrides the level derived from the lesson id, and the level-lock check uses it.** Hand-editing `?lesson=course-b1-…&level=a1` opens a b1 lesson for an a1-locked learner (first lesson of a level is
  otherwise ungated; quiz metadata is then read from the wrong level's `quizzes.json`). Normal links always agree. Fix candidate: lock-check `found.level` (or the id's level). Ties into carry-forward item 1.
- **[LOW] Ordering of gates:** the previous-lesson gate runs BEFORE the level lock, so a locked-level learner sees "Finish the previous lesson first" rather than the lock message.
- **[LOW] `sanitizeHtml`'s "safe URL" test is `^(https?:|mailto:|/)`, so protocol-relative (`//host`) and `/\host` href / img src pass.** Content is first-party, so latent. Fix: reject `^/[/\\]`.
- **[COSMETIC] `sanitizeHtml` drops non-allow-listed elements WITH their text (tables lose their content); an unbalanced `</div>` in `body_content` truncates the rest of the body** (standard parser behaviour).
- **[LOW/latent] `mediaEntries`: an empty `video_urls` / `audio_urls` array is truthy and shadows a populated `videos` / `audios` alias.**
- **[COSMETIC] `youtubeId` regex is unanchored** (any URL containing `youtube.com/watch?v=<id>` yields an id; the embed host is fixed so harmless).
- **[LOW] The lesson completion gate (`refreshCompletionGate`) runs once at load,** so a page left open does not pick up progress changed elsewhere until reload (and a stale unlock survives cleared progress).
- **[INFO] `lessonStartUrl` is dead code;** `lesson_quiz_id` is never linked from the player when the lesson has exercises. The disabled-button tooltip hard-codes "90 %" while the on-page hint reads the module constant.
- **[FAIL-MODE] Missing `course-progress.js` → every non-first lesson is locked (fail closed); missing `level-lock.js` → fail open** (already carry-forward item 1).
- **[LOW] `journey.html` loads no `level-lock.js` and never checks it,** so a locked level's journey overview is viewable (its lesson links remain gated by lesson.html). `course.html` does gate.
- **[COSMETIC] `renderError` link text differs** ("Back to all courses" in course / lesson vs "Back to courses" in journey).
- **[LOW] `statusFor` without `course-progress.js` counts any `completed` record (even a 30 % score) as completed;** with the module it needs mastery. Only reachable if the script fails to load.
- **[LOW] `readProgress` returns a stored ARRAY as-is** (same as the module's reader).

## Test-infrastructure notes
- The mini DOM is not a browser: parser-quirk (mXSS) behaviour of `sanitizeHtml` is unverified. A real-browser pass over `DOMParser` + `innerHTML` is worth doing once on device.
- The mutation sweep must run with `setsid nohup … < /dev/null &` (a plain `&` job died once mid-run and had to be resumed from mutant 50).

## Coverage inventory (what is still untested: inline page script)
| file | inline script | notes |
|---|---|---|
| `courses/index.html` | not measured | references `course-progress.js`; no lock check (see journey finding) |
| `main/progress.html` | ~5.3 KB | referenced by tab-href tests only |
| `main/placement.html` | ~4.8 KB | |
| 6 × `<level>/index.html` | ~4.6 KB each (identical) | static scans only |
| 6 × `<level>/dashboard.html` | ~5.7 KB each (identical) | static wiring scan since Agent 180 |
`courses/lesson.html`, `course.html`, `journey.html` helper layer: **done** (course.html / journey.html page-level rendering — unit list, CTA, progress bars — is still untested; only the shared helpers are).

## Files changed
- `tests/run.js` (two new sections; header comment)
- `HANDOFF_AGENT_182.md` — new.

## Current state
- Tests: PASS — `node tests/run.js` → **641 passed, 0 failed**. `node --check tests/run.js` clean.
- `core.zip` valid; `CACHE_VERSION` = `mylingo-v13`; app source unchanged.

## Remaining / carried forward (from Agent 181, updated)
1. [DECISION] level-lock fail-open vs fail-closed (also lesson gate, load()'s missing-module path, and now the `?level=` override finding above).
2. [PRODUCT] Back button on the results screen / the 60% Continue gate.
10. [PRODUCT] `finishAnswer`'s explanation-field priority ignores `ok` (Agent 170).
11. [BUG-ISH] Banner subprompt shows "Choose the best answer." (Agent 172).
12. [BUG-ISH] Failed lesson-list load cached as `[]` for the page's lifetime (Agent 173).
14. [BUG-ISH] Ctrl/Cmd/Alt+digit triggers the radio digit shortcut (Agent 174).
15. [BUG-ISH] Missing runtime script is reported as a retryable "Connection problem" (Agent 175).
16. [BUG-ISH] Splash icon path wrong for the root page under a sub-path host (Agent 176).
17. [QA/PRODUCT] Ranking questions on touch devices: no on-screen move controls; drag-and-drop unverified on iPhone Safari.
18. [LOW] `orientation.js` coercion quirks (Agent 177).
19. [PRODUCT/LOW] Bottom-nav active state for non-tab pages (Agent 177).
20. [LOW] `authoring-draft-autosave.js` `rowCount` can overstate rows (Agent 178).
21. [INFO] `authoring-draft-autosave.js` / `authoring-validation.js` unused by any shipped page.
22–24. offline-packs-ui / mastery-review-ui / authoring-validation findings (Agents 179–181).
25. [LOW/COSMETIC/INFO] lesson.html / course.html / journey.html findings above (Agent 182).

## Next agent — start here
1. `courses/course.html` and `courses/journey.html` page-level rendering (unit accordion / progress bars / CTA / `?unit=` open state / level-lock message). Reuse the Agent 182 `PN` mini DOM + `runPage`-style harness
   (copy it into a hoisted helper first — it currently lives inside the lesson.html section) and run the whole inline script against the real modules and shipped JSON, as done for lesson.html.
2. Then `courses/index.html`, `main/progress.html`, `main/placement.html`, then the identical `<level>/index.html` and `<level>/dashboard.html` scripts.
3. Mutation-sweep approach unchanged (`[find, replace]` list over the page in a copied tree, `setsid nohup … < /dev/null &`, resume support, classify survivors, close gaps, `cmp` restored file).
4. Items 1, 2, 10–12, 14–25 need a product decision (17 also a real device) before code changes.

## Blockers
None.

## Assumptions made
- Pinned rather than fixed every finding (standing policy: fix only when unambiguous and user-visible; the `?level=` override needs the lock-policy decision).
- Ran the real inline script rather than only lifting nested functions, because `renderTrail` / `renderNav` / `goToSlide` / `refreshCompletionGate` are closures inside the fetch chain and cannot be extracted by name.

## Artifacts produced
- `mylingo-v160-agent182-lesson-player-tests.zip` — full project state after this turn.
- `HANDOFF_AGENT_182.md` — this file.

## Resume command
"Resume from HANDOFF_AGENT_182.md. You are Agent 183. Continue from 'Next agent — start here'."
