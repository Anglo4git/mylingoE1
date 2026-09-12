# MYLINGO — AGENT 13 COMPLETION

## Milestone
Runtime v2 Adapter

## Scope completed
Added a standalone, dependency-free runtime compatibility boundary at
`site/shared/js/runtime-v2-adapter.js` and wired `site/shared/quiz.html` to
normalize quiz payloads and level manifests before existing rendering and
navigation logic consumes them.

## What the adapter handles
- Current production v1 quiz JSON remains unchanged and passes through with
  the same learner-facing fields.
- Legacy authoring payloads using `prompt`, `quiz_id`, `question_text`,
  `options`, and explicit `option_0...` zero-based answer indexing are mapped
  to the production 1-based `correctIndex` contract.
- Runtime v2 extensions are normalized at the boundary: typed questions,
  accepted answers, media objects, placement metadata, and optional date
  metadata remain available without forcing a runtime schema rewrite.
- Manifest aliases (`path`/`file`, `quiz_id`/`id`, etc.) are normalized through
  the same boundary before path resolution and suggestions use them.
- The adapter does not mutate source objects.

## Compatibility decisions
- Public quiz URLs are unchanged.
- Existing `mylingo.*` localStorage schemas are untouched.
- Existing runtime rendering, grading, placement, gamification, and session
  logic remain in `quiz.html`.
- No changes were made to `master_source.csv` or its frozen 23-column shape.
- No changes were made to generated learner-facing quiz data by this
  milestone.

## Verification
- `node --check site/shared/js/runtime-v2-adapter.js`: PASS.
- Runtime adapter smoke test covering v1, legacy 0-based authoring, and v2
  typed/media payloads: PASS.
- `quiz.html` inline script syntax check: PASS.
- `python3 -m unittest discover -s generation -p 'test_*.py'`: PASS.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py'`: PASS.
- `python3 build.py validate --input master_source.csv`: 60 rows, 60 quizzes,
  0 errors, 0 warnings.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent13-build2 --src-root site`
  followed by `verify-output`: 0 errors, 0 warnings; runtime adapter copied.
- Generated JSON values remain semantically identical to the committed site
  data; observed manifest key-order differences are serialization-order only.
- Vitest remains unavailable in this offline environment because
  `node_modules` is absent; the new test file is included for the networked CI
  environment.

## Next handoff
The adapter boundary is ready for a future milestone to extend build-time
mapping of additional v2 authoring fields into published JSON, or to add a
runtime feature that intentionally consumes provenance metadata. Neither is
assumed by this milestone.
