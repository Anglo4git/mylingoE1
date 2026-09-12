# MYLINGO — AGENT 08 COMPLETION

## Scope
Learner Progress Backup/Restore only. No accounts, cloud sync, authentication, or dashboard redesign.

## Production changes
- `site/shared/js/gamification.js`
  - Added local-only backup/restore API.
  - Added minimal Export progress / Import progress UI to all existing level dashboards through the shared module already loaded by those dashboards.
  - Added strict backup envelope validation and best-effort rollback on storage write failure.

## Test changes
- `tests/unit/progress-backup.test.js`
  - Export schema coverage.
  - Clear-and-restore coverage.
  - Malformed import safety.
  - Version mismatch safety.

## Backup schema
Top-level object:
- `schema`: exact string `mylingo.backup.v1`
- `exportedAt`: ISO timestamp string
- `progress`: current `mylingo.progress.v1` object
- `session`: current `mylingo.session.v1` object or `null`
- `gamification`: current `mylingo.gamification.v1` object

The backup is local-only and contains no account or cloud identifiers.

## Compatibility rules
- Import accepts only `mylingo.backup.v1`.
- `progress` must be an object whose entries use the existing learner-progress shape and sane numeric bounds.
- `session` is optional/null; when present it must match the Agent 07 v1 session field contract and contain only resumable in-progress state.
- `gamification` must contain sane numeric/string values when fields are present.
- Malformed JSON, wrong schema versions, invalid progress, invalid sessions, or invalid gamification data are rejected without changing existing storage.
- All validation happens before writes. If a storage write fails, the previous local values are restored on a best-effort basis.

## Acceptance verification
- Export package: passed via direct Node smoke test.
- Clear local progress + restore: passed; saved quiz score restored.
- Invalid import leaves existing progress unchanged: passed.
- Version mismatch leaves existing progress unchanged: passed.
- `node --check` on production module: passed.
- `node --check` on new unit test: passed.
- Full Vitest execution was unavailable because this package has no installed `node_modules`/Vitest binary in the current environment.

## Handoff to Agent 09
Progress backup is independent of gamification fairness logic. Preserve `mylingo.backup.v1` compatibility when modifying gamification behavior; do not rename the backup schema or remove the exported gamification field without an explicit migration.
