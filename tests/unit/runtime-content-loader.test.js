import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const loaderPath = path.resolve(process.cwd(), 'site/shared/js/runtime-content-loader.js');
const source = fs.readFileSync(loaderPath, 'utf8');

function loadLoader(fetchImpl) {
  const context = { window: {}, fetch: fetchImpl };
  vm.runInNewContext(source, context, { filename: loaderPath });
  return context.window.MylingoRuntimeContentLoader;
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) };
}

describe('Runtime content loader', () => {
  it('loads a grammar quiz directly without requesting the level manifest', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ id: 'a1-001' }));
    const loader = loadLoader(fetchMock);
    await loader.load('a1', 'a1-001');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('../grammar/a1/a1-001.json');
  });

  it('falls back to the manifest only for non-grammar content', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response([{ id: 'b1-009', file: 'writing/b1/b1-009.json' }]))
      .mockResolvedValueOnce(response({ id: 'b1-009' }));
    const loader = loadLoader(fetchMock);
    const result = await loader.load('b1', 'b1-009');
    expect(result.id).toBe('b1-009');
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual([
      '../grammar/b1/b1-009.json',
      '../b1/quizzes.json',
      '../writing/b1/b1-009.json'
    ]);
  });

  it('reuses an in-flight quiz request', async () => {
    let resolve;
    const pending = new Promise(r => { resolve = r; });
    const fetchMock = vi.fn().mockReturnValue(pending);
    const loader = loadLoader(fetchMock);
    const a = loader.load('a1', 'a1-001');
    const b = loader.load('a1', 'a1-001');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve(response({ id: 'a1-001' }));
    await expect(Promise.all([a, b])).resolves.toHaveLength(2);
  });
});
