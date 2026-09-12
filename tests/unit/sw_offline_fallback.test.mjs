// Agent 5 — Service Worker / Offline Reliability
//
// Deliberately written against Node's built-in `node:test` + `node:vm`
// only (no vitest/jsdom/playwright) so it can run in environments where
// npm packages cannot be installed, and in CI alike.
//
// It loads the real site/sw.js source into a sandboxed context with a
// minimal Cache Storage + fetch mock, registers the real 'fetch' event
// listener the file defines, and drives it through the threat matrix
// from the Agent 5 mission — most importantly "network unavailable +
// cache unavailable", which previously resolved to `undefined` (R-005).

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SW_PATH = path.join(__dirname, '..', '..', 'site', 'sw.js');
const SW_SOURCE = fs.readFileSync(SW_PATH, 'utf8');

class FakeResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = init.headers ?? {};
  }
  clone() { return new FakeResponse(this.body, { status: this.status, statusText: this.statusText, headers: this.headers }); }
  async json() { return JSON.parse(this.body); }
}

function makeCache(initial = new Map()) {
  const store = initial;
  return {
    match: async (req) => store.get(typeof req === 'string' ? req : req.url),
    put: async (req, res) => { store.set(typeof req === 'string' ? req : req.url, res); },
    addAll: async (urls) => { for (const u of urls) store.set(u, new FakeResponse('precached:' + u)); },
    _store: store
  };
}

function buildSandbox({ online, cachedUrls = {} }) {
  const caches_ = new Map();
  const staticCache = makeCache(new Map(Object.entries(cachedUrls).map(([k, v]) => [k, new FakeResponse(v.body, v.init)])));
  caches_.set('mylingo-v4-static', staticCache);

  const listeners = {};
  const fakeSelf = {
    addEventListener: (type, fn) => { listeners[type] = fn; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
    location: { origin: 'https://example.test' }
  };

  const fakeCachesApi = {
    open: async (name) => {
      if (!caches_.has(name)) caches_.set(name, makeCache());
      return caches_.get(name);
    },
    keys: async () => Array.from(caches_.keys()),
    delete: async (name) => caches_.delete(name),
    match: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      for (const c of caches_.values()) {
        const hit = await c.match(url);
        if (hit) return hit;
      }
      return undefined;
    }
  };

  const fakeFetch = async (request) => {
    if (!online) throw new Error('simulated offline: network unavailable');
    const url = typeof request === 'string' ? request : request.url;
    return new FakeResponse('network:' + url, { status: 200 });
  };

  const sandbox = {
    self: fakeSelf,
    caches: fakeCachesApi,
    fetch: fakeFetch,
    Response: FakeResponse,
    URL,
    console,
    __listeners: listeners
  };
  vm.createContext(sandbox);
  vm.runInContext(SW_SOURCE, sandbox, { filename: 'site/sw.js' });
  return sandbox;
}

function makeRequest(url, { mode = 'no-cors', destination = '' } = {}) {
  return { url, method: 'GET', mode, destination };
}

async function dispatchFetch(sandbox, request) {
  let captured;
  const event = {
    request,
    respondWith: (p) => { captured = p; }
  };
  sandbox.__listeners['fetch'](event);
  return captured;
}

test('navigate + offline + cache miss returns a real 503 Response, never undefined', async () => {
  const sandbox = buildSandbox({ online: false });
  const req = makeRequest('https://example.test/a1/never-cached.html', { mode: 'navigate' });
  const result = await dispatchFetch(sandbox, req);
  assert.notStrictEqual(result, undefined, 'fetch handler must not resolve to undefined (R-005)');
  assert.equal(result.status, 503);
  assert.match(result.body, /You.?re offline/);
});

test('mutable JSON + offline + cache miss returns a real 503 JSON Response, never undefined', async () => {
  const sandbox = buildSandbox({ online: false });
  const req = makeRequest('https://example.test/a1/quizzes.json');
  const result = await dispatchFetch(sandbox, req);
  assert.notStrictEqual(result, undefined);
  assert.equal(result.status, 503);
  const parsed = JSON.parse(result.body);
  assert.equal(parsed.offline, true);
});

test('immutable asset + offline + cache miss returns a real 503 Response, never undefined', async () => {
  const sandbox = buildSandbox({ online: false });
  const req = makeRequest('https://example.test/shared/audio/never-cached.mp3');
  const result = await dispatchFetch(sandbox, req);
  assert.notStrictEqual(result, undefined);
  assert.equal(result.status, 503);
});

test('navigate + offline + cache available returns the cached Response', async () => {
  const sandbox = buildSandbox({
    online: false,
    cachedUrls: { 'https://example.test/main/index.html': { body: 'cached-shell', init: { status: 200 } } }
  });
  const req = makeRequest('https://example.test/main/index.html', { mode: 'navigate' });
  const result = await dispatchFetch(sandbox, req);
  assert.equal(result.body, 'cached-shell');
});

test('mutable JSON + online returns the fresh network response', async () => {
  const sandbox = buildSandbox({ online: true });
  const req = makeRequest('https://example.test/a1/quizzes.json');
  const result = await dispatchFetch(sandbox, req);
  assert.equal(result.status, 200);
  assert.match(result.body, /^network:/);
});


test('mutable JSON + offline + partial cache returns the cached copy for the exact request', async () => {
  const sandbox = buildSandbox({
    online: false,
    cachedUrls: {
      'https://example.test/a1/quizzes.json': { body: '{"cached":true}', init: { status: 200 } }
    }
  });
  const req = makeRequest('https://example.test/a1/quizzes.json');
  const result = await dispatchFetch(sandbox, req);
  assert.equal(result.status, 200);
  assert.equal(result.body, '{"cached":true}');
});

test('online mutable JSON refreshes the runtime cache so a later offline request is still usable', async () => {
  const sandbox = buildSandbox({ online: true });
  const req = makeRequest('https://example.test/a1/quizzes.json');
  const onlineResult = await dispatchFetch(sandbox, req);
  assert.equal(onlineResult.status, 200);

  // Simulate the network disappearing after the successful network-first fetch.
  sandbox.fetch = async () => { throw new Error('simulated offline after refresh'); };
  const offlineResult = await dispatchFetch(sandbox, req);
  assert.equal(offlineResult.status, 200);
  assert.match(offlineResult.body, /^network:https:\/\/example\.test\/a1\/quizzes\.json$/);
});

test('activate removes old app-shell caches but preserves installed offline-pack caches', async () => {
  const sandbox = buildSandbox({ online: true });
  const packCache = makeCache(new Map([
    ['https://example.test/offline/a1-pack/quiz.json', new FakeResponse('installed-pack')]
  ]));
  sandbox.caches._test = undefined;
  // Access the private Cache Storage implementation through the public API
  // by opening the same cache names the real service worker uses.
  await sandbox.caches.open('mylingo-v3-static');
  await sandbox.caches.open('mylingo-offline-pack-v1-a1');
  const before = await sandbox.caches.keys();
  assert.ok(before.includes('mylingo-v3-static'));
  assert.ok(before.includes('mylingo-offline-pack-v1-a1'));

  const activate = sandbox.__listeners['activate'];
  let activationPromise;
  activate({
    waitUntil: (p) => { activationPromise = p; }
  });
  await activationPromise;

  const after = await sandbox.caches.keys();
  assert.ok(!after.includes('mylingo-v3-static'));
  assert.ok(after.includes('mylingo-offline-pack-v1-a1'));
});

test('same-origin non-GET requests are never intercepted by the service worker fetch handler', async () => {
  const sandbox = buildSandbox({ online: false });
  let responded = false;
  sandbox.__listeners['fetch']({
    request: { url: 'https://example.test/api/progress', method: 'POST', mode: 'cors', destination: '' },
    respondWith: () => { responded = true; }
  });
  assert.equal(responded, false);
});
