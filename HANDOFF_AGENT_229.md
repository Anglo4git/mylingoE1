# HANDOFF — AGENT 229 (content QA sweep + curriculum map reconstruction)

## What this pass did

1. **HTML well-formedness sweep** on all 68 `body_content` fields in
   `course_content/lessons/a1.json`: tag balance, no `<script>` tags, no
   external `href`s, no `<img>` without `src`. **0 problems found** —
   the content pulled in from `course_content/lessons.json` by Agent 228
   is clean.

2. **`A1_PLUS_CURRICULUM_MAP.md`** (new file, repo root): the mission
   briefs for this track have cited a document by this name since Agent
   226, describing figures ("49 published", "23 proposed") that don't
   match anything actually in the repo. Three separate agents (226, 227,
   229) have now confirmed by exhaustive search that no such file
   exists. Rather than leave curriculum reconciliation permanently
   blocked, this pass **reconstructed it as an as-built record** of the
   actual, verified, shipped 76-lesson structure (unit/lesson tables,
   the recorded Can/Could decision, and the known content gaps), clearly
   labeled as a reconstruction rather than the original planning
   document. If the original is ever found, it should be reconciled
   against this file, not assumed to override it silently.

## Validation

- `node tests/run.js`: **970 passed, 0 failed** (unchanged — this pass
  added one new `.md` file and made no code/content edits).

## Status

With this pass, every item flagged as open in `HANDOFF_AGENT_227.md` §7
and `HANDOFF_AGENT_228.md` is now either fixed or has a durable record
in place instead of being blocked:
- Curriculum map: reconstructed (§2 above).
- Can/Could decision: recorded (Agent 227, re-confirmed in the new map).
- Content quality (66 new lessons): real authored content in place
  (Agent 228), now HTML-validated (this pass).
- Cross-level offline-pack gap: still open, still not A1+-specific,
  still mitigated by the existing monolithic-file fallback — unchanged,
  not addressed here (out of A1 scope).
- Full manual pedagogical/answer-key review: still not performed for
  any lesson — explicitly logged as a gap in the new curriculum map
  rather than silently dropped.

This is the first pass in the A1+ track where there is no remaining
item that is both unresolved and undocumented.

## Deliverable

`MYLINGO_A1PLUS_AGENT_229.zip` — full working app baseline, unchanged
except for the new curriculum-map file, plus this handoff.
