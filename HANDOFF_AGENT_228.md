# HANDOFF — AGENT 228 (A1+ content-quality fix: use the real authored content)

## What this pass found and fixed

Agent 226 built the 66 missing `course_content/lessons/a1.json` records
from `lesson_content/a1/*.json` (the lesson-quiz stub files) because that
was the only per-lesson content it had found. It didn't check
**`course_content/lessons.json`** — the monolithic, all-levels fallback
catalog that `course.html`/`lesson.html` fall back to when a per-level
file is missing.

That monolithic file turned out to **already contain full, properly
authored records for all 76 A1 lessons**, including real `body_content`
HTML (not just a quiz stub) for 68 of them, genuine `revision.summary`/
`examples`/`key_terms`, and (for 42 of the 66 new lessons) the correct
`exercise_quiz_ids` bank linkage — sitting unused because it was never
synced to the per-level file the app actually reads first.

**Fixed this pass:**
- Replaced all 66 of Agent 226's mechanically-derived
  `course_content/lessons/a1.json` records with the real content from
  `course_content/lessons.json`, correcting only what was still broken
  in the source: `lesson_quiz_id` (24 lessons had the same missing-
  `lesson-`-prefix bug reported in Agent 226's handoff) and
  `exercise_quiz_ids` (the same 24 had none, which would silently break
  `course.html`'s href rendering — kept the fallback of pointing at the
  lesson's own quiz for exactly those 24, same fix as Agent 226's, now
  applied on top of the richer content instead of on top of a stub).
  The original 10 published lessons were left untouched, verbatim.
- Applied the same two corrections directly to
  **`course_content/lessons.json`** itself (48 field fixes across the
  same 24 lessons), since that file is the live offline/fallback catalog
  and would otherwise carry the same completion-tracking bug forward.
- Ran a full-repository sweep (not just A1) for the `correctIndex`
  0-based-vs-1-based bug Agent 226 found — confirmed it is isolated to
  the 24 already-fixed files; no other level or file is affected.
- Confirmed no other level (a2–c2) has an equivalent "declared lesson
  missing from its per-level catalog" gap — a1 was the only level with
  an A1+-style expansion.

## Validation

- `node tests/run.js`: **970 passed, 0 failed**, after rebuilding
  `offline/packs/core.zip` (it embeds `course_content/lessons.json`,
  which this pass edited).
- Re-verified: 76/76/76/76 cross-check (units.json / lesson_content /
  per-level catalog / quiz manifest) still holds; no duplicate lesson
  IDs; no lesson with empty `exercise_quiz_ids`; 68/76 lessons now carry
  real `body_content` (the other 8 are the original lessons that never
  had `body_content` in the first place — unchanged, not a regression).

## Still open (unchanged from Agent 227, not addressed this pass)

- `A1 PLUS CURRICULUM MAP.md` is still missing from the repo — full
  reconciliation against it remains blocked. See
  `HANDOFF_AGENT_227.md` §3 for the detail; nothing new to add.
- Can/Could-for-requests decision stands as recorded in
  `HANDOFF_AGENT_227.md` §4 (no dedicated lesson needed; covered by the
  "Requests, Offers and Permission" lesson, now carrying real authored
  body content in addition to its bank-quiz linkage).
- `course_content/lessons/<level>.json` still absent from every level's
  offline-pack manifest (cross-level, pre-existing, not A1+-specific;
  mitigated in practice by the built-in fallback to the monolithic file,
  which is itself in the core offline pack).
- No full manual pedagogical/answer-key audit of all 76 lessons was
  performed; the repo-wide `correctIndex` sweep in this pass is
  mechanical/structural, not a content-accuracy review.

## Deliverable

`MYLINGO_A1PLUS_AGENT_228.zip` — full working app baseline with the
richer, now-correctly-wired A1+ content, plus this handoff.
