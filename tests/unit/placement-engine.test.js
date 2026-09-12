import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/placement.js', 'utf8');
  const store = new Map();
  const context = { window: { localStorage: { getItem:k=>store.get(k)||null, setItem:(k,v)=>store.set(k,v) } } };
  context.window.window = context.window;
  vm.runInNewContext(source, context);
  return context.window.MylingoPlacement;
}

describe('adaptive placement engine', () => {
  it.each(['a1','a2','b1','b2','c1','c2'])('%s estimate stays primary for high confidence', level => {
    const p=load().decideAssessmentPath({estimated_level:level,confidence:'high'});
    expect(p.primary_level).toBe(level); expect(p.secondary_level).toBeNull();
  });
  it('B1 medium confidence creates adjacent verification', () => {
    expect(load().decideAssessmentPath({estimated_level:'b1',confidence:'medium'})).toMatchObject({primary_level:'b1',secondary_level:'b2',reason:'boundary_check'});
  });
  it('B1 strong score recommends B2', () => expect(load().decideFromPerformance({assessed_level:'b1',score:88,graded_questions:10,complete:true}).recommended_level).toBe('b2'));
  it('B1 weak score recommends A2', () => expect(load().decideFromPerformance({assessed_level:'b1',score:42,graded_questions:10,complete:true}).recommended_level).toBe('a2'));
  it('85 is an upper-boundary score', () => expect(load().decideFromPerformance({assessed_level:'b1',score:85,graded_questions:10,complete:true}).reason).toBe('upper_boundary'));
  it('incomplete attempt has insufficient evidence', () => expect(load().decideFromPerformance({assessed_level:'b1',score:90,graded_questions:4,complete:false}).reason).toBe('insufficient_evidence'));
  it('low evidence is low confidence', () => expect(load().confidenceFor({score:90,graded_questions:3,complete:true})).toBe('low'));
  it('high confidence requires adequate non-boundary evidence', () => expect(load().confidenceFor({score:72,graded_questions:10,complete:true})).toBe('high'));
  it('medium confidence covers boundary performance', () => expect(load().confidenceFor({score:88,graded_questions:10,complete:true})).toBe('medium'));
  it('malformed stored result is ignored', () => {
    const p=load(); p.writeStored({foo:'bar'}); expect(p.readStored()).toBeNull();
  });
  it('skill with one question is null, two questions can score', () => {
    const p=load(); const questions=[{skill:'listening'},{skill:'grammar'},{skill:'grammar'}];
    expect(p.calculateSkillProfile(questions,{0:true,1:true,2:false}).skills.listening).toBeNull();
    expect(p.calculateSkillProfile(questions,{0:true,1:true,2:false}).skills.grammar).toBe(50);
  });
  it('rejects arbitrary skill labels and accepts bounded difficulty', () => {
    const p=load(); expect(p.validateQuestionMetadata({skill:'foo',difficulty:3})).toBe(false); expect(p.validateQuestionMetadata({skill:'grammar',difficulty:5,cefr:'B1',estimated_time_seconds:20})).toBe(true);
  });
});
