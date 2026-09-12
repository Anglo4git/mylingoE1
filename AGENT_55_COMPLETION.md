# Agent 55 — Large-bucket duplicate detection

Removed the previous `>2500` bucket skip for CQ-D03. Large buckets now use deterministic token-shingle postings to generate a bounded candidate set, then retain the existing Jaccard + SequenceMatcher verification.

No dependencies added. Small buckets preserve exhaustive behavior.
