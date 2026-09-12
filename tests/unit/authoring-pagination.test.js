import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const source = fs.readFileSync('authoring/mylingo-admin.html', 'utf8');

describe('Agent 51 — Authoring pagination', () => {
  it('renders bounded pages instead of the entire visible dataset', () => {
    expect(source).toContain('id="gridPageSize"');
    expect(source).toContain('id="gridPrevPage"');
    expect(source).toContain('id="gridNextPage"');
    expect(source).toContain('function getGridPageRows(rows)');
    expect(source).toContain('rows: rows.slice(start, start + gridPageSize)');
  });

  it('keeps row numbering stable across pages', () => {
    expect(source).toContain('page.start + visibleIndex + 1');
  });

  it('resets pagination when changing the level filter or page size', () => {
    expect(source).toContain('gridPage = 1;\n        renderLevelTabs();');
    expect(source).toContain('gridPageSize = Math.max(1, Number(gridPageSizeSelect.value) || 50);\n      gridPage = 1;');
  });
});
