#!/usr/bin/env python3
"""One-shot deterministic migration of canonical master_source.csv answer slots."""
from __future__ import annotations
import argparse, csv
from pathlib import Path
from answer_position import rebalance_quiz_rows

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    args=p.parse_args()
    with open(args.input, newline="", encoding="utf-8-sig") as f:
        rows=list(csv.DictReader(f)); fields=list(rows[0].keys()) if rows else []
    updated=rebalance_quiz_rows(rows)
    with open(args.output,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore"); w.writeheader(); w.writerows(updated)
    changed=sum(a != b for a,b in zip(rows,updated))
    print(f"rows={len(rows)} changed={changed}")
if __name__ == "__main__": main()
