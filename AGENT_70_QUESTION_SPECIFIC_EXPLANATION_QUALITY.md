# AGENT 70 — Question-Specific Explanation Quality

## Mission
Eliminate CQ-D02. Make explanations tied to the actual question/answer/rule and reject copied boilerplate within a quiz unless explicitly justified. Add focused regression tests. Acceptance: zero CQ-D02 warnings and future generated content is protected.

## Read first
- `content_qa.py`
- `generation/generate.py`
- `master_source.csv`

## Free-tier rules
- One focused task; inspect named files first.
- Preserve canonical contracts from Agents 48–67.
- Never weaken QA or mass-generate content.
- Prefer 1–3 production-file changes where practical.
- Run targeted tests and stop when acceptance passes.
- Handoff in ≤200 words: files changed, commands/results, limitation, next dependency.
# Agent 70 — Question-Specific Explanation Quality

## Mission
Ensure explanations apply to the actual question, not merely to the quiz topic.

## Contract
- `CQ-X02` is a correctness error when an explanation explicitly targets a subject/pronoun that conflicts with the question's fill-in-the-blank subject.
- Existing `CQ-X01` answer-claim checking remains unchanged.
- No explanation text is auto-rewritten or mass-generated.

## Examples
- `I ___ a student.` + `Use am with the pronoun I...` => valid.
- `She ___ my friend.` + `Use am with the pronoun I...` => `CQ-X02`.
- Generic rules such as `Use an before a vowel sound.` remain supported.

## Acceptance
Run `python3 content_qa.py --input master_source.csv --out-dir content_qa` and the test suite. Existing data is diagnostic; new `CQ-X02` findings identify rows requiring editorial correction.
