// Focused forced-colors (Windows High Contrast) verification — real Chromium via Playwright,
// forcedColors: 'active' context. Checks the specific CSS the codebase already ships
// (theme.css / courses/lesson.html's @media (forced-colors:active) block) actually
// computes as expected in a real browser, on a handful of real shipped lessons.
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs = require('fs');
const ROOT = '/home/claude/work';
const BASE = 'http://localhost:8765/';

const SAMPLE_LESSONS = [];
for (const L of ['a1', 'a2', 'b1']) {
  const list = JSON.parse(fs.readFileSync(`${ROOT}/course_content/lessons/${L}.json`, 'utf8'));
  const first = list.find((l) => l.status === 'published');
  if (first) SAMPLE_LESSONS.push({ L, id: first.lesson_id });
}

(async () => {
  const b = await chromium.launch();
  const out = { trail: [], chips: [], errors: [] };
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, forcedColors: 'active' });
  for (const p of SAMPLE_LESSONS) {
    const pg = await ctx.newPage();
    try {
      await pg.goto(`${BASE}courses/lesson.html?lesson=${p.id}&level=${p.L}`, { waitUntil: 'networkidle', timeout: 15000 });
      // Step through a few slides looking for a .term chip (vocab chips live on chapter/body slides, not always slide 1).
      for (let i = 0; i < 4; i++) {
        const hasTerm = await pg.evaluate(() => !!document.querySelector('.term'));
        if (hasTerm) break;
        const next = await pg.$('#playerNav button:not([disabled])');
        if (!next) break;
        await next.click().catch(() => {});
        await pg.waitForTimeout(150);
      }
      const r = await pg.evaluate(() => {
        const items = [...document.querySelectorAll('.trail-item')];
        const active = items.find((e) => e.classList.contains('active'));
        const term = document.querySelector('.term');
        const cs = active ? getComputedStyle(active) : null;
        const tcs = term ? getComputedStyle(term) : null;
        return {
          activeOutline: cs ? cs.outlineStyle + ' ' + cs.outlineWidth : null,
          termBorder: tcs ? tcs.borderStyle + ' ' + tcs.borderWidth : null,
          itemCount: items.length,
        };
      });
      out.trail.push({ id: p.id, ...r });
    } catch (e) {
      out.errors.push(p.id + ': ' + e.message);
    } finally {
      await pg.close();
    }
  }
  await ctx.close();
  await b.close();
  console.log(JSON.stringify(out, null, 2));
})();
