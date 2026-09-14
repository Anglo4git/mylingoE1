# MyLingo placement engine

MyLingo has two placement experiences: a short orientation and the final 120-question level assessment.

## 120-question final assessment

The final assessment is **strictly capped at A1–B1**. It cannot automatically assign B2, C1, or C2, regardless of score.

- **120 questions total**
- **40 A1 questions**
- **40 A2 questions**
- **40 B1 questions**
- **70% mastery threshold per band**
- Progression is sequential: A1 must be mastered before A2 can be awarded; A1 and A2 must both be mastered before B1 can be awarded.
- All 120 questions are uniquely identified and shuffled so level bands are not exposed by question order.

Result rules:
- A1 below 70% → **A1**
- A1 ≥70%, A2 below 70% → **A2**
- A1 ≥70%, A2 ≥70%, B1 below 70% → **A2**
- A1 ≥70%, A2 ≥70%, B1 ≥70% → **B1**

The result is a starting level for MyLingo, not an official CEFR certification.

## Quick orientation

The short orientation is only a guide. Its estimate is also capped to A1–B1 and does **not** replace the 120-question assessment.

## Legacy placement helpers

The shared placement utilities still contain broader A1–C2 support because they are used by legacy/manual flows. They must not be used to override the final `placement-120` result. The 120-question result is handled by `calculate120Placement()` and remains capped at B1.

## Score bands

For general/legacy assessments:
- 90–100: Strong
- 80–89: Secure
- 60–79: Developing
- 40–59: Weak
- 0–39: Very weak

These are MyLingo product thresholds, not official CEFR certification.

## Skill metadata

Allowed `skill` values are `grammar`, `vocabulary`, `reading`, `listening`, `writing`, and `usage`. `difficulty` is 1–5. `estimated_time_seconds` is positive. `cefr` may be A1–C2 for legacy content metadata; this does not change the A1–B1 ceiling of the final 120-question assessment.
