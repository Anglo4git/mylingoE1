# Mylingo

Static Mylingo learning app.

## Latest audit
See `COURSE_LESSON_QUIZ_AUDIT.md` for the course lesson/player and quiz wiring audit.

### Verification
```text
node tests/run.js
node tools/verify-all.js --quick
```
Both pass in this build. The supplied task did not include a video URL; provide it before final video embedding.
