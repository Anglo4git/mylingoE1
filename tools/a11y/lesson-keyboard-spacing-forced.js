const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const ROOT='/home/claude/work';const BASE='http://localhost:8765/';
(async()=>{
const seed={},pages=[];
for(const L of ['a1','a2','b1','b2','c1','c2']){for(const l of JSON.parse(fs.readFileSync(`${ROOT}/course_content/lessons/${L}.json`))){(l.exercise_quiz_ids||[]).concat([l.lesson_quiz_id]).forEach(id=>seed[id]={status:'completed',best:100});pages.push({L,id:l.lesson_id,ex:l.exercise_quiz_ids||[]})}}
const b=await chromium.launch();const out={focus:[],spacing:[],forced:[],quizres:[]};
const mk=async(o)=>{const c=await b.newContext(o);await c.addInitScript(s=>localStorage.setItem('mylingo.progress.v1',JSON.stringify(s)),seed);return c};
// keyboard + text spacing (light; lesson player is light-only)
let ctx=await mk({viewport:{width:390,height:844}});
for(const p of pages){const pg=await ctx.newPage();await pg.goto(`${BASE}courses/lesson.html?lesson=${p.id}&level=${p.L}`,{waitUntil:'networkidle'});
 const seen=[];let first=null;
 for(let i=0;i<30;i++){await pg.keyboard.press('Tab');const r=await pg.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const cs=getComputedStyle(e);const vis=(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||(cs.boxShadow&&cs.boxShadow!=='none');return {k:e.tagName+'.'+e.className,vis,txt:(e.textContent||'').trim().slice(0,20)}});
  if(!r)continue;if(first===null)first=r.k;else if(r.k===first&&seen.length>2&&seen.some(s=>s.k===r.k&&s.txt===r.txt)&&i>3)break;seen.push(r);if(!r.vis)out.focus.push(p.id+' '+r.k+' '+r.txt)}
 if(!/skip-link/.test(seen[0]?.k||''))out.focus.push(p.id+' first tab not skip-link: '+seen[0]?.k);
 await pg.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
 const sp=await pg.evaluate(()=>{let clip=0;document.querySelectorAll('h1,h2,h3,p,li,button,a,span,label').forEach(e=>{const cs=getComputedStyle(e);if(cs.display==='none')return;if((cs.overflow==='hidden'||cs.overflowX==='hidden')&&e.scrollWidth>e.clientWidth+2&&e.clientWidth>0)clip++;if(cs.overflow==='hidden'&&e.scrollHeight>e.clientHeight+2&&e.clientHeight>0)clip++});return {clip,over:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});
 if(sp.clip||sp.over)out.spacing.push(p.id+' '+JSON.stringify(sp));
 await pg.close()}
await ctx.close();
// forced colors
ctx=await mk({viewport:{width:390,height:844},forcedColors:'active'});
for(const p of pages.slice(0,3).concat(pages.filter(x=>x.id==='course-a2-unit-02-lesson-02'))){const pg=await ctx.newPage();await pg.goto(`${BASE}courses/lesson.html?lesson=${p.id}&level=${p.L}`,{waitUntil:'networkidle'});
 const r=await pg.evaluate(()=>{const t=[...document.querySelectorAll('.trail-item')];return t.map(e=>{const cs=getComputedStyle(e);return {cls:e.className,outline:cs.outlineStyle+' '+cs.outlineWidth,deco:cs.textDecorationLine}})});out.forced.push({id:p.id,r});await pg.close()}
await ctx.close();
// quiz result variants: complete the quiz by answering, in light+dark, check result screen overflow/contrast basics via audit fn
await b.close();
fs.writeFileSync('audit2.json',JSON.stringify(out,null,1));
console.log('focus issues',out.focus.length,out.focus.slice(0,8));console.log('spacing',out.spacing.length,out.spacing.slice(0,5));console.log(JSON.stringify(out.forced[0]),JSON.stringify(out.forced[3]));
})();
