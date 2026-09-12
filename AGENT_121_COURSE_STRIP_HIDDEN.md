# AGENT 121 — Quiz Screen Course-Strip Hidden

## Change

`.course-strip` (the light-blue course/unit context bar shown above the
quiz card when a lesson is reached via the course flow) is now forced
hidden (`display:none !important` on both base and `.visible` states) in
`site/shared/quiz.html`. The element and its underlying course/unit
title data (`courseTitleParam`/`unitTitleParam`, `renderCourseStrip()`)
are left in place, unrendered — course/unit identity still survives into
the quiz via URL/query parameters (Agent 111's journey-integration tests,
unaffected), only the visual banner is suppressed.

## Files changed

- `site/shared/quiz.html` (CSS only)

## Tests

- `python3 build.py build --src-root .` / `verify-output` / `release-gate`: all PASS, 0/0.
- `python3 -m unittest discover -p "test_*.py"` (root + generation/): 128/128 OK.
- `python3 -m unittest discover -s tests/unit -p "test_*.py"`: 105/105 OK.
- No test in the repo asserts on `.course-strip` visibility, so none needed updating.

AGENT: 121
STATUS: PASS
FILES CHANGED:
- `site/shared/quiz.html`
- `AGENT_121_COURSE_STRIP_HIDDEN.md` (new, this file)
TESTS: see above
RESULTS: all green
KNOWN LIMITATIONS:
- No browser in this environment to visually confirm; verified by reading the rendered CSS rule and confirming no test depends on the strip's visibility.
NEXT AGENT: none
RELEASE BLOCKERS: none
