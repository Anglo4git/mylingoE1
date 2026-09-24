const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const fs=require('fs');const ROOT='/home/claude/work';const BASE='http://localhost:8765/';
const src=fs.readFileSync('audit.js','utf8');
const contrastFn=eval('`'+src.match(/const contrastFn=`([\s\S]*?)`;\nconst namesFn/)[1].replace(/\\/g,'\\\\')+'`');
const vis=`(function(){var e=document.getElementById('end');return e&&getComputedStyle(e).display!=='none'})()`;
(async()=>{
 const b=await chromium.launch();const res=[];
 const targets=[];
 for(const L of ['a1','a2','b1','b2','c1','c2']){const q=JSON.parse(fs.readFileSync(`${ROOT}/${L}/quizzes.json`));const step=Math.max(1,Math.floor(q.length/6));q.filter((_,i)=>i%step===0).slice(0,6).forEach(x=>targets.push({L,id:x.id}))}
 targets.push({L:'a1',id:'placement-120',mode:'placement'});
 for(const scheme of ['light','dark']){
  const ctx=await b.newContext({colorScheme:scheme,viewport:{width:390,height:844}});
  for(const t of targets){
   const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
   await pg.goto(`${BASE}shared/quiz.html?quiz=${t.id}&level=${t.L}&recommended=1${t.mode?'&mode=placement':''}`,{waitUntil:'networkidle'}).catch(()=>{});
   if(!(await pg.evaluate(()=>location.pathname.endsWith('quiz.html')))){res.push({t,scheme,skip:'redirected'});await pg.close();continue}
   await pg.click('#startBtn').catch(()=>{});
   let ended=false,stall=0,steps=0;const pick=(t.id.length%2);
   for(;steps<140;steps++){
     if(await pg.evaluate(vis)){ended=true;break}
     const done=await pg.evaluate(()=>{const n=document.getElementById('next');return n&&getComputedStyle(n).display!=='none'});
     if(done){await pg.click('#next').catch(()=>{});stall=0;continue}
     const did=await pg.evaluate((pick)=>{let a=false;const opts=[...document.querySelectorAll('#options .option')];
       if(opts.length){opts[pick%opts.length].click();a=true}
       document.querySelectorAll('#options input[type=text],#options input:not([type])').forEach(i=>{i.value='x';i.dispatchEvent(new Event('input',{bubbles:true}));a=true});
       document.querySelectorAll('#options select').forEach(s=>{if(s.options.length>1){s.selectedIndex=1;s.dispatchEvent(new Event('change',{bubbles:true}));a=true}});
       const c=document.querySelector('.check-answer,#check,#checkBtn');if(c&&!c.disabled){c.click();a=true}
       return a},pick);
     await pg.waitForTimeout(40);
     if(!did)stall++;if(stall>4)break;
   }
   if(ended){await pg.waitForTimeout(400);const c=await pg.evaluate(contrastFn);const ov=await pg.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
     res.push({t,scheme,ended,steps,contrast:c.filter(x=>x.sel!=='span.sep'),ov,pct:await pg.evaluate(()=>document.getElementById('finalPct').textContent),errs})}
   else res.push({t,scheme,ended:false,steps,errs});
   await pg.close();
  }
  await ctx.close();
 }
 await b.close();fs.writeFileSync('audit3.json',JSON.stringify(res,null,1));
 console.log('runs',res.length,'ended',res.filter(r=>r.ended).length,'notended',res.filter(r=>r.ended===false).map(r=>r.t.id+'/'+r.scheme).join(','));
 res.filter(r=>r.ended&&(r.contrast.length||r.ov||r.errs.length)).forEach(r=>console.log(r.t.id,r.scheme,r.pct,JSON.stringify(r.contrast).slice(0,300),r.ov,r.errs));
 console.log('pcts',[...new Set(res.filter(r=>r.ended).map(r=>r.pct))].join(' '));
})();
