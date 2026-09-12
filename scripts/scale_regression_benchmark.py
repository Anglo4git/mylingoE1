#!/usr/bin/env python3
"""Agent 78 — scale regression benchmark for content_qa.py.

Agent 65 benchmarked build.py's streaming structural validator. That harness
does not exercise content_qa.py, whose cross-row duplicate/diversity checks
(near-duplicate detection, answer-position tracking, repeated-explanation
detection) are the part of the pipeline most at risk of an accidental
O(n^2) regression at 1.2M-row scale.

This harness:
  1. Generates a temporary, non-repository synthetic CSV fixture (never
     committed, deleted automatically) — same shape/helper as
     scripts/scale_benchmark.py.
  2. Runs content_qa.audit_file() on it in a subprocess, twice, at two
     different row counts, so growth in wall time and peak memory
     (resource.getrusage(RUSAGE_CHILDREN).ru_maxrss, i.e. the subprocess's
     own peak RSS) can be compared against row-count growth.
  3. Fails (non-zero exit, status FAIL) if either time or memory grows
     super-linearly beyond a tolerance band — the signal for an accidental
     quadratic duplicate-detection regression — rather than merely
     reporting numbers.

This is a performance/regression signal, not a release gate, and does not
claim browser verification. It measures source-side QA only.
"""
from __future__ import annotations
import argparse, json, resource, subprocess, sys, tempfile, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from scale_benchmark import write_fixture, TARGET_ROWS  # noqa: E402

# How much time/memory are allowed to grow, per unit of row-count growth,
# before this is flagged as a likely non-linear (e.g. O(n^2)) regression.
# 1.35x is comfortable headroom over linear (1.0x) for GC/allocator noise
# and small fixed overhead, while still catching real quadratic blowups
# (a 10x row increase would need ~10x time/memory, not ~1.35x).
NONLINEAR_TOLERANCE = 1.35

_QA_RUNNER = """
import json, resource, sys
sys.path.insert(0, {root!r})
import content_qa
t0 = __import__('time').perf_counter()
report = content_qa.audit_file({fixture!r})
elapsed = __import__('time').perf_counter() - t0
print(json.dumps({{
    'elapsed_seconds': elapsed,
    'quality_score': report.get('quality_score'),
    'issue_count': len(report.get('issues', [])),
}}))
"""


def _run_content_qa(fixture: Path, python: str) -> dict:
    t_wall0 = time.perf_counter()
    proc = subprocess.run(
        [python, "-c", _QA_RUNNER.format(root=str(ROOT), fixture=str(fixture))],
        cwd=ROOT, text=True, capture_output=True, check=True,
    )
    wall = time.perf_counter() - t_wall0
    payload = json.loads(proc.stdout.strip().splitlines()[-1])
    # ru_maxrss is the subprocess's own peak RSS (children of this process);
    # since only one subprocess ran since the last check, this is that
    # subprocess's peak, not a running total. Linux reports KB; macOS bytes.
    peak_kb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    if sys.platform == "darwin":
        peak_kb = peak_kb // 1024
    payload["wall_seconds"] = round(wall, 4)
    payload["peak_rss_kb"] = peak_kb
    return payload


def _measure(rows: int, python: str) -> dict:
    with tempfile.TemporaryDirectory(prefix="mylingo-scale-qa-bench-") as td:
        fixture = Path(td) / "benchmark.csv"
        write_fixture(fixture, rows)
        result = _run_content_qa(fixture, python)
    result["rows"] = rows
    result["rows_per_second"] = round(rows / result["elapsed_seconds"], 1) if result["elapsed_seconds"] else float("inf")
    return result


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--rows", type=int, default=100_000, help="row count for the larger sample")
    p.add_argument("--baseline-rows", type=int, default=10_000, help="row count for the smaller/baseline sample")
    p.add_argument("--python", default=sys.executable)
    args = p.parse_args()
    if args.rows <= args.baseline_rows:
        p.error("--rows must be greater than --baseline-rows")

    small = _measure(args.baseline_rows, args.python)
    large = _measure(args.rows, args.python)

    row_ratio = large["rows"] / small["rows"]
    time_ratio = large["elapsed_seconds"] / small["elapsed_seconds"] if small["elapsed_seconds"] else float("inf")
    mem_ratio = large["peak_rss_kb"] / small["peak_rss_kb"] if small["peak_rss_kb"] else float("inf")

    allowed = row_ratio * NONLINEAR_TOLERANCE
    time_ok = time_ratio <= allowed
    mem_ok = mem_ratio <= allowed

    projected_seconds = (TARGET_ROWS / large["rows"]) * large["elapsed_seconds"]
    result = {
        "baseline": small,
        "large": large,
        "row_count_ratio": round(row_ratio, 2),
        "time_growth_ratio": round(time_ratio, 2),
        "memory_growth_ratio": round(mem_ratio, 2),
        "max_allowed_growth_ratio": round(allowed, 2),
        "time_linear_or_better": time_ok,
        "memory_linear_or_better": mem_ok,
        "target_rows": TARGET_ROWS,
        "projected_target_seconds": round(projected_seconds, 2),
        "status": "PASS" if (time_ok and mem_ok) else "FAIL",
    }
    print(json.dumps(result, indent=2))
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
