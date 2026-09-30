// Agent 312: headless probe for embedded/skill lessons. Serves from BASE (default http://localhost:8765/). ONLY=<lesson_id,...>. Fakes window.YT so the video gate unlocks; checks audio slide (200, duration, focusable, height>=44), h-scroll at 390/320, tab stops + visible focus, .lesson-content spacing. Run in the background (~6 s/lesson x 2 widths).
const { chromium } = require('playwright');
const fs=require('fs');const ROOT=require('path').resolve(__dirname,'..','..');const BASE='http://localhost:8765/';
(async()=>{
  const ids=(process.env.ONLY||'course-b1-unit-01-lesson-01').split(',');
  const b=await chromium.launch();
  const out=[];
  for(const id of ids){
    const L=id.split('-')[1];
    const seed={};const ls=JSON.parse(fs.readFileSync(`${ROOT}/course_content/lessons/${L}.json`));
    ls.forEach(l=>(l.exercise_quiz_ids||[]).concat(l.lesson_quiz_id?[l.lesson_quiz_id]:[]).forEach(q=>seed[q]={status:'completed',best:100,percent:100,attempts:1}));
    for(const w of [390,320]){
      const ctx=await b.newContext({viewport:{width:w,height:800}});
      await ctx.route(/youtube|ytimg|googlevideo/,r=>r.abort());await ctx.addInitScript(()=>{window.YT={Player:function(id,o){setTimeout(function(){o.events.onStateChange({data:0})},50)}}});
      await ctx.addInitScript(s=>{try{localStorage.setItem('mylingo.progress.v1',JSON.stringify(s))}catch(e){}},seed);
      const pg=await ctx.newPage();const errs=[];
      pg.on('pageerror',e=>errs.push(e.message));
      pg.on('requestfailed',r=>{if(!/youtube\.com/.test(r.url()))errs.push('reqfail '+r.url())});
      await pg.goto(`${BASE}courses/lesson.html?lesson=${id}&level=${L}`,{waitUntil:'networkidle'}).catch(e=>errs.push(e.message));
      await pg.waitForTimeout(300);
      const tabs=await pg.$$('.trail-item,[role=tab]');
      const rec={id,w,slides:tabs.length,audio:null,errs};
      for(let i=0;i<tabs.length;i++){
        if(i>0){const nx=pg.locator('#navNext');if(await nx.count()){await nx.click().catch(()=>{})}}await pg.waitForTimeout(250);
        const a=await pg.evaluate(async()=>{
          const au=document.querySelector('audio');
          const ov=document.documentElement.scrollWidth>document.documentElement.clientWidth+1;
          let sp=null;
          const bq=document.querySelector('blockquote'),h3=document.querySelector('h3');
          const pick=q=>{const e=document.querySelector(q);if(!e)return null;const c=getComputedStyle(e);return {mt:parseFloat(c.marginTop),mb:parseFloat(c.marginBottom),fs:parseFloat(c.fontSize),lh:c.lineHeight}};
          if(h3||bq||document.querySelector('.uk-us')){sp={h3:pick('.lesson-content h3'),h4:pick('.lesson-content h4'),bq:pick('.lesson-content blockquote'),uu:pick('.uk-us'),p:pick('.lesson-content p')}}
          if(!au)return {ov,sp};
          const r={ov,sp,src:au.getAttribute('src'),ctl:au.controls};
          try{const resp=await fetch(au.src);r.status=resp.status;r.bytes=(await resp.arrayBuffer()).byteLength}catch(e){r.fetch=e.message}
          await new Promise(res=>{au.addEventListener('loadedmetadata',res,{once:true});au.addEventListener('error',res,{once:true});au.load();setTimeout(res,3000)});
          r.dur=au.duration;r.ready=au.readyState;r.err=au.error&&au.error.code;
          const bx=au.getBoundingClientRect();r.h=Math.round(bx.height);r.w=Math.round(bx.width);
          au.focus();r.focusable=document.activeElement===au;
          return r});
        if(a.src){rec.audio=a}
        if(a.ov)rec.overflow=(rec.overflow||[]).concat(i);
        if(a.sp&&a.sp.h3){rec.sp=a.sp;const q=a.sp;const bad=[];['h3','h4','bq','uu','p'].forEach(k=>{const v=q[k];if(v&&(v.fs<14||(k!=='p'&&v.mt+v.mb<8)))bad.push(k)});if(bad.length)rec.spBad=(rec.spBad||[]).concat(bad)}
      }
      // keyboard: tab order reaches Continue/next and tabs; focus visible
      const seen=new Set();let noOutline=0;
      for(let k=0;k<25;k++){await pg.keyboard.press('Tab');const f=await pg.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const cs=getComputedStyle(e);const vis=(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||cs.boxShadow!=='none';return {k:e.tagName+'.'+(e.className||'').toString().slice(0,30)+'|'+(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,20),vis}});if(f){seen.add(f.k);if(!f.vis)noOutline++}}
      rec.tabStops=seen.size;rec.noOutline=noOutline;
      out.push(rec);await ctx.close();
    }
  }
  await b.close();
  fs.writeFileSync(process.env.OUT||'/tmp/embedded-audio-keyboard.json',JSON.stringify(out,null,1));
  console.log(JSON.stringify(out.map(r=>({id:r.id.slice(7),w:r.w,sl:r.slides,au:r.audio&&{s:r.audio.status,b:r.audio.bytes,d:r.audio.dur,e:r.audio.err,f:r.audio.focusable,h:r.audio.h},ov:r.overflow,sb:r.spBad,ts:r.tabStops,no:r.noOutline,er:r.errs.length}))));
})();
