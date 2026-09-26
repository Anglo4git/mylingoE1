# B1 QA REPORT (v2 — post-merge)
# Agent 7 — QA output.

## SCOPE
Technical Integrator executed the Merge option (see B1_INTEGRATION_NOTES.md). This QA pass
covers both the authored content and the live catalog merge.

## CONTENT QA — authored markdown (unchanged from v1)
- 45 lessons / 45 quizzes / 225 questions, 100% syllabus coverage. PASS (see v1 findings).

## INTEGRATION QA — live catalog after merge
- `b1/quizzes.json`: 21 original rows unchanged + 40 new rows appended = 61 total. PASS
- No duplicate `id` values across the 61 entries. PASS
- All 40 new JSON files (`grammar/b1/b1-011..024.json`, `vocabulary/b1/b1-025..040.json`,
  `functional/b1/b1-041..050.json`) exist, parse as valid JSON, have exactly 5 questions,
  4 answers each, and a `correctIndex` within range (0–3). PASS
- Answer order is shuffled per question (not fixed at index 0), matching existing-file style.
  PASS
- `functional/b1/` uses `category: "Functional Language"` — confirmed this matches the
  existing convention from `a1/quizzes.json` / `a2/quizzes.json`, no new category invented.
  PASS

## DEFECT FOUND AND FIXED (pre-existing, NOT introduced by this merge)
`b1-001` through `b1-010` (the original shipped files) contained `correctIndex` values that
were out of range for their `answers` array in 15 questions across 8 of the 10 files — always
`correctIndex: 4` on a 4-item array (valid indices 0–3), i.e. a consistent off-by-one bug. In
every one of the 15 cases, the intended correct answer text (verified against each question's
own `explanation` field) was already sitting at index 3 — it was never missing, just
mis-pointed. Fixed by setting `correctIndex: 3` for those 15 questions. No answer text, option
order, or wording was changed — only the index. Re-validated: full 61-entry catalog now has
zero structural errors (question count, answer count, correctIndex range, duplicate IDs).

Files touched by this fix: `grammar/b1/b1-001.json`, `b1-002.json`, `b1-003.json`,
`b1-004.json`, `b1-005.json`, `b1-006.json`, `b1-007.json`, `writing/b1/b1-008.json`,
`grammar/b1/b1-009.json`, `vocabulary/b1/b1-010.json`.

## SECOND PASS — EXPANDED VERIFICATION (post-merge, on explicit "Next step")
- Automated check across all 200 live new questions (40 items × 5): no duplicate answer options
  within a question, no empty correct-answer text. 0 issues found.
- Manually read all 14 new grammar items (70 questions) end-to-end against their explanations.
  0 errors found.
- **New defect found and fixed**: 4 of the 40 new catalog titles had leaked internal pipeline
  commentary into the user-facing `title`/`description` fields — e.g. `b1-024` was titled
  "Neither / so do I (unblocked post-approval — see B1_CONTENT_AUDIT.md decision D)" instead of
  "Neither / So Do I". Affected: `b1-013`, `b1-024`, `b1-037`, `b1-038`. Fixed by cleaning the
  title in both `b1/quizzes.json` and each item's own JSON file; `description` regenerated from
  the clean title. Two other parenthetical titles (`First vs Second Conditional (Contrast)`,
  `Make and do (collocations)`) were reviewed and kept — they're intentional user-facing
  clarifiers, not leaked notes.
- Vocabulary (16) and functional (10) items were spot-checked rather than read in full this
  pass; not yet exhaustively read line-by-line.
- `lesson_content/b1/` course-unit pages were not touched or tested (see Integration Notes).
- `b1/index.html` / `b1/dashboard.html` rendering was not run live (no browser in this
  environment) — only the JSON they consume was validated for structural correctness.

## THIRD PASS — VOCAB + FUNCTIONAL MANUAL VERIFICATION, DELIVERY CONFIRMATION
- Manually read all 16 vocabulary items (`b1-025`–`b1-040`, 80 questions) and all 10
  functional items (`b1-041`–`b1-050`, 50 questions) end-to-end. 0 errors found: every
  `correctIndex` points to the correct answer, distractors are unambiguous, definitions
  and usage are accurate B1-level English.
- Sensitive-tone spot check confirmed: `b1-037` (Crime and Punishment) and `b1-038`
  (Political Systems) are both neutral/factual in register — no loaded or partisan
  language (e.g. democracy/monarchy/parliament are defined descriptively).
- Non-blocking style note (not fixed, flagged for awareness): within each of these 26
  items, all 5 questions share one identical generic `explanation` string per item
  (e.g. every "Illness" question explanation reads "Describe symptoms and give basic
  health advice") rather than a per-question rationale. This matches the pre-existing
  pattern in the 14 grammar items and the original `b1-001`–`b1-010` catalog, so it is
  consistent with pipeline convention, not a regression — but has low pedagogical value
  on a wrong-answer screen if ever revisited.
- Delivery check: confirmed `b1/index.html` and `b1/dashboard.html` both `fetch('./quizzes.json')`
  at runtime and compute all counts/labels (`filtered.length`, `all.length`, etc.) from
  the fetched array — no hardcoded quiz count or ID list found in either file. The 40
  new entries require no UI code change to surface.

## VERDICT
Merge: PASS (40/40 new entries structurally valid, 0 collisions, 0 regressions to the old 21).
Pre-existing defect in the old 10 topics: FOUND AND FIXED (15 questions, index-only change).
New-content title-leak defect: FOUND AND FIXED (4 titles cleaned).
Full 61-entry catalog: 0 structural errors, 0 leaked-note titles on re-validation.
All 40 new items (200 questions) now manually verified end-to-end (14 grammar in pass 2,
16 vocabulary + 10 functional in pass 3): 0 content errors found across the full set.
UI delivery path (`index.html`/`dashboard.html` → `quizzes.json`) confirmed dynamic, no
code change needed for the new items to appear.
