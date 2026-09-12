# Agent 58 — Browser export streaming

## Status
COMPLETED

## Problem
The authoring app's "Download Production ZIP" button
(`authoring/mylingo-admin.html`) is the one place the browser builds the
entire 12,000-quiz dataset into a downloadable artifact client-side. Two
compounding memory problems, both flagged under "Browser-side giant ZIP
memory pressure" in the mission brief:

1. `buildQuizExportPayload()` collected every quiz's JSON text into a
   `quizFiles` array (and every level manifest into `manifestFiles`)
   *before* handing any of it to JSZip — so the full export content
   existed twice in memory at once (the array, then JSZip's own per-file
   storage), on top of `window.mylingoData` itself.
2. `downloadProductionZip()` always called `zip.generateAsync({ type:
   "blob" })`, which assembles the entire compressed archive as one
   in-memory `Blob` before `saveAs()` can start the download — at scale,
   a multi-hundred-MB spike arriving all at once right as the user clicks
   the button, with no way to bound it.

## Changed
- `authoring/mylingo-admin.html` only.

### `buildQuizExportPayload()` → `buildQuizExportFiles(zip)`
Now takes the target `JSZip` instance and writes each quiz's JSON and
each level's manifest directly into it during the same traversal that
builds them, instead of returning `quizFiles`/`manifestFiles` arrays for
the caller to loop over a second time. Returns `{ quizCount, masterCsv,
validationReport }` — `validation_report.json` and `master_source.csv`
are still built exactly as before (their content isn't the memory
problem; `rowIssuesMap`/`quizIssuesMap` are already bounded by issue
count, not dataset size).

### `downloadProductionZip()`
- Where the browser supports the File System Access API
  (`window.showSaveFilePicker`), requests a save file handle up front
  (after the existing validation-issues confirmation, unchanged), then
  streams the ZIP's bytes to disk via `JSZip#generateInternalStream()` as
  they're produced — `.on("data", ...)` writes each chunk to the
  `FileSystemWritableFileStream`, pausing the ZIP stream while the write
  is in flight and resuming once it resolves (JSZip's own
  `pause()`/`resume()` backpressure mechanism), so peak memory is bounded
  by a few buffered chunks rather than the whole archive.
- If the picker is missing, throws (e.g. `AbortError` when the user
  cancels the save dialog), or the user cancels: falls back to the
  original `zip.generateAsync({ type: "blob" })` + `saveAs()` path,
  unchanged in outcome. `AbortError` specifically returns silently (no
  "ZIP generation failed" toast for a deliberate cancel).
- Added `streamFiles: true` to both the streaming and fallback
  `generateAsync` paths (an existing, already-loaded JSZip 3.10.1
  option — no new dependency) so JSZip itself streams file-by-file
  internally either way.
- Button ID (`downloadZipBtn`), its click handler wiring, the
  pre-export validation-issues confirmation dialog, and the final
  `showToast` message are all unchanged — only what happens between
  "user clicked download" and "file is on disk" changed.

## Tests
- `tests/unit/browser-export-streaming.test.js` (new, 6 tests) — source
  assertions, matching the existing convention for this file (see
  `tests/unit/authoring-pagination.test.js`, Agent 51): confirms
  `buildQuizExportFiles(zip)` writes straight into the ZIP (and the old
  `quizFiles`/`manifestFiles` accumulation is gone), the File System
  Access API is feature-detected and requested with the right
  `suggestedName`, the streaming path uses `generateInternalStream` with
  explicit pause/resume backpressure and closes the writable, the
  blob+`saveAs` fallback is still present, cancel is handled via
  `AbortError`, and the validation confirmation still runs before any
  file handle is requested.

## Verification
- Extracted the file's single inline `<script>` block and parsed it with
  Node's `Function()` constructor: syntax OK.
- Manually replicated every assertion in the new test file as a plain
  Node script against the actual file content: all pass.
- Grepped for stale references to the old `buildQuizExportPayload` name
  and the removed `quizFiles`/`manifestFiles` arrays: none remain outside
  an explanatory comment.

## Limitation
No JS test runner was available in this environment (`npm install` has
no network access here — sandbox has no registry access — so `vitest`
couldn't be installed), and per the free-tier rules, no browser
verification is claimed: the streaming path (File System Access API +
JSZip's `generateInternalStream`/backpressure) has not been exercised in
an actual browser, only checked for syntax validity and for matching
JSZip's documented `StreamHelper` API (`on('data'|'error'|'end')`,
`pause()`/`resume()`/`resume()`-to-start). A future agent with browser
access should manually verify a large export (ideally with the full
12,000-quiz dataset) in a Chromium-based browser to confirm actual peak
memory stays bounded and the downloaded ZIP opens correctly, and check
the Firefox/Safari fallback path still produces an identical ZIP to
before this change.
