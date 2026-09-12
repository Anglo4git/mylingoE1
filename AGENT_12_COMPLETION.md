# MYLINGO — AGENT 12 COMPLETION

## Scope completed

Build Pipeline v2 — wiring the Content Schema v2 columns (`date_added`/
`date_updated`, `07_CONTENT_SCHEMA_V2.md`) into the actual generation and
promotion pipeline, plus surfacing them in the authoring app. Milestone 7
(Agent 11) shipped the contract and validation only; this was the explicit
follow-on named in that milestone's "Handoff to Agent 12" section.

## Why

`07_CONTENT_SCHEMA_V2.md` and `AGENT_11_COMPLETION.md` both named the same
open item: the two new columns existed and were validated, but nothing
actually *set* them. Without this, schema v2 would stay permanently inert —
every row would forever have an empty `date_added`/`date_updated`, and the
`CQ-M01`/`CQ-M02`/`CQ-M03` rules Agent 11 built would have nothing to check.

## What this is / is not

This is a **wiring** milestone: it makes the two surfaces that create or
edit rows (`generation/generate.py`, `generation/promote.py`) actually stamp
the columns Agent 11's contract defined, and gives the authoring app
read-only visibility into them plus tag autocomplete. It does **not**
backfill `master_source.csv` (still byte-for-byte Agent 10/11's file — see
Compatibility below), and it does not decide whether `date_added` should
ever reach the runtime manifest (`build.py`'s manifest `date` field is
still the Agent 3 placeholder — that question was explicitly left open by
`07_CONTENT_SCHEMA_V2.md` and is not this milestone's to answer).

## Files changed

- `generation/generate.py`
  - `CANONICAL_COLUMNS` now appends `date_added`/`date_updated` (sourced
    from `build.py`'s `SCHEMA_V2_DATE_COLUMNS`, one definition, no drift).
  - `build_rows_for_group()` takes a new `date_added` argument and stamps
    it on every row it builds — both brand-new quizzes and rows appended
    to an existing quiz, since both are genuinely new `master_source.csv`
    rows. `date_updated` is left blank at creation.
  - `generate()` computes one shared UTC timestamp per invocation (so a
    single run reads as one provenance event, not row-by-row clock noise)
    and threads it through all four `build_rows_for_group()` call sites.
    The timestamp is injectable via a new optional `now=` parameter —
    real callers never pass it; it exists so tests can assert exact
    determinism without fighting the wall clock.
  - `GENERATION_REPORT.md`'s writer and the module docstring now mention
    the stamp.
- `generation/promote.py`
  - **Fixed a real latent bug**: `write_master_csv()` hardcoded a 23-column
    fieldname list with `extrasaction="ignore"`. Any row already carrying
    `date_added`/`date_updated` (e.g. content that had already passed
    through `generate.py`) would have had those columns **silently
    dropped** the moment it went through promotion. Fieldnames now include
    `DATE_COLUMNS` (same `build_module.SCHEMA_V2_DATE_COLUMNS` source of
    truth).
  - `promote()` stamps `date_updated` (one shared UTC timestamp per call)
    on rows that are actually promoted — `status` is explicitly listed as
    a content-bearing field in `07_CONTENT_SCHEMA_V2.md`. Skipped and
    blocked rows are left completely untouched, including whatever
    `date_added`/`date_updated` they already had.
  - `write_report()`/`main()` updated to surface the stamp used.
- `authoring/mylingo-admin.html`
  - `DATA_FIELDS` now includes `date_added`/`date_updated` so they
    round-trip through import and CSV export instead of being silently
    stripped from any file that already has them.
  - `createEmptyRow()` defaults both to `""` — imports of existing content
    that lack the columns must stay blank, never fabricated.
  - The grid now renders `date_added`/`date_updated` as **read-only** text
    cells (not editable inputs) with a tooltip explaining why — per
    `07_CONTENT_SCHEMA_V2.md`'s handoff note, these are pipeline-stamped,
    not hand-typed.
  - `addRow()` (the explicit "Add row" button) stamps `date_added` with
    the current time, since that's the one action in this app unambiguous
    about minting a brand-new row rather than re-loading existing content
    for editing. Bulk import/paste flows deliberately do **not**
    auto-stamp — there's no reliable way to tell "brand-new raw content"
    apart from "re-loading an existing export for a bulk edit" from
    inside those flows, and guessing wrong would fabricate history.
  - Added an inline `TAG_VOCABULARY` constant mirroring `tag_vocabulary.json`
    (this app has no `fetch()` calls anywhere — it's a standalone offline
    file) and wired a shared `<datalist id="tagVocabularyList">` as
    autocomplete on the `quiz_tags`/`question_tags` cells. Advisory only;
    `content_qa.py`'s `CQ-T01` remains the actual enforcement point.
- `generation/test_generate.py`
  - New `TestContentSchemaV2Dates` class: valid ISO `date_added` on new
    rows, blank `date_updated` at creation, one shared timestamp per run,
    pre-existing rows in a v1-shaped (no date columns) source are never
    backfilled, and the stamped output still passes `build.py validate()`
    with zero `V-H1`/`V-H2` warnings.
  - Two pre-existing determinism tests (`test_determinism_same_input_same_output`,
    `test_repeated_content_is_deterministic_via_cache`) now pass a fixed
    `now=` so they keep asserting exact byte-for-byte reproducibility
    instead of failing on the wall clock the new stamp reads from.
- `generation/test_promote.py`
  - New `TestContentSchemaV2Dates` class: valid ISO `date_updated` on
    promoted rows, no stamp on skipped/blocked rows, only the targeted
    quiz gets stamped (an untouched sibling quiz doesn't), a regression
    test proving `write_master_csv()` no longer drops an existing
    `date_added` on the write-out roundtrip, and zero `V-H1`/`V-H2`
    warnings on promoted output.

## Rule/design decisions (why)

- **One timestamp per run/call, not per row.** Matches the existing style
  in this codebase (`write_metadata_csv()` in `generate.py` already does
  this for `generated_at`) and keeps "when was this batch touched" a
  single fact instead of microsecond noise across dozens of rows from the
  same action.
- **`date_added` stamped by `generate.py`, `date_updated` stamped by
  `promote.py`.** Deliberately disjoint: a freshly generated row hasn't
  been "updated," it's been created — stamping `date_updated` at creation
  would make every row look edited before anyone touched it.
- **The authoring app stamps `date_added` only on `addRow()`, not on
  bulk import/paste.** `07_CONTENT_SCHEMA_V2.md` frames the authoring app
  as one of three surfaces that *can* stamp `date_added` "at row
  creation," but bulk import is structurally ambiguous in this app — the
  same code path handles "author raw content for the first time" and
  "reload my own exported CSV to keep editing it." Stamping unconditionally
  there would risk exactly the backfill the contract rules out. The
  explicit, single-row "Add row" button has no such ambiguity.
- **No manifest wiring.** `07_CONTENT_SCHEMA_V2.md` explicitly lists
  "decide whether `date_added` should ever reach the runtime manifest" as
  its own open question, separate from this handoff. `build.py`'s
  placeholder manifest `date` field (`BUILD.md` Known Issue #1) is left
  untouched on purpose — that's a product decision, not a wiring task.

## Verification

- `python3 -m py_compile build.py content_qa.py generation/generate.py generation/promote.py generation/model_classifier.py`: PASS.
- `node --check` on the extracted inline `<script>` from
  `authoring/mylingo-admin.html`: PASS.
- `python3 -m unittest discover -s generation -p 'test_*.py' -v`: **58/58
  passed** (41 in `test_generate.py`, 17 in `test_promote.py` — up from
  34/10 before this milestone; all new tests are additive).
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v`: **16/16
  passed**, unchanged (no Python files under `tests/unit` were touched).
- `python3 build.py validate --input master_source.csv`: **60 rows, 60
  quizzes, 0 errors, 0 warnings** — unchanged; this file was never
  modified.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent12-build --src-root .`
  followed by `verify-output`: **0 errors, 0 warnings**, 66 data files
  written. Diffed generated `quizzes.json` against the committed `site/`
  copies: identical content, only a pre-existing key-ordering difference
  unrelated to this milestone (`build.py` itself was not touched).
- End-to-end CLI smoke test against temp copies (not the real
  `master_source.csv`):
  1. `generate.py --existing <60-row file>` with 5 new raw rows → 2
     accepted into the existing `a1-001` quiz, 3 held pending. Both new
     rows got the same `date_added` stamp; `date_updated` blank; all 60
     pre-existing rows stayed blank on both fields.
  2. `generate.py` with no `--existing` → fresh `a2-001` draft quiz, all 5
     rows share one `date_added`.
  3. `promote.py promote --all-draft` on that output → `a2-001` promoted
     to `published`, all 5 rows share one `date_updated`; `date_added`
     unchanged from step 2.
  4. `build.py validate` on the promoted output: 0 errors, 0 warnings.
  5. `content_qa.py` on the promoted output: 0 errors, 1 warning (an
     unrelated quiz-size review signal), 0 `CQ-T01`/`CQ-M0x` issues — as
     expected, since the tags used are all in `tag_vocabulary.json` and
     the dates are well-formed.
- Confirmed `tests/unit/authoring-raw-import.test.js`'s string-containment
  checks against `authoring/mylingo-admin.html` still hold against the
  edited file (`RAW_IMPORT_FIELDS`, `headers = RAW_IMPORT_FIELDS;`,
  `MAX_QUESTIONS_PER_QUIZ`, etc. — none of the regions this test inspects
  were touched). Note: that test's `Do NOT fall back to DATA_FIELDS here`
  assertion does not match the actual (line-wrapped, comment-prefixed)
  source text in either the pre- or post-Agent-12 file — a pre-existing
  mismatch, not something introduced here. Vitest itself remains
  unavailable in this environment (no `node_modules/.bin/vitest`, no
  networked `npm ci`), same as every prior agent's handoff — this could
  not be executed to confirm either way.

## Compatibility

- `master_source.csv` itself is untouched — still the exact 60-row file
  Agent 10/11 left. Nothing in this milestone writes to it directly;
  verification used temp copies.
- No change to runtime quiz JSON, `site/shared/quiz.html`, manifest shape,
  or any `mylingo.*` localStorage schema.
- No change to `build.py`'s validation rule set — `V-H1`/`V-H2` already
  existed from Milestone 7 and are unmodified.
- No change to `content_qa.py`'s rule set — `CQ-T01`/`CQ-M01`/`CQ-M02`/
  `CQ-M03` already existed and are unmodified; they now simply have real
  data to check once content flows through the updated pipeline.
- `generation/GENERATION_METADATA.csv`'s existing columns are untouched.
- The authoring app's runtime JSON/ZIP export path (the code that builds
  `quiz_doc`/manifest entries for the production ZIP) does not read
  `DATA_FIELDS` and was not touched — `date_added`/`date_updated` cannot
  leak into learner-facing JSON through this app.

## Handoff to Agent 13

- The manifest `date` field in `build.py` is still a fixed placeholder
  (`BUILD.md` Known Issue #1). Now that `date_added`/`date_updated` are
  actually populated for new/edited content, a future agent could revisit
  whether the manifest should source from them — `07_CONTENT_SCHEMA_V2.md`
  deliberately left this as an open product decision, not a default-yes.
- `master_source.csv` itself still has zero rows with `date_added`/
  `date_updated` populated (by design — no backfill). The columns only
  start appearing in output once content actually flows through
  `generate.py`/`promote.py`/the authoring app's "Add row" again.
- Other items still open from prior handoffs, unrelated to this milestone:
  real Vitest/Playwright execution (needs a networked environment),
  accessibility audit, deployment-topology decision (`RELEASE_CHECKLIST.md`).

## Do not change

- The frozen 23-column `master_source.csv` shape — `date_added`/
  `date_updated` are still columns 24/25, optional, never required.
- `master_source.csv` itself — still no backfill.
- Runtime quiz JSON / manifest shape.
- `mylingo.progress.v1`, `mylingo.session.v1`, `mylingo.gamification.v1`,
  `mylingo.backup.v1`, `mylingo.assessment.v1` schemas.
- `build.py validate`'s existing error rule set and `content_qa.py`'s rule
  set (both already had the Schema v2 rules from Milestone 7; this
  milestone didn't add or change any rule, only populated what they read).

## Stop rule

Stop after Agent 12 verification and handoff. Do not begin the manifest
`date`-sourcing decision or any other new milestone in this package.
