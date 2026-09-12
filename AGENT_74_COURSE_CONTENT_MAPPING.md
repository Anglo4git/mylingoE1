AGENT 74 — COURSE CONTENT MAPPING
STATUS: COMPLETE

MISSION
Map existing MYLINGO quizzes into the new Course → Unit → Lesson structure.

DELIVERED
- map_quiz_catalog.py — deterministic, idempotent mapping generator.
  1 course per level, 1 unit per (level, quiz_category) bucket (mirrors
  production_quiz_profiles.json's 19 named profiles exactly), 1 lesson
  per quiz. Reads master_source.csv read-only.
- audit_course_mapping.py — automated orphan/reference audit: orphan
  quizzes, orphan units/lessons, broken exercise references, wrong-level
  assignment, wrong-category assignment, plus a reuse report. Exit 0/1.
- course_content/{courses,units,lessons}.json — regenerated to cover the
  full catalog: 6 courses, 19 units, 60 lessons, all 60 published quizzes
  mapped, 0 orphans.
- COURSE_CONTENT_MAPPING.md — mapping rule + rationale, coverage table,
  known limitation (revision.summary reuses quiz.description; richer
  per-topic revision authoring is out of scope here), handoff to Agent 75.
- test_course_content_mapping_agent74.py — 9 unittest cases: full
  coverage, determinism, output validates clean, shipped JSON matches a
  fresh regeneration (drift guard), and 2 negative tests proving the
  audit catches a planted orphan-quiz bug and a planted wrong-level bug.

AUDIT RESULTS (see COURSE_CONTENT_MAPPING.md for detail)
- 60/60 published quizzes mapped, 0 orphan quizzes.
- 0 orphan units/lessons, 0 broken references.
- 0 wrong-level, 0 wrong-category assignments.
- course_schema.py validate: 0 errors, 0 warnings on the full mapping.

GUARDRAILS HONORED
- Did not rewrite any quiz content (master_source.csv byte-unchanged).
- Did not create a duplicate exercise engine (references only).
- Did not silently discard any quiz — 60/60 mapped, audited, test-covered.
- Preserved existing quiz IDs/routes — nothing under site/ touched.

HANDOFF TO AGENT 75 (Course Landing Page)
- course_content/courses.json has all 6 levels, published, non-empty
  unit_ids — safe to build /courses/ against real data now.
- Lesson/exercise counts per course/unit are derivable from array
  lengths directly (no extra lookups needed).
- Re-run map_quiz_catalog.py whenever master_source.csv gains new
  published quizzes, then audit_course_mapping.py before shipping.
  Do not hand-edit course_content/*.json — a drift-guard test enforces
  this.
- Hand-curated multi-quiz topic lessons (the richer "Daily Routines"
  style example) are a future content-authoring change to specific
  lessons, not a schema change.

STOP CONDITION MET
Every published quiz is mapped (0 excluded, 0 orphaned). Mapping rules,
coverage, exceptions, and QA results documented in
COURSE_CONTENT_MAPPING.md. Machine-readable mapping data delivered in
course_content/*.json. No UI touched.
