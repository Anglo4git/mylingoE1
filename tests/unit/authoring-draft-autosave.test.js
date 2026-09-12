import { describe, it } from 'vitest';
import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('site/shared/js/authoring-draft-autosave.js', 'utf8');
function loadModule(storage) { const context = { window: { localStorage: storage }, console }; vm.runInNewContext(source, context); return context.window.MylingoAuthoringDraftAutosave; }
function makeStorage(seed = {}) { const map = new Map(Object.entries(seed)); return { getItem: k => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k), _map: map }; }

// Written as plain Node/assert harnesses (Agent 52) rather than vitest describe/it
// blocks originally, which meant `vitest run` registered zero tests for this file
// and reported it as a failed suite ("No test suite found") even though every
// assertion passed under a direct `node` invocation. Wrapped in `it()` here so the
// project's actual test runner (see package.json's `test` script) exercises them.
describe('authoring draft autosave (chunked)', () => {
  it('round-trips rows across chunks and strips internal bookkeeping fields', () => {
    const s = makeStorage(), api = loadModule(s).create(s, { chunkSize: 2 });
    const rows = Array.from({ length: 5 }, (_, i) => ({ __internalId: i, quiz_id: 'q' + i, nested: { i } }));
    const r = api.save(rows, { activeLevel: 'B1' });
    assert.equal(r.ok, true);
    assert.equal(r.chunkCount, 3);
    assert.equal(s._map.has(api.STORAGE_KEY), false);
    const loaded = api.load();
    assert.equal(loaded.schemaVersion, 2);
    assert.equal(loaded.rows.length, 5);
    assert.equal(loaded.rows[0].__internalId, undefined);
    assert.equal(loaded.rows[4].nested.i, 4);
  });

  it('removes stale chunks when a later save shrinks the row count', () => {
    const s = makeStorage(), api = loadModule(s).create(s, { chunkSize: 2 });
    api.save([{ a: 1 }, { a: 2 }, { a: 3 }, { a: 4 }, { a: 5 }], {});
    api.save([{ a: 1 }], {});
    assert.equal(s._map.has('mylingo.authoring-draft.v2.chunk.1'), false);
    assert.equal(api.load().rows.length, 1);
  });

  it('reads a pre-chunking legacy v1 draft', () => {
    const s = makeStorage({ 'mylingo.authoring-draft.v1': JSON.stringify({ schemaVersion: 1, savedAt: new Date().toISOString(), activeLevel: 'A1', rows: [{ quiz_id: 'x' }] }) });
    const api = loadModule(s).create(s);
    assert.equal(api.load().rows[0].quiz_id, 'x');
  });

  it('clears every chunk and reports no remaining draft', () => {
    const s = makeStorage(), api = loadModule(s).create(s, { chunkSize: 1 });
    api.save([{ a: 1 }, { a: 2 }], {});
    assert.equal(api.clear(), true);
    assert.equal(api.hasDraft(), false);
  });
});
