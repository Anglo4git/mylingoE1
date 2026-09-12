import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import SafeUrl from '../../site/shared/js/safe-url.js';

test('Agent 7: dangerous media schemes are rejected', () => {
  assert.equal(SafeUrl.isSafeMediaUrl('javascript:alert(1)'), false);
  assert.equal(SafeUrl.isSafeMediaUrl('data:text/html,<svg/onload=alert(1)>'), false);
  assert.equal(SafeUrl.isSafeMediaUrl('//evil.example/x'), false);
});
test('Agent 7: ordinary relative and HTTPS media URLs are accepted', () => {
  assert.equal(SafeUrl.isSafeMediaUrl('../shared/img.png'), true);
  assert.equal(SafeUrl.isSafeMediaUrl('https://example.com/video.mp4'), true);
});
test('Agent 7: redirects are same-site relative paths only', () => {
  assert.equal(SafeUrl.isSafeRedirect('../courses/index.html'), true);
  assert.equal(SafeUrl.isSafeRedirect('./course.html?level=a2'), true);
  assert.equal(SafeUrl.isSafeRedirect('https://evil.example'), false);
  assert.equal(SafeUrl.isSafeRedirect('//evil.example'), false);
  assert.equal(SafeUrl.isSafeRedirect('javascript:alert(1)'), false);
});
test('Agent 7: no obvious private-key/API-key material in deployable site', () => {
  const root=path.resolve(process.cwd(),'site'); const files=[];
  function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.statSync(p);if(s.isDirectory())walk(p);else if(/\.(js|html|json)$/.test(name))files.push(p)}}
  walk(root);
  const secret=/(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----)/;
  for(const file of files) assert.equal(secret.test(fs.readFileSync(file,'utf8')),false,file);
});
