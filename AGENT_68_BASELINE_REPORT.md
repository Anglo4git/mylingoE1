# Agent 68 — Baseline + Quality Contract Freeze

## Frozen production contract
Canonical policy: `quality_contract.json`.

The freeze records the audit rules that must not drift silently:
- Per-quiz correct-answer position dominance: warning at **>=80%**, only when a quiz has **>=5** questions.
- Dataset-wide correct-answer position dominance: warning at **>=70%**, only when at least 10 answered rows exist.
- Correct-answer indexing remains canonical **1-based**.
- Position randomization must be deterministic (`sha256(quiz_id:question_number)`), preserve question/answer meaning, and only permute answer slots.
- Explanation duplication (`CQ-D02`) remains a review signal; repeated explanations are not automatically incorrect.
- Answer-length clue review remains `CQ-C06`/`CQ-C07` with the existing 18-character / 1.8x clue threshold.
- Every production row must retain canonical CEFR level and quiz category.

## Pre-change baseline (Agent 67 artifact)
- 300 questions / 60 quizzes.
- `CQ-B05`: **60 warnings** (every quiz had one position at 100%).
- Global correct-position distribution: position 1 = 115, position 2 = 160, position 3 = 25; no `CQ-B06` because the global maximum was 53.3%, below 70%.
- Other observed signals: `CQ-C06` 10 warnings, `CQ-C07` 5 info, `CQ-D02` 60 info.

## Post-freeze migration result
Agent 69 applies the frozen deterministic slot-balancing contract to the existing canonical dataset. No question text or answer set is changed; only answer order and the corresponding 1-based `correct_index` may change.

Post-migration QA: **0 errors, 10 warnings, 65 info; score 93/100**.
`CQ-B05` and `CQ-B06`: **0**.
Global correct-position distribution: 1 = 70, 2 = 71, 3 = 75, 4 = 84 (max 28%).

This report is the baseline/freeze record; it is not a claim that all remaining content-quality review signals are resolved.
