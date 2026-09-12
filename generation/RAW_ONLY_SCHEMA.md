# Raw-only authoring contract

The authoring boundary accepts question content, not quiz bookkeeping.

## Minimum input

```csv
question_text,correct_index,answer_1,answer_2
Which word is correct?,2,go,goes
```

Required: `question_text`, `correct_index`, and at least two contiguous answers.

Optional raw content: `answer_3` through `answer_9`, `explanation`.

The following must **not** be hand-authored for normal production batches:

`quiz_id`, `level`, `title`, `description`, `quiz_category`, `quiz_tags`,
`version`, `status`, `question_number`, `question_category`, `question_tags`.

They are generated automatically. Valid supplied hints are still accepted for
backward compatibility, but invalid or missing hints fall back to inference.

## Automatic outputs

For each raw question the system derives a quiz id, contiguous question number,
CEFR level, top-level category, topic title, description, tags, version, draft
status, question metadata and an explanation when one is missing.

Questions are grouped into 5-150 item quizzes where possible. Small topic groups
are packed into a level/category-specific mixed quiz. A genuinely insufficient
level/category remainder is reported as pending rather than silently lost.

Generation-side metadata (`GENERATION_METADATA.csv`) is also filled
automatically with template id, deterministic seed, learning objective,
difficulty, distractor strategy and source reference.

## How level/topic are derived (Agent 5)

Whichever of level/category/title a row didn't supply is filled in by a
model-backed classifier (`generation/model_classifier.py`) that reads the
question and its answers and chooses from the same fixed CEFR levels and
categories the rest of this contract uses — not a keyword list. It falls
back automatically to a deterministic heuristic (Agent 4's original
inference) whenever no `ANTHROPIC_API_KEY` is configured, or a model call
fails for any reason, so authoring never breaks or blocks on it. See
`generation/README.md` → "Level/topic classification" for configuration
and `model_classifier.py`'s module docstring for the full design.
