# MYLINGO — AGENT 09 COMPLETION

## Scope completed
Gamification Fairness + Local-Day Fix.

## Production files changed
- `site/shared/js/gamification.js`
- `site/shared/quiz.html`
- `tests/unit/gamification.test.js`

## Exact reward rules
1. A first qualifying normal-learning quiz attempt earns the existing XP formula unchanged: `10 XP × correct answers`, plus `20 XP` for a perfect score.
2. A repeated attempt is identified by the stable tuple `quizId + correct + total`. If that same tuple has already been rewarded in the most recent 20 normal-learning reward signatures, the repeat earns **0 XP**.
3. A different result on the same quiz has a different signature and can earn XP normally.
4. Placement attempts (`mode=placement`) earn **0 XP**, do **not** change the learning streak, and do **not** change `lastActiveDate`.
5. Reward signatures are capped at 20 to keep the gamification record small. The existing `recordSession(correct,total,now)` API remains valid; metadata is optional.
6. The streak calendar key uses the browser's learner-local calendar (`getFullYear/getMonth/getDate`) rather than `toISOString()`/UTC. `todayStr(date, timeZone)` also supports deterministic timezone tests via `Intl.DateTimeFormat`.

## Compatibility
- Existing XP constants and return fields remain intact.
- Existing callers using three `recordSession` arguments continue to work.
- `mylingo.gamification.v1` remains the storage key; the new reward-signature field is additive.
- Agent 08's backup envelope continues to carry the entire gamification object without schema breakage.

## Verification
- `node --check site/shared/js/gamification.js`: PASS
- Extracted `site/shared/quiz.html` inline JavaScript syntax check: PASS
- Standalone Agent 09 smoke tests: PASS
  - first qualifying attempt gets normal XP
  - identical repeat gets 0 XP
  - different result can earn XP
  - placement does not alter XP/streak/date
  - timezone-aware local-day conversion works across UTC midnight
- `python3 build.py validate --input 'data structure orientation for auditoring/#master_source (the current data structure).csv'`: 60 rows, 60 quizzes, 0 errors, 0 warnings
- `python3 build.py build ...`: 66 data files written
- `python3 build.py verify-output ...`: 0 errors, 0 warnings
- Vitest was unavailable because `node_modules/.bin/vitest` is not installed in this environment.

## Handoff to Agent 10
Preserve the optional fourth `recordSession(..., {quizId, mode})` metadata and the additive `rewardedSessions` state. Do not revert local-day logic to UTC-only `toISOString()`.
