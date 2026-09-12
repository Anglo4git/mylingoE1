import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function load() {
  const source = fs.readFileSync('site/shared/js/placement.js', 'utf8');
  const context = { window: { localStorage: { getItem:()=>null, setItem:()=>{} } } };
  vm.runInNewContext(source, context);
  return context.window.MylingoPlacement;
}

describe('placement blueprint v2', () => {
  it('exposes and validates the v2 blueprint', () => {
    const p = load();
    expect(p.PLACEMENT_BLUEPRINT_V2.version).toBe(2);
    expect(p.PLACEMENT_BLUEPRINT_V2.verification.max_adjacent_hops).toBe(1);
    expect(p.validatePlacementBlueprint()).toBe(true);
  });

  it('primary score in the middle completes without verification', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b1', score:72, graded_questions:10, complete:true, stage:'primary'});
    expect(r).toMatchObject({action:'complete', recommended_level:'b1', finality:'final', verification_level:null});
  });

  it('primary upper boundary creates exactly one adjacent verification target', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b1', score:90, graded_questions:10, complete:true, stage:'primary'});
    expect(r).toMatchObject({action:'verify_boundary', verification_level:'b2', reason:'upper_boundary', finality:'provisional'});
  });

  it('primary lower boundary creates exactly one adjacent verification target', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b1', score:42, graded_questions:10, complete:true, stage:'primary'});
    expect(r).toMatchObject({action:'verify_boundary', verification_level:'a2', reason:'lower_boundary', finality:'provisional'});
  });

  it('verification edge does not auto-chain another CEFR level', () => {
    const p = load();
    const r = p.resolvePlacement({estimated_level:'b1', assessed_level:'b2', score:95, graded_questions:10, complete:true, stage:'verification'});
    expect(r).toMatchObject({recommended_level:'b2', reason:'verification_upper_edge', action:'continue_at_verified_level', finality:'final_with_edge_signal'});
    expect(r.recommended_level).not.toBe('c1');
  });

  it('verification lower edge does not auto-chain another CEFR level', () => {
    const p = load();
    const r = p.resolvePlacement({estimated_level:'b2', assessed_level:'b1', score:30, graded_questions:10, complete:true, stage:'verification'});
    expect(r).toMatchObject({recommended_level:'b1', reason:'verification_lower_edge', action:'continue_at_verified_level', finality:'final_with_edge_signal'});
    expect(r.recommended_level).not.toBe('a2');
  });

  it('insufficient evidence is never final', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b1', score:100, graded_questions:4, complete:true, stage:'primary'});
    expect(r).toMatchObject({action:'complete_more_questions', reason:'insufficient_evidence', finality:'provisional'});
  });
});

describe('placement blueprint v2 — evidence and confidence', () => {
  it('publishes the near-boundary confidence buffer on the versioned contract', () => {
    const p = load();
    expect(p.PLACEMENT_BLUEPRINT_V2.confidence.near_boundary_margin).toBe(5);
    expect(p.PLACEMENT_BLUEPRINT_V2.confidence.high_min_graded).toBe(8);
    expect(p.PLACEMENT_BLUEPRINT_V2.confidence.medium_min_graded).toBe(5);
    expect(p.validatePlacementBlueprint()).toBe(true);
  });

  it('is high confidence with enough evidence, a complete attempt, and a clear mid-band score', () => {
    expect(load().confidenceFor({score:70, graded_questions:8, complete:true})).toBe('high');
  });

  it('is medium confidence with only 5-7 graded questions even at a clear score', () => {
    expect(load().confidenceFor({score:70, graded_questions:6, complete:true})).toBe('medium');
  });

  it('is medium confidence just below the upper boundary (near-boundary buffer)', () => {
    expect(load().confidenceFor({score:82, graded_questions:10, complete:true})).toBe('medium');
  });

  it('is medium confidence just above the lower boundary (near-boundary buffer)', () => {
    expect(load().confidenceFor({score:52, graded_questions:10, complete:true})).toBe('medium');
  });

  it('is medium confidence at the boundary itself', () => {
    expect(load().confidenceFor({score:90, graded_questions:10, complete:true})).toBe('medium');
    expect(load().confidenceFor({score:30, graded_questions:10, complete:true})).toBe('medium');
  });

  it('is low confidence when the attempt is incomplete, regardless of score or evidence', () => {
    expect(load().confidenceFor({score:70, graded_questions:10, complete:false})).toBe('low');
  });

  it('is low confidence with fewer than 5 graded questions, regardless of score', () => {
    expect(load().confidenceFor({score:70, graded_questions:4, complete:true})).toBe('low');
  });

  it('is low confidence when conflicting signals are flagged, even with strong evidence', () => {
    expect(load().confidenceFor({score:70, graded_questions:10, complete:true, conflicting_signals:true})).toBe('low');
  });

  it('surfaces confidence through resolvePlacement on the primary stage', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b1', score:70, graded_questions:8, complete:true, stage:'primary'});
    expect(r.confidence).toBe('high');
  });

  it('surfaces confidence through resolvePlacement on a boundary verification result', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b2', score:95, graded_questions:10, complete:true, stage:'verification'});
    expect(r.confidence).toBe('medium');
  });

  it('surfaces low confidence through resolvePlacement when evidence is insufficient', () => {
    const r = load().resolvePlacement({estimated_level:'b1', assessed_level:'b1', score:60, graded_questions:3, complete:true, stage:'primary'});
    expect(r.confidence).toBe('low');
  });
});
