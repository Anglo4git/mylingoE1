#!/usr/bin/env python3
"""
Mylingo review/promotion workflow — Agent 3.

`generate.py` deliberately writes new quizzes as `status=draft` (see
HANDOFF_AGENT2_TO_AGENT3.md) so nothing goes live without a human decision.
Today that means opening `master_source.csv` or the authoring app and
hand-editing `status` for every row of a quiz. This script makes that an
explicit, auditable, batch operation instead.

It never invents its own notion of "valid" — it re-runs the SAME
`build.py.validate()` every other stage uses, on the row set as it will
exist *after* promotion, so a quiz can never be promoted into a state
`build.py build` would reject.

Agent 77 — promotion is also the gate that decides what enters master
source as `published`, so it additionally re-runs `content_qa.py`'s
deterministic *error*-level checks (safety/correctness defects such as
executable-content injection or an explanation that contradicts the
marked answer — see content_qa.py's CQ-S0x/CQ-X0x/CQ-Rxx/CQ-Bxx codes)
against the same post-promotion row set. This intentionally does NOT
run in `--strict` mode: strict promotes review-quality *warnings*
(short explanation, answer-position pattern, etc.) that are legitimate
in a still-maturing content library and are enforced at release time by
`ci/release_gate.sh` / Agent 76's canonical policy instead. Promotion
only blocks on issues that are defects at any maturity level.

Commands
--------
    python3 generation/promote.py list    --input master_source.csv
    python3 generation/promote.py promote --input master_source.csv \\
        --out master_source.csv --quiz-id a1-011 a2-011 \\
        --report generation/PROMOTION_REPORT.md
    python3 generation/promote.py promote --input master_source.csv \\
        --out master_source.csv --level A1 --category Grammar --all-draft \\
        --report generation/PROMOTION_REPORT.md
"""

import argparse
import os
import sys
from collections import defaultdict
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import build as build_module  # noqa: E402
import content_qa  # noqa: E402

PROMOTABLE_FROM = {"draft", "in_review", "approved"}
TARGET_STATUS = "published"

# Content Schema v2 (07_CONTENT_SCHEMA_V2.md): optional, appended columns.
# Reused from build.py so both sides of the contract never drift apart.
DATE_COLUMNS = build_module.SCHEMA_V2_DATE_COLUMNS


class PromotionOutcome:
    __slots__ = ("quiz_id", "action", "reason")

    def __init__(self, quiz_id, action, reason):
        self.quiz_id = quiz_id
        self.action = action  # "promoted" | "skipped" | "blocked"
        self.reason = reason

    def __str__(self):
        return f"{self.quiz_id}: {self.action} — {self.reason}"


def group_by_quiz(rows):
    quizzes = defaultdict(list)
    for r in rows:
        quizzes[str(r.get("quiz_id", "")).strip()].append(r)
    return quizzes


def eligible_quizzes(quizzes, quiz_ids=None, level=None, category=None):
    """Return the quiz_ids matching the given filters, restricted to those
    currently in a promotable status. Filters are AND'd together; passing
    none of them selects every promotable quiz (used by --all-draft with no
    other filters)."""
    selected = []
    for quiz_id, qrows in quizzes.items():
        first = qrows[0]
        status = str(first.get("status", "")).strip().lower()
        if status not in PROMOTABLE_FROM:
            continue
        if quiz_ids and quiz_id not in quiz_ids:
            continue
        if level and str(first.get("level", "")).strip().upper() != level.upper():
            continue
        if category and str(first.get("quiz_category", "")).strip().lower() != category.lower():
            continue
        selected.append(quiz_id)
    return sorted(selected)


def list_promotable(rows):
    quizzes = group_by_quiz(rows)
    out = []
    for quiz_id in sorted(quizzes.keys()):
        qrows = quizzes[quiz_id]
        first = qrows[0]
        status = str(first.get("status", "")).strip().lower()
        if status in PROMOTABLE_FROM:
            out.append({
                "quiz_id": quiz_id,
                "level": first.get("level", ""),
                "title": first.get("title", ""),
                "quiz_category": first.get("quiz_category", ""),
                "status": status,
                "questions": len(qrows),
            })
    return out


def promote(rows, quiz_ids=None, level=None, category=None, bump_version=False,
            enforce_content_qa=True):
    """Attempt to promote the selected quizzes to `published`.

    Returns (new_rows, outcomes). `new_rows` is the full row set with
    promoted quizzes' status (and optionally version) updated in place.
    Every requested/eligible quiz gets exactly one PromotionOutcome, whether
    it succeeds, is skipped (not in a promotable status / didn't match any
    filter), or is blocked (would fail build.py's validate(), or — unless
    `enforce_content_qa=False` — content_qa.py's error-level checks, once
    promoted).

    Content Schema v2 (07_CONTENT_SCHEMA_V2.md): `status` is a
    content-bearing field, so a row that is actually promoted also gets
    `date_updated` stamped with one shared UTC timestamp for this call.
    Rows that are skipped or blocked are left completely untouched,
    including any `date_added`/`date_updated` they already carried.
    """
    quizzes = group_by_quiz(rows)
    outcomes = []
    now = datetime.now(timezone.utc).isoformat()

    requested = set(quiz_ids) if quiz_ids else None
    targets = eligible_quizzes(quizzes, quiz_ids=quiz_ids, level=level, category=category)

    if requested:
        for qid in sorted(requested):
            if qid not in quizzes:
                outcomes.append(PromotionOutcome(qid, "skipped", "no such quiz_id in the input"))
            elif qid not in targets:
                status = str(quizzes[qid][0].get("status", "")).strip().lower()
                outcomes.append(PromotionOutcome(
                    qid, "skipped", f"status is '{status}', not eligible for promotion"))

    if not targets:
        return rows, outcomes

    # Build a candidate row set with the promotion applied, then validate
    # the WHOLE thing before committing to any of it — a bad quiz among
    # several requested must not block the good ones, so validate each
    # promoted quiz individually against the full (all-promoted) backdrop,
    # then roll back just the ones that fail.
    candidate_rows = []
    for r in rows:
        qid = str(r.get("quiz_id", "")).strip()
        if qid in targets:
            r = dict(r)
            r["status"] = TARGET_STATUS
            if bump_version:
                try:
                    r["version"] = str(int(r.get("version", 1)) + 1)
                except (TypeError, ValueError):
                    pass
        candidate_rows.append(r)

    errors, warnings, _ = build_module.validate(candidate_rows)
    failing_quiz_ids = {qid for qid in targets if any(qid in str(e.ref) for e in errors)}
    validation_reasons = defaultdict(list)
    for e in errors:
        for qid in targets:
            if qid in str(e.ref):
                validation_reasons[qid].append(str(e))

    # Agent 77 — content-quality gate. Deliberately diagnostic-mode (not
    # --strict): only defects that are always "error" (executable-content
    # injection, an explanation that contradicts the marked answer, an
    # empty/malformed required field, ...) block promotion; review-quality
    # warnings stay warnings here and are enforced later, at release time,
    # by the canonical strict policy in content_qa.py / Agent 76.
    content_reasons = defaultdict(list)
    if enforce_content_qa and targets:
        qa_report = content_qa.audit_rows(candidate_rows)
        for issue in qa_report["issues"]:
            if issue["severity"] != "error":
                continue
            haystack = f"{issue['ref']} {issue['message']}"
            for qid in targets:
                if qid in haystack:
                    content_reasons[qid].append(f"{issue['code']}: {issue['message']}")

    blocked_quiz_ids = failing_quiz_ids | set(content_reasons)

    final_rows = []
    for r in rows:
        qid = str(r.get("quiz_id", "")).strip()
        if qid in targets and qid not in blocked_quiz_ids:
            r = dict(r)
            r["status"] = TARGET_STATUS
            r["date_updated"] = now
            if bump_version:
                try:
                    r["version"] = str(int(r.get("version", 1)) + 1)
                except (TypeError, ValueError):
                    pass
        final_rows.append(r)

    for qid in targets:
        if qid in blocked_quiz_ids:
            reasons = "; ".join(validation_reasons.get(qid, []) + content_reasons.get(qid, []))
            outcomes.append(PromotionOutcome(qid, "blocked", f"would fail validation: {reasons}"))
        else:
            outcomes.append(PromotionOutcome(qid, "promoted", f"{len(quizzes[qid])} question(s)"))

    return final_rows, outcomes


def write_master_csv(path, rows):
    """Preserve the canonical 23-column shape/dialect build.py already reads,
    plus the two optional Content Schema v2 columns (date_added/date_updated)
    appended at the end when present. Appending them unconditionally to the
    header — rather than only when at least one row has a value — matches
    generate.py's writer and means a row that already carries a date (e.g.
    content that passed through generate.py before reaching promote.py)
    is never silently dropped here. Rows without either value simply get
    an empty cell, which is a valid, non-backfilled Content Schema v2 row."""
    import csv
    fieldnames = ["quiz_id", "level", "title", "description", "quiz_category",
                  "quiz_tags", "version", "status", "question_number",
                  "question_text", "question_category", "question_tags",
                  "explanation", "correct_index"] + build_module.ANSWER_COLS + DATE_COLUMNS
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for r in sorted(rows, key=lambda r: (
                str(r.get("quiz_id", "")), int(r.get("question_number", 0) or 0))):
            w.writerow(r)


def write_report(path, outcomes, bump_version, date_updated=None):
    lines = ["# Mylingo Promotion Report", "",
             f"- Generated: {datetime.now(timezone.utc).isoformat()}",
             f"- Version bump on promotion: {bump_version}",
             f"- Promoted: {sum(1 for o in outcomes if o.action == 'promoted')}",
             f"- Blocked (would fail validation): {sum(1 for o in outcomes if o.action == 'blocked')}",
             f"- Skipped (not eligible / not found): {sum(1 for o in outcomes if o.action == 'skipped')}",
             f"- date_updated stamped on promoted rows (Content Schema v2): "
             f"{date_updated or 'n/a (nothing promoted)'}",
             "", "## Detail"]
    if not outcomes:
        lines.append("Nothing requested.")
    else:
        for o in sorted(outcomes, key=lambda o: o.quiz_id):
            lines.append(f"- **{o.quiz_id}** — {o.action}: {o.reason}")
    lines.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    p = argparse.ArgumentParser(description="Mylingo draft -> published promotion workflow")
    sub = p.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list", help="List quizzes eligible for promotion (no writes)")
    p_list.add_argument("--input", required=True)

    p_promote = sub.add_parser("promote", help="Promote selected quizzes to 'published'")
    p_promote.add_argument("--input", required=True)
    p_promote.add_argument("--out", required=True)
    p_promote.add_argument("--quiz-id", nargs="*", default=None, help="Specific quiz_id(s) to promote")
    p_promote.add_argument("--level", default=None, help="Restrict to one CEFR level, e.g. A1")
    p_promote.add_argument("--category", default=None, help="Restrict to one quiz_category, e.g. Grammar")
    p_promote.add_argument("--all-draft", action="store_true",
                            help="Promote every eligible quiz matching the given filters "
                                 "(required if --quiz-id is omitted, as a safety rail against "
                                 "accidentally promoting everything)")
    p_promote.add_argument("--bump-version", action="store_true",
                            help="Increment each promoted quiz's version number")
    p_promote.add_argument("--skip-content-qa", action="store_true",
                            help="Bypass the content_qa.py error-level gate (structural "
                                 "build.py validation still applies). For exceptional, "
                                 "explicitly reviewed overrides only.")
    p_promote.add_argument("--report", default="generation/PROMOTION_REPORT.md")

    args = p.parse_args()
    rows = build_module.read_rows(args.input)

    if args.command == "list":
        items = list_promotable(rows)
        if not items:
            print("No quizzes are currently eligible for promotion.")
            return
        for it in items:
            print(f"{it['quiz_id']:10s} {it['level']:3s} {it['status']:10s} "
                  f"{it['questions']:2d}q  {it['quiz_category']:16s} {it['title']}")
        return

    if args.command == "promote":
        if not args.quiz_id and not args.all_draft:
            print("Refusing to promote: pass --quiz-id one or more ids, or pass "
                  "--all-draft to explicitly promote everything matching --level/--category.",
                  file=sys.stderr)
            sys.exit(2)

        new_rows, outcomes = promote(
            rows, quiz_ids=args.quiz_id, level=args.level, category=args.category,
            bump_version=args.bump_version, enforce_content_qa=not args.skip_content_qa)

        promoted = [o for o in outcomes if o.action == "promoted"]
        date_updated = None
        if promoted:
            promoted_ids = {o.quiz_id for o in promoted}
            for r in new_rows:
                if str(r.get("quiz_id", "")).strip() in promoted_ids and r.get("date_updated"):
                    date_updated = r["date_updated"]
                    break

        write_report(args.report, outcomes, args.bump_version, date_updated=date_updated)
        for o in sorted(outcomes, key=lambda o: o.quiz_id):
            print(o)

        if promoted:
            write_master_csv(args.out, new_rows)
            print(f"\n{len(promoted)} quiz(zes) promoted. Master source written to {args.out}")
        else:
            print("\nNothing promoted; master source left unwritten.")
        print(f"Report: {args.report}")

        if any(o.action == "blocked" for o in outcomes):
            sys.exit(1)


if __name__ == "__main__":
    main()
