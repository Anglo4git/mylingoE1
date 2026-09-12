# Agent 35 Completion — Ranking validation semantics

Status: **COMPLETED**

Ranking source validation now requires `correct_order` to be a unique,
non-empty permutation of `items`, using case-insensitive whitespace-normalized
comparison. Valid reordered answers pass; duplicate, missing, extra, or absent
orders fail with the existing `V-R4` rule.

The runtime verifier already used set semantics; the build validator now uses
the same normalized-set contract. Learner scoring remains positional and was
not redesigned.
