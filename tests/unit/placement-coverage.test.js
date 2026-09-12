import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

const levels = ['a1','a2','b1','b2','c1','c2'];
function loadEngine(){
  const source=fs.readFileSync('site/shared/js/placement.js','utf8');
  const context={window:{localStorage:{getItem:()=>null,setItem:()=>{}}}};
  vm.runInNewContext(source,context);
  return context.window.MylingoPlacement;
}

describe('placement coverage blueprint', () => {
  it.each(levels)('%s meets explicit coverage minimums', level => {
    const p=loadEngine();
    const data=JSON.parse(fs.readFileSync(`site/placement/${level}/placement-001.json`,'utf8'));
    const report=p.coverageReport(data.questions);
    expect(report.meets_blueprint).toBe(true);
    expect(report.skill_counts.grammar).toBeGreaterThanOrEqual(4);
    expect(report.skill_counts.vocabulary).toBeGreaterThanOrEqual(1);
    expect(report.skill_counts.reading).toBeGreaterThanOrEqual(1);
    expect(report.claimable_cefr_evidence).toBe(true);
    expect(report.unavailable_skills.listening).toMatch(/audio/i);
  });

  it('requires explicit writing-or-usage evidence without pretending listening is covered', () => {
    const p=loadEngine();
    const b=p.PLACEMENT_BLUEPRINT_V2.coverage;
    expect(b.minimums.listening).toBe(0);
    expect(b.required_compound_skills).toContainEqual({key:'writing_or_usage',minimum:1,skills:['writing','usage']});
  });
});
