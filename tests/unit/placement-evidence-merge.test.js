import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/placement.js', 'utf8');
  const context = { window: { localStorage: { getItem:()=>null, setItem:()=>{} } } };
  context.window.window = context.window;
  vm.runInNewContext(source, context);
  return context.window.MylingoPlacement;
}

describe('placement evidence merge', () => {
  it('deduplicates identical question IDs while preserving both stages and source quizzes', () => {
    const p = load();
    const merged = p.mergePlacementEvidence([
      {question_id:'q1', quiz_id:'placement-001', skill:'grammar', correct:true, stage:'primary'},
      {question_id:'q2', quiz_id:'placement-001', skill:'vocabulary', correct:false, stage:'primary'}
    ], [
      {question_id:'q1', quiz_id:'placement-001', skill:'grammar', correct:true, stage:'verification'},
      {question_id:'q3', quiz_id:'placement-001', skill:'reading', correct:true, stage:'verification'}
    ]);
    expect(merged).toHaveLength(3);
    expect(merged.find(e=>e.question_id==='q1')).toMatchObject({correct:true});
    expect(merged.find(e=>e.question_id==='q1').stages).toEqual(['primary','verification']);
  });

  it('builds explicit evidence and calculates combined totals by skill', () => {
    const p = load();
    const primary = p.buildEvidence([
      {id:'p1',skill:'grammar'}, {id:'p2',skill:'vocabulary'}
    ], {0:true,1:false}, 'primary-bank', 'primary');
    const verification = p.buildEvidence([
      {id:'v1',skill:'reading'}, {id:'v2',skill:'grammar'}
    ], {0:true,1:true}, 'verification-bank', 'verification');
    const merged = p.mergePlacementEvidence(primary, verification);
    const profile = p.calculateResult({estimated_level:'b1',assessed_level:'b2',score:90,graded_questions:2,questions:verification,evidence:merged,assessment_quiz_ids:['primary-bank','verification-bank'],complete:true});
    expect(profile.evidence_question_count).toBe(4);
    expect(profile.evidence_correct_count).toBe(3);
    expect(profile.evidence_skill_counts).toMatchObject({grammar:2,vocabulary:1,reading:1});
    expect(profile.assessment_quiz_ids).toEqual(['primary-bank','verification-bank']);
  });
});
