/*! Mylingo — Safe URL helpers (Agent 7) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MylingoSafeUrl = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function isSafeMediaUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    var raw = value.trim();
    if (/^(javascript|data|vbscript|file):/i.test(raw) || /^\/\//.test(raw)) return false;
    try {
      var parsed = new URL(raw, 'https://mylingo.invalid/');
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return !parsed.protocol || raw.charAt(0) === '/';
      return true;
    } catch (e) { return false; }
  }
  function isSafeRedirect(value) {
    return typeof value === 'string' && /^\.\.?\//.test(value) && !/^[a-z][a-z0-9+.-]*:/i.test(value) && value.indexOf('//') !== 0;
  }
  return { isSafeMediaUrl: isSafeMediaUrl, isSafeRedirect: isSafeRedirect };
});
