# course_content/

Sample data for the Course Data Contract (see `COURSE_SCHEMA.md`,
`course_schema.py`). One worked example only:

`course-a2` ("English A2") → `course-a2-unit-01` ("Everyday Life") →
`course-a2-unit-01-lesson-01` ("Daily Routines") → exercises
`a2-007` (Adverbs of Frequency, Grammar) and `a2-010` (Everyday
Vocabulary, Vocabulary), both real, currently-published rows in
`master_source.csv`.

No quiz content is duplicated here — `lessons.json` only stores
`quiz_id` references. Validate with:

```
python3 course_schema.py validate --content-dir course_content --master-source master_source.csv
```

Mapping the rest of the catalog (all 61 quizzes) into this shape is
Agent 74's deliverable (`COURSE_CONTENT_MAPPING.md`), not this sample.
