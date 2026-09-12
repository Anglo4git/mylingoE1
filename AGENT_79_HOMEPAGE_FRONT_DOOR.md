# AGENT 79 — HOMEPAGE / FRONT DOOR

STATUS: IMPLEMENTED + VERIFIED

## Decision tree
New/unsure learner → **Find my level** → placement flow.
Known level → **Explore by level** → existing level practice.
Returning learner → **Continue learning** → current incomplete lesson.
Topic/goal-first learner → **Practice by goal** → direct level practice.
Guided learner → **Explore courses** → course → unit → lesson → revision → existing quiz engine.

## Routes
- `/main/index.html` — new homepage/front door.
- `/main/placement.html` — preserved placement/orientation experience.
- `/courses/index.html` — course explorer.
- `/courses/lesson.html` — lesson/revision entry.
- Existing `/a1/` … `/c2/` routes remain available for direct practice.

## States
- New user: no saved exercise state; shows a clear start/find-level path.
- Returning user: continuation card resolves from canonical quiz progress/session state.
- Completed work: remains accessible through courses/journey and direct practice; homepage does not create duplicate state.

## UX/accessibility
- Keyboard focus-visible styles and skip link.
- Semantic headings/nav/main/section structure.
- Large touch targets and responsive mobile layout.
- Reduced-motion-safe behavior through simple CSS without required animation.
- No learning dependency on external video/content.

## Product guardrails
Placement is preserved rather than removed. Manual level selection remains first-class. Direct practice is never hidden behind the journey.
