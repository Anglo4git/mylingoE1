import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function load() {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'https://example.test/a1/dashboard.html', runScripts: 'dangerously' });
  const context = dom.getInternalVMContext();
  for (const file of [
    'site/shared/js/skill-mastery.js',
    'site/shared/js/review-scheduler.js',
    'site/shared/js/mastery-review-ui.js'
  ]) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return { dom, ui: dom.window.MylingoMasteryReviewUI };
}

describe('mastery + review dashboard UI', () => {
  it('renders a useful empty state for a new learner', () => {
    const { dom, ui } = load();
    const target = dom.window.document.createElement('div');
    const out = ui.render(target, { level: 'a1', masteryStore: { version: 1, skills: {} }, reviewStore: { version: 1, skills: {} }, now: 1000 });
    expect(out.summary.dueCount).toBe(0);
    expect(out.summary.skillCount).toBe(0);
    expect(target.textContent).toContain('Today’s Review');
    expect(target.textContent).toContain('mastery profile will appear after you complete a graded quiz');
    expect(target.querySelector('a.mr-action')?.textContent).toBe('Practice A1');
  });

  it('prioritizes due skills and derives mastery from the existing stores', () => {
    const { dom, ui } = load();
    const masteryStore = {
      version: 1,
      updated_at: 900,
      skills: {
        grammar: { question_count: 10, correct_count: 5, attempt_count: 2, accuracy: 50, mastery_band: 'needs_support', confidence: 'medium' },
        vocabulary: { question_count: 10, correct_count: 9, attempt_count: 3, accuracy: 90, mastery_band: 'mastered', confidence: 'medium' }
      }
    };
    const reviewStore = {
      version: 1,
      updated_at: 900,
      skills: {
        grammar: { interval_days: 1, consecutive_successes: 0, last_accuracy: 50, last_review_at: 0, due_at: 500, last_quiz_id: 'a1-g', last_level: 'a1' },
        vocabulary: { interval_days: 14, consecutive_successes: 2, last_accuracy: 90, last_review_at: 0, due_at: 5000, last_quiz_id: 'a1-v', last_level: 'a1' }
      }
    };
    const target = dom.window.document.createElement('div');
    const out = ui.render(target, { level: 'a1', masteryStore, reviewStore, now: 1000 });
    expect(out.summary.dueCount).toBe(1);
    expect(out.summary.due[0].skill).toBe('grammar');
    expect(out.nextAction.skill).toBe('grammar');
    expect(out.nextAction.reason).toContain('50% accuracy');
    expect(target.textContent).toContain('grammar');
    expect(target.textContent).toContain('Due now');
    expect(target.textContent).toContain('Needs support');
    expect(target.textContent).toContain('Mastered');
    expect(target.querySelectorAll('.mr-row').length).toBe(3);
  });

  it('uses next weakest mastery when nothing is due', () => {
    const { ui } = load();
    const out = ui.compute({
      level: 'b1',
      now: 1000,
      masteryStore: { version: 1, skills: {
        writing: { question_count: 20, correct_count: 12, attempt_count: 4, accuracy: 60, mastery_band: 'developing', confidence: 'medium' },
        reading: { question_count: 20, correct_count: 18, attempt_count: 4, accuracy: 90, mastery_band: 'mastered', confidence: 'medium' }
      } },
      reviewStore: { version: 1, skills: {
        writing: { interval_days: 3, consecutive_successes: 1, last_accuracy: 70, due_at: 9000 },
        reading: { interval_days: 14, consecutive_successes: 2, last_accuracy: 90, due_at: 9000 }
      } }
    });
    expect(out.summary.dueCount).toBe(0);
    expect(out.nextAction.skill).toBe('writing');
    expect(out.nextAction.reason).toContain('Lowest current mastery');
  });
});
