# Agent 36 Completion — Metadata/date contract

Status: **COMPLETED**

Canonical metadata fields remain `date_added` and `date_updated`, both optional
at source level and validated as ISO 8601 when present. Generated level manifests
no longer contain the hardcoded `2026-09-05` placeholder: `date` is emitted only
when valid source metadata exists, using the latest valid `date_updated`/`date_added`
timestamp across the quiz's rows. Identical inputs remain deterministic.

The current master source has no v2 date columns, so its generated manifests now
omit `date` rather than invent a historical value. Automatic per-row stamping by
generation/promotion remains a separate follow-on concern.
