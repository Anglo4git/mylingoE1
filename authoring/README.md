# Mylingo Authoring App

`mylingo-admin.html` is the canonical browser-based authoring surface for Mylingo quiz data.

## Rich Question Authoring MVP

Select one row and choose **Rich Question** to author the same question types
understood by the production Runtime v2 Adapter: multiple choice, short text,
fill-in-the-blank, number/date answers, matching pairs, and ranking items. The
editor also supports optional image/audio media, subprompts, accepted answers,
and numeric tolerance. Rich fields are optional extensions to the frozen
canonical row model and are serialized into the exported CSV and production
quiz JSON.

## Compatibility contract

The editor's internal row model and `master_source.csv` export use the same 23 columns as the build pipeline:

- quiz metadata: `quiz_id`, `level`, `title`, `description`, `quiz_category`, `quiz_tags`, `version`, `status`
- question metadata: `question_number`, `question_text`, `question_category`, `question_tags`, `explanation`, `correct_index`
- answer slots: `answer_1` through `answer_9`

`correct_index` is **1-based**, matching the production quiz runtime (`correctIndex`).

The authoring app still accepts the earlier prototype shape on import (`category`, `question_num`, `prompt`, `option_0`…`option_3`, and 0-based `correct_index`) and upgrades it to this canonical shape.

Production JSON is emitted in the same topic-first layout as `build.py`:

`site/<quiz_category-slug>/<level>/<quiz_id>.json`

The generated quiz JSON uses the exact runtime field names consumed by `site/shared/quiz.html`.


## Raw-only authoring mode

The preferred authoring workflow now starts with raw question content only:
`question_text`, `correct_index`, and at least two answer options. Explanation,
quiz ID, level, topic/title, categories/tags, numbering, version, status and
other bookkeeping are auto-generated before validation/export. Existing
canonical imports remain supported for backward compatibility. See
`../generation/RAW_ONLY_SCHEMA.md`.

## Authoring Draft Autosave MVP

The editor now keeps a browser-local recovery snapshot under
`mylingo.authoring-draft.v1`. Edits are debounced and flushed on page hide/
unload. The toolbar exposes autosave status plus explicit **Restore Draft** and
**Discard Draft** actions. The draft envelope is versioned and excludes the
UI-only `__internalId` field.
