# Agent 9 — Performance / Scalability Audit

## Status
COMPLETED — no demonstrated production bottleneck required a code change.

## Scope
- `site/` shipped assets and page payloads
- `scripts/scale_benchmark.py`
- `scripts/scale_regression_benchmark.py`
- scale regression tests
- offline pack sizes

## Baseline
| Metric | Observed |
|---|---:|
| Shipped files | 147 |
| `site/` size | 2,437,706 bytes (~2.32 MiB) |
| JS files / bytes | 22 / 294,228 |
| HTML files / bytes | 20 / 180,925 |
| Core offline pack | 798,957 bytes (~780 KiB) |
| Largest shipped source file | `site/shared/quiz.html` — 72,999 bytes |
| Largest JS | `site/shared/js/gamification.js` — 32,628 bytes |
| Largest JSON | `site/course_content/lessons.json` — 24,970 bytes |

## Scale verification
`python3 scripts/scale_benchmark.py --rows 3000`
- 4,552.2 rows/sec
- projected 1.2M-row validation: 263.61 sec
- PASS

`python3 scripts/scale_regression_benchmark.py --baseline-rows 3000 --rows 30000`
- time growth: 4.09x for 10x rows
- memory growth: 1.62x
- projected 1.2M-row QA: 83.20 sec
- PASS

`python3 scripts/scale_regression_benchmark.py --baseline-rows 10000 --rows 100000`
- time growth: 1.52x for 10x rows
- memory growth: 2.79x
- projected 1.2M-row QA: 88.04 sec
- PASS

## Findings
- No large production JS/HTML payload or unbounded shipped JSON was identified.
- Existing scale harnesses demonstrate sub-linear growth on larger samples.
- Offline packs are bounded and individually small; `core.zip` is the only materially large pack.
- A 3k/1k regression sample produced a false FAIL due to fixed process-startup/measurement overhead; the repository's own intended 3k/30k test passed. No source change was justified for this measurement artifact.

## Changes
Documentation only: this audit report and handoff. No production behavior changed.

## Next dependency
Agent 10 — Accessibility / Mobile audit.
