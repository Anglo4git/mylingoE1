import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const authoringPath = path.resolve(process.cwd(), 'authoring/mylingo-admin.html');
const source = fs.readFileSync(authoringPath, 'utf8');

// Milestone 23 — Authoring Scale + Incremental Validation moved the
// per-quiz validation rules (including this ceiling message) out of
// mylingo-admin.html and into a reusable, incrementally-recomputable
// module. The MAX_QUESTIONS_PER_QUIZ constant itself is still declared
// in the authoring app and passed into that module as config.
const validationPath = path.resolve(
  process.cwd(),
  'site/shared/js/authoring-validation.js'
);
const validationSource = fs.readFileSync(validationPath, 'utf8');

describe('Agent 4 raw-only authoring boundary', () => {
  it('defines a dedicated raw schema for headerless paste', () => {
    expect(source).toContain('const RAW_IMPORT_FIELDS = [');
    expect(source).toContain('"question_text",');
    expect(source).toContain('"correct_index",');
    expect(source).toContain('"explanation"');
  });

  it('maps headerless TSV to raw fields instead of canonical bookkeeping fields', () => {
    expect(source).toContain('headers = RAW_IMPORT_FIELDS;');
    expect(source).toContain('Do NOT fall back to\n        // DATA_FIELDS here');
    expect(source).not.toContain('headers = DATA_FIELDS;\n        startIndex = 0;');
  });

  it('keeps the production quiz ceiling at 150 questions', () => {
    expect(source).toContain('const MAX_QUESTIONS_PER_QUIZ = 150;');
    expect(validationSource).toContain(
      'maximum is ${cfg.MAX_QUESTIONS_PER_QUIZ}'
    );
  });
});
