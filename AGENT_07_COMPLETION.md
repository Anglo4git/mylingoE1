# MYLINGO — Agent 07 Completion Handoff

## Status
COMPLETED — Learner Session Resume

## Changed files
- `site/shared/quiz.html`
- `tests/unit/session-resume.test.js`

## Session storage contract
**Storage key:** `mylingo.session.v1`

**Schema:**
```json
{
  "version": 1,
  "quizId": "a1-001",
  "quizVersion": "1",
  "questionIndex": 0,
  "answers": [
    {
      "response": {"index": 2},
      "correct": true,
      "correctText": "goes",
      "submittedAt": 1750000000000
    },
    null
  ],
  "score": 1,
  "status": "in-progress",
  "startedAt": 1750000000000,
  "updatedAt": 1750000010000
}
```

`response` preserves the existing submit-answer shape: `{index}`, `{indices}`, `{value}`, `{matching}`, or `{ranking}` depending on question type.

A session is resumable only when `version === 1`, `status === "in-progress"`, the quiz id/version match the loaded quiz, `questionIndex` is in range, `answers.length` equals the question count, score is valid, and both timestamps are finite. Malformed or incompatible session data is ignored; structurally malformed state is removed safely.

## Runtime behavior
- Starting a quiz creates a fresh version-1 session.
- Submitting an answer stores the response, correctness, correct-answer text, score, and timestamps.
- Moving to the next question stores the new question index.
- Reopening the same quiz shows `Resume Quiz` and changes the primary action to `Start Over`.
- Resume restores the saved question, score, prior answer map, and current submitted answer UI/feedback.
- `Start Over` clears the session and starts from question 1.
- Quiz completion clears `mylingo.session.v1`.
- Legacy `mylingo.progress.v1` remains unchanged for dashboard/history data.

## Verification
- Inline `quiz.html` JavaScript: syntax check passed.
- Focused session assertions: 9/9 passed.
- `python3 build.py build --input master_source.csv --out /tmp/mylingo-agent7-build`: passed; 66 data files.
- `python3 build.py verify-output --out /tmp/mylingo-agent7-build`: passed; 0 errors, 0 warnings.
- Vitest executable is not installed in this package, so the new Vitest test file could not be executed through `npm test`.

## Next agent
Agent 08 — Learner Progress Backup/Restore.
