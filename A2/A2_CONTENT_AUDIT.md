# A2_CONTENT_AUDIT.md
# Produced by: A2 Agent 4 (Content Auditor)
# Inputs audited: CURRICULUM_SOURCE.md, A2_CURRICULUM_MAP.md,
# A2_CURRICULUM_ISSUES.md, A2_LESSON_DRAFTS.md, A2_SAMPLE_QUIZZES.md

## 1. STRUCTURAL INTEGRITY

- Lesson drafts: 44 `## course-a2-...` entries in A2_LESSON_DRAFTS.md. PASS.
- Quizzes: 44 `## quiz a2-...` entries in A2_SAMPLE_QUIZZES.md — one per
  lesson draft, 1:1. PASS.
- Questions: 220 numbered questions total (5 × 44). PASS.
- Answer keys: exactly one `*`-marked correct answer per question, 220
  of 220. No question found with zero or multiple markers. PASS.

## 2. CURRICULUM-SCOPE INTEGRITY (vs. CURRICULUM_SOURCE.md)

- Grammar: 20 top-level items in the source. 4 already covered by the
  existing published lessons + 3 left PARTIAL/pending (superlative,
  "will", adverbs of manner — per A2_LESSON_DRAFTS.md §4) + 13 drafted
  this pass = 20. No item added, dropped, or renamed. PASS.
- Vocabulary: all 18 named topics have exactly one drafted lesson each,
  titled to match the source topic name. No topic combined or split
  without a flag (issue #7 on "Restaurants and leisure venues" is
  flagged, not silently resolved — it was kept as one lesson, matching
  the seed's default). PASS.
- Functional: all 13 named items have exactly one drafted lesson each.
  Lessons 07 ("Talking About Preferences") and 08 ("Expressing
  Preferences") are near-duplicates by design — the source lists them
  as two separate items, and the Lesson Author flagged this rather than
  merging them. Left as-is; flagged for the approval gate, not resolved
  here. NOTED, not a defect.
- No A1/A1+ content was re-taught or down-leveled; no B1 grammar
  (e.g. Second Conditional, Present Perfect Continuous) appeared in any
  draft. PASS.

## 3. CONTENT-QUALITY FINDINGS

- FIXED: A2_SAMPLE_QUIZZES.md, quiz a2-113 (Relative Clauses), Q4 —
  option D read "that (non-defining)"; the parenthetical was an
  editorial note that had leaked into the learner-facing option text.
  Corrected to plain "that". This is a formatting fix, not a curriculum
  change — the correct answer (B, "which") and question content are
  unchanged.
- No other leaked notes, broken option lists, or missing correct-answer
  markers found across the remaining 219 questions.
- Distractors were spot-checked across all three sections (grammar,
  vocabulary, functional) for plausibility (i.e., wrong answers are
  wrong for a clear reason, not nonsense) and found consistent with the
  lesson each quiz is attached to.

## 4. OPEN ITEMS CARRIED FORWARD (not resolved by this pass)

All items below remain exactly as flagged in A2_CURRICULUM_ISSUES.md;
none were decided during authoring, quizzing, or this audit:
- Seed issues 1–7 (OCR ambiguities) — unresolved, human correction
  still needed in CURRICULUM_SOURCE.md itself.
- Design decisions A (A1/A2 overlap), B (political-systems
  sensitivity), C (target lesson count) — unresolved.
- New findings D–H (existing course-a2 not a blank slate; two
  off-syllabus existing lessons; three half-covered grammar items;
  unverified existing vocabulary lessons; missing Functional Language
  unit) — unresolved; D and H are now partially addressed in practice
  (a Functional Language unit has been drafted, per H) but the unit
  still needs to be added to units.json/courses.json by the Technical
  Integrator, and only after approval.
- Preferences duplication (lessons 07/08, §2 above) — newly noted,
  not a resolution.

## 5. RECOMMENDATION

No blocking defects found beyond the one formatting fix in §3, which
has been applied. Coverage, structure, and answer keys are internally
consistent and traceable to CURRICULUM_SOURCE.md.

Per MASTER_A2_HANDOFF.md §11, this is where the pipeline stops for the
human approval gate. No further A2 agent (Technical Integrator, QA,
Final Handoff) should run until a human marks this batch APPROVED or
CHANGES REQUIRED — in particular, the open items in §4 (overlap policy,
lesson-count target, off-syllabus lessons, preferences duplication,
political-systems framing) need a decision before integration, since
several of them affect exactly which lessons the Technical Integrator
would write into units.json/courses.json/a2/quizzes.json.
