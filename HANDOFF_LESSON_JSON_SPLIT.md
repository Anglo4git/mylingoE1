# Handoff — per-level lesson JSON + blog-style body_content

## Done
1. **Split lessons per level.** `course_content/lessons.json` (monolithic, all
   62 lessons/all levels) is UNTOUCHED — other consumers still read it:
   `courses/index.html`, `courses/course.html`, `courses/journey.html`,
   `shared/js/course-progress.js`. Do not delete it without updating those.
   New files added, one per level, same lesson objects (not yet trimmed of
   fields):
   - `course_content/lessons/a1.json` (10)
   - `course_content/lessons/a2.json` (11)
   - `course_content/lessons/b1.json` (10)
   - `course_content/lessons/b2.json` (10)
   - `course_content/lessons/c1.json` (11)
   - `course_content/lessons/c2.json` (10)
   Regenerate anytime with the split logic in this repo's shell history:
   read `course_content/lessons.json`, group by the level encoded in
   `lesson_id` (`course-<level>-unit-..-lesson-..`), write each group to
   `course_content/lessons/<level>.json`.

2. **`courses/lesson.html` now fetches only its own level's file.**
   - `levelFromLessonId(id)` parses the level straight out of the lesson_id
     (no need to know the level before fetching).
   - Primary path: fetch `course_content/lessons/<level>.json` directly.
   - Fallback (bad/missing level hint): loops the 6 per-level files looking
     for the lesson_id — still far less data than the old single-file fetch
     in the common case.
   - `courses.json` and `units.json` are still fetched in full (they're
     small/shared; not in scope of this request).

3. **Blog-style `body_content` support (the "Jason files as blog text"
   idea).** In each lesson JSON object, an optional field:
   ```json
   "body_content": "<h2>Welcome</h2><p>Today we cover <strong>X</strong>.</p>"
   ```
   When present, it replaces the summary/examples/key-terms cards on the
   **Lesson** slide, rendered through a new `sanitizeHtml()` allowlist
   sanitizer (tags: p,h2-h4,strong,em,b,i,ul,ol,li,br,a,blockquote,img,div,
   span,code,pre; attrs: href/title on `<a>`, src/alt on `<img>`, class on
   div/span; href/src must be http(s)/mailto/relative). Styled via new
   `.lesson-content` CSS block (matches the dark player skin).
   **No lesson JSON currently has `body_content` set** — this is plumbing
   only. Content team / authoring tool still needs to populate it.

4. Dark "player mode" slide deck (Lesson → Watch → Practice) and video
   wrapper/chapter-trail/`youtubeEmbedSrc`/`renderMedia` work from the
   previous handoff round is intact and unaffected by the above.

## Round 2 — remaining four consumers migrated

5. **`courses/course.html`** — level is already known from the URL, so it
   now fetches `course_content/lessons/<level>.json` directly instead of
   the monolith, with `.catch()` falling back to
   `course_content/lessons.json` if the split file is ever missing.

6. **`courses/journey.html`** — same treatment: level known up front, fetch
   `course_content/lessons/<level>.json` with the same monolith fallback.

7. **`courses/index.html`** — the homepage lists all six courses at once,
   so it genuinely needs every level's lessons. Added a
   `fetchAllLessons()` helper that fetches all six
   `course_content/lessons/<level>.json` files in parallel via
   `Promise.all` and concatenates them (same total payload as the old
   bundle, just split into 6 requests) — falls back to the monolith
   wholesale if any per-level fetch fails.

8. **`shared/js/course-progress.js` (`resolveHomepageState`)** — same
   `fetchAllLessons()` pattern (duplicated locally in this file rather than
   shared, since it's plain script-tag JS with no module system) replacing
   its `lessons.json` fetch. Used by both `./index.html` and
   `./main/index.html`'s "continue learning" card.

   Note: this function's fetch paths are hardcoded `'../course_content/...'`
   regardless of caller depth — that mismatch (root `index.html` vs
   `main/index.html`) predates this change and was left as-is; not in scope
   here.

   **`course_content/lessons.json` (the big bundle) is still kept in sync
   and still exists** as the fallback path for all five consumers above
   plus `lesson.html`'s own fallback scan. It is safe to delete only once
   nobody's fallback still needs it — recommend leaving it in place for at
   least one release cycle after the split ships, then removing once
   confident the per-level files are reliably present and correctly
   regenerated on every content update.

9. **Sample `body_content` added** to `course-a1-unit-01-lesson-01`, in
   both `course_content/lessons/a1.json` and the `lessons.json` monolith
   (kept in sync), as a manual smoke test: a short "Welcome to Unit 1"
   blog-style block using `<h2>`, `<p>`, `<strong>`, `<ul>/<li>`, `<em>`,
   and `<code>` — all of which are on `sanitizeHtml`'s allowlist. Load
   `courses/lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1` to see
   it render on the Lesson slide in place of the summary/examples cards.

## Not done / next steps
- **`sanitizeHtml` is a client-side safety net only.** It is NOT a
  replacement for sanitizing at authoring/import time (the pasted reference
  material's `wp_kses_post()` point stands) — treat this as defense in
  depth, not the primary control, before any real user-submitted HTML flows
  into these files.
- **Per-level files still carry every field** (`revision`, `exercise_quiz_ids`,
  etc.) even when a lesson also has `body_content` — no size trimming was
  done beyond the level split itself. If further payload optimization is
  wanted, drop unused fields per-lesson once `body_content` is the
  authoritative source.
- Only `course-a1-unit-01-lesson-01` has `body_content` populated — the
  other 61 lessons still render via the old summary/examples/key-terms
  cards, which is expected (this is plumbing + one smoke-test sample, not a
  content-authoring pass).
- Not tested in a real browser/server (no network egress in this sandbox) —
  only static JS syntax-checked with `node --check` (all edited `<script>`
  blocks across `courses/index.html`, `courses/course.html`,
  `courses/journey.html`, `courses/lesson.html`, and
  `shared/js/course-progress.js` pass) and JSON validated with
  `json.load()`. Before merging, in a real environment: load
  `courses/index.html` (homepage grid), `courses/course.html?level=a1`,
  `courses/journey.html?level=a1`, and
  `courses/lesson.html?lesson=course-a1-unit-01-lesson-01&level=a1` to
  confirm progress %, unit listings, and the rendered `body_content` all
  look right, and confirm the network tab shows per-level requests instead
  of the old single `lessons.json` fetch.
