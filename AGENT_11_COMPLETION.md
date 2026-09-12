# MYLINGO — AGENT 11 COMPLETION

## Scope completed
Content Schema v2 Contract — provenance timestamps (`date_added`/
`date_updated`) and a controlled tag vocabulary, layered additively on top
of the frozen v1 23-column `master_source.csv` shape.

## Why
Multiple prior handoffs (Agent 9, Agent 10) flagged the same two open items
under "content-scaling groundwork": `date_added`/`date_updated` columns and
a controlled tag vocabulary. No agent had scoped or claimed this work yet.
The raw authoring-orientation notes (`data structure orientation for
auditoring/`) also describe a much larger (~400-quiz) incoming dataset,
which is exactly the scale at which untracked content age and free-text tag
drift start costing real review time.

## What this is / is not
This is a **contract + tooling** milestone, not a data-migration milestone.
It adds the columns and vocabulary that authoring/generation *can* start
using, and the validation that reads them if present. It does **not**
backfill `master_source.csv` with dates, and does **not** wire
`generation/generate.py` or the authoring app to stamp them automatically —
both are named as explicit follow-on work in the contract, since touching
the generation pipeline is outside the "do not change" boundary this
milestone respects unless a later milestone explicitly asks for it.

## Files added
- `07_CONTENT_SCHEMA_V2.md` — the contract itself: field definitions,
  scope boundaries, enforcement split, acceptance criteria, handoff notes.
- `tag_vocabulary.json` — controlled vocabulary source of truth (`levels`,
  `skills`, `categories`), seeded from the enums `build.py`/`SCHEMA.md`
  already use plus the 4 production category names already in
  `master_source.csv`, with a few reserved growth categories logged in
  `_added_log`.

## Files changed
- `build.py` — `_is_iso_datetime()` helper; `V-H1`/`V-H2` warnings for
  malformed `date_added`/`date_updated` values, only evaluated when the
  column is present in the source at all (`has_date_added`/
  `has_date_updated` computed once from the header, not per row).
- `content_qa.py` — loads `tag_vocabulary.json` once at import
  (`CONTROLLED_TAG_VOCAB`; empty set and rule silently disabled if the file
  is missing/unreadable, so the module never hard-fails on this). New rules
  inside `audit_rows()`: `CQ-T01` (tag not in controlled vocabulary,
  warning), `CQ-M01` (date column present but value empty, warning),
  `CQ-M02` (value present but not valid ISO 8601, error), `CQ-M03`
  (`date_updated` earlier than `date_added`, warning).
- `site/SCHEMA.md` — new "Content Schema v2 (Milestone 7)" section linking
  the contract.
- `tests/unit/test_content_qa.py` — 7 new tests: v1 rows unaffected,
  unknown tag flags `CQ-T01`, known tags don't, empty date column flags
  `CQ-M01`, malformed date flags `CQ-M02` as an error, valid dates produce
  no metadata issues, `date_updated` before `date_added` flags `CQ-M03`.

## Rule severities (why)
`V-H1`/`V-H2` (build.py) and `CQ-M01`/`CQ-M03` (content_qa.py) are always
warnings — build must not silently break on brand-new, not-yet-runtime-
consumed metadata columns, and vocabulary/staleness drift is a review
signal, not a defect. `CQ-M02` (unparseable date, when the column is
present and non-empty) is an error in content_qa.py, since a value that
claims to be a date but isn't is a real structural mistake, not a review
judgment call — but it still isn't wired into `build.py`'s error list, so
it cannot block a build. Full rationale and severity table in
`07_CONTENT_SCHEMA_V2.md`.

## Verification
- `python3 -m py_compile build.py content_qa.py`: PASS.
- `python3 build.py validate --input master_source.csv`: **60 rows, 60
  quizzes, 0 errors, 0 warnings** — unchanged from Agent 10's baseline.
- `python3 build.py build --input master_source.csv --out
  /tmp/mylingo-agent11-build`: 66 data files written, unchanged.
- `python3 build.py verify-output --out /tmp/mylingo-agent11-build`: 0
  errors, 0 warnings.
- `python3 content_qa.py --input master_source.csv --out-dir
  /tmp/cqa_check`: identical `summary`/`by_code` to the committed
  `content_qa/content_qa_report.json` baseline (0 errors, 65 warnings, 1
  info, score 79/100) — confirmed by direct JSON diff. No `CQ-T01`/
  `CQ-M0x` issues appear, as expected: current tags are all in
  `tag_vocabulary.json` and no date columns exist yet.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v`: 16/16
  passed (9 pre-existing + 7 new).
- Direct Node-free Python smoke test of `build.validate()` against
  synthetic rows: no date columns → 0/0; valid ISO dates → 0/0; malformed
  dates → `V-H1`/`V-H2` warnings only, no errors. PASS.
- Vitest was unavailable for the same reason every prior agent in this
  package has hit (no networked `npm ci` in this environment) — no `.js`
  test files were added by this milestone, so this doesn't add to that
  backlog.

## Compatibility
- `master_source.csv` itself is untouched — still the exact 60-row, 23-
  column file Agent 10 left.
- No change to runtime quiz JSON, `site/shared/quiz.html`, manifest shape,
  or any `mylingo.*` localStorage schema.
- No change to `generation/GENERATION_METADATA.csv`'s existing columns.
- Existing Milestone 6 content QA rules/report shape unchanged; new rules
  are additive entries in the same `issues` list and `by_code` summary.

## Handoff to Agent 12
- Wire `generation/generate.py` to stamp `date_added` on new rows and
  `promote.py`/authoring saves to stamp `date_updated` on edits — the
  natural next step now that the contract and validation exist, explicitly
  left open by this milestone.
- Extend `authoring/mylingo-admin.html` with read-only date display and
  tag-vocabulary-sourced autocomplete.
- Still open, unrelated to this milestone: real Vitest execution (needs a
  networked environment), accessibility audit, deployment-topology
  decision.

## Do not change
- The frozen 23-column `master_source.csv` shape.
- Runtime quiz JSON / manifest shape.
- `mylingo.progress.v1`, `mylingo.session.v1`, `mylingo.gamification.v1`,
  `mylingo.backup.v1`, `mylingo.assessment.v1` schemas.
- `build.py validate`'s existing error rule set (only warnings were added).
