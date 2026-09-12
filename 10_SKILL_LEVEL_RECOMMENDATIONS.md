# Skill-Level Recommendations

## Purpose

This milestone adds deterministic, per-skill practice-level recommendations on top of Placement Blueprint v2. The overall placement level remains authoritative; skill recommendations are a targeted practice plan and may point one CEFR level below or above that overall level.

## Contract

A skill is eligible only when its placement result reports at least two questions for that skill. Sparse skills remain unavailable rather than producing a misleading recommendation.

The recommendation base is `recommended_level`, falling back to `assessed_level`.

| Skill score | Recommendation level | Intent |
| --- | --- | --- |
| 0–59.99% | one level below base, clamped to A1 | Build foundations |
| 60–79.99% | base level | Targeted practice |
| 80–89.99% | base level | Reinforce skills |
| 90–100% | one level above base, clamped to C2 | Stretch skills |

The rule is skill-specific: a learner can receive different target levels for different skills from the same assessment.

A recommendation is resolved to a real quiz only when the caller supplies a manifest containing a quiz in the required skill category at the recommended level. Missing catalog coverage is skipped; no synthetic quiz IDs or broken links are produced.

`usage` maps to the existing `Grammar` category for compatibility with the current content taxonomy. Reading and Listening remain valid skill types even when the current starter catalog has no corresponding quizzes.

## Runtime API

`site/shared/js/recommendations.js` exposes `MylingoRecommendations`:

- `recommendSkillLevels(profile, options)` — deterministic skill targets ranked weakest-first, with a maximum of three by default.
- `recommendationForSkill(skill, score, baseLevel, availableLevels)` — pure per-skill rule evaluation.
- `resolveQuizPicks(recommendations, manifestByLevel)` — resolves recommendations against real quiz manifests.
- `validateProfile(profile)` — lightweight contract check.

## Compatibility

This milestone does not change the Placement Blueprint v2 decision state machine, existing placement URLs, quiz schema, localStorage keys, or overall recommended level. It only enriches the result presentation with skill-specific practice targets.
