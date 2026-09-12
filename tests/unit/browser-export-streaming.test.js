import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const source = fs.readFileSync('authoring/mylingo-admin.html', 'utf8');

describe('Agent 58 — Browser export streaming', () => {
  it('writes each quiz/manifest file straight into the JSZip instance instead of an intermediate array', () => {
    expect(source).toContain('function buildQuizExportFiles(zip)');
    expect(source).toContain(
      'zip.file(\n          `site/${topicSlug}/${levelFolder}/${quizId}.json`,'
    );
    expect(source).toContain(
      'zip.file(\n          `site/${level.toLowerCase()}/quizzes.json`,'
    );
    // the old double-buffering arrays must be gone
    expect(source).not.toContain('quizFiles.push(');
    expect(source).not.toContain('quizFiles.forEach(');
    expect(source).not.toContain('const manifestFiles = [];');
  });

  it('requests a streaming file handle via the File System Access API when available', () => {
    expect(source).toContain(
      'typeof window.showSaveFilePicker === "function"'
    );
    expect(source).toContain('await window.showSaveFilePicker({');
    expect(source).toContain('suggestedName: "mylingo_production.zip"');
  });

  it('streams ZIP bytes to disk with backpressure instead of buffering the whole archive', () => {
    expect(source).toContain('zip.generateInternalStream({');
    expect(source).toContain('type: "uint8array"');
    expect(source).toContain('helper.pause();');
    expect(source).toContain('.then(() => helper.resume())');
    expect(source).toContain('await writable.close();');
  });

  it('falls back to the original blob download when streaming is unavailable', () => {
    expect(source).toContain('const blob = await zip.generateAsync({');
    expect(source).toContain('saveAs(blob, "mylingo_production.zip");');
  });

  it('treats a cancelled save dialog as a silent no-op, not an error toast', () => {
    expect(source).toContain('error.name === "AbortError"');
  });

  it('keeps the pre-export validation confirmation before any file handle is requested', () => {
    const confirmIdx = source.indexOf('Validation found ${rowsWithIssues}');
    const pickerIdx = source.indexOf('await window.showSaveFilePicker({');
    expect(confirmIdx).toBeGreaterThan(-1);
    expect(pickerIdx).toBeGreaterThan(-1);
    expect(confirmIdx).toBeLessThan(pickerIdx);
  });
});
