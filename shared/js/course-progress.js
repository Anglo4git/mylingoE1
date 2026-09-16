// @ts-check
/**
 * Course-progress read/derive boundary. Persisted progress is untrusted input.
 */
(function(global){'use strict';
var PROGRESS_KEY='mylingo.progress.v1',SESSION_INDEX='mylingo.sessions.v3.index',SESSION_PREFIX='mylingo.sessions.v3.';
// Quiz mastery uses MASTERY_THRESHOLD; lesson completion separately requires
// LESSON_COMPLETION_THRESHOLD percent of linked quizzes to be mastered — not just
// attempted/marked completed with any score. Single named constant,
// referenced by every page that needs the threshold (course.html,
// journey.html, courses/index.html all include this script and call
// isMastered() below) instead of the number being hand-copied into each.
var MASTERY_THRESHOLD=60;
var LESSON_COMPLETION_THRESHOLD=90;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})}
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}}
function progress(){return read(PROGRESS_KEY,{})}
function sessionFor(id){try{return read(SESSION_PREFIX+encodeURIComponent(id),null)}catch(e){return null}}
function sessionRatio(id,total){var s=sessionFor(id);if(!s||s.status!=='in-progress'||!Number.isInteger(s.questionIndex)||!total)return 0;return Math.max(0,Math.min(99,Math.round((s.questionIndex/total)*100)))}
// A quiz record counts as mastered when it's completed AND scored at or
// above MASTERY_THRESHOLD. `best` (the highest percent score across
// attempts) has been persisted by shared/quiz.html's save() for as long as
// the completed/in-progress status field has existed, so any genuinely old
// record with status==='completed' but no `best` predates that — there's
// no server-side recovery path for a client-only progress store, so a
// missing score is grandfathered as passing rather than silently
// regressing a returning learner's progress bar to "incomplete".
function isMastered(record){
  if(!record||record.status!=='completed') return false;
  if(record.best==null) return true; // pre-threshold legacy record — grandfathered
  return record.best>=MASTERY_THRESHOLD;
}
function lessonCompletionRecord(lesson,p){
  var ids=lesson&&lesson.exercise_quiz_ids||[];
  if(!ids.length && lesson&&lesson.lesson_quiz_id) ids=[lesson.lesson_quiz_id];
  if(!ids.length)return {completed:false,progress:0,gateId:null};
  var done=ids.filter(function(id){return isMastered(p[id])}).length;
  var completionPct=Math.round((done/ids.length)*100);
  if(completionPct>=LESSON_COMPLETION_THRESHOLD)return {completed:true,progress:100,gateId:ids[ids.length-1]};
  var partial=ids.find(function(id){return p[id]&&p[id].status==='in-progress'});
  if(partial)return {completed:false,progress:Math.round(((done+sessionRatio(partial,p[partial].totalQuestions||0)/100)/ids.length)*100),gateId:partial};
  return {completed:false,progress:completionPct,gateId:null};
}
function lessonIsComplete(lesson,p){return lessonCompletionRecord(lesson,p).completed}
function lessonPercent(lesson,p){return lessonCompletionRecord(lesson,p).progress}
function fetchJson(url){return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw Error(String(r.status));return r.json()})}
var ALL_LEVELS=['a1','a2','b1','b2','c1','c2'];
// Homepage "continue" card can surface a lesson from any level, so this
// needs lessons across all of them — fetch the six per-level files in
// parallel and concat, instead of the old all-levels lessons.json bundle.
// Falls back to the monolith if a per-level file can't be fetched.
function fetchAllLessons(){return Promise.all(ALL_LEVELS.map(function(lvl){return fetchJson('../course_content/lessons/'+lvl+'.json')})).then(function(lists){return lists.reduce(function(a,b){return a.concat(b)},[])}).catch(function(){return fetchJson('../course_content/lessons.json')})}
function resolveHomepageState(){return Promise.all([fetchJson('../course_content/courses.json'),fetchJson('../course_content/units.json'),fetchAllLessons()]).then(function(a){var courses=a[0],units=a[1],lessons=a[2],p=progress(),flat=[];courses.filter(function(c){return c.status==='published'}).forEach(function(c){units.filter(function(u){return u.course_id===c.course_id}).forEach(function(u){lessons.filter(function(l){return l.unit_id===u.unit_id&&l.status==='published'}).sort(function(x,y){return x.order-y.order}).forEach(function(l){flat.push({course:c,unit:u,lesson:l,percent:lessonPercent(l,p)})})})});var active=flat.find(function(x){return x.percent>0&&x.percent<100});if(!active)active=flat.find(function(x){return x.percent===100?false:(x.lesson.exercise_quiz_ids||[]).some(function(id){return p[id]})});return active||null})}
global.MylingoCourseProgress={readProgress:progress,lessonPercent:lessonPercent,lessonCompletionRecord:lessonCompletionRecord,lessonIsComplete:lessonIsComplete,resolveHomepageState:resolveHomepageState,esc:esc,isMastered:isMastered,MASTERY_THRESHOLD:MASTERY_THRESHOLD,LESSON_COMPLETION_THRESHOLD:LESSON_COMPLETION_THRESHOLD};
})(window);
