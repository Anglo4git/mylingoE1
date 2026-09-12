import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'site');
const quiz = fs.readFileSync(path.join(root, 'shared/quiz.html'), 'utf8');
const lesson = fs.readFileSync(path.join(root, 'courses/lesson.html'), 'utf8');
const journey = fs.readFileSync(path.join(root, 'courses/journey.html'), 'utf8');
const homepage = fs.readFileSync(path.join(root, 'main/index.html'), 'utf8');
const courseProgress = fs.readFileSync(path.join(root, 'shared/js/course-progress.js'), 'utf8');
const skillMastery = fs.readFileSync(path.join(root, 'shared/js/skill-mastery.js'), 'utf8');
const reviewScheduler = fs.readFileSync(path.join(root, 'shared/js/review-scheduler.js'), 'utf8');

describe('Agent 80 review + mastery integration', () => {
  it('resume/exit/back controls route through the calling context (redirect), not just the bare level home', () => {
    expect(quiz).toContain('function backTarget()');
    expect(quiz).toContain("$('exitBtn').onclick=()=>{stopAllSounds();location.href=backTarget()}");
    expect(quiz).toContain("$('homeBtn').onclick=()=>{stopAllSounds();location.href=backTarget()}");
    expect(quiz).toContain("$('endHome').onclick=()=>{stopAllSounds();location.href=backTarget()}");
    expect(quiz).toContain("$('errHomeBtn').onclick=()=>{stopAllSounds();location.href=backTarget()}");
  });

  it('redirect target is validated as a same-site relative path before use', () => {
    expect(quiz).toContain('function isSafeRedirect(url)');
    // guards against an absolute/scheme URL or protocol-relative host being reflected back
    expect(quiz).toMatch(/isSafeRedirect[\s\S]{0,400}scheme|isSafeRedirect\(url\)\{return[\s\S]*?a-z0-9\+\.\-/i);
  });

  it('lesson, journey, and homepage all pass redirect so a learner returns to that exact context', () => {
    expect(lesson).toContain("(redirect?'&redirect='+encodeURIComponent(redirect):'')");
    expect(journey).toContain("&redirect='+encodeURIComponent('./journey.html");
    expect(homepage).toContain("&redirect='+encodeURIComponent('../main/index.html')");
  });

  it('quiz completion is the single write path for progress, mastery, and review', () => {
    expect(quiz).toContain('recordAndPersist'); // skill-mastery
    expect(quiz).toContain('window.MylingoReviewScheduler'); // review-scheduler
    expect(quiz).toContain("mode!=='placement' && window.MylingoReviewScheduler"); // review excludes placement
    expect(quiz).toContain('localStorage.setItem(KEY,JSON.stringify(x))'); // canonical progress write
  });

  it('mastery and review scheduler each own exactly one storage key, distinct from progress and from each other', () => {
    expect(skillMastery).toContain("STORAGE_KEY = 'mylingo.skill-mastery.v1'");
    expect(reviewScheduler).toContain("STORAGE_KEY = 'mylingo.review-scheduling.v1'");
    expect(skillMastery).not.toContain('mylingo.progress.v1');
    expect(reviewScheduler).not.toContain('mylingo.progress.v1');
    expect(skillMastery).not.toContain('mylingo.review-scheduling.v1');
    expect(reviewScheduler).not.toContain('mylingo.skill-mastery.v1');
  });

  it('course-progress.js remains a read-only projection: no writes, no second progress/session store', () => {
    expect(courseProgress).not.toMatch(/localStorage\.setItem/);
    expect(courseProgress).toContain("PROGRESS_KEY='mylingo.progress.v1'");
    // must read the same sharded session key quiz.html actually writes to
    expect(courseProgress).toContain("SESSION_PREFIX='mylingo.sessions.v3.'");
    expect(quiz).toContain("SESSION_SHARD_PREFIX='mylingo.sessions.v3.'");
  });

  it('mastery/review recording is best-effort and never blocks quiz completion or the results screen', () => {
    // both blocks must be wrapped in their own try/catch ahead of show('end')
    const masteryBlock = quiz.slice(quiz.indexOf('MylingoSkillMastery.recordAndPersist') - 120, quiz.indexOf('MylingoSkillMastery.recordAndPersist'));
    const reviewBlock = quiz.slice(quiz.indexOf('MylingoReviewScheduler.recordAndPersist') - 160, quiz.indexOf('MylingoReviewScheduler.recordAndPersist'));
    expect(masteryBlock).toContain('try{');
    expect(reviewBlock).toContain('try{');
    expect(quiz.indexOf("show('end')")).toBeGreaterThan(quiz.indexOf('MylingoReviewScheduler.recordAndPersist'));
  });
});
