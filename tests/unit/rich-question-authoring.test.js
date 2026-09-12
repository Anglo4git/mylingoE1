import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const authoringPath = path.resolve(process.cwd(), 'authoring/mylingo-admin.html');
const buildPath = path.resolve(process.cwd(), 'build.py');
const source = fs.readFileSync(authoringPath, 'utf8');
const build = fs.readFileSync(buildPath, 'utf8');

describe('Agent 14 Rich Question Authoring MVP', () => {
  it('exposes the runtime-supported rich question types', () => {
    expect(source).toContain('value="short_text"');
    expect(source).toContain('value="fill_in_the_blank"');
    expect(source).toContain('value="number"');
    expect(source).toContain('value="date"');
    expect(source).toContain('value="matching"');
    expect(source).toContain('value="ranking"');
  });

  it('authors structured matching and ranking data instead of flattening it', () => {
    expect(source).toContain('row.pairs = Array.from(matchingPairsEditor.children)');
    expect(source).toContain('row.items = richRankingItems.value');
    expect(source).toContain('row.correct_order = richCorrectOrder.value');
  });

  it('exports media and answer rules into runtime v2 question fields', () => {
    expect(source).toContain('q.acceptedAnswers = accepted');
    expect(source).toContain('q.pairs = pairs');
    expect(source).toContain('q.correctOrder = order');
    expect(source).toContain('q.media = { ...(q.media || {}), image:');
    expect(source).toContain('q.media = { ...(q.media || {}), audio:');
  });

  it('makes build validation type-aware for rich questions', () => {
    expect(build).toContain('RICH_TYPES =');
    expect(build).toContain('V-R2');
    expect(build).toContain('V-R3');
    expect(build).toContain('V-R4');
    expect(build).toContain('acceptedAnswers');
    expect(build).toContain('correctOrder');
  });
});
