// tools/a11y/pages-contrast.js (Agent 257)
// Real-browser contrast/names/overflow audit for dashboard/course/journey/progress pages
// (the lesson-player and quiz-result equivalents live in lesson-contrast-names.js /
// quiz-result-contrast.js). Seeds a MIXED progress state (some lessons/quizzes passed,
// some failed, some untouched) via the app's own mylingo.progress.v1 localStorage key so
// pages render their real "in progress" visuals, not just the empty/zero state.
// Usage: python3 -m http.server 8765 &  then
//   NODE_PATH=$(npm root -g) node tools/a11y/pages-contrast.js
// Env: BASE, OUT, ONLY=comma-separated page keys (see PAGES below)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const BASE = process.env.BASE || 'http://localhost:8765/';
const OUT = process.env.OUT || '/tmp/pages_audit.json';
const contrastFn = require('./contrast-fn.js');
const namesFn = fs.readFileSync(path.join(__dirname, 'lesson-contrast-names.js'), 'utf8').match(/const namesFn=`(.*?)`;\n\(async/s)[1];

function buildSeed() {
  const seed = {};
  let n = 0;
  for (const L of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
    const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, 'course_content/lessons', L + '.json'), 'utf8')).filter((l) => l.status === 'published');
    lessons.forEach((l, i) => {
      n++;
      const pass = n % 3 !== 0; // mix: 2/3 passed, 1/3 failed/low, rest untouched (no entry)
      const ids = [].concat(l.lesson_quiz_id || [], l.exercise_quiz_ids || []);
      if (i % 5 === 0) return; // leave ~20% completely untouched
      ids.forEach((id) => { seed[id] = { status: 'completed', best: pass ? 90 + (n % 10) : 20 + (n % 30), percent: pass ? 90 : 30, attempts: 1 + (n % 3) }; });
    });
  }
  return seed;
}

const PAGES = {
  main_index: 'main/index.html',
  main_progress: 'main/progress.html',
  main_placement: 'main/placement.html',
  main_practice: 'main/practice.html',
  a1_dashboard: 'a1/dashboard.html',
  a2_dashboard: 'a2/dashboard.html',
  b1_dashboard: 'b1/dashboard.html',
  b2_dashboard: 'b2/dashboard.html',
  c1_dashboard: 'c1/dashboard.html',
  c2_dashboard: 'c2/dashboard.html',
  a1_index: 'a1/index.html',
  a2_index: 'a2/index.html',
  b1_index: 'b1/index.html',
  b2_index: 'b2/index.html',
  c1_index: 'c1/index.html',
  c2_index: 'c2/index.html',
  course_a1: 'courses/course.html?level=a1',
  course_b1: 'courses/course.html?level=b1',
  journey_a1: 'courses/journey.html?level=a1',
  courses_index: 'courses/index.html',
  quiz_a1_midquiz: 'shared/quiz.html?quiz=a1-001&level=a1&recommended=1',
  quiz_placement_midquiz: 'shared/quiz.html?quiz=placement-120&level=a1&mode=placement',
};

(async () => {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(PAGES);
  const seed = buildSeed();
  const b = await chromium.launch();
  const results = [];
  for (const key of only) {
    const url = PAGES[key];
    if (!url) { console.log('unknown page key', key); continue; }
    for (const scheme of ['light', 'dark']) {
      for (const w of [390, 320]) {
        const ctx = await b.newContext({ viewport: { width: w, height: 700 }, colorScheme: scheme });
        await ctx.addInitScript((s) => { try { localStorage.setItem('mylingo.progress.v1', JSON.stringify(s)); } catch (e) {} }, seed);
        const pg = await ctx.newPage();
        const errs = [];
        pg.on('console', (m) => { if (m.type() === 'error' && !/status of 403/.test(m.text())) errs.push('console ' + m.text()); });
        pg.on('pageerror', (e) => errs.push('pageerror ' + e.message));
        pg.on('requestfailed', (r) => { if (!/youtube\.com/.test(r.url())) errs.push('reqfail ' + r.url()); });
        await pg.goto(BASE + url, { waitUntil: 'networkidle', timeout: 15000 }).catch((e) => errs.push('goto ' + e.message));
        await pg.waitForTimeout(300);
        const c = await pg.evaluate(contrastFn).catch((e) => [{ err: e.message }]);
        const n = await pg.evaluate(namesFn).catch((e) => ({ err: e.message }));
        results.push({ key, scheme, w, contrast: (Array.isArray(c) ? c : []).filter((x) => x.sel !== 'span.sep'), names: n, errs });
        await ctx.close();
      }
    }
  }
  await b.close();
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  const issues = results.filter((r) => r.contrast.length || (r.names && (r.names.unnamed || []).length) || (r.names && r.names.h1 === 0) || (r.names && (r.names.dupIds || []).length) || (r.names && r.names.overflow) || r.errs.length);
  console.log('runs', results.length, 'with issues', issues.length);
  issues.forEach((r) => console.log(r.key, r.scheme, r.w, 'contrast:', JSON.stringify(r.contrast).slice(0, 200), 'unnamed:', (r.names.unnamed || []).length, 'h1:', r.names.h1, 'dupIds:', r.names.dupIds, 'overflow:', r.names.overflow, 'errs:', r.errs));
})();
