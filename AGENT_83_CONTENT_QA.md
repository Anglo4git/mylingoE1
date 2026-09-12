AGENT 83 — CONTENT QA
STATUS: EMPTY HANDOFF / PLANNING FILE

MISSION
Quality-check the Course/Lesson/Journey content graph.

MUST DETECT
- Broken course/unit/lesson/exercise references.
- Orphan lessons and quizzes.
- Duplicate IDs.
- Duplicate/conflicting mappings.
- Wrong level/category/topic.
- Empty or excessively long revision summaries.
- Malformed YouTube URLs.
- Missing required lesson fields.
- Circular journey references.
- Unsafe or unusable presentation/media references.
- Content that bypasses existing quality contracts.

GUARDRAILS
- Do not silently repair ambiguous content.
- Preserve existing content QA contracts.

REQUIRED HANDOFF
Create COURSE_CONTENT_QA_REPORT.md and machine-checkable QA tests.
STOP only when defects are fixed or explicitly dispositioned.
