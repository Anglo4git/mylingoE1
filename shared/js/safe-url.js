/*! Mylingo — Safe URL helpers (Agent 7) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MylingoSafeUrl = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function isSafeMediaUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    var raw = value.trim();
    // WHATWG URL parsing treats backslashes the same as forward slashes for
    // http(s) resolution, so '/\evil.com', '\\evil.com' and '\/evil.com' are
    // protocol-relative to an external host exactly like '//evil.com' is,
    // even though they don't match a literal '//' prefix. Normalise slashes
    // for this check only (the URL itself is still parsed from the raw string below).
    // Agent 203: the URL parser also drops every ASCII tab / CR / LF and strips leading and
    // trailing C0 control characters and spaces, so '/\t/evil.com', '/\n/evil.com' and
    // '\u0001//evil.com' were protocol-relative to an external host while slipping past the
    // '//' test above. Both checks now run on the same text the parser sees.
    var parsable = raw.replace(/[\t\n\r]/g, '').replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, '');
    var slashNormalized = parsable.replace(/\\/g, '/');
    if (/^(javascript|data|vbscript|file):/i.test(parsable) || /^\/\//.test(slashNormalized)) return false;
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
