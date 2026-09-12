# MYLINGO v54 — MASTER HANDOFF: 14 FREE-TIER AGENTS
## Quality, Release Hygiene, Content Diversity & Final Consistency

**Input package:** `MYLINGO_v53_AGENT67_FINAL_INTEGRATION_GATE.zip`
**Input audit:** latest audit supplied by the user.

### Current verified baseline
- 63 Python tests pass.
- All JS files pass `node --check`.
- `build.py validate` is clean.
- Offline-pack/manifest references resolve.
- PWA icon references, placement index, pack dependency graph, quiz IDs and CSV↔JSON parity are consistent.
- `content_qa.py --strict`: **88/100, 0 errors, 70 warnings**.
- Remaining audit findings: stale `dist-release/`; CQ-B05 answer-position pattern; CQ-D02 repeated explanations; CQ-C06 answer-length tells; A1/A2 category imbalance; duplicate/reference authoring HTML.

## Mission
Fix **every finding in the audit** and convert the fixes into durable production gates so the problems cannot return when content scales toward 12,000 quizzes × 100 questions.

**Do not weaken QA to obtain a green score. Fix the underlying data, generator, authoring workflow, or gate.**

## Required final state
1. Strict Content QA = **0 errors, 0 warnings** for release content.
2. Correct-answer positions have controlled diversity and cannot be fixed to one position for every question in a quiz unless an explicitly documented exception applies.
3. Explanations are question-specific; repeated boilerplate is rejected.
4. Correct-answer length is not a systematic clue; legitimate exceptions are documented and bounded.
5. CEFR/category coverage follows a machine-readable content policy; A1/A2 are no longer unintentionally 100% Grammar.
6. Only one live authoring application exists in the shipped package; reference/archive material is clearly excluded or relocated.
7. `dist-release/` is never treated as source truth. It is deleted before release and regenerated from source by the release process.
8. Release artifacts are reproducible and stale artifacts cannot silently ship.
9. Existing Agents 48–67 scale protections remain intact.
10. Final gate verifies content, code, manifests, packs, generated output and package cleanliness.
11. A final report gives exact commands, measured results, remaining browser-only checks, and READY/NOT READY.

## Agent execution order
| Agent | Focus | Priority |
|---|---|---|
| 68 | Baseline + quality contract freeze | P0 |
| 69 | Correct-answer position diversity | P0 |
| 70 | Question-specific explanation quality | P0 |
| 71 | Answer-length / distractor clue control | P1 |
| 72 | CEFR/category coverage policy + A1/A2 correction | P1 |
| 73 | Cross-question/content diversity regression gates | P1 |
| 74 | Authoring duplicate/reference cleanup | P1 |
| 75 | `dist-release` source/artifact hygiene | P0 |
| 76 | Strict QA warning-to-blocking policy | P0 |
| 77 | Content-generation pipeline enforcement | P0/P1 |
| 78 | Scale regression benchmarks + bounded QA | P1 |
| 79 | Release/browser verification wiring | P1 |
| 80 | Clean rebuild + package integrity audit | P0 |
| 81 | Final integration + consistency gate | P0 |

## Dependency rules
- Agents 69–73 depend on Agent 68's canonical quality contract.
- Agent 77 must consume the canonical rules from 69–73 and prevent bad rows from being promoted.
- Agents 75–76 must not bypass strict QA or reintroduce generated-output drift.
- Agent 78 must verify that quality fixes do not undo the 1.2M-scale architecture from Agents 48–67.
- Agent 80 must build from a clean tree, not from an existing `dist-release/` directory.
- Agent 81 is the only final integrator and must not start until 68–80 are complete.

## Free-tier guardrails
Each agent:
- inspect only the named files first;
- change 1–3 production files where practical;
- avoid repository-wide rewrites;
- do not generate thousands/millions of questions;
- do not weaken existing scale safeguards;
- run focused tests first;
- stop once acceptance criteria pass;
- hand off in ≤200 words with files changed, tests, result, and known limitation.

## Shared contracts
- Runtime truth > documentation.
- One canonical schema; legacy aliases only at boundaries.
- Strict production QA is the release truth.
- Content-quality policy must be machine-enforced, not merely documented.
- Generated artifacts are disposable and must never become source truth.
- Category coverage policy must be explicit; do not force artificial diversity where pedagogically inappropriate.
- Randomization must be deterministic/reproducible when seeded, while avoiding answer-position patterns.
- Semantic quality checks must distinguish legitimate repeated forms from actual template duplication.

## Final definition of done
`source → canonical content contract → authoring/generation safeguards → strict QA → clean build → pack/index verification → browser checks → clean package → final consistency report`

### Required final verdict
**READY** only if all P0/P1 acceptance tests pass and strict QA reports zero warnings/errors. Otherwise **NOT READY** with exact blockers.
