# Review Scheduling MVP

## Purpose

Milestone 12 adds a small, deterministic review scheduler on top of the skill-mastery evidence model. It creates the next review date for each skill after a completed learning quiz, while leaving placement, scoring, recommendations, and the quiz schema unchanged.

## Storage contract

- Key: `mylingo.review-scheduling.v1`
- Version: `1`
- Best-effort localStorage; malformed or incompatible storage falls back safely to an empty model.
- Only explicitly tagged graded questions with boolean correctness contribute.
- Placement assessments are not scheduled as learning reviews.

## Card shape

```json
{
  "version": 1,
  "updated_at": 1760000000000,
  "skills": {
    "grammar": {
      "interval_days": 7,
      "consecutive_successes": 2,
      "last_accuracy": 86.67,
      "last_review_at": 1760000000000,
      "due_at": 1760604800000,
      "last_quiz_id": "b1-010",
      "last_level": "b1"
    }
  }
}
```

## MVP interval rules

Per-attempt skill accuracy chooses a base interval:

- 0–59% → 1 day
- 60–79% → 3 days
- 80–89% → 7 days
- 90–100% → 14 days

When a skill is already on a successful streak (80%+), the prior interval may double, capped at 30 days. A result below 60% resets the streak and returns to a 1-day interval.

The scheduler is intentionally deterministic and does not claim to be a clinical or research-grade spaced-repetition algorithm.

## Runtime API

`site/shared/js/review-scheduler.js` exposes:

- `recordAttempt(input, store)` — pure scheduling update.
- `recordAndPersist(input)` — update and persist local state.
- `getSkill(store, skill)` — one skill's schedule card.
- `getDueSkills(store, now)` — due skills ordered by earliest due time.
- `getNextReview(store)` — earliest scheduled review.
- `isDue(card, now)` — due check.
- `validateStore(store)` — invariant check.
- `accuracyBand()` / `calculateNextInterval()` — deterministic scheduling rules.

## Integration rule

The shared quiz runtime records a schedule after normal learning quizzes complete. Placement mode is excluded. Scheduling failures remain isolated so they cannot prevent quiz completion or alter existing results.
