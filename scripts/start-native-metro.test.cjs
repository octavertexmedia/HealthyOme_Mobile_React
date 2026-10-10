const test = require('node:test');
const assert = require('node:assert/strict');
const { rewriteNativeRequestUrl } = require('./start-native-metro.cjs');

test('rewrites the native entry while preserving absolute HMR URLs', () => {
  const url = new URL(rewriteNativeRequestUrl('http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true'));
  assert.equal(url.origin, 'http://localhost:8081');
  assert.equal(url.pathname, '/node_modules/expo-router/entry.bundle');
  assert.equal(url.searchParams.get('platform'), 'ios');
  assert.equal(url.searchParams.get('transform.engine'), 'hermes');
  assert.equal(url.searchParams.get('transform.routerRoot'), 'app');
});

test('retains relative middleware paths and supports source maps', () => {
  const result = rewriteNativeRequestUrl('/.expo/.virtual-metro-entry.map?platform=ios');
  assert.ok(result.startsWith('/node_modules/expo-router/entry.map?'));
  assert.ok(result.includes('transform.asyncRoutes=false'));
});

test('preserves HTTPS and accepts protocol-relative HMR entrypoints', () => {
  assert.ok(rewriteNativeRequestUrl('https://localhost:8081/index.bundle').startsWith('https://localhost:8081/'));
  assert.ok(rewriteNativeRequestUrl('//localhost:8081/index.bundle').startsWith('http://localhost:8081/'));
});

test('preserves unrelated paths and delegates to the existing rewrite hook', () => {
  assert.equal(rewriteNativeRequestUrl('/status'), '/status');
  assert.equal(rewriteNativeRequestUrl('/symbolicate', (url) => `existing:${url}`), 'existing:/symbolicate');
});
