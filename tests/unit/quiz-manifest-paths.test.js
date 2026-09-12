import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Regression coverage for a bug found during the topic-folder reorg (2026-09-06):
// site/shared/quiz.html used to hardcode '../<level>/quizzes/<id>.json' as the
// fetch path for every non-placement quiz, while the actual content lived at
// '../<level>/<topic>/<id>.json' (and, after this reorg, at the topic-first
// '../<topic>/<level>/<id>.json'). That mismatch meant every regular quiz link
// on the site 404'd. quiz.html now resolves the real path via each level
// manifest's 'file' field instead of guessing a shape — these tests make sure
// that field always points at a file that actually exists, so a future content
// move can't silently reintroduce the same class of bug.

const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const siteRoot = 'site';

describe('level manifests resolve to real quiz files', () => {
  for (const level of levels) {
    it(`${level}/quizzes.json entries all point at existing files`, () => {
      const manifestPath = path.join(siteRoot, level, 'quizzes.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(Array.isArray(manifest)).toBe(true);
      expect(manifest.length).toBeGreaterThan(0);

      for (const entry of manifest) {
        expect(typeof entry.file).toBe('string');
        // 'file' is root-relative (relative to site/), matching how
        // quiz.html resolves it: fetch('../' + entry.file) from site/shared/.
        const absPath = path.join(siteRoot, entry.file);
        expect(fs.existsSync(absPath), `${entry.id}: ${absPath} does not exist`).toBe(true);

        const quiz = JSON.parse(fs.readFileSync(absPath, 'utf8'));
        expect(quiz.id).toBe(entry.id);
      }
    });
  }
});

describe('topic folders are the single home for quiz content', () => {
  it('no stray <level>/quizzes or <level>/<topic> directories remain', () => {
    for (const level of levels) {
      const legacyFlat = path.join(siteRoot, level, 'quizzes');
      expect(fs.existsSync(legacyFlat), `${legacyFlat} should not exist (old flat layout)`).toBe(false);
    }
  });

  it('every quiz file on disk lives under a top-level topic folder and is referenced by its level manifest', () => {
    const nonTopicDirs = new Set(['shared', 'main', 'placement', ...levels]);
    const referenced = new Set();
    for (const level of levels) {
      const manifest = JSON.parse(fs.readFileSync(path.join(siteRoot, level, 'quizzes.json'), 'utf8'));
      for (const entry of manifest) referenced.add(path.normalize(entry.file));
    }

    const topLevelEntries = fs.readdirSync(siteRoot, { withFileTypes: true })
      .filter(d => d.isDirectory() && !nonTopicDirs.has(d.name));

    expect(topLevelEntries.length).toBeGreaterThan(0); // e.g. grammar, vocabulary, writing, academic-english

    for (const topicDir of topLevelEntries) {
      const topicPath = path.join(siteRoot, topicDir.name);
      for (const levelDir of fs.readdirSync(topicPath, { withFileTypes: true })) {
        if (!levelDir.isDirectory()) continue;
        const levelPath = path.join(topicPath, levelDir.name);
        for (const file of fs.readdirSync(levelPath)) {
          if (!file.endsWith('.json')) continue;
          const rel = path.normalize(path.join(topicDir.name, levelDir.name, file));
          expect(referenced.has(rel), `${rel} is on disk but no manifest references it`).toBe(true);
        }
      }
    }
  });
});


describe('quiz manifest architecture', () => {
  it('has globally unique stable quiz IDs and lightweight topic metadata', () => {
    const ids = [];
    for (const level of levels) {
      const manifest = JSON.parse(fs.readFileSync(path.join(siteRoot, level, 'quizzes.json'), 'utf8'));
      for (const entry of manifest) {
        expect(typeof entry.id).toBe('string');
        expect(entry.id.length).toBeGreaterThan(0);
        expect(typeof entry.topic).toBe('string');
        expect(entry.topic.length).toBeGreaterThan(0);
        // The manifest stays metadata-only; question payloads belong in the
        // file referenced by `file`.
        expect(entry).not.toHaveProperty('questionsData');
        expect(entry).not.toHaveProperty('answers');
        expect(entry).not.toHaveProperty('question');
        ids.push(entry.id);
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups numbered/review variants under a shared topic', () => {
    function expectedTopic(title) {
      return title.replace(/\s+(?:\d+|review)\s*$/i, '').trim() || title;
    }
    for (const level of levels) {
      const manifest = JSON.parse(fs.readFileSync(path.join(siteRoot, level, 'quizzes.json'), 'utf8'));
      for (const entry of manifest) {
        expect(entry.topic).toBe(expectedTopic(entry.title));
      }
    }
  });
});
