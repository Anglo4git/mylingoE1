/*! Mylingo Offline Content Packs — Agent 25 */
(function (global) {
  'use strict';
  var CACHE_PREFIX = 'mylingo-offline-pack-v1-';
  var CACHE_PREFIX_PATTERN = /^mylingo-offline-pack-v\d+-/;
  var CACHE_META_KEY = 'mylingo-offline-pack-cache-meta-v1';
  var MAX_INSTALLED_PACKS = 4;
  // Bound simultaneous Cache Storage writes so a large pack cannot fan out
  // one promise/request per asset and spike browser memory/network pressure.
  var INSTALL_CONCURRENCY = 4;
  var BASE_URL = (function () {
    try {
      var script = document.currentScript && document.currentScript.src;
      return script ? new URL('../../', script).href : new URL('../../', location.href).href;
    } catch (e) { return './'; }
  })();
  function assetUrl(path) { return new URL(String(path).replace(/^\.\//, ''), BASE_URL).href; }
  // Agent 204: packs.json is fetched JSON, so its shape is untrusted. The index must be an
  // object (a `null` / array / number body used to surface later as a TypeError somewhere
  // inside a chain), and only a string / number is an id (String() of an object with its
  // own non-function `toString` THROWS, and any object matched the id "[object Object]").
  function getIndex() {
    return fetch(assetUrl('offline/packs.json'), { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Unable to load offline pack index');
      return response.json();
    }).then(function (index) {
      if (!index || typeof index !== 'object' || Array.isArray(index)) throw new Error('Invalid offline pack index');
      return index;
    });
  }
  function packsOf(index) {
    return index && Array.isArray(index.packs) ? index.packs : [];
  }
  function idOf(pack) {
    if (!pack || typeof pack !== 'object') return null;
    return typeof pack.id === 'string' || typeof pack.id === 'number' ? String(pack.id) : null;
  }
  function findPack(index, id) {
    var want = typeof id === 'string' || typeof id === 'number' ? String(id) : null;
    if (want === null) return null;
    return packsOf(index).find(function (pack) { return idOf(pack) === want; }) || null;
  }
  // A pack file is a non-blank string that resolves inside the app's own origin (a `null` /
  // object entry became the relative URL "null" / "[object Object]", and an absolute or
  // protocol-relative entry made the installer download from another origin).
  function validFiles(pack) {
    var origin;
    try { origin = new URL(BASE_URL).origin; } catch (e) { return false; }
    return Array.isArray(pack.files) && pack.files.every(function (file) {
      if (typeof file !== 'string' || !file.trim()) return false;
      try { return new URL(assetUrl(file)).origin === origin; } catch (e) { return false; }
    });
  }
  function depsOf(pack) {
    return Array.isArray(pack.dependencies) ? pack.dependencies.filter(function (dep) {
      return typeof dep === 'string' || typeof dep === 'number';
    }).map(String) : [];
  }
  // Agent 204: the stored blob is untrusted. A stored `null` / array / number / string made
  // touch() THROW (setting a property on null), which inside installPack rolled the whole install
  // back and inside isInstalled turned every pack into "not installed"; non-numeric timestamps
  // made the eviction sort comparator NaN. Only own finite-number entries survive, in a
  // prototype-free map (an id such as "constructor" is an ordinary key).
  function readMeta() {
    var meta = Object.create(null);
    try {
      var parsed = JSON.parse(global.localStorage.getItem(CACHE_META_KEY) || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.keys(parsed).forEach(function (key) {
          if (typeof parsed[key] === 'number' && Number.isFinite(parsed[key])) meta[key] = parsed[key];
        });
      }
    } catch (e) {}
    return meta;
  }
  function writeMeta(meta) {
    try { global.localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta)); } catch (e) {}
  }
  function touch(id) {
    var meta = readMeta();
    meta[String(id)] = Date.now();
    writeMeta(meta);
  }
  function cleanupOldCacheVersions() {
    if (!global.caches) return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return CACHE_PREFIX_PATTERN.test(key) && key.indexOf(CACHE_PREFIX) !== 0;
      }).map(function (key) { return caches.delete(key); }));
    });
  }
  function evictIfNeeded(exceptId) {
    if (!global.caches) return Promise.resolve();
    return getIndex().then(function (index) {
      var protectedIds = Object.create(null);
      var visiting = Object.create(null);

      // Never evict the pack being installed, or anything it depends on.
      // Level packs depend on core, so blindly evicting the oldest cache can
      // leave an installed pack unusable offline after the next installation.
      function protectDependencies(id) {
        id = String(id);
        if (protectedIds[id] || visiting[id]) return;
        protectedIds[id] = true;
        visiting[id] = true;
        var pack = findPack(index, id);
        var deps = pack ? depsOf(pack) : [];
        deps.forEach(protectDependencies);
        delete visiting[id];
      }
      protectDependencies(exceptId);

      return caches.keys().then(function (keys) {
        var ids = keys.filter(function (key) { return key.indexOf(CACHE_PREFIX) === 0; })
          .map(function (key) { return key.slice(CACHE_PREFIX.length); })
          .filter(function (id) { return id && !protectedIds[String(id)]; });
        var allInstalledCount = keys.filter(function (key) { return key.indexOf(CACHE_PREFIX) === 0; }).length;
        if (allInstalledCount < MAX_INSTALLED_PACKS) return;
        var meta = readMeta();
        ids.sort(function (a, b) { return (meta[a] || 0) - (meta[b] || 0); });
        var removeCount = allInstalledCount - MAX_INSTALLED_PACKS + 1;
        var remove = ids.slice(0, removeCount);
        return Promise.all(remove.map(function (id) { delete meta[id]; return caches.delete(CACHE_PREFIX + id); }))
          .then(function () { writeMeta(meta); });
      });
    });
  }
  // `stack` (internal) is the chain of packs being checked: a dependency cycle (or a pack that
  // depends on itself) can never be satisfied, and used to recurse — re-fetching packs.json each
  // time — without end. Each branch gets its own copy so a shared dependency (a diamond) is fine.
  function isInstalled(id, stack) {
    if (!global.caches) return Promise.resolve(false);
    var key = typeof id === 'string' || typeof id === 'number' ? String(id) : null;
    if (key === null || (stack && stack[key])) return Promise.resolve(false);
    var chain = Object.assign(Object.create(null), stack);
    chain[key] = true;
    return cleanupOldCacheVersions().then(function () { return getIndex(); }).then(function (index) {
      var pack = findPack(index, id);
      if (!pack || !Array.isArray(pack.files) || !pack.files.length || !validFiles(pack)) return false;
      var deps = depsOf(pack);
      return Promise.all(deps.map(function (dep) { return isInstalled(dep, chain); })).then(function (ready) {
        if (!ready.every(Boolean)) return false;
        // Agent 159: caches.open() CREATES an empty cache when none exists, so merely asking
        // "is it installed?" used to leave a phantom cache per queried pack (counted by
        // evictIfNeeded). Check existence first; only open a cache that is really there.
        var name = CACHE_PREFIX + String(id);
        var exists = typeof caches.has === 'function' ? caches.has(name) : Promise.resolve(true);
        return exists.then(function (present) {
          if (!present) return false;
          return caches.open(name).then(function (cache) {
            return Promise.all(pack.files.map(function (file) {
              return cache.match(assetUrl(file), { ignoreSearch: true });
            })).then(function (matches) {
              var installed = matches.every(Boolean);
              if (installed) touch(pack.id);
              return installed;
            });
          });
        });
      });
    }).catch(function () { return false; });
  }
  function installPack(id, onProgress, dependencyStack) {
    // Prototype-free: a pack named "constructor" / "toString" is not already "on the stack".
    dependencyStack = dependencyStack || Object.create(null);
    if (dependencyStack[String(id)]) return Promise.reject(new Error('Offline pack dependency cycle: ' + id));
    dependencyStack[String(id)] = true;
    return cleanupOldCacheVersions().then(function () { return getIndex(); }).then(function (index) {
      var pack = findPack(index, id);
      if (!pack || !Array.isArray(pack.files)) throw new Error('Unknown offline pack: ' + id);
      if (!validFiles(pack)) throw new Error('Invalid offline pack: ' + id);
      if (!global.caches) throw new Error('Offline packs require Cache Storage support');
      var deps = depsOf(pack);
      return deps.reduce(function (chain, dep) {
        return chain.then(function () { return installPack(dep, null, dependencyStack); });
      }, Promise.resolve()).then(function () { return evictIfNeeded(pack.id); }).then(function () {
        return caches.open(CACHE_PREFIX + String(id));
      }).then(function (cache) {
        var files = pack.files.slice();
        var total = files.length;
        var done = 0;
        var next = 0;
        var installed = new Array(total);
        var concurrency = Math.min(INSTALL_CONCURRENCY, total || 1);
        // Agent 159: once one download fails the install is rolled back, so the sibling
        // workers must stop pulling more files instead of downloading into a dead cache.
        var failed = false;
        if (typeof onProgress === 'function') onProgress({ id: pack.id, done: 0, total: total });

        function worker() {
          var index = next;
          next += 1;
          if (failed || index >= total) return Promise.resolve();
          var file = files[index];
          return cache.add(assetUrl(file)).catch(function (error) { failed = true; throw error; }).then(function () {
            done += 1;
            installed[index] = file;
            if (typeof onProgress === 'function') onProgress({ id: pack.id, done: done, total: total, file: file });
            return worker();
          });
        }

        return Promise.all(Array.from({ length: concurrency }, worker)).then(function () {
          touch(pack.id);
          return { id: pack.id, files: installed, total: installed.length, dependencies: deps.slice() };
        }).catch(function (error) {
          return caches.delete(CACHE_PREFIX + String(id)).then(function () { throw error; });
        });
      });
    }).then(function (result) {
      delete dependencyStack[String(id)];
      return result;
    }, function (error) {
      delete dependencyStack[String(id)];
      throw error;
    });
  }
  function removePack(id) {
    if (!global.caches) return Promise.resolve(false);
    return getIndex().then(function (index) {
      var dependents = packsOf(index).filter(function (pack) {
        return pack && typeof pack === 'object' && depsOf(pack).indexOf(String(id)) !== -1;
      });
      return Promise.all(dependents.map(function (pack) { return isInstalled(pack.id); })).then(function (installed) {
        if (installed.some(Boolean)) throw new Error('Cannot remove offline pack ' + id + ': installed packs depend on it');
        var meta = readMeta();
        delete meta[String(id)];
        writeMeta(meta);
        return caches.delete(CACHE_PREFIX + String(id));
      });
    });
  }
  global.MylingoOfflinePacks = {
    VERSION: 1,
    INSTALL_CONCURRENCY: INSTALL_CONCURRENCY,
    MAX_INSTALLED_PACKS: MAX_INSTALLED_PACKS,
    getIndex: getIndex,
    findPack: findPack,
    isInstalled: isInstalled,
    installPack: installPack,
    removePack: removePack,
    assetUrl: assetUrl
  };
})(window);
