# Agent 56 — Build memory reduction

## Status
COMPLETED

## Problem
`build.py`'s CLI commands (`validate`, `build`, `release-gate`) called
`read_rows()`, which materializes the entire master source as a flat list
of row dicts, then passed that list to `validate()`, which builds a
*second* full-dataset structure (`quizzes`: dict of quiz_id -> row list,
plus derived fields) grouped from it. At 1,200,000 questions, the CLI path
held two full copies of the dataset in memory at once — the flat list
outlived `validate()` only to be used for a row count in the report.

## Changed
- `build.py` only.

### Added
- `iter_rows_streaming(path)`: generator that yields CSV rows one at a
  time instead of returning a list (`.xlsx` still delegates to the
  existing `read_rows()`, since openpyxl already loads the whole workbook
  — streaming that is a separate, riskier change left for another agent).
- `_CountingIter`: thin iterator wrapper that counts items as they're
  consumed in a single pass, so the CLI can still report "N rows
  processed" without keeping the rows themselves.

### Changed
- `validate(rows)` no longer assumes `rows` is an indexable sequence
  (`bool(rows) and "date_added" in rows[0]`); the schema-v2 column check
  is now done per-row inside the existing single-pass loop. This is
  behavior-preserving for list input and makes `validate()` accept any
  single-pass iterable — its signature, return shape, and semantics are
  otherwise unchanged, since `validate()` is a shared entry point used by
  `generation/promote.py`, `generation/generate.py`, and several test
  files that all unpack `errors, warnings, quizzes = validate(rows)`.
- The `validate`, `build`, and `release-gate` CLI branches in `main()` now
  build rows via `_CountingIter(iter_rows_streaming(args.input))` instead
  of `read_rows(args.input)`, so the flat list is never held alongside
  `quizzes`. Only `quizzes` — the grouping the build actually needs —
  stays resident.
- `write_report()`'s `rows` parameter is now `row_count` (an int), since
  the report only ever needed `len(rows)`. It has no other callers.
- `read_rows()` itself is untouched and still returns a full list — other
  modules (`generation/`, tests) depend on that list-returning contract
  and were out of scope for this change.

## Tests
- `tests/unit/test_build_streaming.py` (new): confirms
  `iter_rows_streaming` yields a generator (not a list), that streamed
  ingestion produces identical errors/warnings/quiz grouping to the old
  `read_rows()` + `validate()` path, that `validate()` accepts an empty
  generator without the old `rows[0]` `IndexError`, and that
  `_CountingIter` reports the correct count after a single pass.

## Verification
- New test file: 4/4 passed.
- Full `tests/unit/` suite: 43/43 passed (unchanged files' behavior
  preserved).
- `generation/` suite: 58/58 passed (`build.validate()` callers there are
  unaffected — they pass lists, which still work).
- CLI smoke tests against the real `master_source.csv` (300 rows / 60
  quizzes): `validate`, `build`, `verify-output`, and `release-gate` all
  produced the same row/quiz counts and PASS results as before the change.
- Idempotency preserved: two full builds' generated `quizzes.json`
  manifests and per-quiz JSON files are byte-identical (md5-verified);
  only the offline-pack `.zip` files differ, and that's pre-existing
  (embedded timestamps in `offline_packs.py`, unrelated to this change).
- Measured with `tracemalloc` on a synthetic 80,000-row / 8,000-quiz CSV
  (proxy for the 1.2M-question target, same code path): peak traced memory
  dropped from 143.6 MB (list + quizzes) to 105.1 MB (streamed, quizzes
  only) — a 27% reduction — with identical validation output.

## Limitation
`quizzes` (the per-quiz grouping `validate()` builds) is still a
full-dataset, in-memory structure — this milestone removes the *second*,
redundant full copy on the CLI path, not the first. A true external-memory
build (bounded quiz-group buffers, e.g. relying on quiz-sorted input, or a
disk-backed grouping stage) would need its own milestone, since it changes
`validate()`'s contract that many other files depend on. `.xlsx` sources
also still load fully via openpyxl; only the CSV path (what a 1.2M-row
source will actually use) was addressed here.
