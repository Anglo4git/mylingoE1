# Agent 19 Completion — Skill-Level Recommendations

## Delivered

Agent 19 adds deterministic, skill-specific practice-level recommendations on top of Placement Blueprint v2.

### Recommendation engine
- Added `site/shared/js/recommendations.js` with a small, dependency-free runtime API.
- A skill is eligible only when at least 2 questions contributed to its placement percentage, matching the v2 sparse-skill rule.
- Per-skill target levels are deterministic:
  - 0–59.99% → one level below the overall base level (clamped to A1).
  - 60–79.99% → overall base level.
  - 80–89.99% → overall base level for reinforcement.
  - 90–100% → one level above the overall base level (clamped to C2).
- Base level is `recommended_level`, falling back to `assessed_level`.
- Recommendations are ranked weakest-first, capped at three by default.
- `usage` resolves to the existing Grammar category for content compatibility.
- A separate resolver matches recommendations only to real quiz entries in supplied level manifests; missing categories are skipped without creating broken links.

### Learner-facing runtime
- Updated `site/shared/quiz.html` to load the shared recommendation engine.
- Placement results now render a **Skill-level recommendations** section with the skill score and target CEFR level alongside resolved quiz links.
- The existing overall placement decision, boundary verification, placement URLs, localStorage keys, and generic suggestion flow remain unchanged.

### Offline support
- Added `site/shared/js/recommendations.js` to the service-worker precache list.

### Documentation/tests
- Added `10_SKILL_LEVEL_RECOMMENDATIONS.md` as the executable milestone contract.
- Added `tests/unit/skill-level-recommendations.test.js` covering score bands, A1/C2 clamping, sparse-skill suppression, weakest-first ranking, catalog fallback, usage→Grammar mapping, missing catalog entries, and malformed profiles.

## Verification

- `node --check site/shared/js/recommendations.js` — passed.
- `node --check site/sw.js` — passed.
- All 6 inline JavaScript blocks in `site/shared/quiz.html` passed `node --check`.
- Direct Node VM smoke test with the actual six-level `quizzes.json` manifests — passed; valid recommendations resolved to real quiz IDs and catalog gaps were skipped.
- `python3 tests/unit/test_content_qa.py -v` — **16/16 passed**.
- `python3 -m unittest discover -s tests/unit -p 'test_*.py' -v` — **16/16 passed**.
- `python3 build.py validate --input master_source.csv` — **60 rows, 60 quizzes, 0 errors, 0 warnings**.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent19-build` — **66 data files written**.
- `python3 build.py verify-output --out /tmp/mylingo-agent19-build` — **0 errors, 0 warnings**.
- `npm test` remains unavailable because `vitest` is not installed in the supplied package (`vitest: not found`), consistent with the checkpoint limitation.

## Files added
- `10_SKILL_LEVEL_RECOMMENDATIONS.md`
- `site/shared/js/recommendations.js`
- `tests/unit/skill-level-recommendations.test.js`
- `AGENT_19_COMPLETION.md`

## Files changed
- `site/shared/quiz.html`
- `site/sw.js`
- `HANDOFF.md`

## Do not change
- Placement Blueprint v2 decision thresholds/state machine.
- Existing placement URLs and six canonical placement quiz IDs.
- Existing localStorage key names.
- Legacy quiz schema.
- Manifest resolution behavior.

## Handoff

The recommendation engine is ready to consume richer item-bank coverage. As more level/category manifests become populated, recommendations will automatically resolve to more skills without changing the API or placement state machine.
