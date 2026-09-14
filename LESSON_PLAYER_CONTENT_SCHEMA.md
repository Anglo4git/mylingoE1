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
