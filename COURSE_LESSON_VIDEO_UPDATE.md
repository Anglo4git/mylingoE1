# Course Lesson Video Update

## Applied
- Sample YouTube video added to every published course lesson across all six levels.
- URL: `https://youtu.be/wDchsz8nmbo?si=YRm1-glIjaKnE0MG`
- Total lessons updated: **308**
  - A1: 76
  - A2: 54
  - B1: 50
  - B2: 60
  - C1: 58
  - C2: 10
- Updated both the per-level lesson catalogs and the combined `course_content/lessons.json`.
- Lesson player keeps the lesson header/context visible on video and audio slides.
- YouTube embeds use the fixed YouTube embed host and existing safe-media validation.
- CSP regenerated with YouTube frame permission required by the player.
- `offline/packs/core.zip` rebuilt to match the core manifest after source changes.

## Verification
- All 308 lesson records contain the exact requested `youtube_url`.
- Lesson player contains YouTube parsing/embed/rendering support.
- Full project suite: **970 passed / 0 failed** (`node tests/run.js`).
- Core offline archive: `unzip -t` clean and source/zip identity verified by the test suite.
