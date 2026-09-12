"""Deterministic answer-position balancing for canonical quiz rows.

The helper only permutes answer slots. It never changes question text, answer
text, or the identity of the correct answer; it updates ``correct_index`` to
follow the moved answer. The mapping is deterministic for a quiz/question.
"""
from __future__ import annotations

import hashlib
from collections import Counter, defaultdict


def target_position(quiz_id: str, question_number: int, answer_count: int) -> int:
    """Return a stable 1-based target position in ``1..answer_count``."""
    if answer_count < 2:
        return 1
    digest = hashlib.sha256(f"{quiz_id}:{question_number}".encode("utf-8")).digest()
    return (int.from_bytes(digest[:4], "big") % answer_count) + 1


def rebalance_quiz_rows(rows: list[dict]) -> list[dict]:
    """Deterministically spread correct answers across available slots.

    For each quiz, question order is stable by numeric ``question_number``.
    The target slot cycles through the available answer count using a hash
    offset, which guarantees no single slot dominates a normal 4-option quiz.
    Distractors retain their relative order; only the correct answer is moved.
    """
    grouped = defaultdict(list)
    for row in rows:
        grouped[str(row.get("quiz_id", ""))].append(row)

    out = [dict(r) for r in rows]
    positions = {id(r): i for i, r in enumerate(rows)}
    for quiz_id, quiz_rows in grouped.items():
        quiz_rows = sorted(quiz_rows, key=lambda r: (int(r.get("question_number", 0) or 0), str(r.get("question_number", ""))))
        assigned = Counter()
        for row in quiz_rows:
            answers = []
            for i in range(1, 10):
                value = str(row.get(f"answer_{i}", "") or "").strip()
                if not value:
                    break
                answers.append(value)
            if len(answers) < 2:
                continue
            try:
                correct = int(row.get("correct_index"))
                qnum = int(row.get("question_number"))
            except (TypeError, ValueError):
                continue
            if not 1 <= correct <= len(answers):
                continue
            # Greedy least-used slot selection handles quizzes whose rows have
            # different answer counts; ties are broken deterministically.
            candidates = list(range(1, len(answers) + 1))
            min_used = min(assigned[p] for p in candidates)
            candidates = [p for p in candidates if assigned[p] == min_used]
            digest = hashlib.sha256(f"{quiz_id}:{qnum}".encode("utf-8")).digest()
            target = candidates[int.from_bytes(digest[:4], "big") % len(candidates)]
            assigned[target] += 1
            if target == correct:
                continue
            correct_value = answers.pop(correct - 1)
            answers.insert(target - 1, correct_value)
            idx = positions[id(row)]
            updated = dict(out[idx])
            for i in range(1, 10):
                updated[f"answer_{i}"] = answers[i - 1] if i <= len(answers) else ""
            updated["correct_index"] = target
            out[idx] = updated
    return out


def position_distribution(rows: list[dict]) -> dict[str, dict[int, int]]:
    result = {}
    grouped = defaultdict(list)
    for row in rows:
        grouped[str(row.get("quiz_id", ""))].append(row)
    for quiz_id, quiz_rows in sorted(grouped.items()):
        counts = Counter()
        for row in quiz_rows:
            try:
                counts[int(row["correct_index"])] += 1
            except (KeyError, TypeError, ValueError):
                pass
        result[quiz_id] = dict(sorted(counts.items()))
    return result
