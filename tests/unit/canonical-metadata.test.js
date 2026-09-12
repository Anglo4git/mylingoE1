import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/canonical-metadata.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.MylingoCanonicalMetadata;
}

describe('Agent 64 — canonical skill/objective metadata', () => {
  it('exposes the six canonical skills and category mapping', () => {
    const m = load();
    expect(m.SKILLS).toEqual(['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'usage']);
    expect(m.skillForCategory('Academic English')).toBe('usage');
  });

  it('prefers explicit skill and objective while accepting generation alias', () => {
    const m = load();
    expect(m.normalize({ category: 'Grammar', skill: 'grammar', learning_objective: ' Use tense accurately. ' })).toEqual({
      skill: 'grammar', objective: 'Use tense accurately.'
    });
  });

  it('derives only the safe category skill and does not invent an objective', () => {
    const m = load();
    expect(m.normalize({ category: 'Vocabulary' })).toEqual({ skill: 'vocabulary' });
  });
});
