# MyLingo Lesson Player Content Schema

The lesson player is backward compatible with existing lesson JSON. Optional richer fields:

- `body_content`: one sanitized HTML text lesson.
- `chapters`: array of `{title, body_content}`; each chapter becomes a text slide.
- `video_urls`: array of YouTube or safe video URLs; each item may be a string or `{url,title}`.
- `videos`: alias for `video_urls`.
- `audio_urls`: array of safe audio URLs; each item may be a string or `{url,title}`.
- `audios`: alias for `audio_urls`.
- `audio_url`: legacy single-audio fallback.
- `youtube_url`: legacy single-video fallback.

Slide order is text/chapter slides → all videos → all audio → Practice. The top slide strip shows a type icon: T, ▶, audio, or ✓.

Direct lesson-backed quiz URLs remain gated by `shared/quiz.html`; users are routed back into the owning lesson.

## UK | US side-by-side comparison (Agent 295)

Whenever British and American English differ (spelling, vocabulary, grammar, pronunciation), show both every time using this markup inside `body_content` / chapter `body_content` (only sanitizer-allowed DIV/SPAN + `class`):

```html
<div class="uk-us"><div class="uk"><span class="uk-us-tag">UK</span>colour, lift, flat</div><div class="us"><span class="uk-us-tag">US</span>color, elevator, apartment</div></div>
```

Two columns; a single column under 340px. Styles live in `courses/lesson.html` (scoped to `.lesson-content`).

## Optional lesson tags (Agent 296)

Lesson objects (`course_content/lessons/<level>.json`) may carry two optional string fields; absent or unknown values are ignored and old lessons render unchanged:

- `lesson_length`: `short` | `long` -> shown as "Short lesson" / "Deep lesson".
- `lesson_type`: `standalone_skill` | `embedded_skill` | `exam` | `fluency` -> shown as "Skill lesson" / "Skill practice" / "Exam prep" / "Real-life fluency".

Rendered as chips under the read-time line in `courses/lesson.html`. Targets from CURRICULUM_DECISIONS.md: ~30% exam / 70% fluency; skills 50% standalone long / 50% embedded short.

