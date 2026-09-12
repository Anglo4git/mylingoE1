# Placement Blueprint v2

## Purpose

Placement Blueprint v2 turns the existing Mylingo placement behavior into an explicit, versioned decision contract. It is additive: the six existing `placement-001` routes remain valid, the current compact banks remain usable, and the legacy helper APIs are preserved.

## Learner flow

`Orientation → Primary assessment → optional one-level boundary verification → final placement`

Orientation is an estimate, never a measured CEFR result. A high-confidence orientation estimate proceeds directly to the estimated level. Medium- or low-confidence orientation prepares an adjacent level as the only possible verification target.

The primary assessment is a 10-question bank. A completed attempt with fewer than five graded answers is insufficient evidence. At 85% or above, the primary result is an upper-boundary signal; below 50%, it is a lower-boundary signal. Scores from 50% through 84.99% remain at the assessed level.

## Boundary verification

A boundary check is always adjacent to the primary level and can happen only once in a placement run. Verification is evidence about the boundary just tested; it is not permission to silently chain into another CEFR level.

When a verification result is itself at an upper or lower edge (85%+ or below 50%), v2 recommends the verified level and records an edge signal instead of auto-jumping again. This prevents a two-level recommendation from a single unverified inference. A future richer bank can add a deliberate second-stage route without changing the v2 state contract.

## Evidence and confidence

The score is the percentage of graded items answered correctly. The blueprint does not weight answers by difficulty; difficulty remains question metadata for future bank-balancing and audit purposes.

Confidence is derived from evidence quantity, completeness, boundary proximity, and conflicting signals, using the thresholds published on `PLACEMENT_BLUEPRINT_V2.confidence`.

- **Low**: an incomplete attempt, fewer than `medium_min_graded` (5) graded questions, or a conflicting-signals flag on the input. Any of these overrides everything else.
- **Medium**: otherwise, if graded questions are below `high_min_graded` (8), or the score falls in a `near_boundary_margin` (5-point) caution zone below either boundary — i.e. 80–84.99% (approaching the 85% upper boundary) or 50–54.99% (just above the below-50% lower boundary) — or the score is at/past a boundary outright (85%+ or below 50%).
- **High**: at least 8 graded questions, a complete attempt, no conflicting signals, and a score outside the near-boundary caution zone (55–79.99%).

The near-boundary buffer is a confidence-only caution zone: a score of 82% does not trigger upper-boundary verification (that still requires 85%+), but it is close enough to the line that the result is reported as medium rather than high confidence, since a couple of different answers could have crossed it.

## Skill reporting

A skill is reported only when at least two questions in the attempt carry that skill. Sparse skills return `null`. This avoids presenting a one-item result as a reliable skill percentage.

## Blueprint object

The runtime exposes `MylingoPlacement.PLACEMENT_BLUEPRINT_V2` and `validatePlacementBlueprint()`. The executable decision function is `resolvePlacement()`:

- `stage: "primary"` decides whether a boundary verification is needed.
- `stage: "verification"` returns a final recommendation without chaining into another automatic verification.
- `action` is explicit (`complete_more_questions`, `verify_boundary`, `complete`, or `continue_at_verified_level`).
- `reason` is machine-readable (`insufficient_evidence`, `upper_boundary`, `lower_boundary`, `score_in_band`, `verification_upper_edge`, `verification_lower_edge`).

## Compatibility and scope

This milestone does not repack `master_source.csv`, replace the six published placement banks, or change the existing URL format. It establishes the v2 contract and an executable reference implementation so later item-bank expansion can be validated against the same state machine.

## Coverage blueprint (Agent 38)

Placement coverage is now machine-reportable and is intentionally narrower than a claim of full language certification. Each shipped 10-question level bank must contain at least:

- 4 grammar items
- 1 vocabulary item
- 1 reading item
- 1 writing **or** usage item

Listening has a minimum of zero in v2 because the current shipped placement banks contain no language-audio assessment items; the runtime now reports this limitation instead of implying listening coverage. The coverage check is exposed as `MylingoPlacement.coverageReport()` and is executable for all level banks with `npm run placement:coverage`.
