# Agent 76 — Lesson Revision Page (COMPLETE)

## What was built

- `site/courses/lesson.html?lesson=<lesson_id>&level=<a1..c2>&redirect=<url>` —
  the lightweight revision screen between a course/unit and its exercises.
  Query-driven, one template (not one file per lesson/level), same pattern
  as `course.html`.

- `site/courses/course.html` updated (2 call sites + 1 new helper,
  `lessonUrl()`) so every lesson link — the top "Continue"/"Start course"
  CTA and each lesson row's "Practice"/"Review" link — now routes through
  `lesson.html` first instead of straight into `shared/quiz.html`. This is
  exactly the one-line change flagged in the Agent 75 handoff; nothing else
  on the course page changed.

## Content rendering rules

Rendered in this fixed order, each section entirely optional except title
and revision:

1. **Category chip + "Skip revision"** (top) — skip goes straight to the
   first exercise; present only when the lesson actually has one.
2. **Title** (`lesson.title`).
3. **Estimated reading time.** Uses `revision.estimated_minutes` if the
   content has one; otherwise computed client-side from word count of
   `summary` + `examples` + `key_terms` at ~200 words/minute, rounded up,
   **minimum 1 min**. This is a display estimate only — it never gates
   "Start exercises". Verified with unit tests (see below).
4. **Quick revision** (`revision.summary`) — always rendered. If a
   (currently hypothetical, schema allows `draft`) lesson has no summary,
   shows "No revision notes yet for this lesson — you can still practice."
   rather than an empty card.
5. **Examples** (`revision.examples`) — bulleted list, omitted entirely if
   empty/absent.
6. **Key terms** (`revision.key_terms`) — chip row, omitted entirely if
   empty/absent.
7. **Presentation image** (`presentation_url`) — omitted if null;
   `onerror` removes the whole card client-side if the image 404s, so a
   dead link never leaves a broken-image icon on the page.
8. **YouTube video** (`youtube_url`) — see media fallback rules below.
9. **"Exercises in this lesson"** — only rendered when a lesson has
   **more than one** `exercise_quiz_ids` (0 of the current 60 lessons do;
   the schema and Agent 74's mapping both allow it). Lists each exercise's
   title + question count (from `quizzes.json` metadata only — never
   question/answer content) with its own "Practice" link.
10. **"Start exercises"** (sticky bottom button) — the only required
    action; always present when the lesson has at least one exercise ID,
    disabled state ("No exercises are linked to this lesson yet.") if not.

## Empty-state behavior

- No `?lesson=` → error state, links back to the course catalog and to
  placement.
- Lesson not found, not `published`, or its unit/course chain doesn't
  resolve → same error state (never a blank or half-rendered page).
- `revision.summary` empty (schema requires it, but defensively handled
  for future draft content) → fallback sentence, page still fully usable.
- `examples` / `key_terms` / `presentation_url` / `youtube_url` all
  absent (the real case for all 60 current lessons) → those cards simply
  don't render; page is title + reading time + summary + Start exercises,
  which matches the "quick to scan, not a textbook" UX rule.
- Lesson with 0 exercise IDs (future draft data) → "Start exercises" is
  replaced with a plain notice instead of a dead/empty link.

## Media fallback rules (guardrail: never require YouTube)

- `youtube_url` absent → no video section at all.
- `youtube_url` present but doesn't parse as a recognizable YouTube URL
  (`watch?v=`, `youtu.be/`, `embed/`, `shorts/`) → treated as absent
  (silently skipped), not shown as a broken link. Regex verified against
  all four URL shapes plus a non-YouTube URL and a null input.
- `youtube_url` present, parses, but the browser is offline
  (`navigator.onLine === false`) → shows the exact fallback text from the
  handoff spec: *"Video unavailable offline. Read the quick revision
  instead."* — no iframe is even attempted offline.
- Also listens for the `offline` event so a learner who loses connection
  **while reading** gets the same message live, not just on initial load.
- If an online iframe embed itself fails to load, its `onerror` swaps in
  the same fallback message rather than leaving a broken embed.
- In every one of these cases the **text revision (summary, examples, key
  terms) is unaffected** — video is strictly additive, per the guardrail.
  Full offline asset caching (service worker / manifest entries for
  `/courses/*`) is Agent 81's job, not this page's; this page only
  guarantees it degrades correctly whatever the connectivity state is.

## Routing / redirect contract

- `lesson.html` accepts `redirect` (where to go after finishing the
  exercise — typically `course.html?level=&unit=`, passed through
  unchanged from `course.html`) and falls back to
  `course.html?level=<level>&unit=<unit_id>` if absent, so the page also
  works as a standalone deep link.
- `level` is optional too — if omitted, it's derived from the lesson's
  resolved course (`unit_id` → `course_id` → `course.level`), so a bare
  `lesson.html?lesson=course-a2-unit-01-lesson-01` link still works.
- "Skip revision" and "Start exercises" are two entry points to the exact
  same destination (`shared/quiz.html?quiz=<first exercise>&level=&redirect=`)
  — skip is a fast top-of-page escape for return visitors, start is the
  natural end of reading. Neither is gated behind the other; revision is
  never mandatory.
- **Known scope limit:** for a lesson with multiple exercises, "Start
  exercises" / "Skip revision" launch only the *first* one; the rest are
  reachable individually from the "Exercises in this lesson" list, not
  auto-chained after the first completes. Auto-chaining multiple quizzes
  within one lesson is Agent 78's territory (lesson progress / quiz
  interconnection) — flagged there rather than invented here, since it
  touches how quiz completion reports back, not just navigation. Doesn't
  affect any of the 60 shipped lessons today (all are single-exercise).

## Accessibility

- Same design tokens/patterns as Agents 74/75's pages (`skip-link`,
  `:focus-visible`, 44px+ tap targets — the sticky CTA is 52px, key terms
  and status pills are text-labeled not color-only,
  `prefers-reduced-motion` guards, `@view-transition`).
- `role="status" aria-live="polite"` on the loading state.
- Video iframe has a descriptive `title`; image has descriptive `alt`.
- Reading-time icon is `aria-hidden`; the time itself is in visible text.
- Sticky bottom CTA doesn't rely on hover/pointer-only interaction — it's
  a normal anchor, fully keyboard-reachable, and doesn't obscure content
  behind it (gradient + top padding, not an opaque overlap).

## Guardrail: no quiz-question duplication

The only quiz data this page ever fetches or renders is
`quizzes.json` metadata — `title` and `questions` (count) — used solely
in the optional multi-exercise list. No question text, answers, or
explanations are fetched or stored here at any point.

## Verified

- `node --check` on the embedded script in both `lesson.html` and the
  edited `course.html` — clean.
- Unit-tested the two pure helpers in Node against real and synthetic
  input:
  - `estimateMinutes()` — empty/short/long content, explicit
    `estimated_minutes`, null revision — all return sane minutes (≥1).
  - `youtubeId()` — `watch?v=`, `youtu.be/`, `embed/`, `shorts/`, a
    non-YouTube URL, a null URL, and a URL with a trailing `&t=30s` query
    — correctly extracts or correctly returns `null`.
- Simulated the lesson → unit → course resolution in Node against the
  real shipped `course_content/*.json` for all 60 lessons across all 6
  levels: **0 broken chains**, and every lesson's `exercise_quiz_ids`
  still resolves against its level's `quizzes.json` (**0 missing**,
  matching Agent 74/75's own audits).
- Confirmed (via the real data) that 0 of the 60 lessons currently set
  `presentation_url`, `youtube_url`, `examples`, `key_terms`, or
  `estimated_minutes` — i.e. the "everything optional is absent" path is
  the one that actually runs in production today, and it was the
  primary path exercised by hand-tracing the render logic.
- No headless-browser/E2E run in this environment (same limitation noted
  in the Agent 75 handoff) — flagged again for Agent 82/Playwright.

## Guardrails honored

- Revision is never required — "Start exercises" and "Skip revision"
  both bypass it freely; the "brief" schema rule (soft 10-minute ceiling)
  is display-only and not enforced as a gate here.
- YouTube is never required — see media fallback rules above.
- Offline fallback retains the full text revision in every case; only the
  video card is ever swapped out.
- No quiz question/answer content duplicated anywhere on this page.
- Did not touch `shared/quiz.html`, scoring, or any progress/completion
  store — this page reads course-content JSON and quiz *metadata* only,
  and its only side effect is normal navigation.

## Next dependency

Agent 77 (Journey UI) can proceed — the course → unit → lesson → revision
→ exercises path is now fully wired end to end for the "guided door", and
the `unit=` deep-link param on `course.html` plus the `redirect=` contract
on both `course.html` and `lesson.html` are stable for it to build
progress/position tracking on top of.
