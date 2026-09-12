# Authoring Draft Autosave MVP

## Contract

The authoring app keeps a browser-local recovery copy of the current authoring dataset under:

`mylingo.authoring-draft.v1`

This is a draft/recovery layer only. It does not replace `master_source.csv`, does not publish content, and does not mutate canonical `date_added` / `date_updated` values.

### Stored envelope

```json
{
  "schemaVersion": 1,
  "savedAt": "2026-09-07T20:00:00.000Z",
  "activeLevel": "B1",
  "rows": [/* canonical + rich authoring rows without __internalId */]
}
```

### Behavior

- Changes are debounced and written automatically after authoring edits.
- The snapshot is flushed on `beforeunload`, `pagehide`, and when the document becomes hidden.
- The authoring UI shows autosave state and the timestamp of an available draft.
- A saved draft can be restored explicitly; restoring rehydrates fresh internal row IDs.
- A saved draft can be discarded without deleting the current grid.
- Malformed, wrong-version, or unreadable storage is ignored safely.
- Storage quota failures are surfaced as a non-blocking warning; authoring continues.
- The snapshot excludes `__internalId` so browser-session implementation details never become persisted content.

## Non-goals

- No server sync.
- No cross-device sync.
- No automatic publishing.
- No changes to validation, export, generation, placement, mastery, or review scheduling.
