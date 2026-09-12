# Agent 14 Completion — Rich Question Authoring MVP

## Delivered

Agent 14 adds a browser-based Rich Question Authoring MVP on top of the Agent 13 Runtime v2 Adapter.

### Authoring UI
- Added **Rich Question** editor to `authoring/mylingo-admin.html`.
- Supported question types mirror the production runtime:
  - multiple choice (`radio`)
  - short text (`short_text`)
  - fill in the blank (`fill_in_the_blank`)
  - number (`number`)
  - date (`date`)
  - matching (`matching`)
  - ranking (`ranking`)
- Added optional per-question:
  - subprompt
  - accepted answers
  - numeric tolerance
  - matching pairs
  - ranking items and correct order
  - image URL + alt text
  - audio URL + label
- Rich fields are optional and round-trip through authoring CSV export.

### Build/runtime bridge
- `build.py` now recognizes optional rich authoring columns and promotes them into learner-facing quiz JSON.
- Build validation is type-aware instead of forcing every rich question through the multiple-choice `2-9 answers + correctIndex` contract.
- `verify-output` validates rich text, matching, and ranking question structures.
- Existing v1/canonical rows remain valid and unchanged.

### Content QA
- `content_qa.py` now has rich-question-aware checks so text/date, matching, and ranking rows are audited against their own structures.

### Tests/docs
- Added `tests/unit/rich-question-authoring.test.js` for the authoring/build contract.
- Updated `authoring/README.md` with the Rich Question Authoring workflow.

## Verification

- `python3 build.py validate --input master_source.csv` — **60 rows, 60 quizzes, 0 errors, 0 warnings**.
- Full production build + `verify-output` — **0 errors, 0 warnings**.
- Rich synthetic build smoke — fill-in-the-blank, matching, ranking, and image metadata promoted into runtime v2 JSON successfully.
- Rich Content QA smoke — **0 errors**.
- Python Content QA regression suite — **16/16 passed**.
- Authoring inline JavaScript syntax check — **passed**.
- Vitest execution was not available in this offline workspace because `node_modules` is absent; the new JS regression file is included for the normal CI/networked test environment.

## Handoff

Agent 15 can build on the new typed-question authoring boundary without changing the Runtime v2 Adapter contract. A natural next step is richer preview/drag-and-drop authoring and stronger import/export UX around the structured fields.
