# Authoring Scale + Incremental Validation

## Problem

The authoring app's live-edit validation re-validated the **entire** dataset
on every keystroke: `computeValidation()` recomputed every row's field
issues and rebuilt every quiz_id's row grouping and cross-row consistency
checks from scratch, and `renderValidationPanel()` then tore down and
rebuilt the whole validation table. Cost was O(total rows in the authoring
session) per keystroke — fine at the small sample sizes used during earlier
milestones, but not at the production target scale (~400 quizzes, per the
`master_source.csv` reference data), where it becomes noticeably laggy.

Measured before this milestone (Node timing of the equivalent full-rescan
work, dataset = N quizzes × 10 questions each):

| Quizzes | Rows  | Full rescan (≈ old per-keystroke cost) |
| ------- | ----- | --------------------------------------- |
| 100     | 1,000 | ~12 ms                                  |
| 400     | 4,000 | ~48 ms                                  |
| 1,600   | 16,000| ~178 ms                                 |

Cost grows linearly with dataset size — every keystroke gets slower as the
authored dataset grows.

## Contract

Validation **rules** are unchanged — same checks, same messages, same
order, same pre-existing quirks (not fixed, not in scope: the duplicate-
question-number check reads `question_num` rather than `question_number`,
and the category-consistency check reads `category` rather than
`quiz_category`/`question_category`).

What changed is **how** validation is recomputed:

- Row-level checks (`getRowIssues`) and per-quiz cross-row checks
  (`computeQuizGroupIssues`) now live in
  `site/shared/js/authoring-validation.js`, alongside a stateful
  `createEngine()` that maintains:
  - a `quiz_id -> Set(internalId)` index, updated incrementally (never
    rebuilt from scratch except by `fullRecompute`);
  - `rowIssuesMap` / `quizIssuesMap`, the same two Map objects for the
    engine's entire lifetime (mutated in place, never reassigned) so a
    caller can hold a reference once and it stays valid;
  - running summary counters (`rowsWithIssues`, `quizzesFailing`,
    `totalRows`, `totalQuizzes`, `orphanRows`) updated on each issue-state
    transition, not recomputed by rescanning.
- `engine.onFieldChanged(internalId)` is the live-edit hot path: it
  re-checks only the edited row, plus its quiz group (or, if the edited
  field was `quiz_id` itself, both the old and new quiz groups — moving the
  row between them in the index). It never touches any row outside of at
  most two quiz groups, so cost is O(rows in one quiz), not O(total rows).
  It returns the touched quiz_id(s).
- `engine.fullRecompute(rows)` remains the full O(total rows) rescan, used
  for bulk operations that already touch every row anyway: import, paste
  import, quiz packing, bulk delete, undo/redo, initial load. These paths
  are unchanged.
- `renderValidationPanel({ onlyQuizIds })` patches just the given quiz
  row(s) in the validation table's DOM (update in place, insert at the
  correct sorted position, or remove if the quiz has no rows left) instead
  of clearing and rebuilding the whole `<tbody>`. `renderValidationPanel()`
  with no arguments still does the full rebuild, used by the same bulk
  operations above.
- The per-keystroke `input` listener now calls `validationEngine
  .onFieldChanged(row.__internalId)` and `renderValidationPanel({
  onlyQuizIds: touchedQuizIds })` instead of `computeValidation()` +
  `renderValidationPanel()`.

Measured after this milestone (Node timing, same synthetic datasets, cost
of one single-field edit via `onFieldChanged`):

| Quizzes | Rows   | Incremental single-edit cost |
| ------- | ------ | ----------------------------- |
| 100     | 1,000  | ~0.13 ms                      |
| 400     | 4,000  | ~0.04 ms                      |
| 1,600   | 16,000 | ~0.06 ms                      |

Cost is flat — decoupled from total dataset size, as intended.

### Correctness invariant

For any sequence of `onRowAdded` / `onRowRemoved` / `onFieldChanged` calls,
the engine's final state (row issues, quiz issues, and summary counters)
must be identical to calling `fullRecompute` once over the same final row
set. This is covered by
`tests/unit/authoring-scale-incremental-validation.test.js`, including a
mixed add/edit/(quiz_id move)/delete sequence.

## Non-goals

- No grid virtualization / windowed rendering of the row grid itself (a
  separate, larger change with its own scroll/focus-management risk) — this
  milestone targets the validation hot path, which is what runs on every
  keystroke regardless of how many rows are currently visible.
- No changes to validation rules, export, generation, placement, mastery,
  or review scheduling.
- No change to the export/production-build validation call sites
  (`computeValidation()` immediately before an export/pack action) — they
  already touch the whole dataset and remain a full rescan.
