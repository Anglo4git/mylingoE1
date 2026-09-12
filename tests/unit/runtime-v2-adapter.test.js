import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const adapterPath = path.resolve(process.cwd(), 'site/shared/js/runtime-v2-adapter.js');
const adapterSource = fs.readFileSync(adapterPath, 'utf8');

function loadAdapter() {
  const context = { window: {} };
  vm.runInNewContext(adapterSource, context, { filename: adapterPath });
  return context.window.MylingoRuntimeV2;
}

describe('Runtime v2 Adapter', () => {
  it('keeps the current runtime v1 quiz shape stable', () => {
    const adapter = loadAdapter();
    const result = adapter.normalizeQuiz({
      id: 'a1-001', title: 'Legacy', level: 'A1', version: 1,
      questions: [{ question: 'Choose', answers: ['a', 'b'], correctIndex: 2 }]
    });

    expect(result).toEqual({
      id: 'a1-001', title: 'Legacy', description: '', brand: 'Mylingo',
      category: '', tags: '', level: 'a1', version: 1,
      questions: [{ question: 'Choose', category: '', tags: '', explanation: '', correctIndex: 2, answers: ['a', 'b'] }]
    });
  });

  it('adapts the legacy authoring 0-based option shape only when explicitly recognizable', () => {
    const adapter = loadAdapter();
    const result = adapter.normalizeQuestion({
      prompt: 'Choose', options: ['a', 'b', 'c'],
      option_0: 'a', option_1: 'b', option_2: 'c', correct_index: 1
    });

    expect(result.question).toBe('Choose');
    expect(result.answers).toEqual(['a', 'b', 'c']);
    expect(result.correctIndex).toBe(2);
  });

  it('maps v2 question extensions without changing the learner-facing core fields', () => {
    const adapter = loadAdapter();
    const result = adapter.normalizeQuiz({
      id: 'b1-009', title: 'V2', level: 'B1', version: 2,
      date_added: '2026-09-07T18:00:00Z',
      questions: [{
        question_text: 'Complete', question_type: 'fill_in_the_blank',
        accepted_answers: ['right'],
        media: { image: { url: '/x.png', alt: 'Example' } },
        skill: 'grammar', difficulty: 2, cefr: 'B1'
      }]
    });

    expect(result.level).toBe('b1');
    expect(result.date_added).toBe('2026-09-07T18:00:00Z');
    expect(result.questions[0].question).toBe('Complete');
    expect(result.questions[0].question_type).toBe('fill_in_the_blank');
    expect(result.questions[0].acceptedAnswers).toEqual(['right']);
    expect(result.questions[0].media.image.src).toBe('/x.png');
    expect(result.questions[0].difficulty).toBe(2);
  });

  it('bridges Course → Unit → Lesson → Activity → Question while preserving rich question types', () => {
    const adapter = loadAdapter();
    const fixture = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'tests/fixtures/content-architecture-v2-fixture.json'), 'utf8'));
    const hierarchy = adapter.normalizeHierarchy(fixture);

    expect(hierarchy.course.id).toBe('eng-b1');
    expect(hierarchy.course.units[0].lessons[0].activities[0].id).toBe('eng-b1-u1-l1-a1');
    expect(hierarchy.course.units[0].lessons[0].activities[0].questions.map(q => q.question_type)).toEqual(['radio', 'ranking']);

    const quiz = adapter.flattenActivityToQuiz(fixture);
    expect(quiz.id).toBe('eng-b1-u1-l1-a1');
    expect(quiz.questions).toHaveLength(2);
    expect(quiz.questions[1].question_type).toBe('ranking');
  });

  it('normalizes manifest aliases while retaining date metadata', () => {
    const adapter = loadAdapter();
    expect(adapter.normalizeManifest([{
      quiz_id: 'c1-002', name: 'Manifest alias', level: 'C1',
      path: 'grammar/c1/c1-002.json', questions: '8', version: '3',
      date_added: '2026-09-07'
    }])[0]).toMatchObject({
      id: 'c1-002', title: 'Manifest alias', level: 'c1',
      file: 'grammar/c1/c1-002.json', questions: 8, version: 3,
      date_added: '2026-09-07'
    });
  });
});
