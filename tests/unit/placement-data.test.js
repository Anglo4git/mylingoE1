import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

const levels = ['a1','a2','b1','b2','c1','c2'];

function loadEngine() {
  const source = fs.readFileSync('site/shared/js/placement.js', 'utf8');
  const context = { window: { localStorage: { getItem:()=>null, setItem:()=>{} } } };
  vm.runInNewContext(source, context);
  return context.window.MylingoPlacement;
}

describe('placement datasets', () => {
  for (const level of levels) {
    it(`${level} has a 10-question canonical placement quiz`, () => {
      const p = `site/placement/${level}/placement-001.json`;
      const d = JSON.parse(fs.readFileSync(p, 'utf8'));
      expect(d.id).toBe('placement-001');
      expect(d.level.toLowerCase()).toBe(level);
      expect(d.questions).toHaveLength(10);
      d.questions.forEach(q => {
        expect(q.answers.length).toBeGreaterThanOrEqual(2);
        expect(q.answers.length).toBeLessThanOrEqual(9);
        expect(q.correctIndex).toBeGreaterThanOrEqual(1);
        expect(q.correctIndex).toBeLessThanOrEqual(q.answers.length);
        expect(loadEngine().validateQuestionMetadata(q)).toBe(true);
      });
    });
  }
});
