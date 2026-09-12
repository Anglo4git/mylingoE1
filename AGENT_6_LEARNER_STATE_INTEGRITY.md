# Agent 6 — Learner State / Data Integrity

## Status
COMPLETE

## Trust boundary
Mylingo is a client-side/local learning system. Browser storage and URL parameters are **untrusted input**. Local state is convenience/persistence data, not secure authority.

| State | Source | Writer/reader | Boundary |
|---|---|---|---|
| Progress | localStorage `mylingo.progress.v1` | quiz + course/dashboard projections | Validate IDs, status, scores, counters; reject malformed data safely |
| Quiz sessions | localStorage `mylingo.sessions.v2` / `mylingo.sessions.v3.*` | quiz + backup/restore | Versioned, per-session validation; malformed sessions are ignored |
| XP/streak | localStorage `mylingo.gamification.v1` | gamification + dashboard | Non-negative bounded totals; local values are not authoritative proof of achievement |
| Skill mastery | localStorage `mylingo.skill-mastery.v1` | skill-mastery | Version + skill whitelist + count/accuracy bounds |
| Review schedule | localStorage `mylingo.review-scheduling.v1` | review-scheduler | Version + skill whitelist + interval bounds |
| Placement | localStorage `mylingo.assessment.v1` | placement | CEFR whitelist + score/evidence validation |
| Pending placement | localStorage `mylingo.assessment.pending.v1` | placement | Versioned and validated by existing backup contract |
| Orientation | localStorage `mylingo.orientation.v1` | orientation/placement flow | Versioned and validated by existing backup contract |
| Cache Storage | service worker/offline packs | SW | Content cache only; never learner authority |
| URL parameters | `location.search` | page routing | Whitelist levels; encode generated IDs; unsafe redirects rejected |

## Changes
- Added `site/shared/js/learner-state.js`, a small reusable trust-boundary contract for parsing and validating local learner state.
- Added regression tests for invalid JSON, negative/oversized values, wrong types, malformed placement state, and tampered gamification/mastery state.
- Confirmed the existing backup/restore path already has section-level validators and safe rejection semantics; no backend was invented and no existing storage keys were renamed.

## Verification
- `npx vitest run tests/unit/learner-state-integrity-agent6.test.js`
- Full Vitest suite after Agent 7 changes.
