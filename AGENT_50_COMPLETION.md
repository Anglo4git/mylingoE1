# Agent 50 — Multi-session Storage Sharding

## DONE
Moved active multi-session persistence from one growing `mylingo.sessions.v2` JSON blob to per-quiz shards with a small index, while retaining migration and backup compatibility.

## Files changed
- `site/shared/quiz.html`
- `site/shared/js/gamification.js`
- `tests/unit/session-resume.test.js`
- `tests/unit/progress-backup.test.js`
- `AGENT_50_COMPLETION.md`

## What changed
- Added `mylingo.sessions.v3.index` containing only the resumable quiz IDs.
- Each session is stored at `mylingo.sessions.v3.<encodedQuizId>`.
- Existing v2 multi-session and legacy v1 stores migrate into shards on first access.
- Session reads/writes no longer serialize every in-progress quiz on each save.
- Backup reads all shards into the backup section; restore writes sessions back as shards and merges by quizId without deleting unrelated sessions.
- No new dependencies and existing quiz/session object shape is preserved.

## Checks
- `node --check site/shared/js/gamification.js`: PASS.
- Extracted quiz runtime script and `node --check`: PASS.
- `node --check` focused tests: PASS.
- Direct Node harness: sharded backup discovery and fractional-schema validation PASS.
- Vitest unavailable because `node_modules`/registry access is unavailable in this environment.

## Known limitation
Not verified in an actual browser.
