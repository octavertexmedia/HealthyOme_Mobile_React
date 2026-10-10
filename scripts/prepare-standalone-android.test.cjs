const test = require('node:test');
const assert = require('node:assert/strict');
const { addStandaloneHook } = require('./prepare-standalone-android.cjs');

const fixture = 'before\n    ExpoReactHostFactory.getDefaultReactHost(\n      context = applicationContext,\n      packageList = PackageList(this).packages\n    )\nafter';
test('adds the standalone hook to a regenerated native template and preserves surrounding code', () => {
  const changed = addStandaloneHook(fixture);
  assert.match(changed, /useDevSupport = BuildConfig.DEBUG && !assets.list/);
  assert.ok(changed.startsWith('before\n'));
  assert.ok(changed.endsWith('\nafter'));
  assert.match(changed, /packageList = PackageList\(this\).packages/);
});
test('is idempotent on the current prepared project', () => {
  const changed = addStandaloneHook(fixture);
  assert.equal(addStandaloneHook(changed), changed);
});
test('refuses unknown templates and custom native settings without overwriting them', () => {
  assert.throws(() => addStandaloneHook('different native template'), /template changed/);
  assert.throws(() => addStandaloneHook(fixture + '\nuseDevSupport = customValue,'), /custom useDevSupport/);
  assert.throws(() => addStandaloneHook(fixture + fixture), /exactly one/);
});
test('preserves CRLF native templates', () => {
  const changed = addStandaloneHook(fixture.replaceAll('\n', '\r\n'));
  assert.ok(!changed.replaceAll('\r\n', '').includes('\n'));
});
