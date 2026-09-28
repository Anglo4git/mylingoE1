# Agent 241 — iPhone Safari + Android Chrome QA

Date: 2026-09-27

## Result

**PASS — static/regression release checks.**

## Verified

- `node tests/run.js`: **971 passed, 0 failed**.
- Video-first lesson contract remains intact.
- Three text presentation slides remain intact.
- Native YouTube controls and fullscreen remain enabled.
- Custom `requestFullscreen` / `webkitRequestFullscreen` code remains absent.
- 90% actual-playback gate remains enforced; forward seek jumps are not credited.
- YouTube iframe uses `playsinline=1` for mobile inline playback behavior.
- App no longer grants the iframe explicit `picture-in-picture` permission.
- CSP regenerated after the player markup change.
- Offline core packs rebuilt from the canonical manifest.

## Browser/device attempt

Chromium and Python Playwright are available in the environment, but navigating Playwright to the locally served app was blocked by the execution sandbox with:

`ERR_BLOCKED_BY_ADMINISTRATOR`

Therefore this agent **did not claim** live iPhone Safari or Android Chrome testing.

## Device matrix

| Check | iPhone Safari | Android Chrome |
|---|---|---|
| Touch/tap playback | Requires external device QA | Requires external device QA |
| Native YouTube fullscreen | Requires external device QA | Requires external device QA |
| 9:16 viewport/cropping | Requires external device QA | Requires external device QA |
| Muted autoplay policy | Requires external device QA | Requires external device QA |
| 90% gate runtime behavior | Static/regression covered | Static/regression covered |

## Source change

`courses/lesson.html` now grants:

`allow="autoplay; fullscreen; encrypted-media"`

instead of explicitly granting `picture-in-picture`.

## Next

Agent 242 should perform Android Chrome-specific runtime QA on a real/device-capable browser harness, especially autoplay, fullscreen, touch playback, and the 90% gate.
