import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const quizPath = path.resolve(process.cwd(), 'site/shared/quiz.html');
const source = fs.readFileSync(quizPath, 'utf8');
const gradedTotalSrc = source.match(/function gradedTotal\(\)\{[^}]*\}/);
if (!gradedTotalSrc) throw new Error('gradedTotal() not found in quiz.html');

/** Run gradedTotal() against a fake `data` object, isolated in its own VM context. */
function gradedTotalFor(questions) {
  const sandbox = {
    data: { questions },
    rawType: (q) => q.question_type || 'radio'
  };
  vm.createContext(sandbox);
  vm.runInContext(gradedTotalSrc[0] + '\nthis.__result = gradedTotal();', sandbox);
  return sandbox.__result;
}

/**
 * Milestone 10 -- Graded Question Count Consistency.
 *
 * `gradedTotal()` excludes non-gradable `banner` questions from the
 * denominator used for score percentage, placement evidence, and session
 * validation. The results screen (`end()`) must use that same graded
 * denominator everywhere it reports or forwards a "total" for the current
 * quiz attempt -- not the raw `data.questions.length`, which includes
 * ungraded banner interstitials. Mixing the two silently breaks the
 * displayed score text and the gamification perfect-score bonus (which
 * requires `correct === total`) as soon as any quiz includes a banner
 * question.
 */
describe('Graded question count consistency', () => {
  it('gradedTotal() is computed once per end() and reused for both the score text and recordSession', () => {
    expect(source).toContain('const graded=gradedTotal();');
    expect(source).toContain('const pct=graded?Math.round(score/graded*100):100;');
    expect(source).toContain("$('message').textContent='You scored '+score+' out of '+graded+' ('+pct+'%).';");
    expect(source).toContain('window.MylingoGamification.recordSession(score,graded,new Date(),{quizId:data.id,quizVersion:String(data.version||1),mode});');
  });

  it('does not regress to the raw question count for score reporting or XP', () => {
    // These are the exact call sites that previously used
    // data.questions.length as a score denominator instead of gradedTotal().
    expect(source).not.toContain("'You scored '+score+' out of '+data.questions.length+' ('+pct+'%).'");
    expect(source).not.toContain('recordSession(score,data.questions.length,new Date()');
  });

  it('still uses the raw question count for position/navigation concerns, which is correct', () => {
    // Step counters, the progress bar, and the frozen legacy progress
    // schema (current/totalQuestions) track the learner's position through
    // every question shown, banners included -- these are intentionally
    // unaffected by this fix.
    expect(source).toContain("setTextSmooth($('counter'),(i+1)+' / '+data.questions.length);");
    expect(source).toContain('totalQuestions:data.questions.length');
    expect(source).toContain('current:done?data.questions.length:i,score,');
  });
});

describe('gradedTotal() behavior', () => {
  it('counts all questions when there are no banners', () => {
    const questions = [{ question_type: 'radio' }, { question_type: 'radio' }, { question_type: 'radio' }];
    expect(gradedTotalFor(questions)).toBe(3);
  });

  it('excludes banner questions from the graded total', () => {
    const questions = [
      { question_type: 'banner' },
      { question_type: 'radio' },
      { question_type: 'radio' },
      { question_type: 'banner' }
    ];
    expect(gradedTotalFor(questions)).toBe(2);
  });

  it('a perfect graded score correctly satisfies the XP perfect-bonus condition even with banners present', () => {
    // Simulates the fixed end() flow: 2 real questions, both correct, plus
    // 2 banner interstitials that are not gradable.
    const questions = [
      { question_type: 'banner' },
      { question_type: 'radio' },
      { question_type: 'radio' },
      { question_type: 'banner' }
    ];
    const graded = gradedTotalFor(questions);
    const score = 2; // both real questions answered correctly
    const rawTotal = questions.length; // 4

    expect(graded).toBe(2);
    // This is the exact condition calculateXp() checks for PERFECT_BONUS.
    expect(score === graded).toBe(true);
    // Before the fix, recordSession received rawTotal instead of graded,
    // so this same perfect attempt would have failed the bonus check.
    expect(score === rawTotal).toBe(false);
  });
});
