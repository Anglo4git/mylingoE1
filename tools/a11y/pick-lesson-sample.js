// tools/a11y/pick-lesson-sample.js (Agent 259)
// Picks N unaudited published lessons per level (spread across units) that aren't already
// in audited-lessons.json, prints a comma-separated ONLY= list, and (with --mark) appends
// them to audited-lessons.json so the next agent doesn't re-cover the same ground.
// Usage:
//   node tools/a11y/pick-lesson-sample.js [perLevel=2]        # just print the list
//   node tools/a11y/pick-lesson-sample.js [perLevel=2] --mark # print AND record as audited
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const TRACK = path.join(__dirname, 'audited-lessons.json');
const perLevel = Number(process.argv[2]) || 2;
const mark = process.argv.includes('--mark');
const done = new Set(JSON.parse(fs.readFileSync(TRACK, 'utf8')));
const picked = [];
for (const L of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) {
  const lessons = JSON.parse(fs.readFileSync(path.join(ROOT, 'course_content/lessons', L + '.json'), 'utf8'))
    .filter((l) => l.status === 'published' && !done.has(l.lesson_id));
  const step = Math.max(1, Math.floor(lessons.length / perLevel));
  for (let i = 0; i < perLevel && i * step < lessons.length; i++) picked.push(lessons[i * step].lesson_id);
}
console.log(picked.join(','));
console.log('# ' + picked.length + ' picked, ' + done.size + ' already audited before this pick');
if (mark) {
  picked.forEach((id) => done.add(id));
  fs.writeFileSync(TRACK, JSON.stringify([...done].sort(), null, 1));
  console.log('# recorded ' + picked.length + ' new ids in audited-lessons.json (now ' + done.size + ' total)');
}
