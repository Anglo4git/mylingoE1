# Changelog

## Agent 235 — Course lesson video integration
- Added the requested YouTube sample to all 308 published course lessons across A1, A2, B1, B2, C1 and C2.
- Synchronized per-level and aggregate lesson catalogs.
- Kept lesson context visible on video/audio slides in the lesson player.
- Regenerated CSP for YouTube framing.
- Rebuilt `offline/packs/core.zip`.
- Added shipped-lesson video assertions to the regression suite.
- Verification: `node tests/run.js` — **970 passed / 0 failed**.
## Agent 237 — Release audit
- Audited the Agent 236 release from a clean unzip.
- Verification: `node tests/run.js` — **970 passed / 0 failed**.
- Quick release gates: **ALL PASSED**; CSP current; source/dist byte-identical across 709 files.
- Confirmed the requested YouTube URL in **308/308** published lesson records.
- Packaging: **998 archive entries**, clean-unzip verification passed.
- Browser CSP sweep was attempted but requires the optional `playwright` module, which is not installed.

