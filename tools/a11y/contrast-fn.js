// Shared in-page contrast checker source (Agent 256; extracted from lesson-contrast-names.js).
module.exports=`(function(){
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
