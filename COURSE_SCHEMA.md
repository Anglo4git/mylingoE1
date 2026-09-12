# Mylingo — Course Data Contract (Agent 73)

## Objective

Define the canonical content contract for `Course → Unit → Lesson → Exercises`
so the journey/course layer described in the handoff can be built **on top
of** the existing quiz system, not as a fork of it.

This contract defines **data shape only**. It does not touch:
- the quiz engine, quiz schema, or `master_source.csv` (frozen — see
  `07_CONTENT_SCHEMA_V2.md`),
- any UI/route (`site/**`),
- scoring, mastery, or review scheduling.

Those are explicitly out of scope for Agent 73 and belong to later agents
(74–85) per the handoff.

## Three-layer separation (load-bearing)

Per the handoff's "most important architecture decision," this contract
keeps three things structurally separate. A course/unit/lesson record never
stores learner state and never stores presentation markup:

| Layer | Owns | Lives in |
|---|---|---|
| **Content** | Quiz, Lesson, Unit, Course | `master_source.csv` (quizzes, frozen) + `course_content/*.json` (this contract) |
| **Learner state** | placement, progress, mastery, review, completion | existing progress/mastery/review systems (Agents 11, 12, 40–42, 80) — untouched here |
| **Presentation** | homepage, course page, lesson revision, journey UI, quiz UI | `site/**` — untouched here |

A lesson/unit/course record is a **reference + short summary**, never a
copy of quiz content and never a UI template.

## Entities

### Course

One course per CEFR level for the initial rollout (`course-a1` …
`course-c2`), matching the six levels already canonical in `build.py`
(`LEVELS`) and `quality_contract.json`. The schema does not hard-code
"one course per level" — `level` and `course_id` are independent fields —
so a future goal-based course (e.g. "Travel English") is representable
without a schema change, but only CEFR-level courses ship in this
milestone's sample data.

| Field | Type | Required | Notes |
|---|---|---|---|
| `course_id` | string | yes | Unique, immutable. Pattern `^course-[a-z0-9-]+$`. |
| `level` | enum | yes | One of `A1 A2 B1 B2 C1 C2` (matches `build.py LEVELS`). |
| `title` | string | yes | e.g. `"English A2"`. |
| `description` | string | yes | Learner-facing summary. |
| `version` | integer | yes | Starts at `1`. Bump on any content-bearing change (mirrors the quiz `version` column convention). |
| `status` | enum | yes | `draft` \| `published`. |
| `unit_ids` | array\<string\> | yes | Ordered. May be empty in `draft`; must be non-empty to be `published`. |

### Unit

| Field | Type | Required | Notes |
|---|---|---|---|
| `unit_id` | string | yes | Unique, immutable. Pattern `^<course_id>-unit-[0-9]{2}$`. |
| `course_id` | string | yes | Must reference an existing course. |
| `title` | string | yes | e.g. `"Everyday Life"`. |
| `order` | integer | yes | 1-based, unique within its course. |
| `lesson_ids` | array\<string\> | yes | Ordered. May be empty in `draft`; must be non-empty to be `published`. |

### Lesson

The lightweight revision + exercise-pointer record. Never a textbook page.

| Field | Type | Required | Notes |
|---|---|---|---|
| `lesson_id` | string | yes | Unique, immutable. Pattern `^<unit_id>-lesson-[0-9]{2}$`. |
| `unit_id` | string | yes | Must reference an existing unit. |
| `title` | string | yes | e.g. `"Daily Routines"`. This is the lesson's *topic* — same role as a quiz's `title`. |
| `category` | enum | yes | `Grammar` \| `Vocabulary` \| `Writing` \| `Academic English` \| `Mixed`. Must be one of the four production quiz categories, or `Mixed` when the lesson intentionally spans more than one. |
| `order` | integer | yes | 1-based, unique within its unit. |
| `revision` | object | yes | See below. |
| `presentation_url` | string \| null | no | Optional slide/image asset reference. |
| `youtube_url` | string \| null | no | Optional. Enhancement, never a dependency (Agent 81 rule — see Offline). |
| `exercise_quiz_ids` | array\<string\> | yes | Non-empty. Each value must equal an existing `quiz_id` in `master_source.csv`. **This is the single link between the course layer and the quiz engine.** |
| `version` | integer | yes | Starts at `1`. |
| `status` | enum | yes | `draft` \| `published`. |

#### `revision` object

| Field | Type | Required | Notes |
|---|---|---|---|
| `summary` | string | yes | 1–400 chars. Must stay skimmable — see "brief" rule below. |
| `examples` | array\<string\> | no | 0–6 short example sentences. |
| `key_terms` | array\<string\> | no | Short vocabulary/rule callouts (e.g. `"always"`, `"usually"`). |
| `estimated_minutes` | number | no | Expected reading time. Soft ceiling of 10 (see validation). |

"Brief" is a product requirement, not just a style note: revision must be
skippable (`Start exercises` always available without completing it), so
the schema enforces it as a soft ceiling rather than baking a UI
requirement into content.

## IDs and versioning

- IDs are **hierarchical and immutable**: `course-a2` →
  `course-a2-unit-01` → `course-a2-unit-01-lesson-01`. A record's ID
  never changes after creation; retiring content means setting
  `status: "draft"` (or removing it from its parent's ordered list), not
  renaming or reusing an ID.
- `version` is an integer per record, starting at `1`, bumped on any
  content-bearing edit (title, category, revision, exercise list) —
  cosmetic-only edits are not required to bump it. This mirrors the quiz
  `version` column already in `master_source.csv`.
- `status` is `draft` or `published`. Only `published` records with a
  fully `published` ancestor chain (course → unit → lesson) are eligible
  for learner-facing surfaces; that gating decision belongs to the
  presentation layer (Agent 75+), not to this contract.

## The quiz reference contract

`Lesson.exercise_quiz_ids` is the only place this schema touches the quiz
engine, and it does so **by reference only**:

- A value must exactly match a `quiz_id` already present in
  `master_source.csv`.
- This contract does not duplicate quiz questions, answers, or
  explanations anywhere in course content — enforced by the schema
  simply having no field capable of holding them.
- A lesson may reference more than one quiz; a quiz may be referenced by
  more than one lesson (e.g. a foundational grammar quiz reused across
  two units). Reuse is allowed and is not itself a validation issue.
- Whether a *specific* quiz belongs under a *specific* lesson/topic is a
  content-mapping decision, not a schema rule — that mapping (and the
  full-catalog orphan/reference audit across all 61 quizzes) is Agent
  74's deliverable (`COURSE_CONTENT_MAPPING.md`). This contract only
  guarantees the reference, once made, is structurally valid and
  checkable.

## Validation rules

Implemented in `course_schema.py`, mirroring `content_qa.py`'s
error/warning/info severity model. Machine-checkable, dependency-free,
safe to run against a sparse/growing dataset.

### Blocking (`error`)

| Code | Rule |
|---|---|
| `CC-E01` | Duplicate `course_id` / `unit_id` / `lesson_id`. |
| `CC-E02` | Missing required field on a course/unit/lesson record. |
| `CC-E03` | Unknown enum value (`level`, `category`, `status`). |
| `CC-E04` | `unit.course_id` does not reference an existing course. |
| `CC-E05` | `lesson.unit_id` does not reference an existing unit. |
| `CC-E06` | A course's `unit_ids` (or unit's `lesson_ids`) lists an ID that does not exist. |
| `CC-E07` | `lesson.exercise_quiz_ids` is empty. |
| `CC-E08` | A value in `exercise_quiz_ids` does not exist as a `quiz_id` in `master_source.csv`. |
| `CC-E09` | Duplicate `order` value among sibling units (same course) or sibling lessons (same unit). |
| `CC-E10` | `published` course/unit has an empty `unit_ids`/`lesson_ids`. |

### Non-blocking (`warning`)

| Code | Rule |
|---|---|
| `CC-W01` | `lesson.category` is not `Mixed` and does not match the `quiz_category` of one or more of its referenced quizzes. |
| `CC-W02` | `revision.summary` exceeds 400 characters (no longer "brief"). |
| `CC-W03` | `revision.estimated_minutes` exceeds 10. |
| `CC-W04` | `youtube_url` present but not a well-formed `https://www.youtube.com/...` or `https://youtu.be/...` URL. |
| `CC-W05` | A referenced quiz's `status` in `master_source.csv` is not `published`. |

Severity rank follows the existing project convention
(`error > warning > info`); `error` codes are release blockers, `warning`
codes are review signals. No `info`-level codes are needed yet at this
scale — added if/when Agent 83's content-QA integration needs them.

## Guardrails honored (from the handoff)

- ✅ Did not redesign the homepage.
- ✅ Did not rewrite/touch the quiz engine or `master_source.csv`.
- ✅ Did not duplicate quiz data — lessons hold references (`exercise_quiz_ids`) only.
- ✅ `presentation_url` and `youtube_url` are optional on every lesson; nothing makes video mandatory.
- ✅ Did not change the legacy quiz schema (23 frozen columns untouched).
- ✅ No UI was built or modified.

## Sample data & tests

- `course_content/courses.json`, `course_content/units.json`,
  `course_content/lessons.json` — one full sample course (`course-a2`,
  matching the handoff's worked example: `English A2 → Everyday Life →
  Daily Routines`), referencing two real, currently-published quizzes
  (`a2-007`, `a2-010`) from `master_source.csv`. No new quiz content was
  created or duplicated to build this sample.
- `test_course_schema_agent73.py` — validates the schema loader and
  validation rules against both the sample data (should pass clean) and
  synthetic broken fixtures (each `CC-E0x`/`CC-W0x` code is exercised at
  least once).

## Handoff to Agent 74 (Course Content Mapping)

- The reference contract is `exercise_quiz_ids: array<quiz_id>` on
  `Lesson`, validated by `course_schema.py::validate_quiz_references()`.
  Reuse that function rather than re-deriving the check.
- This milestone deliberately maps only 2 of the catalog's 61 quizzes
  (`a2-007`, `a2-010`) as a worked sample. The full
  level → category → topic → lesson mapping across all published quizzes,
  and the catalog-wide orphan/broken-reference audit, is out of scope
  here and is Agent 74's deliverable.
- `lesson.category` is intentionally soft-checked (`CC-W01`, warning,
  not error) against the quiz(zes) it references, because a lesson may
  deliberately mix categories (`category: "Mixed"`) — Agent 74's mapping
  layer decides per-lesson category, this contract just flags mismatches
  for review.
- Do not add new columns to `master_source.csv` to support course
  content — the quiz ↔ lesson link is one-directional
  (`lesson.exercise_quiz_ids → quiz_id`); quizzes stay unaware of which
  lesson(s) reference them.
