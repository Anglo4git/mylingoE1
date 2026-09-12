# Handoff — after Agent 109

## State of the package

Functionally identical to `MYLINGO_v108_RELEASE_PACKAGE_AUDIT.zip`. The
only addition is `AGENT_109_CONTENT_EXPANSION.md`. No course content, code,
or site output was changed — a trial expansion was built, tested, found to
conflict with an existing regression gate, and reverted rather than shipped
half-verified. See that file for the full investigation.

## What's actually blocking 96/97 (content expansion)

`test_course_content_mapping_agent74.py::test_shipped_content_matches_fresh_generation`
requires `course_content/*.json` to exactly equal a fresh, from-scratch run
of `map_quiz_catalog.py` (deterministic, 1 quiz → 1 lesson, no hand
authoring). That's incompatible, by design, with adding curated
revision/mixed lessons — which is what "content expansion" actually means
in the 109 brief. This isn't a bug to patch quietly; it's a real fork in
the road:

- Extend `map_quiz_catalog.py` so new lessons are generated, not
  hand-written (keeps the drift guard, generator becomes more complex), or
- Deliberately relax `test_shipped_content_matches_fresh_generation` to
  allow a "baseline (generated) + additions (curated)" split, with a new
  test that only checks the baseline never drifts, or
- Decide 96/97 is out of scope for this release and update the release
  gate criteria (Agent 118's checklist) to reflect that explicitly instead
  of leaving it an open TODO forever.

Whoever picks this up should make that call deliberately — it's a schema/
process decision, not a content-writing task.

## What is NOT done (be honest about this at 118)

Agents 110 (quiz coverage), 111 (journey integration), 112 (quiz screen
audit), 113 (renderer coverage), 114 (route audit), 115
(accessibility/mobile), 116 (regression audit), 117 (forensic audit), 118
(release gate) were **not started** in this pass. This handoff only covers
109. Also flagging for whoever runs 112–115/118: this environment has no
network and no real browser, so any of those agents run in an identical
sandbox cannot honestly claim live-browser or axe-core verification either
— that will need to happen in an environment with those tools, or be
explicitly logged as "PASS WITH TOOLING LIMITATION" per the master
handoff's own rule, never a silent/fake PASS.

## Verified in this pass (reproducible)

```
python3 course_schema.py validate --content-dir course_content --master-source master_source.csv
python3 course_content_qa.py
python3 audit_course_mapping.py
python3 content_qa.py --input master_source.csv
python3 -m unittest test_course_schema_agent73 test_course_content_mapping_agent74 test_course_content_qa_agent83
find . -name "*.js" -exec node --check {} \;
```
All clean / PASS on the shipped v109 package.
