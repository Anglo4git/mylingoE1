AGENT 73 — COURSE DATA CONTRACT
STATUS: COMPLETE

MISSION
Define the canonical content contract for Course → Unit → Lesson → Exercises.

DELIVERED
- COURSE_SCHEMA.md — full contract: entity field tables, ID/versioning
  scheme, the quiz-reference contract, validation rule table (CC-E01…E10
  blocking, CC-W01…W05 non-blocking), guardrail checklist, handoff notes
  for Agent 74.
- course_schema.py — standalone, dependency-free validator (stdlib only).
  Loads course_content/*.json, cross-checks Lesson.exercise_quiz_ids
  against master_source.csv quiz_id (read-only), and exposes a CLI
  (`python3 course_schema.py validate`).
- course_content/{courses,units,lessons}.json — one worked sample
  (English A2 → Everyday Life → Daily Routines → a2-007 + a2-010),
  referencing two real, currently-published quizzes. No quiz content
  duplicated.
- test_course_schema_agent73.py — 20 unittest cases: sample data
  validates clean (0 errors, 0 warnings) against the real
  master_source.csv, and every CC-E0x/CC-W0x code is exercised against a
  synthetic broken fixture at least once. Also confirms quiz reuse across
  lessons is not flagged as an error.

GUARDRAILS HONORED
- Did not redesign the homepage.
- Did not rewrite the quiz engine or touch master_source.csv (read-only).
- Did not duplicate quiz/exercise content — lessons hold quiz_id
  references only.
- Did not make video (youtube_url) or presentation_url mandatory — both
  optional on every lesson.
- Did not build any UI.
- Did not change the legacy quiz schema (23 frozen columns untouched).

HANDOFF TO AGENT 74 (Course Content Mapping)
- Reuse course_schema.py's load_quiz_ids() / load_quiz_categories() /
  validate_quiz_references() rather than re-deriving the quiz lookup.
- The only sanctioned link from course content to the quiz engine is
  Lesson.exercise_quiz_ids: array<quiz_id>. It is one-directional —
  quizzes stay unaware of which lesson(s) reference them.
- This milestone mapped 2 of 61 quizzes as a worked sample
  (a2-007, a2-010). Mapping the remaining catalog
  (level → category → topic → lesson) and running the full-catalog
  orphan/broken-reference audit is Agent 74's deliverable
  (COURSE_CONTENT_MAPPING.md) — not repeated here.
- lesson.category is intentionally soft-checked (CC-W01, warning) against
  its referenced quizzes' quiz_category, because a lesson may legitimately
  be "Mixed". Agent 74's mapping layer decides per-lesson category; this
  contract only flags mismatches as a review signal.
- Do not add columns to master_source.csv to support this — none are
  needed.

STOP CONDITION MET
Schema + validation + sample data + tests + handoff delivered. No UI
touched.
