#!/usr/bin/env node
/* Step 14 (Agent 13): generate sitemap.xml + the Sitemap line in robots.txt once the production origin is known.
   Usage:  node tools/build-sitemap.js https://your-domain.example
   Nothing is written without an https origin: a sitemap with the wrong host is worse than none.
   Only indexable, content-bearing URLs are listed. Excluded on purpose: /main/index.html (duplicate of /),
   the per-learner pages (dashboards, progress, quiz — all noindex) and the practice redirect stub. */
'use strict';
var fs = require('fs');
var path = require('path');
var LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

function paths() {
  var p = ['/', '/main/placement.html', '/courses/index.html'];
  LEVELS.forEach(function (l) { p.push('/' + l + '/index.html'); });
  LEVELS.forEach(function (l) { p.push('/courses/course.html?level=' + l); });
  return p;
}
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function normalizeOrigin(origin) {
  var u;
  try { u = new URL(String(origin)); } catch (e) { throw new Error('not a valid URL: ' + origin); }
  if (u.protocol !== 'https:') throw new Error('origin must be https:// (got ' + u.protocol + ')');
  if (u.pathname !== '/' || u.search || u.hash) throw new Error('give the bare origin, e.g. https://example.com');
  return u.origin;
}
function buildSitemap(origin) {
  var base = normalizeOrigin(origin);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths().map(function (p) { return '  <url><loc>' + esc(base + p) + '</loc></url>'; }).join('\n') + '\n</urlset>\n';
}
function buildRobots(origin) {
  return 'User-agent: *\nAllow: /\nDisallow: /tests/\nDisallow: /tools/\nSitemap: ' + normalizeOrigin(origin) + '/sitemap.xml\n';
}
module.exports = { paths: paths, buildSitemap: buildSitemap, buildRobots: buildRobots, normalizeOrigin: normalizeOrigin };

if (require.main === module) {
  try {
    var root = path.join(__dirname, '..');
    var xml = buildSitemap(process.argv[2]);
    var robots = buildRobots(process.argv[2]);
    fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
    fs.writeFileSync(path.join(root, 'robots.txt'), robots);
    console.log('wrote sitemap.xml (' + paths().length + ' URLs) and robots.txt for ' + normalizeOrigin(process.argv[2]));
  } catch (e) { console.error('build-sitemap: ' + e.message); process.exit(1); }
}
