# Mylingo Agent 4 Handoff

## Completed

- Continued from the supplied v23 package without changing the existing production quiz dataset.
- Fixed the raw-only authoring app's **headerless TSV paste boundary** in `authoring/mylingo-admin.html`.
- Added a dedicated `RAW_IMPORT_FIELDS` mapping so headerless raw input is interpreted as:
  `question_text, answer_1..answer_9, correct_index, explanation`.
- Preserved canonical 23-column imports for headered CSV/XLSX and backward-compatible legacy fields.
- Kept the quiz size ceiling explicitly at **150 questions per quiz**.
- Added `tests/unit/authoring-raw-import.test.js` regression coverage for the raw boundary and 150-question ceiling.

## Why this matters

Before this fix, a headerless paste such as:

`Which word is correct?\tgo\tgoes\t...\t2`

was assigned the canonical 23-column order, which could put the question into `quiz_id` and shift every subsequent value into the wrong field. The authoring UI now honors the raw-only contract consistently whether the pasted data has a header or not.

## Validation

- `python3 -m unittest generation.test_generate generation.test_promote` → **47/47 passed**.
- `python3 -m py_compile build.py generation/generate.py generation/model_classifier.py generation/promote.py` → passed.
- Inline JavaScript syntax checks for `authoring/mylingo-admin.html` and `site/shared/quiz.html` → passed.
- `python3 build.py validate --input master_source.csv` → **60 rows, 60 quizzes, 0 errors, 0 warnings**.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent4-build --src-root .` → passed.
- `python3 build.py verify-output --out /tmp/mylingo-agent4-build` → **0 errors, 0 warnings**.

## Files changed

- `authoring/mylingo-admin.html`
- `tests/unit/authoring-raw-import.test.js`
- `HANDOFF_AGENT4.md`

## Do not change

- Existing quiz URLs/routes and manifest/path fallback behavior.
- Existing generated quiz JSON content unless a later agent explicitly requires it.
- `generation/` behavior already validated by the current 47-test suite unless a later milestone explicitly requires an extension.
- `site/sw.js` precache strategy.
