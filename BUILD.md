# Mylingo Generator — Usage (Agent 3)

## What this is

`build.py` turns a master source (one row per question, matching
`master_source.csv`'s columns) into the exact data files the runtime reads:
per-level `quizzes.json` manifests, and quiz content files under top-level
topic folders (`<topic-slug>/<level>/<id>.json`, e.g.
`grammar/b1/b1-001.json`) — one folder per topic (`grammar/`, `vocabulary/`,
`writing/`, `academic-english/`), each spanning all six levels. Each
manifest entry's `file` field is the source of truth for where its quiz
content actually lives; `shared/quiz.html` looks it up there rather than
assuming a path shape. It never touches `shared/quiz.html`, `index.html`,
`dashboard.html`, or `main/` — those are copied verbatim (Agent 1's build)
or left for Agent 4 (UX/runtime).

## Commands

```bash
# Check the source for problems without writing anything
python3 build.py validate --input master_source.csv

# Validate, then generate the site into ./site
python3 build.py build --input master_source.csv --out ./site \
    --src-root /path/to/agent1-starter --report BUILD_REPORT.md
```

`--src-root` is optional — omit it to generate only the data files
(per-level `quizzes.json` manifests + topic-folder quiz content) without
copying runtime assets.

`--force` writes output even when validation errors exist. Not recommended;
it exists for local debugging only, never for a real release build.

## Source format

CSV or XLSX, one row per question. Required columns:

`quiz_id, level, title, description, quiz_category, quiz_tags, version,
status, question_number, question_text, question_category, question_tags,
explanation, correct_index, answer_1 … answer_9`

- All quiz-level columns (`title`, `description`, `quiz_category`,
  `quiz_tags`, `version`, `level`, `status`) must be identical across every
  row sharing a `quiz_id` — the generator rejects a quiz with inconsistent
  metadata rather than silently picking one row's values.
- `answer_1`…`answer_9`: fill left-to-right, no gaps, 2–9 non-empty values.
- `correct_index` is **1-based**, matching the existing runtime's
  `correctIndex` field exactly (this is Agent 1's real schema — not the
  0-based or lettered scheme Agent 2's first draft assumed before the actual
  starter files were available; see Known Issues).
- Only rows where every row of a quiz has `status = published` are written
  to the generated site. `draft`/`in_review`/`approved`/`retired` quizzes are
  validated but excluded from output — this lets a content pipeline keep
  unfinished work in the same spreadsheet without it leaking into the live
  manifest.

## Validation rules enforced

See inline rule IDs in `build.py` (`V-A1`…`V-G1`) — required fields, level/
status enums, `quiz_id`/`question_id` uniqueness and format, answer-column
contiguity and count, `correct_index` bounds, duplicate answers, duplicate
question text within a quiz, cross-row metadata consistency, and question-
count sanity. Every failure names its rule ID and the exact row/quiz, so a
content editor can jump straight to the problem instead of re-reading the
whole file.

## Idempotency

Running `build` twice on unchanged input produces byte-identical JSON output
(verified: two full builds of the 60-sample source diffed with zero
differences). The only field that would differ run-to-run is `date` in each
manifest entry, currently a fixed placeholder — see Known Issues.

## Known issues / open items for the next agent

1. **Manifest `date` field is a placeholder.** The generator currently
   writes a fixed date into every manifest entry rather than sourcing it
   from a real `date_added`/`date_updated` column, because the master
   schema doesn't yet carry those columns (Agent 2's original schema had
   them; they were dropped when the template was corrected against the real
   runtime — see item 2). Add `date_added`/`date_updated` columns back to
   the master source and wire them in before this goes to production, or the
   manifest will report the same date for every quiz forever.
2. **Agent 2's original `CONTENT_SCHEMA.md` and `mylingo_quiz_template.xlsx`
   were written without access to Agent 1's actual starter files** and
   guessed a richer schema (lettered `option_a`–`option_d`, five question
   types, 0/letter-based answers) that does not match what Agent 1 actually
   shipped. The real, load-bearing schema is: single-type multiple-choice
   questions, 2–9 free-form `answers[]`, 1-based `correctIndex`. This
   generator, `master_source.csv`, and `mylingo_master_template_v2.xlsx`
   supersede the earlier Agent 2 files for anything that touches actual
   field names. If Mylingo wants true/false, fill-blank, matching, or
   ordering questions, that requires **both** a schema extension **and**
   runtime changes in `shared/quiz.html` (Agent 4's territory) — it is not
   just a data problem.
3. **`index.html` per level is static HTML** with ten hardcoded `<a>` cards
   (see `a1/index.html`). It will not scale to 2,000 quizzes per level.
   This generator does not touch it, by design (data generation only) — but
   it's a hard blocker for the 12,000-quiz production target. Flagging for
   Agent 4: `index.html` needs to fetch `quizzes.json` and render cards
   dynamically (with pagination/search), the same way the manifest-first
   architecture already assumes.
4. **No image/audio support yet.** The real schema has no `image_url`/
   `audio_url` fields at all (unlike Agent 2's original draft) — Agent 1's
   runtime doesn't render them. Out of scope until Agent 4 adds runtime
   support.
5. The generator's category/tag values are **not** validated against a
   closed vocabulary in this version, because Agent 1's real sample data
   uses natural values (`Grammar`, `Academic English`) that don't match the
   lowercase closed set Agent 2 originally proposed. Recommend the content
   team and Agent 4 agree on a real controlled vocabulary before scaling
   past the 60 samples, then add that as a V-C2-style rule here.
