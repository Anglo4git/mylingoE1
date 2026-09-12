# Agent 21 Completion — Review Scheduling MVP

## Delivered

Agent 21 adds a separate deterministic review-scheduling MVP on top of the Agent 20 skill-mastery model.

### Scheduling model
- Added `site/shared/js/review-scheduler.js`.
- Added versioned localStorage key `mylingo.review-scheduling.v1`.
- Stores per-skill interval, consecutive successful attempts, last accuracy, last review time, due time, quiz id, and level.
- Base intervals: 0–59% = 1 day, 60–79% = 3 days, 80–89% = 7 days, 90–100% = 14 days.
- Successful prior intervals can double up to 30 days; <60% resets to 1 day.
- Only explicitly tagged graded questions with boolean correctness contribute.

### Runtime integration
- Shared quiz runtime records schedules after normal learning quizzes.
- Placement assessments are excluded.
- Scheduling failures are isolated and cannot break quiz completion.
- Added scheduler to service-worker precache.

### Runtime API
`MylingoReviewScheduler` exposes `recordAttempt`, `recordAndPersist`, `getSkill`, `getDueSkills`, `getNextReview`, `isDue`, `validateStore`, `accuracyBand`, and `calculateNextInterval`.

### Compatibility
- Placement Blueprint v2 unchanged.
- Skill-Level Recommendations unchanged.
- Skill Mastery Data Model unchanged.
- Existing localStorage keys and quiz schema unchanged.
- No automatic CEFR switching introduced.

### Verification
- Scheduler syntax check passed.
- Scheduler unit tests cover interval bands, evidence filtering, streak growth/reset, due ordering, persistence, and malformed storage.
