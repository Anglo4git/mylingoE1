// Agent 319: WCAG text contrast on EVERY slide of lessons that carry audio (audio_urls), light + dark, 390 px.
// STEP=<n> samples every n-th audio lesson (default 4); ONLY=<ids>; OUT=file. Fakes window.YT to unlock the video gate.
// Usage: python3 -m http.server 8765 & NODE_PATH=$(npm root -g) node tools/a11y/lesson-audio-contrast.js
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const contrastFn = require('./contrast-fn.js'); const ROOT = path.resolve(__dirname, '..', '..'); const BASE = process.env.BASE || 'http://localhost:8765/';
// Lesson gating: seed EVERY quiz of the level as passed so no lesson redirects to "Finish the previous lesson first".
const all = []; ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].forEach((L) => { const ls = JSON.parse(fs.readFileSync(`${ROOT}/course_content/lessons/${L}.json`)); const q = []; ls.forEach((l) => (l.exercise_quiz_ids || []).concat(l.lesson_quiz_id ? [l.lesson_quiz_id] : []).forEach((x) => q.push(x))); ls.forEach((l) => { if ((l.audio_urls || []).length) all.push({ id: l.lesson_id, L, q }); }); });
const step = +(process.env.STEP || 4); const list = process.env.ONLY ? all.filter((x) => process.env.ONLY.split(',').includes(x.id)) : all.filter((_, i) => i % step === 0);
(async () => {
  const b = await chromium.launch(); const out = [];
  for (const { id, L, q } of list) {
    const seed = {}; q.forEach((x) => (seed[x] = { status: 'completed', best: 100, percent: 100, attempts: 1 }));
    for (const scheme of ['light', 'dark']) {
      const ctx = await b.newContext({ colorScheme: scheme, viewport: { width: 390, height: 800 } });
      await ctx.route(/youtube|ytimg|googlevideo/, (r) => r.abort());
      await ctx.addInitScript(() => { window.YT = { Player: function (i, o) { setTimeout(() => o.events.onStateChange({ data: 0 }), 50); } }; });
      await ctx.addInitScript((s) => { try { localStorage.setItem('mylingo.progress.v1', JSON.stringify(s)); } catch (e) {} }, seed);
      const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
      await pg.goto(`${BASE}courses/lesson.html?lesson=${id}&level=${L}`, { waitUntil: 'networkidle' }).catch((e) => errs.push(e.message));
      await pg.waitForTimeout(250);
      const n = (await pg.$$('.trail-item,[role=tab]')).length; const bad = []; let sawAudio = false;
      for (let i = 0; i < n; i++) {
        if (i > 0) await pg.locator('#navNext').click().catch(() => {}); await pg.waitForTimeout(250);
        if (await pg.$('audio')) sawAudio = true;
        (await pg.evaluate(contrastFn)).filter((x) => x.sel !== 'span.sep').forEach((x) => bad.push(Object.assign({ slide: i }, x)));
      }
      out.push({ id, scheme, n, sawAudio, bad, errs }); await ctx.close();
    }
  }
  await b.close(); fs.writeFileSync(process.env.OUT || '/tmp/lesson-audio-contrast.json', JSON.stringify(out, null, 1));
  const p = out.filter((r) => r.bad.length || r.errs.length || !r.sawAudio);
  console.log('runs', out.length, 'problem runs', p.length); p.slice(0, 12).forEach((r) => console.log(r.id.slice(7), r.scheme, r.sawAudio, JSON.stringify(r.bad.slice(0, 3)), r.errs.slice(0, 1)));
  process.exit(p.length ? 1 : 0);
})();
