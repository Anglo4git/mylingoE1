# Agents 35–36 Completion

**35 — Ranking validation semantics:** `build.py` now accepts any valid
`correct_order` permutation of unique `items`, comparing normalized values and
rejecting duplicates/missing/extra/empty orders under `V-R4`. Existing runtime
verification semantics and learner scoring were preserved.

**36 — Metadata/date contract:** canonical source fields remain `date_added` and
`date_updated`. Manifest `date` is now source-derived only: the latest valid
metadata timestamp across quiz rows is emitted. No source date means no manifest
`date`; no build clock or placeholder date is invented. Existing generated site
manifests were scrubbed of the old `2026-09-05` placeholder.

Focused verification: **37/37 Python tests passed** across ranking, metadata/date,
content QA, and offline-core regression suites. Python syntax checks passed.

Known limitation: browser/Playwright execution is not available in this sandbox.
