# A2_INTEGRATION_NOTES.md
# Produced by: A2 Agent 6 (Technical Integrator)
# Ran after human APPROVAL at the gate in A2_CONTENT_AUDIT.md §4/§5.

## 1. HUMAN DECISIONS RECEIVED AT THE GATE

1. **A1/A2 grammar overlap (design decision A):** teach overlapping items
   (Present Simple, Past Simple) in more depth, at slightly higher
   difficulty, with a different practice structure than A1 — not a
   recap. Applied to `course-a2-unit-01-lesson-10` (Present Simple) and
   `-lesson-11` (Past Simple): each lesson's `body_content` carries a
   "Going further at A2" section, and the practice style for these two
   (transformation / error-correction framing in the extra material)
   differs from a plain gap-fill recap.
2. **Off-syllabus lessons (Countable/Uncountable, Modal: should):**
   kept, and revised with more depth rather than left as-is or removed.
   Both lessons' exercise quizzes grew from 5 to 7 questions, both
   gained a "Going further" section in `body_content`, and both are
   bumped to `version: 2`.
3. **Preferences lessons 07/08:** merged into one lesson,
   `course-a2-unit-03-lesson-07` — "Talking About and Expressing
   Preferences" — covering both simple preference statements and
   comparing options. The functional-language unit therefore has 12
   lessons, not 13; lessons after the merge point were renumbered down
   by one (old 09–13 → new 08–12), and quiz IDs renumbered to match
   (a2-308…a2-312).

## 2. ONE ITEM NOT EXPLICITLY DECIDED — DEFAULTED, FLAGGED FOR REVIEW

The three PARTIAL grammar items (issue F: superlative adjectives,
"will", adverbs of manner) were never put to you as a question — I
defaulted to the option the Lesson Author had already suggested in
A2_LESSON_DRAFTS.md §4 (extend the existing host lesson, rather than
create 3 new near-duplicate lessons), to avoid inventing lesson
content unprompted:
- Superlative adjectives → extended into `a2-001`
  (now "Comparative and Superlative Adjectives")
- "Will" (predictions / spontaneous decisions) → extended into `a2-004`
  (now "Future: going to / will")
- Adverbs of manner → extended into `a2-007`
  (now "Adverbs of Frequency and Manner")

Each gained 2 extra quiz questions (5 → 7) and a body_content section.
**This default has not been confirmed by you** — if you'd rather these
become 3 standalone new lessons instead, say so and I'll split them out.

## 3. WHAT WAS INTEGRATED

- 13 new grammar lessons: `course-a2-unit-01-lesson-10` … `-22`
- 18 new vocabulary lessons: `course-a2-unit-02-lesson-03` … `-20`
- 12 new functional-language lessons (13 drafted, 2 merged into 1):
  new unit `course-a2-unit-03`, lessons `-01` … `-12`
- 5 existing lessons revised in place (version bumped to 2):
  `a2-001`, `a2-004`, `a2-006`, `a2-007`, `a2-008`
- 0 existing lessons removed

Files touched/created:
- `course_content/lessons.json` — 43 new entries appended; 5 existing
  entries patched (title/version/body_content) for the revisions above
- `course_content/lessons/a2.json` — regenerated from the A2 slice of
  `lessons.json` (was stale/out of sync with the monolith; now mirrors
  it, sorted by unit + order)
- `course_content/units.json` — `course-a2-unit-01` and `-02` extended
  with the new lesson IDs; new unit `course-a2-unit-03` (Functional
  Language) appended
- `course_content/courses.json` — `course-a2.unit_ids` gained
  `course-a2-unit-03`; `course-a2.version` bumped to 2
- `a2/quizzes.json` — 86 new manifest entries (one exercise-quiz file +
  one lesson-quiz file per new lesson); 10 existing entries patched for
  the 5 revised lessons (question count / title / version)
- New content files: `grammar/a2/a2-101.json`…`a2-113.json`,
  `vocabulary/a2/a2-201.json`…`a2-218.json`,
  `functional/a2/a2-301.json`…`a2-312.json` (new directory — no A2
  functional quizzes existed before this pass), and 43 matching
  `lesson_content/a2/lesson-course-a2-unit-0X-lesson-YY.json` banner
  files, plus the 5 revised existing files under `grammar/a2/` and
  `lesson_content/a2/`
- `offline/packs/core.zip` and `offline/core.zip` — rebuilt so the 4
  files listed in `offline/core-manifest.json` that changed
  (`a2/quizzes.json`, `course_content/{courses,lessons,units}.json`)
  are byte-identical to the live repo copies again

## 3a. Political-systems-and-change framing (design decision B)

Not put to you explicitly either; left exactly as the Lesson Author
and Content Auditor already handled it — neutral, definitional
vocabulary only (government, election, vote, president, parliament,
policy, democracy), no country-specific or current-events content. No
further action taken; still worth a look if you want a different
framing.

## 4. SCHEMA / CONVENTIONS FOLLOWED

- `correctIndex` in every quiz question is **1-based** (matches all
  pre-existing A2/A1 content) — this was the one bug caught by the
  test suite during integration (initial draft used 0-based indices
  from the quiz-author markdown parser) and fixed before anything
  shipped.
- New lessons use the richer `body_content` HTML field (same
  convention as the existing A1 Functional Language unit) even though
  the original 11 A2 lessons predate that field — this is additive and
  backward compatible per `LESSON_PLAYER_CONTENT_SCHEMA.md`.
- Quiz ID numbering continues the scheme the Quiz Author proposed:
  grammar 101–113, vocabulary 201–218, functional 301–312 (post-merge).
- No app code (JS/HTML/CSS) was modified — content and manifest files
  only.

## 5. VALIDATION PERFORMED

- Every new/modified JSON file parses.
- Every `unit.lesson_ids` entry for `course-a2` has exactly one
  matching `lessons.json` entry and vice versa (no orphans, no gaps).
- Every `exercise_quiz_ids` / `lesson_quiz_id` referenced by an A2
  lesson resolves to an entry in `a2/quizzes.json`.
- `node tests/run.js`: see A2_QA_REPORT.md.
