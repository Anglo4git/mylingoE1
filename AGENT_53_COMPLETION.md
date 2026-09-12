# Agent 53 — Authoring memory-safe editing

Changed the same focused autosave adapter and regression test.

- Autosave processes rows one bounded chunk at a time rather than cloning/sanitizing the full dataset into a second in-memory array.
- Internal UI-only `__internalId` is omitted while serializing each row.
- Existing pagination keeps the DOM bounded to the current page; edits continue to mutate only the targeted row.

Test: `node tests/unit/authoring-draft-autosave.test.js` (4/4 passed).

Remaining limitation: restoring a draft necessarily reconstructs the full authoring array because the current editor data model is array-based.
