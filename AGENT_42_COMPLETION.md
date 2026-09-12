# Agent 42 — Multi-session resume

DONE

- Replaced the single-session container with versioned `mylingo.sessions.v2`, keyed by quiz ID.
- Existing v1 `mylingo.session.v1` data is migrated automatically on read.
- Resume/start-over/answer persistence now scopes to the current quiz, so switching quizzes no longer overwrites another in-progress session.
- Completion clears only the completed quiz's resumable entry.

Changed: `site/shared/quiz.html`, `tests/unit/session-resume.test.js`.
