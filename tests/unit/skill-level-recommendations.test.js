import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/recommendations.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.MylingoRecommendations;
}

const base = {
  recommended_level: 'b1',
  assessed_level: 'b1',
  skills: { grammar: 45, vocabulary: 68, writing: 84, reading: 94, listening: null },
  skill_counts: { grammar: 4, vocabulary: 3, writing: 2, reading: 2, listening: 1 }
};

describe('skill-level recommendations', () => {
  it('exposes the version-independent recommendation rules', () => {
    const r = load();
    expect(r.RULES.min_reported_questions).toBe(2);
    expect(r.RULES.max_recommendations).toBe(3);
    expect(r.recommendationForSkill('grammar', 45, 'b1')).toMatchObject({ level: 'a2', reason: 'support' });
    expect(r.recommendationForSkill('vocabulary', 68, 'b1')).toMatchObject({ level: 'b1', reason: 'practice' });
    expect(r.recommendationForSkill('writing', 84, 'b1')).toMatchObject({ level: 'b1', reason: 'reinforce' });
    expect(r.recommendationForSkill('reading', 94, 'b1')).toMatchObject({ level: 'b2', reason: 'stretch' });
  });

  it('clamps support at A1 and stretch at C2', () => {
    const r = load();
    expect(r.recommendationForSkill('grammar', 10, 'a1').level).toBe('a1');
    expect(r.recommendationForSkill('grammar', 99, 'c2').level).toBe('c2');
  });

  it('reports only skills with at least two questions and ranks weakest first', () => {
    const r = load();
    const items = r.recommendSkillLevels(base);
    expect(items.map(x => x.skill)).toEqual(['grammar', 'vocabulary', 'writing']);
    expect(items.map(x => x.level)).toEqual(['a2', 'b1', 'b1']);
    expect(items[0].question_count).toBe(4);
  });

  it('supports a custom recommendation limit and available-level fallback', () => {
    const r = load();
    const items = r.recommendSkillLevels(base, { max_recommendations: 2, available_levels: ['b1', 'b2'] });
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ skill: 'grammar', level: 'b1' });
  });

  it('maps usage to Grammar and resolves only real quiz entries', () => {
    const r = load();
    const recs = [r.recommendationForSkill('usage', 55, 'b1'), r.recommendationForSkill('vocabulary', 70, 'b1')];
    const picks = r.resolveQuizPicks(recs, {
      a2: [{ id: 'a2-001', category: 'Grammar', title: 'Present Simple' }],
      b1: [{ id: 'b1-010', category: 'Vocabulary', title: 'Phrasal Verbs' }]
    });
    expect(picks).toHaveLength(2);
    expect(picks[0].quiz.id).toBe('a2-001');
    expect(picks[0].skill).toBe('usage');
    expect(picks[1].quiz.id).toBe('b1-010');
  });

  it('does not manufacture links when a category is absent', () => {
    const r = load();
    const recs = r.recommendSkillLevels({
      recommended_level: 'b2',
      skills: { reading: 40 },
      skill_counts: { reading: 2 }
    });
    expect(r.resolveQuizPicks(recs, { b1: [], b2: [] })).toEqual([]);
  });

  it('accepts malformed profiles safely', () => {
    const r = load();
    expect(r.recommendSkillLevels(null)).toEqual([]);
    expect(r.validateProfile(null)).toBe(true);
    expect(r.recommendationForSkill('not-a-skill', 50, 'b1')).toBeNull();
  });
});
