import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/orientation.js', 'utf8');
  const context = { window: {}, localStorage: { getItem:()=>null, setItem:()=>{} } };
  vm.runInNewContext(source, context);
  return context.window.MylingoOrientation;
}

describe('Mylingo orientation', () => {
  it('contains exactly 10 questions', () => expect(load().QUESTIONS).toHaveLength(10));
  it('scores answers and routes low/high profiles to sensible extremes', () => {
    const o = load();
    const low = Array(10).fill(0);
    const high = Array(10).fill(4);
    expect(o.recommendation(low).level).toBe('a1');
    expect(o.recommendation(high).level).toBe('c2');
  });
  it('keeps contextual exposure and goal from overpowering skill answers', () => {
    const o = load();
    const answers = [0,0,0,0,0,0,0,4,4,0];
    expect(['a1','a2']).toContain(o.recommendation(answers).level);
  });
  it('generates a real placement URL', () => {
    const o = load();
    expect(o.placementUrl('b1')).toContain('quiz=placement-001');
    expect(o.placementUrl('b1')).toContain('level=b1');
    expect(o.placementUrl('b1')).toContain('mode=placement');
  });
});
