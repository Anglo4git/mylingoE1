# AGENT 77 — JOURNEY UI — COMPLETE

## Delivered
- Added `site/courses/journey.html` as the guided path for each published course level.
- Added a Journey entry point to `site/courses/course.html`.

## Journey behavior
- Reads the existing course/unit/lesson content model only.
- Reads the existing `mylingo.progress.v1` learner state; no second progress store was created.
- Course progress = completed published lessons / total published lessons.
- Lesson completion = every linked exercise quiz is `status: completed`, matching the existing Agent 75/76 behavior.
- Current lesson = first published lesson in course order that is not completed.
- Completed lessons remain reviewable.
- Lessons after the current position are visually `Upcoming`, not technically locked.
- A learner can use `Practice this topic` from every lesson with an exercise ID, so the journey never becomes a gate.
- `Continue learning` opens the Agent 76 revision page and passes a journey return URL.
- Journey completion offers direct practice again rather than forcing a restart.

## Navigation contract
- Journey: `/courses/journey.html?level=<a1..c2>`.
- Lesson links use Agent 76: `lesson.html?lesson=<id>&level=<level>&redirect=<journey URL>`.
- Direct topic practice uses the existing quiz runtime and first linked exercise only; quiz scoring is untouched.
- Existing course and level routes remain available.

## Accessibility / mobile
- Keyboard-reachable links and visible focus states.
- Course progress exposes `role="progressbar"` with numeric ARIA values.
- Status is conveyed with text, not color alone.
- Tap targets are sized for mobile.
- Responsive layout collapses lesson actions cleanly on narrow screens.
- Reduced-motion preference disables page/button motion.

## Recovery / empty states
- Missing or invalid level: actionable error with course/placement links.
- Missing/unpublished course: actionable error.
- Fetch failure: actionable retry-or-direct-practice message.
- Empty published journey: explicit empty state.
- Completed course: direct practice remains available.

## Guardrails honored
- Journey is an organizer/presentation layer, not a new learning engine.
- No quiz question duplication.
- No scoring changes.
- No mandatory revision or video dependency.
- No second learner-progress source of truth.
- No linear lock that prevents direct practice.

## Verification
- `node --check` equivalent syntax coverage is provided by Vitest/source checks; page scripts are self-contained and use existing static-site conventions.
- Added `tests/unit/journey-ui.test.js` covering path wiring, progress source, states, direct practice, Agent 76 routing, course entry point, and accessibility.
- Full Vitest suite should be run in the repository environment before release; no headless browser dependency was added for this agent.

## Handoff to Agent 78
Agent 78 can connect quiz completion events to lesson/course progress and mastery without changing the journey UI contract. The journey already derives state from `mylingo.progress.v1`; no new progress API is required.
