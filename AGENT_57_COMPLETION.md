# Agent 57 — Incremental build artifacts

## Status
COMPLETED

## Problem
`build_site()` unconditionally rewrote every quiz JSON file and every
level manifest on every build, regardless of whether the content had
actually changed. At 12,000 quizzes, a rebuild after editing a single
question would still rewrite all ~12,000+ files — churning mtimes,
producing noisy diffs for git-tracked output, and forcing full re-upload
on rsync/CDN-based deploys even when only a handful of quizzes changed.

## Changed
- `build.py` only.

### Added
- `_write_text_if_changed(path, text)`: writes only when the existing
  file's content differs from the new content (or doesn't exist yet).
  Returns whether a write actually happened.

### Changed
- `build_site()` now builds each quiz doc's and each level manifest's
  JSON text first, then calls `_write_text_if_changed()` instead of
  unconditionally opening the file for writing. The function's return
  contract is unchanged: `written_files` still lists every output path
  that belongs to this build (same set, same length as before) — only
  whether bytes were physically rewritten to disk changed. `by_level` is
  unaffected (built the same way regardless of skip/write).
- `build_site()` gained an optional third parameter, `stats=None`. When a
  dict is passed, it's populated with `{'written': N, 'unchanged': N}`
  after the call. This is additive and back-compatible: existing 2-arg
  callers (`generation/`, tests) are unaffected.
- The `build` CLI command now passes a `stats` dict and prints
  `"N files in <out> (W written, U unchanged)"` instead of the old
  `"N files written to <out>"`. `BUILD_REPORT.md`'s own content/format
  (`write_report()`) is untouched — nothing else parses the stdout line.

## Tests
- `tests/unit/test_incremental_build.py` (new, 4 tests):
  - a second build with no source change writes 0 files and leaves every
    output file's mtime untouched;
  - editing one quiz's explanation only rewrites that quiz's JSON file —
    a sibling quiz's file is byte-identical and its mtime is untouched;
  - `_write_text_if_changed` reports write/skip accurately across repeated
    calls;
  - `build_site()` called the old 2-arg way (no `stats`) still works, for
    back-compat with existing callers/tests.

## Verification
- New test file: 4/4 passed.
- Full `tests/unit/` suite: 47/47 passed (43 prior + 4 new).
- `generation/` suite: 58/58 passed (`build_site` isn't called there, but
  `validate()` is — unaffected).
- Manual end-to-end smoke test against the real `master_source.csv`
  copied into the existing `site/` runtime:
  - Fresh build: `66 written, 0 unchanged`.
  - Immediate rebuild, unchanged source: `0 written, 66 unchanged`; a
    file-by-file mtime diff across every generated JSON file showed zero
    changes.
  - Editing one A1 quiz's explanation text and rebuilding: `1 written, 65
    unchanged`; only that quiz's JSON file's mtime changed (its level
    manifest didn't change either, correctly, since `explanation` isn't a
    manifest-visible field).
  - `verify-output` and `release-gate` both still PASS against the
    incrementally-built output.
- Idempotency (BUILD.md's documented guarantee) still holds and is now
  stronger: unchanged reruns produce not just byte-identical content but
  zero actual writes.

## Limitation
This only makes `build_site()`'s own writes incremental (quiz JSON +
level manifests) — offline pack `.zip` generation (`offline_packs.py`,
called separately by the `build` command) and `copy_runtime_assets()`
still do unconditional copies each run. Those are separate modules/
concerns and out of scope for a focused, 1-file change; a future agent
could apply the same skip-if-unchanged approach there if pack/asset
rebuild cost becomes a bottleneck at scale.
