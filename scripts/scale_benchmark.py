#!/usr/bin/env python3
"""Agent 65 — bounded scale benchmark harness.

Generates only a temporary synthetic CSV (never repository content), runs the
same streaming validator used by the release gate, and reports throughput and
an extrapolated 1.2M-question estimate. This is a performance signal, not a
release gate and does not claim browser verification.
"""
from __future__ import annotations
import argparse, csv, json, os, subprocess, sys, tempfile, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET_ROWS = 1_200_000
FIELDS = [
    'quiz_id','level','title','description','quiz_category','quiz_tags','version','status',
    'question_number','question_text','question_category','question_tags','explanation','correct_index',
    *[f'answer_{i}' for i in range(1,10)]
]

def write_fixture(path: Path, rows: int) -> None:
    levels = ('A1','A2','B1','B2','C1','C2')
    with path.open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for i in range(rows):
            q = i % 100 + 1
            level = levels[(i // 100) % len(levels)]
            quiz = f'{level.lower()}-bench-{i // 100:06d}'
            w.writerow({
                'quiz_id': quiz, 'level': level, 'title': 'Scale Benchmark',
                'description': 'Synthetic benchmark row.', 'quiz_category': 'Grammar',
                'quiz_tags': f'Grammar,{level}', 'version': 1, 'status': 'published',
                'question_number': q, 'question_text': f'Synthetic question {i}.',
                'question_category': 'Grammar', 'question_tags': f'Grammar,{level}',
                'explanation': 'Synthetic benchmark explanation.', 'correct_index': 1,
                'answer_1': 'correct', 'answer_2': 'wrong', 'answer_3': '', 'answer_4': '',
                'answer_5': '', 'answer_6': '', 'answer_7': '', 'answer_8': '', 'answer_9': ''
            })

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--rows', type=int, default=10_000)
    p.add_argument('--python', default=sys.executable)
    args = p.parse_args()
    if args.rows < 1: p.error('--rows must be positive')
    with tempfile.TemporaryDirectory(prefix='mylingo-scale-bench-') as td:
        fixture = Path(td) / 'benchmark.csv'
        t0 = time.perf_counter(); write_fixture(fixture, args.rows); generation = time.perf_counter() - t0
        t1 = time.perf_counter()
        proc = subprocess.run([args.python, str(ROOT/'build.py'), 'validate', '--input', str(fixture)],
                              cwd=ROOT, text=True, capture_output=True)
        validation = time.perf_counter() - t1
        if proc.returncode:
            print(proc.stdout, end=''); print(proc.stderr, end='', file=sys.stderr); return proc.returncode
    rows_per_sec = args.rows / validation if validation else float('inf')
    projected = TARGET_ROWS / rows_per_sec if rows_per_sec else None
    result = {
        'rows': args.rows, 'fixture_generation_seconds': round(generation, 4),
        'validation_seconds': round(validation, 4), 'rows_per_second': round(rows_per_sec, 1),
        'target_rows': TARGET_ROWS, 'projected_target_seconds': round(projected, 2),
        'target_hours': round(projected / 3600, 3), 'status': 'PASS'
    }
    print(json.dumps(result, indent=2))
    return 0

if __name__ == '__main__': raise SystemExit(main())
