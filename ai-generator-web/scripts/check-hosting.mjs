// Read-only smoke test for the nginx deployment (not Vite's preview server).
// Usage: node scripts/check-hosting.mjs http://127.0.0.1:4185
import assert from 'node:assert/strict';

const baseURL = process.argv[2];
if (!baseURL) throw new Error('Pass the URL of the nginx deployment to check');
const index = await fetch(new URL('/index.html', baseURL));
assert.equal(index.status, 200);
const html = await index.text();
const asset = html.match(/src="(\/assets\/[^"\s]+\.js)"/)?.[1];
assert.ok(asset, 'The built entry script must be present');

for (const path of ['/index.html', '/reports/new', '/sw.js', '/version.json', '/pdf.worker.min.mjs', asset]) {
  const response = await fetch(new URL(path, baseURL), { method: 'HEAD' });
  assert.equal(response.status, 200, path);
  assert.ok(response.headers.get('content-security-policy'), `${path}: missing CSP`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
  const cache = response.headers.get('cache-control') ?? '';
  assert.ok(path.startsWith('/assets/') ? cache.includes('immutable') : cache.includes('no-cache'), `${path}: incorrect caching`);
  if (path.endsWith('.mjs')) {
    assert.match(response.headers.get('content-type') ?? '', /javascript/, `${path}: incorrect module MIME type`);
  }
}
const missing = await fetch(new URL('/assets/hosting-check-missing.js', baseURL), { method: 'HEAD' });
assert.equal(missing.status, 404, 'Missing JS must not return the SPA HTML');
console.log('nginx MIME, caching, security headers, and SPA routing checks passed');
