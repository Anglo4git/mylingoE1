const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');
const ROOT='/home/claude/work';
const BASE='http://localhost:8765/';
const levels=['a1','a2','b1','b2','c1','c2'];
const contrastFn=`(function(){
function parse(c){var m=c.match(/rgba?\\(([^)]+)\\)/);if(!m)return null;var p=m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number);return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}}
function lum(c){function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b)}
function over(f,b){var a=f.a;return {r:f.r*a+b.r*(1-a),g:f.g*a+b.g*(1-a),b:f.b*a+b.b*(1-a),a:1}}
function bg(el){var layers=[];var e=el;while(e&&e.nodeType===1){var cs=getComputedStyle(e);if(cs.backgroundImage&&cs.backgroundImage!=='none')return null;var c=parse(cs.backgroundColor);if(c&&c.a>0){layers.push(c);if(c.a>=1)break}e=e.parentElement}
var base={r:255,g:255,b:255,a:1};if(layers.length&&layers[layers.length-1].a>=1)base=layers.pop();
for(var i=layers.length-1;i>=0;i--)base=over(layers[i],base);return base}
var out=[];var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);var n;var seen=new Set();
while(n=w.nextNode()){if(!n.nodeValue.trim())continue;var el=n.parentElement;if(!el||seen.has(el))continue;seen.add(el);
var cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)===0)continue;
var r=el.getBoundingClientRect();if(r.width<1||r.height<1)continue;if(r.bottom<=0||r.right<=0||r.left>=innerWidth+50)continue;
if(el.closest('[disabled],[aria-disabled=true]'))continue;
var fg=parse(cs.color);var b=bg(el);if(!fg||!b)continue;fg=over(fg,b);
var L1=lum(fg),L2=lum(b);var ratio=(Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
var fs=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700;var large=fs>=24||(fs>=18.66&&bold);
if(ratio<(large?3:4.5))out.push({t:n.nodeValue.trim().slice(0,40),ratio:+ratio.toFixed(2),sel:el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'?'.'+el.className.split(' ').join('.'):'')})}
return out})()`;
const namesFn=`(function(){var out=[];
document.querySelectorAll('button,a[href],input,select,textarea,[role=button],[role=tab],[role=progressbar],img,svg[role=img],video,audio,iframe').forEach(function(e){
var cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return;
var n=(e.getAttribute('aria-label')||'').trim()||(e.getAttribute('aria-labelledby')?'x':'')||(e.textContent||'').trim()||(e.getAttribute('title')||'').trim()||(e.tagName==='IMG'?(e.hasAttribute('alt')?'ok':''):'')||(e.id&&document.querySelector('label[for="'+e.id+'"]')?'x':'');
if(e.tagName==='IMG'&&e.getAttribute('alt')==='')return;
if(!n)out.push(e.outerHTML.slice(0,100))});
var h1=document.querySelectorAll('h1').length;var main=document.querySelectorAll('main,[role=main]').length;
var ids={};document.querySelectorAll('[id]').forEach(function(e){ids[e.id]=(ids[e.id]||0)+1});var dup=Object.keys(ids).filter(function(k){return ids[k]>1});
var tiny=[];document.querySelectorAll('button,a[href],[role=tab],[role=button],input,select').forEach(function(e){var r=e.getBoundingClientRect();if(r.width&&r.height&&(r.width<24||r.height<24)){var cs=getComputedStyle(e);if(cs.display!=='inline')tiny.push(e.tagName+':'+(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height))}});
return {unnamed:out,h1:h1,main:main,dupIds:dup,tiny:tiny,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}})()`;
(async()=>{
  const b=await chromium.launch();
  const results=[];const pages=[];
  const seed={};
  for(const L of levels){
    const lessons=JSON.parse(fs.readFileSync(`${ROOT}/course_content/lessons/${L}.json`));
    for(const l of lessons){ if(l.status!=='published')continue;
      (l.exercise_quiz_ids||[]).concat(l.lesson_quiz_id?[l.lesson_quiz_id]:[]).forEach(id=>seed[id]={status:'completed',best:100,percent:100,attempts:1});
      pages.push({L,id:l.lesson_id});}
  }
  const only=process.env.ONLY?process.env.ONLY.split(','):null;
  for(const scheme of ['light','dark']){
   for(const [w,h] of [[390,844],[320,700]]){
    const ctx=await b.newContext({colorScheme:scheme,viewport:{width:w,height:h}});
    await ctx.addInitScript(s=>{try{localStorage.setItem('mylingo.progress.v1',JSON.stringify(s))}catch(e){}},seed);
    for(const p of pages){
      if(only&&!only.includes(p.id))continue;
      const pg=await ctx.newPage();const errs=[];
      pg.on('pageerror',e=>errs.push('pageerror '+e.message));
      pg.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
      pg.on('requestfailed',r=>errs.push('reqfail '+r.url()));
      const url=`${BASE}courses/lesson.html?lesson=${p.id}&level=${p.L}`;
      await pg.goto(url,{waitUntil:'networkidle'}).catch(e=>errs.push('goto '+e.message));
      await pg.waitForTimeout(300);
      const state=await pg.evaluate(()=>({err:!!document.querySelector('.errbox,.error,#error'),txt:document.body.innerText.slice(0,80),tabs:[...document.querySelectorAll('[role=tab]')].map(t=>t.textContent.trim())}));
      const rec={p:p.id,scheme,w,slides:[],errs};
      const nTabs=Math.max(1,state.tabs.length);
      for(let i=0;i<nTabs;i++){
        if(i>0){const t=pg.locator('[role=tab]').nth(i);if(await t.count()){await t.click().catch(()=>{});await pg.waitForTimeout(150)}}
        const c=await pg.evaluate(contrastFn);const n=await pg.evaluate(namesFn);
        rec.slides.push({i,label:state.tabs[i],contrast:c,names:n});
      }
      rec.first=state.txt;
      results.push(rec);await pg.close();
    }
    await ctx.close();
   }
  }
  await b.close();
  fs.writeFileSync('/home/claude/lh/lesson_audit.json',JSON.stringify(results,null,1));
  let bad=0;
  for(const r of results){const issues=[];
    if(r.errs.length)issues.push('errs:'+r.errs.join('|'));
    r.slides.forEach(s=>{if(s.contrast.length)issues.push(`s${s.i} contrast:`+JSON.stringify(s.contrast.slice(0,3)));if(s.names.unnamed.length)issues.push(`s${s.i} unnamed:`+s.names.unnamed.slice(0,2).join(';'));if(s.names.h1!==1)issues.push(`s${s.i} h1=${s.names.h1}`);if(s.names.main!==1)issues.push(`s${s.i} main=${s.names.main}`);if(s.names.dupIds.length)issues.push(`s${s.i} dup ${s.names.dupIds}`);if(s.names.overflow)issues.push(`s${s.i} overflow`)});
    if(issues.length){bad++;console.log(r.p,r.scheme,r.w,issues.join(' ; ').slice(0,400))}}
  console.log('runs',results.length,'with issues',bad);
})();
