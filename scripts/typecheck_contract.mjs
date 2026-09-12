#!/usr/bin/env node
/**
 * Dependency-free static type contract.
 * Confirms @ts-check is intentionally enabled on the selected high-risk
 * modules and that each carries a public-boundary JSDoc contract.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
  'site/shared/js/runtime-content-loader.js',
  'site/shared/js/course-progress.js',
  'site/shared/js/recommendations.js',
  'site/shared/js/review-scheduler.js',
  'site/shared/js/skill-mastery.js'
];
const failures=[];
for(const rel of required){
 const s=fs.readFileSync(path.join(root,rel),'utf8');
 if(!s.startsWith('// @ts-check')) failures.push(`${rel}: missing @ts-check`);
 if(!s.includes('/**')) failures.push(`${rel}: missing JSDoc boundary`);
}
if(failures.length){ failures.forEach(x=>console.error(`BLOCKING: ${x}`)); process.exit(1); }
process.stdout.write(`TYPE CONTRACT: PASS (${required.length} high-risk modules use @ts-check + JSDoc)\n`);
