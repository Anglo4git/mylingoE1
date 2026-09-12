# Agent 52 — Authoring autosave chunking

Changed `site/shared/js/authoring-draft-autosave.js` and its focused unit test.

- Replaced whole-dataset localStorage snapshot writes with v2 manifest + bounded row chunks (default 200 rows).
- Manifest is written after chunks, so incomplete chunk writes are not advertised as complete drafts.
- Stale chunks are removed after a successful smaller save.
- Legacy v1 single-key drafts remain readable for compatibility.

Test: `node tests/unit/authoring-draft-autosave.test.js` (4/4 passed).

Remaining limitation: localStorage remains quota-limited; very large drafts can still exceed browser quota, but writes no longer construct one giant dataset JSON string.
