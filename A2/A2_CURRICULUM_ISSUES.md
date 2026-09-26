# A2_CURRICULUM_ISSUES.md
# CURRICULUM_ISSUES_SEED.md, carried forward unchanged below, plus new
# findings appended by A2 Agent 1 (Curriculum Mapper) after inspecting
# the current repo. Nothing below is resolved — all items still require
# human decision at the approval gate.

---

# A2 CURRICULUM ISSUES — SEED (pre-flagged for human review)
# Agent 1 must read this BEFORE mapping.
# Do not silently resolve these. Add to this file, do not overwrite.

## OCR / SOURCE AMBIGUITIES

1. "Past Simple Continuous"
   - The supplied syllabus lists "Past Simple Continuous".
   - Almost certainly means "Past Continuous".
   - ACTION: Treat as Past Continuous. Confirm with human.

2. "jonesterd enguage, basic or"
   - Reading objective is garbled in the source.
   - Likely: "understand simple everyday language, basic vocabulary".
   - ACTION: Flagged for human correction. Use the paraphrase above
     until corrected. Do not invent a different objective.

3. "Croniors and denslanations"
   - Speaking objective is garbled.
   - Likely: "opinions and explanations".
   - ACTION: Flagged. Use "give opinions and explanations" until corrected.

4. "impress"
   - Writing objective ends with "experiences and impress".
   - Likely: "experiences and impressions".
   - ACTION: Use "impressions". Confirm with human.

5. Listening objective wording
   - Source text reads as two overlapping sentences ("Understand the main
     point any radio or TV programme..." and "Understand the main points
     of clear speech on work, school").
   - ACTION: Treated as two objectives. Merged in CURRICULUM_SOURCE.md.
     Human should confirm this is the intended scope.

6. "Present Simple Passive"
   - Confirmed as listed. No ambiguity.
   - Note: sometimes also written "Present Simple, Passive" — same thing.

7. "leisure venues"
   - Source says "Restaurants and leisure venues". Kept as one topic.
   - ACTION: If human wants these split into two lessons, say so at the
     approval gate.

## DESIGN DECISIONS NEEDING HUMAN INPUT (do NOT resolve)

A. A1 / A1+ / A2 overlap
   - Present Simple, Present Continuous, Past Simple, Comparatives,
     Adverbs of frequency/manner, and Have to/need to all appear in both
     A1+ and A2.
   - QUESTION: Should A2 lessons re-teach these from scratch, or assume
     the learner completed A1 and build on them?
   - ACTION: Flagged. Curriculum Mapper must not decide this alone.

B. Political systems and change
   - Included as an A2 vocabulary topic. Some learners may consider this
     sensitive. QUESTION: any local/regional constraints?
   - ACTION: Flagged. Do not remove.

C. Total lesson count
   - A2 has more grammar items than A1/A1+ combined.
   - QUESTION: is there a target lesson count, or is breadth fine?
   - ACTION: Flagged. Do not artificially cap.

## MISSING OR UNCLEAR FROM SOURCE

- No explicit listening examples (types of audio) are given.
  → Quiz Author should propose examples and flag them for approval.
- No explicit writing task types beyond "personal letters" and "write
  simply about familiar topics".
  → Lesson Author should propose task types and flag them.
- No indication whether "First Conditional" means type 1 only or
  type 1 + variations.
  → Assume First Conditional type 1 only. Confirm at approval gate.

---

# NEW FINDINGS — appended by A2 Agent 1 (Curriculum Mapper)
# Source: inspection of course_content/, grammar/a2/, vocabulary/a2/,
# a2/quizzes.json, lesson_content/a2/, placement/a2/ in the current build.
# See A2_CURRICULUM_MAP.md for the full coverage tables these summarize.

D. course-a2 is not a blank slate
   - Unlike the "fresh level" framing in the pipeline docs, course-a2
     already exists and is marked "status": "published" in
     courses.json, with 9 grammar lessons, 2 vocabulary lessons, 22
     quiz records, and a 10-question placement check already in the
     repo.
   - QUESTION: is this pass meant to extend/complete the existing
     course-a2, or does "fresh level" mean something in the existing
     build should be replaced/reset first?
   - ACTION: Flagged. Not resolved here. Lesson Author should treat the
     9+2 existing lessons as kept-in-place unless a human says otherwise.

E. Two existing grammar lessons have no matching syllabus item
   - "Countable/Uncountable" (course-a2-unit-01-lesson-06) and
     "Modal: should" (course-a2-unit-01-lesson-08) are both published
     lessons in the current build, but neither appears in
     CURRICULUM_SOURCE.md's grammar syllabus.
   - QUESTION: keep as supplementary content outside the syllabus, fold
     "should" into "must/might for deductions" or "have to/need to",
     or flag as content that predates this syllabus and should be
     reconciled/removed?
   - ACTION: Flagged. Not removed, not reclassified. Human decision
     needed, per the "do not silently add or remove topics" rule.

F. Three grammar syllabus items are half-covered by existing lessons
   - "Comparative Adjectives" covers comparative but not superlative.
   - "Future: going to" covers "going to" but not "will" (predictions /
     spontaneous decisions).
   - "Adverbs of Frequency" covers frequency but not manner.
   - QUESTION: extend these three existing lessons to cover the missing
     half, or add three new standalone lessons (superlative; will;
     adverbs of manner)?
   - ACTION: Flagged. Interacts with design decision C (target lesson
     count) — do not decide silently.

G. Existing vocabulary lessons don't map to named topics
   - "Everyday Vocabulary" and "Everyday Vocabulary Review" are the only
     two vocabulary lessons in course-a2-unit-02. Their titles don't
     correspond to any of the 18 topics in CURRICULUM_SOURCE.md, and
     confirming their actual word-list scope against those topics
     requires opening lesson_content/a2/lesson-course-a2-unit-02-*.json,
     which is Content Auditor work.
   - QUESTION: repurpose/rename these two as the first two topic
     lessons (once their content is checked against a topic), or leave
     them as general lessons and add all 18 topic lessons separately?
   - ACTION: Flagged. Not resolved here.

H. No Functional Language unit exists for course-a2
   - course-b1, course-b2, and course-c1 each have a "Functional
     Language" unit in units.json; course-a2 does not, and none of the
     13 functional syllabus items are evidenced anywhere in the current
     A2 build.
   - ACTION: Flagged as a straightforward gap (not ambiguous — just
     confirming it's genuinely unbuilt, per §4 of A2_CURRICULUM_MAP.md).
     Lesson Author should propose a new course-a2-unit-03 at the
     approval gate.
