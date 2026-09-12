# Skill Mastery Data Model

## Purpose

Milestone 11 adds a versioned, cumulative learner skill-mastery store. It complements Placement Blueprint v2 and Skill-Level Recommendations without changing their decision rules or schemas.

## Storage contract

- Key: `mylingo.skill-mastery.v1`
- Version: `1`
- Storage is best-effort localStorage. Malformed or incompatible data is ignored safely and replaced in memory with an empty model.
- Only completed quiz responses with an explicit supported `skill` and boolean correctness are counted.
- Banner/non-graded items never contribute evidence.
- Untagged legacy questions never create mastery evidence.

## Shape

```json
{
  "version": 1,
  "updated_at": 1760000000000,
  "skills": {
    "grammar": {
      "question_count": 12,
      "correct_count": 10,
      "attempt_count": 3,
      "accuracy": 83.33,
      "mastery_band": "secure",
      "confidence": "medium",
      "level_counts": {"b1": 8, "b2": 4},
      "last_level": "b2",
      "last_quiz_id": "b2-010",
      "last_attempt_at": 1760000000000
    }
  }
}
```

Fields are cumulative per skill. `accuracy` is derived from cumulative correct/question counts, not stored as an independent source of truth. `mastery_band` follows the same 0/60/80/90 thresholds used by the skill recommendation vocabulary, but this model does not choose a quiz or CEFR target.

## Confidence

Confidence is evidence quality, not mastery:

- Low: fewer than 5 questions or fewer than 2 attempts.
- Medium: 5–9 questions or 2–4 attempts.
- High: at least 10 questions and at least 5 attempts.

## Runtime API

`site/shared/js/skill-mastery.js` exposes:

- `recordAttempt(input, store)` — pure cumulative update; does not touch storage.
- `recordAndPersist(input)` — records against the stored model and writes it back.
- `readStored()` / `writeStored(store)` — versioned persistence.
- `getSkill(store, skill)` — normalized skill snapshot.
- `validateStore(store)` — invariant check.
- `masteryBand()` / `confidenceFor()` — deterministic derived rules.

## Integration rule

The quiz runtime records mastery evidence after a completed quiz, using the already computed `answerCorrect` map. Existing score persistence, gamification, placement, recommendations, routes, and quiz schema remain unchanged. If the mastery module is unavailable or storage fails, the quiz still completes normally.
