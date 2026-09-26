# Agent 225 Handoff — offline-packs-ui.js: formal mutation pass, 3 real-kills confirmed; no source/test changes; baseline remains 967 passed / 3 failed

## Context
Resumed from `HANDOFF_AGENT_224.md` as Agent 225. The recommended next target was `shared/js/offline-packs-ui.js` (155 lines), followed by `offline-packs.js`.

## Baseline
The current tree's existing suite reports **967 passed, 3 failed** before this pass. The three pre-existing failures are:
- every shipped quiz payload normalizes without throwing and satisfies the radio invariants
- EVERY shipped quiz, after the adapter, passes `quiz.html` `validate()`
- `offline/packs/core.zip` byte-identical identity check

No attempt was made to attribute or fix these carried failures in this mutation-sweep pass.

## Method
Applied one mutation at a time to `shared/js/offline-packs-ui.js`, ran the full `tests/run.js` suite, then restored the original file before the next candidate. A mutation was considered a real kill when failures increased beyond the baseline three.

## Findings — 3 real kills

| Location | Mutation | Result | Conclusion |
|---|---|---:|---|
| `renderPack` progress total | `progress.total || pack.files.length || 1` → `progress.total || 1` | **965 passed, 5 failed** | **REAL KILL.** The pack's declared file count is required as the progress denominator when the API does not provide a total. |
| `mount` pack-id filter | `(typeof pack.id === 'number' && Number.isFinite(pack.id))` → `(typeof pack.id === 'number')` | **966 passed, 4 failed** | **REAL KILL.** `NaN`/`Infinity` numeric IDs must continue to be rejected; existing panel tests cover this malformed-input boundary. |
| `mount` file-count rendering | `Array.isArray(pack.files) ? pack.files.length : 0` → `pack.files.length` | **963 passed, 7 failed** | **REAL KILL.** Malformed/non-array `files` values must not throw the panel render; the defensive array check is load-bearing. |

All three mutations were reverted immediately. The source tree is restored to the clean pre-session state.

## Inspection notes
The remaining guards in this file were reviewed without mutation where their intent was already explicit and/or tied to malformed-input protection:
- `esc()` intentionally accepts only strings/numbers to avoid hostile object coercion and throwing `toString` values (documented in the source).
- `idle()` preserves the offline/installed button invariant.
- the click handler's busy/offline guards prevent duplicate operations and dead install actions.
- `setInstalled()` deliberately changes label/class based on installation and connectivity state.
- `updateNetwork()` must preserve busy state and re-enable/disable install buttons on connectivity changes.
- malformed pack filtering, array checks, and error fallback are all exercised by the current panel tests.

No safe simplification was found that warranted a fourth mutation this pass. In particular, no source change is recommended merely because a defensive guard is not independently exercised by every possible caller.

## Tests
- Baseline: **967 passed / 3 failed**
- After candidate A: **965 / 5** → real kill
- After candidate B: **966 / 4** → real kill
- After candidate C: **963 / 7** → real kill
- Final restored tree: **967 / 3**

## Files changed vs Agent 224
Only this handoff file was added. No source or test file changed.

## Next agent — start here
**Agent 226:** continue the mutation sweep with `shared/js/offline-packs.js` (244 lines), which Agent 224 identified as completely untouched. Do not re-test the three real-kill mutations above.

Suggested workflow:
1. Confirm the existing 967/3 baseline.
2. Read `offline-packs.js` fully and identify one candidate at a time.
3. Mutate → run `node tests/run.js` → restore immediately.
4. Treat any result worse than 967/3 as a real kill; record the exact failure delta.
5. Keep the tree source/test-identical to Agent 225 unless a separate task explicitly calls for a fix.

Resume command: `Resume from HANDOFF_AGENT_225.md. You are Agent 226. Continue from “Next agent — start here”.`
