# Agent 57b — Incremental build artifacts (offline packs)

## Status
COMPLETED

## Problem
Agent 57 made `build_site()` skip rewriting quiz JSON/manifest files that
hadn't changed, but explicitly left `offline_packs.py` out of scope
(separate module, 1-file-change budget). `write_offline_packs()` still
unconditionally rewrote `offline/packs.json`, `offline/core-manifest.json`,
and all 7 pack `.zip` files (core + 6 levels) on every build, even when
nothing feeding them had changed — the same churn problem Agent 57 fixed
for quiz files, now the next-biggest write volume in the build.

While wiring this up, a related determinism bug surfaced: each pack ZIP's
`PACK_MANIFEST.json` entry was written via `zf.writestr(name, data)`,
which — given a bare filename instead of a `ZipInfo` — stamps the entry
with the current wall-clock time. That meant every pack ZIP's bytes
differed on every build regardless of content, silently defeating any
"skip if unchanged" comparison (and quietly breaking `build.py`'s
documented "identical input → byte-identical output" guarantee for these
specific files, pre-dating this change). Fixed alongside the incremental
write, since the skip logic is inert without it.

## Changed
- `offline_packs.py`: added `_write_bytes_if_changed()` (bytes analog of
  Agent 57's `_write_text_if_changed()`); `write_core_manifest()` and
  `write_offline_packs()` now use it instead of unconditional writes; each
  pack ZIP is assembled in memory (`io.BytesIO`) and compared whole before
  touching disk, so no partial ZIP is ever written. Fixed the
  `PACK_MANIFEST.json` entry to a constant `ZipInfo` timestamp (ZIP epoch)
  instead of "now". Both functions gained an optional `stats=None` param,
  same additive/back-compatible pattern as Agent 57's `build_site(...,
  stats=None)` — existing 1-arg callers (tests, prior `build.py` call site)
  are unaffected.
- `build.py`: `write_offline_packs(args.out)` → `write_offline_packs(args.out,
  stats=offline_stats)`; the `build` command's second stdout line now
  reports pack write/unchanged counts too (`Offline packs: 7 (...) (W
  written, U unchanged)`). No other line's format changed.

## Tests
- `tests/unit/test_incremental_offline_packs.py` (new, 5 tests), run
  against the existing `site/` fixture (same convention as
  `test_offline_core_package_integrity.py`, which already mutates and
  restores it):
  - a second `write_offline_packs()` call with nothing changed underneath
    writes 0 files and leaves every watched artifact's mtime and bytes
    untouched;
  - editing one level's `quizzes.json` only rewrites that level's pack and
    `core` (which embeds every level's manifest) — an unrelated level's
    ZIP is byte-identical and its mtime is untouched;
  - `_write_bytes_if_changed` reports write/skip accurately across
    repeated calls;
  - `write_offline_packs()` and `write_core_manifest()` called the old
    way (no `stats`) still work, for back-compat.

## Verification
- New test file: 5/5 passed.
- Full `tests/unit/` suite: 52/52 passed (47 prior + 5 new).
- Manual end-to-end smoke test, real CLI, real `master_source.csv` against
  the existing `site/` runtime:
  - First `build` after this change: quiz files `0 written, 66 unchanged`
    (Agent 57's incrementality, unaffected); offline packs `7 written, 2
    unchanged` — the 7 are the ZIPs, each carrying the old
    current-time-stamped `PACK_MANIFEST.json` from before this fix, so
    they differ from the freshly-built (now epoch-stamped) version once.
  - Immediate second `build`, nothing changed: `0 written, 66 unchanged`
    for quiz files, **`0 written, 9 unchanged`** for offline packs (7 ZIPs
    + packs.json + core-manifest.json) — previously this line would have
    read `7 written` on *every* build, forever, regardless of content.
  - Third `build` (repeat): identical `0 written, 9 unchanged` — confirms
    the fix is stable, not a one-time artifact of the first run.
  - `verify-output` and `release-gate` both PASS against the incrementally
    rebuilt output.

## Limitation
`copy_runtime_assets()` (verbatim copy of `shared/`, `main/`,
`placement/`, per-level `index.html`/`dashboard.html`, etc., only invoked
when `--src-root` is passed) still does unconditional `shutil.copytree` /
`copy2` on every call — same class of problem, not touched here to keep
this change to the 2 files it actually required. A future agent could
extend the same skip-if-unchanged approach there if asset-copy cost
becomes a bottleneck (it's typically small/one-time relative to the
1.2M-question dataset, unlike the artifacts fixed here and in Agent 57).
