# Agent 219 Handoff — placement.js: 2 new equivalents confirmed (1 Class B variant, 1 Class A variant — two genuinely new sub-patterns) in `readStored` and `calculateResult`; against the CURRENT 954-test suite; no source or test file changed; 954 tests unchanged

## Context
Continued `HANDOFF_AGENT_218.md`'s "Next agent — start here" instruction #2: read `mergePlacementEvidence`'s `add()` helper, `buildEvidence`, `calculateResult`, `finalizeVerification`, `timestampOf`, and `readStored`/`writeStored` line-by-line for Class A, Class B, or a new class.

## Method (unchanged from Agents 213–218)
Hand-apply a candidate mutation, run the full `tests/run.js` suite, check whether the only failure is the `offline/packs/core.zip ... byte-identical` identity check (true false-kill for core-manifest files only), then revert and re-confirm the 954-passed baseline before trying the next candidate. Baseline (954/0) confirmed at session start and re-confirmed after every mutation.

## Findings

### 2 new equivalents confirmed — two new sub-patterns, neither pure Class A nor pure Class B

| Location | Mutation tried | Result | Why it's equivalent |
|---|---|---|---|
| `readStored` (~417) | Dropped `!value \|\|` from `if (!value \|\| typeof value !== 'object') return null;`, leaving only `if (typeof value !== 'object') return null;` | **953 passed, 1 failed (identity only) → equivalent** | `typeof null === 'object'`, so the shortened guard lets a JSON `null` value fall through. But the very next line, `value.recommended_level`, then throws a `TypeError` on the null — and the whole function body is wrapped in the outer `try { ... } catch (e) { return null; }`. The catch swallows that throw and returns `null` anyway, so the explicit `!value` check and the implicit exception path produce the identical observable result. **New sub-pattern: a guard made redundant by an enclosing try/catch turning the "impossible" bypass into a caught exception with the same return value — not an earlier branch (Class B) and not a literal same-value reassignment (Class A), but a third mechanism worth naming explicitly.** |
| `calculateResult` (~375) | Changed `mergePlacementEvidence(input.evidence, [])` to `mergePlacementEvidence(input.evidence)`, dropping the explicit `[]` second argument | **953 passed, 1 failed (identity only) → equivalent** | `mergePlacementEvidence(primary, verification)` only ever does `(Array.isArray(verification) ? verification : []).forEach(add)`. `Array.isArray(undefined)` is `false`, so an omitted second argument is handled identically to an explicitly-passed `[]` — the ternary already guards it. **New sub-pattern: a redundant explicit default argument whose value merely restates what the callee already does for `undefined` — a variant of Class A (same-value redundancy) but at a call site rather than a post-init reassignment.** |

Both reverted immediately after confirming, baseline re-checked (954/0) before moving to the next candidate. Tried in sequence, not simultaneously — each isolated and re-verified against a clean 954/0 baseline before the next.

### Rejected (real-kill) candidates tried this session — do not re-try
| Location | Mutation tried | Result |
|---|---|---|
| `buildEvidence` (~220) | Dropped `typeOf(q) === 'banner' \|\|` from the guard, leaving only `typeof map[index] !== 'boolean'` | 950 passed, 4 failed → **real kill, not equivalent** (a banner question can apparently still line up with a boolean in `map[index]` in some tested case, so the banner check is load-bearing, not implied by the map-type check) |
| `calculateResult` (~373) | Dropped the `\|\| questions.filter(...).length` fallback from the `graded` computation, leaving only `count(input && input.graded_questions)` | 950 passed, 4 failed → **real kill, not equivalent** (some tested caller omits `graded_questions` and relies on the question-count fallback) |
| `finalizeVerification` (~161) | Dropped the `verification.reason === 'score_in_band' ? 'verified_boundary' : ...` remap, leaving plain `reason: verification.reason` | 951 passed, 3 failed → **real kill, not equivalent** (verification-stage `'score_in_band'` must surface as `'verified_boundary'`; this is tested) |

### No further candidates found this pass
- `mergePlacementEvidence`'s `add()` helper: every field in the "new id" `copy` object and every update in the "existing id" branch changes a value that could genuinely differ from its prior state (quiz_id/quiz_ids accumulate, skill fills in only when previously empty, stages accumulate, correct is deliberately never overwritten per the existing in-code comment). No redundant reassignment or guard-implied-by-earlier-logic found beyond the two confirmed above.
- `buildEvidence`: re-inspected fully; only the banner-guard candidate above was found, and it's a real kill. `sourceQuizId`, `sourceStage`, `map`, and `questionId` computations are each used exactly once for a genuine purpose.
- `finalizeVerification`: only the `reason` remap was a plausible candidate; it's a real kill. Every other field is a single straightforward pass-through/derivation.
- `timestampOf`: single-expression function, no candidate structure at all.
- `writeStored`: single `try`/`catch` around one `setItem` call, no guard or reassignment to test.

## Tests: 954 -> 954 (no change; this pass only ran the existing suite against temporary, reverted mutations)

## Cache / pack
No source file changed. `CACHE_VERSION` stays `mylingo-v27`. Full suite confirmed 954 passed / 0 failed with the tree byte-identical to Agent 218's zip (`diff -rq` against Agent 218's extracted zip confirmed clean at session end, excluding the handoff file itself).

## Files changed vs Agent 218 zip
None (only `HANDOFF_AGENT_219.md` added).

## Not done / carried forward
- Item 1(a) backlog progress so far (cumulative across Agents 213–219): 7 of the 10 files touched — runtime-content-loader.js (1/1), skill-mastery.js (1/8), mastery-review-ui.js (1/7), offline-packs-ui.js (1/38), offline-packs.js (1/19), orientation.js (pin claim re-validated), **placement.js (23/51 spot-checked/confirmed: Class C fully swept at 12/12, plus 2 Class A + 1 Class B from Agents before 217 + 3 Class B from Agent 217 + 2 Class A from Agent 218 + 2 new equivalents this session (1 try/catch-guard variant, 1 default-argument variant) = 10 confirmed-equivalent outside Class C, and 8 tried-and-rejected real-kill candidates total across sessions — see rejection tables in Agent 216's, 217's, and this handoff's findings)**. `resolvePlacement`, `validateQuestionMetadata`, `calculateSkillProfile`, `calculateEvidenceSkillProfile`, `mergePlacementEvidence`, `buildEvidence`, `calculateResult`, `finalizeVerification`, `timestampOf`, `readStored`, `writeStored` are now all read closely with no further candidates found by inspection. **Still untouched this backlog:** recommendations.js (13), review-scheduler.js (16), runtime-v2-adapter.js (12), the remaining 28 of placement.js's 51 (likely requires re-reading `decideAssessmentPath`, `decideVerificationPath`, `normalizeLevel`, `adjacentLevel`, `scoreBand`, `pct`, `count`, `idString`, `skillOf`, `typeOf`, `normalizeStage`, `unique`, `numeric`, and `validatePlacementBlueprint` — the small helper/utility functions not yet individually swept this session — or accepting that placement.js may be close to exhausted and moving to a fresh file), the remaining 7 of skill-mastery.js's 8, 6 of mastery-review-ui.js's 7, 37 of offline-packs-ui.js's 38, 18 of offline-packs.js's 19.
- Same limitation as Agents 213–218: no access to the original per-file handoff text (203/204/207/208/209/210) this session; verification continues from first principles rather than re-reading the original arguments.
- Decision-gated backlog: unchanged (see Agent 203/210/211/212/213 notes for the full list).
- `tools/mutate.js` still not checked into the shipped tree (Agent 212's suggestion, still open).

## Next agent — start here
1. `decideFromPerformance`, `decideAssessmentPath`, `decideVerificationPath`, `confidenceFor`, `calculate120Placement`, `resolvePlacement`, `validateQuestionMetadata`, `calculateSkillProfile`, `calculateEvidenceSkillProfile`, `mergePlacementEvidence`, `buildEvidence`, `calculateResult`, `finalizeVerification`, `timestampOf`, `readStored`, `writeStored` have now all been read closely across Agents 216–219 with no more obvious candidates found by inspection. **Do not re-try** the 5 documented real-kill candidates from Agent 216/217, the 2 confirmed equivalents from Agent 218 (the two `resolvePlacement` `recommended_level = assessed;` reassignments), or this session's 3 real-kill candidates (the `buildEvidence` banner-guard drop, the `calculateResult` graded-fallback drop, the `finalizeVerification` reason-remap drop) or its 2 new confirmed equivalents (the `readStored` `!value` guard, the `calculateResult` `mergePlacementEvidence(..., [])` explicit-empty-array argument) — already confirmed, no need to re-verify or re-try.
2. Next candidates on placement.js: the small helper/utility functions (`normalizeLevel`, `adjacentLevel`, `scoreBand`, `pct`, `count`, `idString`, `skillOf`, `typeOf`, `normalizeStage`, `unique`, `numeric`, `validatePlacementBlueprint`) have not been individually swept this session — read them line-by-line next for Class A/B/new-class instances. Given three consecutive sessions (217, 218, 219) each found only 2–3 new equivalents in the larger business-logic functions, and this session's new sub-patterns came from try/catch interaction and default-argument semantics rather than the original Class A/B molds, watch especially for guards made redundant by (a) enclosing try/catch blocks, (b) JS coercion quirks (`typeof null`, `Array.isArray(undefined)`, `Number()` of falsy values), and (c) default-parameter/argument omission — these proved more fruitful this session than the original post-init-reassignment or branch-implication patterns.
3. If placement.js's remaining candidates prove slow to find after sweeping the helpers, move to recommendations.js / review-scheduler.js / runtime-v2-adapter.js (12–16 equivalents each) — fresh files, not yet touched at all.
4. Reusable per-file recipe (unchanged): `cp` the file → mutate one candidate with `str_replace`/python replace → `node tests/run.js` → if the *only* failure is the core.zip identity line (core-manifest files only, check `offline/core-manifest.json`) it's not a real kill, i.e. still equivalent → restore → next candidate. If more than the identity line fails, it's a real kill — not equivalent — revert and move on.
5. If picking up the decision-gated backlog instead, it is unchanged and ready.

## Blockers
None new. Carried forward: product decisions for the DECISION backlog; a real device for Agent 203's item 17; the `normalizeQuestion`-throws-on-malformed-question observation (product/refactor call); lack of access to Agents 202-210's original handoff text (noted by Agent 213, still true this session).

## Artifacts
`mylingo-v186-agent219-equivalent-sweep.zip` (byte-identical contents to Agent 218's zip except this handoff file — no source/test changes this pass), `HANDOFF_AGENT_219.md`.

## Resume command
"Resume from HANDOFF_AGENT_219.md. You are Agent 220. Continue from 'Next agent — start here'."
