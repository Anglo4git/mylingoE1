# HANDOFF — AGENT 227 (A1+ Final Curriculum & Runtime Release Gate)

## Status: **conditional release** — see §3 before treating this as final

## 1. Agent 226 artifacts reviewed
`HANDOFF_AGENT_226.md`, `A1PLUS_INVENTORY_AGENT_226.md`,
`A1PLUS_QA_AGENT_226.md` reviewed. Agent 226's fixes were re-verified
independently (re-derived the 76/76/76/76 cross-checks from source
rather than trusting the prior report's numbers) and confirmed correct.

## 2. Additional integration work done this pass

While reconciling coverage, found that 42 of the 66 new lessons Agent 226
wired to *only* their own thin, single-question `lesson_quiz_id` in fact
have a matching, more substantial exercise-bank quiz already authored and
shipped under an **exact title match** in `grammar/a1/`, `vocabulary/a1/`,
or `functional/a1/` (e.g. lesson "Requests, Offers and Permission" ↔
`functional/a1/a1-050.json`). These were never linked via
`exercise_quiz_ids`. Linked all 42 (bank quiz id prepended to each
lesson's `exercise_quiz_ids`, existing self-quiz kept). Re-ran the full
suite after: still 970/0, no duplicate/empty `exercise_quiz_ids`.

This also resolves the Can/Could item — see §4.

## 3. Curriculum map reconciliation — BLOCKED, not skipped

The mission brief for this track (and Agent 226's brief before it) both
reference `A1 PLUS CURRICULUM MAP.md` as the source of truth, stating it
identified "49 published A1 lessons before the A1+ delta" and "23
proposed new A1+ lessons." **This file does not exist anywhere in the
package** — confirmed by exhaustive filename and content search across
the whole tree, at both the start of Agent 226's work and again now. No
other file in the repo references those specific figures (49 / 23)
either.

Those figures also don't reconcile with what's actually in the repo: the
runtime catalog had 10 lessons pre-A1+ (not 49), and 66 new lessons were
implemented (not 23), for 76 total. It's possible "49" refers to a
different/earlier planning artifact that was never committed, or to a
count that included non-A1 content; without the source document this
can't be resolved rather than guessed at.

**This is a genuine blocking gap for a "final" release gate**, per the
letter of the mission ("independently reconcile curriculum coverage
against A1 PLUS CURRICULUM MAP.md"). I have not fabricated a
reconciliation against a document that isn't there. What *can* be, and
was, verified independently against the actual shipped content:
`units.json` ⟺ `lesson_content/a1/` ⟺ `course_content/lessons/a1.json`
⟺ `a1/quizzes.json` all agree at 76/76/76/76, no duplicates, no gaps
(see `A1PLUS_INVENTORY_AGENT_226.md`, re-verified this pass).

**Recommendation**: before public release, someone with the original
curriculum-planning context should either locate/re-commit
`A1 PLUS CURRICULUM MAP.md` or confirm the 76-lesson structure now
shipped is the intended final scope.

## 4. Can/Could-for-requests decision — now recorded

**Decision: no separate dedicated grammar lesson is needed.** Evidence:
- Unit 1 (Grammar) lesson 6, "Can", already exists and is scoped to
  **ability** ("I can swim", "She can speak French") — confirmed by
  reading its exercise content (`grammar/a1/a1-006.json`).
- Unit 3 (Functional Language) lesson 10, "Requests, Offers and
  Permission", explicitly and substantively covers **Can/Could for
  requests and permission** — confirmed by reading its content
  (`functional/a1/a1-050.json`): "Could you close the door, please?",
  "Can I leave early, please?", "Can you pass the salt?" (as a request,
  contrasted against offers and permission in the same lesson).
- That functional lesson's exercise bank was authored but not linked to
  the lesson record — fixed in §2 above, so this coverage is now
  actually reachable by a learner, not just present in an orphaned file.

This is a content-based judgment made from what's actually in the
package, not a stakeholder/pedagogical-team decision — flagging that a
curriculum owner may still want to confirm it explicitly.

## 5. Final end-to-end smoke test

- `node tests/run.js`: **970 passed, 0 failed** (after the §2 fix, run
  again from a clean state — same result, no flakiness observed).
- Re-derived from source (not from a prior report) that all 76 course-a1
  lessons: have a catalog record, `status: published`, a unique
  `lesson_id`, a registered `lesson_quiz_id` in `a1/quizzes.json`, and
  now non-empty `exercise_quiz_ids` with no duplicates.
- Confirmed via `course.html`'s own roadmap-rendering test that a fresh
  learner sees exactly lesson 1 open and a fully-mastered learner sees
  all 76 lessons complete with a working link — this exercises the full
  Course → Unit → Lesson → Player → Quiz → Completion path end to end,
  not just static JSON shape.

## 6. Regression check against the existing A1 course

- The original 10 lesson records in `course_content/lessons/a1.json`
  were not modified by Agent 226 or by this pass (diffed against the
  Agent 225 baseline zip to confirm byte-for-byte).
- `offline/packs/core.zip` and `offline/packs/a1.zip` remain
  byte-identical to their manifests (re-verified by the test suite).
- No other level (a2–c2) touched by any agent in this track.

## 7. Remaining open items (non-blocking, for whoever owns final sign-off)

- `A1 PLUS CURRICULUM MAP.md` missing from the repo — §3.
- `revision.summary`/`key_terms` for the 66 new lessons are still
  mechanically derived from quiz explanations rather than freshly
  authored prose (Agent 226's note, unchanged this pass) — functional,
  not richly written.
- `course_content/lessons/<level>.json` absent from every level's
  offline-pack manifest (all 6 levels, pre-existing, not A1+-specific).
- No full manual pedagogical/answer-key audit of all 76 lessons'
  content was performed by either agent in this track; only the
  specific `correctIndex` convention bug (Agent 226) was mechanically
  detected and fixed.

## 8. Deliverable

`MYLINGO_A1PLUS_AGENT_227.zip` — full working app baseline with the §2
exercise-bank linking applied, plus this handoff. Given §3, this should
be treated as **content-and-runtime complete and passing all automated
checks**, but not yet a confirmed final release without a curriculum
owner's sign-off on the missing source document and the Can/Could
decision recorded in §4.
