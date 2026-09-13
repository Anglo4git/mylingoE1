(function(){
  'use strict';
  if(window.__mylingoSplashLoaded) return;
  window.__mylingoSplashLoaded=true;
  var KEY='mylingo.splash.v1';
  try{ if(sessionStorage.getItem(KEY)==='1') return; sessionStorage.setItem(KEY,'1'); }catch(e){}
  function mount(){
    if(document.getElementById('mylingoSplash')) return;
    var el=document.createElement('div');
    el.id='mylingoSplash';
    el.setAttribute('role','status');
    el.setAttribute('aria-label','Loading Mylingo');
    el.innerHTML='<div class="mylingo-splash-card"><img src="'+(location.pathname.split('/').length>2?'../':'./')+'shared/brand/icon.svg" alt="" width="72" height="72"><strong>Mylingo</strong><span>Learn English your way.</span></div>';
    var style=document.createElement('style');
    style.textContent='#mylingoSplash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#f7f9fc;color:#17212b;transition:opacity .28s ease,visibility .28s ease}#mylingoSplash.hide{opacity:0;visibility:hidden;pointer-events:none}.mylingo-splash-card{text-align:center;display:grid;justify-items:center;gap:8px}.mylingo-splash-card img{border-radius:20px;box-shadow:0 8px 0 #0e45ae}.mylingo-splash-card strong{font:900 24px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.mylingo-splash-card span{font:500 13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;opacity:.65}@media(prefers-color-scheme:dark){#mylingoSplash{background:#0b1220;color:#f4f7fb}.mylingo-splash-card img{box-shadow:0 8px 0 #3477d6}}@media(prefers-reduced-motion:reduce){#mylingoSplash{transition:none}}';
    document.head.appendChild(style); document.body.appendChild(el);
    var hide=function(){setTimeout(function(){el.classList.add('hide');setTimeout(function(){el.remove();style.remove()},320)},350)};
    if(document.readyState==='complete') hide(); else window.addEventListener('load',hide,{once:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
