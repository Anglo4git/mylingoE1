# Mylingo Milestone 6 — Content QA at Scale

## Objective

Create a deterministic, batch-friendly content-quality gate that can audit the
Mylingo master dataset as it grows from the current starter set to hundreds or
thousands of quizzes without changing the canonical quiz schema, runtime routes,
or generation/build semantics.

The QA layer is deliberately separate from `build.py` validation:

- **Build validation** answers: “Can this row be safely generated into runtime JSON?”
- **Content QA** answers: “Does this content look review-ready, and what should a human review next?”

The content QA layer must never pretend to prove pedagogical correctness or
official CEFR alignment from deterministic text heuristics alone.

## Deliverables

### 1. `content_qa.py`

Dependency-free Python CLI/module that accepts the canonical `master_source.csv`
(or the supported `.xlsx` input) and produces:

- `CONTENT_QA_REPORT.md` — human review report
- `content_qa_report.json` — machine-readable report
- `content_qa_issues.csv` — sortable issue queue for authoring/review workflows

Command:

```bash
python3 content_qa.py --input master_source.csv --out-dir content_qa
```

Production gate:

```bash
python3 content_qa.py --input master_source.csv --out-dir content_qa --strict
```

Diagnostic mode is the default. Strict mode changes only the severity of
explicit production-threshold checks; it does not modify source data.

### 2. `tests/unit/test_content_qa.py`

Unit coverage for the public audit behavior and all high-risk rule families.
Tests must run with standard-library `unittest`; they must not depend on Vitest,
Playwright, a browser, or an external model/API.

### 3. `content_qa/` baseline report

Run the audit against the actual `master_source.csv` so the next agent can see
real findings instead of only fixture results.

### 4. `package.json`

Expose the diagnostic audit through:

```bash
npm run audit
```

This is convenience tooling only; the static site still has no production
bundler requirement.

## QA rule contract

Severity semantics:

- **error** — content is clearly unsafe or internally contradictory; production
  promotion should stop.
- **warning** — strong review signal; may be acceptable after human review.
- **info** — useful pattern/triage signal, never a promotion blocker.

### Structural/content correctness

| Rule | Severity | Purpose |
|---|---|---|
| `CQ-S01` | error | Missing question text |
| `CQ-S02` | warning / strict error | Missing explanation |
| `CQ-A01` | error | Fewer than 2 answer options |
| `CQ-A02` | error | More than 9 answer options |
| `CQ-A03` | error | Duplicate answer options after normalization |
| `CQ-X01` | error | Explicit explanation answer claim conflicts with marked answer |
| `CQ-S03`–`CQ-S05` | error | Obvious executable HTML/URL payloads in answer, explanation, or question content |

### Linguistic/review heuristics

| Rule | Severity | Purpose |
|---|---|---|
| `CQ-C01` | warning | Question is unusually short |
| `CQ-C02` | warning | Question exceeds the default length threshold |
| `CQ-C03` | warning | Missing terminal punctuation where a normal sentence is expected |
| `CQ-C04` | warning | Repeated adjacent word |
| `CQ-C05` | warning | Repeated spaces |
| `CQ-C06` | warning | Correct answer is much longer than distractors; possible test-taking clue |
| `CQ-C07` | info | Answer options have inconsistent capitalization shape |
| `CQ-C08` | warning / strict error | Explanation is shorter than the review threshold |
| `CQ-C09` | warning | Explanation is unusually long |

### Duplication and scale checks

| Rule | Severity | Purpose |
|---|---|---|
| `CQ-D01` | error within quiz / warning across quizzes | Detect exact normalized duplicate questions |
| `CQ-D02` | info | Detect heavily reused explanations for copy/paste review |
| `CQ-D03` | warning | Detect very high-similarity questions within the same level/category |

### Quiz-level checks

| Rule | Severity | Purpose |
|---|---|---|
| `CQ-B01` | warning / strict error | Quiz contains fewer than the production target of 5 questions |
| `CQ-B02` | error | Empty quiz title |
| `CQ-B03` | error | Unknown level |
| `CQ-B04` | error | Empty category |
| `CQ-B05` | warning | Correct answer position dominates one quiz at >=80% |
| `CQ-B06` | warning | Correct answer position dominates the dataset at >=70% |

## Defaults

- CEFR levels: `A1`–`C2`
- Production quiz target: **5+ questions**
- Supported answer count: **2–9**
- Question warning threshold: **220 characters**
- Explanation review threshold: **20 characters minimum**
- Explanation warning threshold: **350 characters maximum**
- Duplicate normalization is case-insensitive and strips HTML/tag noise and punctuation.
- Near-duplicate checks are candidate-pruned to the same level/category bucket.

All thresholds are CLI-configurable without editing the code.

## Scoring model

The report includes a **quality triage score from 0–100**.

It is explicitly **not** a learner score and **not** a CEFR score.
Repeated instances of one known rule are capped so rollout-stage conditions,
such as many intentionally tiny starter quizzes, do not collapse the score to
zero while still appearing in the issue queue.

The score is intended for prioritization only. Promotion decisions use the
error/warning policy, not the score alone.

## Production workflow

Recommended content pipeline:

```text
raw authoring / generation
        ↓
canonical master_source.csv
        ↓
`python3 build.py validate`
        ↓
`python3 content_qa.py`          (diagnostic during authoring)
        ↓
human content review
        ↓
`python3 content_qa.py --strict` (promotion gate)
        ↓
`python3 build.py build`
        ↓
`python3 build.py verify-output`
```

A semantic/model review layer can be added later behind this same issue/report
contract, but Milestone 6 does not require an external API or network access.

## Human review boundaries

Deterministic QA is appropriate for:

- duplicates and near-duplicates
- answer-count and answer-index integrity
- obvious answer/explanation contradictions
- suspicious option-shape clues
- repeated explanations
- unsafe markup patterns
- basic length/punctuation hygiene
- quiz-size and coverage signals

Human review remains required for:

- factual accuracy
- naturalness and idiomaticity
- whether a distractor is genuinely wrong
- ambiguity / whether multiple answers could be correct
- pedagogical usefulness
- authentic difficulty
- CEFR appropriateness
- cultural/contextual appropriateness

No rule in this milestone may be described as a certified CEFR judgment.

## Scale requirements

The auditor must:

1. Process the entire input dataset in one run.
2. Produce stable, machine-readable issue records.
3. Use deterministic normalization so repeated runs give equivalent findings.
4. Avoid network/API dependencies.
5. Keep the existing 23-column canonical source schema unchanged.
6. Avoid changing existing quiz URLs or runtime routes.
7. Leave `generation/` behavior unchanged unless a later milestone explicitly extends it.
8. Make review findings easy to sort/filter by code, severity, scope, and reference.

## Acceptance criteria

Milestone 6 is complete when all of the following are true:

- `content_qa.py` audits the actual master source successfully.
- Diagnostic mode exits successfully when only review warnings are present.
- Strict mode exits non-zero when strict errors are present.
- Unit tests cover duplicate answers, duplicate questions, explanation conflicts,
  unsafe content, position bias, strict thresholds, and score saturation.
- JSON and CSV outputs are generated from the same audit result.
- The current starter dataset remains build-valid and route-valid.
- `python3 build.py validate --input master_source.csv` remains **0 errors, 0 warnings**.
- `python3 build.py build ...` and `verify-output` remain clean.

## Non-goals

- Replacing the canonical source schema.
- Rewriting existing quiz content automatically.
- Automatic CEFR certification.
- Calling an LLM or external moderation service.
- Changing the published runtime UX.
- Making content QA a hidden part of the generation process.
