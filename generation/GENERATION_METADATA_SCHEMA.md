# Generation metadata (side-channel, non-canonical)

`master_source.csv` stays frozen at the 23 canonical columns Agent 1 locked
down (see `authoring/README.md` / `site/SCHEMA.md`). Automation still needs a
place to record *why* a question was generated the way it was — that
information is authoring/debugging metadata, not runtime content, so it does
not belong in the human-facing export.

`generate.py` writes it to a companion file instead:
`GENERATION_METADATA.csv`, one row per generated question, keyed by the same
derived `question_id` (`{quiz_id}-q{question_number:02d}`) that `build.py`
already derives internally. Nothing reads this file at build or runtime — it
exists purely for traceability and for future automated regeneration.

| column | meaning |
|---|---|
| `question_id` | `{quiz_id}-q{NN}`, same derivation `build.py` uses |
| `template_id` | identifier of the generation template/prompt that produced this row, if any |
| `seed` | deterministic seed used, if the row came from a randomized generator |
| `learning_objective` | short human-readable statement of what the question tests |
| `target_item` | the specific grammar/vocabulary item being tested (often equal to the raw `question_category`) |
| `difficulty` | free-text or numeric difficulty label, generator-defined |
| `distractor_strategy` | how wrong answers were chosen (e.g. `common-misspelling`, `false-friend`, `off-topic`) |
| `source_reference` | textbook/corpus/reference the question was derived from, if any |
| `generation_status` | `generated`, `human-reviewed`, `human-edited`, `rejected` |
| `generated_at` | ISO timestamp of generation |

All columns are generated automatically for raw-only input. `source_reference` is
set to `raw-input`, `difficulty` mirrors the inferred CEFR level, and the
remaining fields are deterministic authoring metadata. A future upstream model
may replace these values, but authors do not need to provide them. A human editing a question directly in
the authoring app has no obligation to keep this file in sync; it is a
best-effort trail from the generation side, not a second source of truth.
