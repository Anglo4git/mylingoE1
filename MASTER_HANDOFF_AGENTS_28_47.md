# MYLINGO v42 — MASTER HANDOFF: 20 FREE-TIER AGENTS

## Starting point
**Input:** `MYLINGO_v41_AGENT27_COMPLETED.zip` + `MYLINGO_v41_CRITICAL_AUDIT.md`.

The audit found 4 P0 blockers and multiple P1/P1+ contract inconsistencies. The goal of Agents 28–47 is to clean, fix, and make the app consistent **without another broad rewrite**.

## Critical audit findings being closed
- `site/sw.js` syntax failure.
- Release gate weaker than strict Content QA.
- Missing root `site/index.html`.
- Contradictory offline/global-cache vs selective-pack behavior.
- Missing offline core file in generated ZIP.
- Authoring validator stale field names.
- Ranking validator rejects valid permutations.
- Hardcoded metadata date.
- Placement evidence not merged.
- Grammar-heavy placement coverage.
- Backup excludes mastery/review/placement/orientation.
- Mastery/review not visible to learners.
- Review scheduler too coarse.
- Multiple “in progress” quizzes but one session store.
- Core quiz-flow E2E absent from CI.
- Accessibility gate semantics too weak.
- XP repeat farming risk.
- Content architecture remains quiz-centric.
- Authoring validation must scale incrementally.

## Execution order
| Agent | Deliverable | Priority |
|---|---|---|
| 28 | Service-worker syntax fix | **P0** |
| 29 | JS syntax release gate | **P0** |
| 30 | Root deployment entry | **P0** |
| 31 | Strict Content QA release gate | **P0** |
| 32 | Offline cache consistency + freshness | **P0/P1** |
| 33 | Offline core package integrity | **P1** |
| 34 | Canonical authoring validation | **P1** |
| 35 | Ranking validation semantics | **P1** |
| 36 | Metadata/date contract | **P1** |
| 37 | Placement evidence merge | **P1** |
| 38 | Placement coverage blueprint | **P1** |
| 39 | Complete learner backup/restore | **P1** |
| 40 | Mastery/review dashboard | **P1** |
| 41 | Review scheduling granularity | **P1** |
| 42 | Multi-session resume | **P1** |
| 43 | Core quiz E2E in CI | **P1** |
| 44 | Accessibility release gate | **P1** |
| 45 | Gamification reward integrity | **P1+** |
| 46 | Content architecture v2 bridge | **P1+** |
| 47 | Authoring scale + final consistency gate | **P1+** |

## Dependency rule
Agents should normally run **in numeric order**. Do not skip P0 agents. Agents 32–33 depend on the service-worker correction. Agents 37–38 depend on the placement contract. Agent 47 is the final integrator and should not begin until 28–46 are merged.

## Free-tier guardrails
Each agent must:
- inspect only the named files first;
- change 1–3 production files where practical;
- avoid repository-wide searches unless the handoff requires one named contract check;
- avoid mass content generation;
- avoid dependency installation unless unavoidable;
- run targeted tests, not the entire test pyramid;
- stop when acceptance criteria pass;
- hand off in under ~200 words.

### Context budget target
Use **one focused task per conversation/agent turn**. The agent should spend the majority of its context on implementation + verification, not explaining the entire product.

## Shared contract priorities
1. **Runtime truth > documentation claims.**
2. **One canonical schema; legacy aliases only at boundaries.**
3. **Production gate must use production QA policy.**
4. **Learner-facing state must match persisted state.**
5. **Offline UI claims must match actual cache behavior.**
6. **Placement claims must match actual evidence.**
7. **Do not scale content until the content hierarchy/type contract is stable.**

## Definition of done for v42 hardening
At the end, the project should have:
- valid runtime JS;
- a real site root;
- a strict content-aware release gate;
- coherent offline pack semantics;
- canonical authoring/build validation;
- trustworthy placement evidence and coverage;
- complete learner-state backups;
- visible mastery/review behavior;
- truthful multi-session resume;
- core learner-flow CI coverage;
- blocking critical/serious accessibility policy;
- bounded gamification rewards;
- a backward-compatible hierarchy/rich-question content contract;
- scalable authoring validation;
- one final consistency report.

## Final handoff requirement
Agent 47 must create/update `V42_CONSISTENCY_REPORT.md` with:
- P0/P1/P1+ status,
- exact commands run,
- remaining browser-only checks,
- any accepted limitations,
- recommendation: **READY / NOT READY**.
