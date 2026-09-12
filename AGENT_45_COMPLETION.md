# Agent 45 — Gamification Reward Integrity

DONE

## Files changed
- `site/shared/js/gamification.js`
- `site/shared/quiz.html`
- `tests/unit/gamification.test.js`
- `tests/unit/graded-question-consistency.test.js`

## Implementation
Rewards are keyed by `quizId + quizVersion`, not by score. Full completion XP is awarded once per version. A real score improvement can earn a bounded 5 XP per improved correct answer, capped at 20 XP per quiz version. Lower/repeated scores earn 0 XP. Missing quiz identity/version is non-rewardable. Placement remains fully non-rewarding and does not advance the learning streak.

Legacy score-keyed reward history is migrated conservatively to version `1` using the highest previously rewarded score, preventing upgrade-time farming.

## Checks
- `node --check site/shared/js/gamification.js` — PASS.
- `node --check tests/e2e/accessibility.spec.js` — PASS.
- Direct Node runtime assertions for first completion, score cycling, improvement, version change, missing identity, and placement — PASS.
- Full Vitest suite could not run because npm dependencies could not be installed in-session (transport timeout).

## Next agent
Keep later gamification work on top of the quiz-version reward ledger; do not reintroduce score-based reward signatures.
