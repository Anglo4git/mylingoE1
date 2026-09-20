// @ts-check
/**
 * Runtime content boundary.
 * @typedef {{id: string, file: string}} QuizManifestEntry
 */
/*! Mylingo Runtime Content Loader — Agent 62 */
(function (global) {
  'use strict';

  var VALID_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  var manifestPromises = Object.create(null);
  var jsonPromises = Object.create(null);

  function levelOf(value) {
    var level = String(value || '').toLowerCase();
    return VALID_LEVELS.indexOf(level) >= 0 ? level : 'a1';
  }

  function basePath(level) { return '../' + level + '/'; }

  function manifest(level) {
    level = levelOf(level);
    if (!manifestPromises[level]) {
      manifestPromises[level] = fetch(basePath(level) + 'quizzes.json', { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) throw new Error('Quiz manifest unavailable (' + response.status + ')');
          return response.json();
        })
        .then(function (list) {
          return Array.isArray(list) ? list : [];
        });
      // Agent 163: never memoize a FAILURE. quiz.html's "Try again" button calls
      // load() again in the same page; a cached rejected promise made every retry
      // fail instantly until a full page reload, even once the connection was back.
      manifestPromises[level].catch(function () { delete manifestPromises[level]; });
    }
    return manifestPromises[level];
  }

  function fetchJson(path) {
    return fetch(path, { cache: 'no-store' }).then(function (response) {
      if (!response.ok) {
        var error = new Error('Content unavailable (' + response.status + ')');
        error.status = response.status;
        throw error;
      }
      return response.json();
    });
  }

  function load(level, id, explicitFile) {
    level = levelOf(level);
    id = String(id || '');
    var key = level + '|' + id + '|' + String(explicitFile || '');
    if (jsonPromises[key]) return jsonPromises[key];

    jsonPromises[key] = (function () {
      if (explicitFile) return fetchJson('../' + String(explicitFile).replace(/^\.\//, ''));

      // The common grammar route is deterministic and avoids loading the whole
      // level manifest for the normal quiz path. Other content types fall back
      // to the manifest only after this cheap lookup fails.
      return fetchJson('../grammar/' + level + '/' + encodeURIComponent(id) + '.json')
        .catch(function (error) {
          if (error && error.status !== 404) throw error;
          return manifest(level).then(function (list) {
            var entry = list.find(function (item) { return item && String(item.id) === id; });
            if (!entry || typeof entry.file !== 'string') {
              var missing = new Error('Quiz not found: ' + id);
              missing.status = 404;
              throw missing;
            }
            return fetchJson('../' + entry.file.replace(/^\.\//, ''));
          });
        });
    }());

    // Agent 163: evict on failure (see manifest() above) so a retry really retries.
    jsonPromises[key].catch(function () { delete jsonPromises[key]; });

    return jsonPromises[key];
  }

  function loadManifest(level) { return manifest(level); }

  global.MylingoRuntimeContentLoader = Object.freeze({
    VERSION: '1.0',
    load: load,
    loadManifest: loadManifest
  });
}(window));
