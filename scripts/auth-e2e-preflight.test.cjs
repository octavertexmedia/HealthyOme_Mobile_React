const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectAuthPrerequisites } = require('./auth-e2e-preflight.cjs');

test('blocks authentication in the preview and never attempts network access', () => {
  const report = inspectAuthPrerequisites({ extra: { readOnlyPreview: true } });
  assert.ok(report.blockers.includes('PREVIEW_AUTH_DISABLED'));
  assert.ok(report.blockers.includes('ENVIRONMENT_CREDENTIALS_MISSING'));
  assert.equal(report.authenticationAttempted, false);
  assert.equal(report.networkRequests, 0);
  assert.equal(report.inputsCompatible, false);
});

test('does not accept Firebase test codes as a mobile JWT flow', () => {
  const report = inspectAuthPrerequisites({ extra: { readOnlyPreview: false } }, {
    HEALTHYOME_E2E_AUTH_METHOD: 'firebase-phone',
    HEALTHYOME_E2E_IDENTIFIER: 'fixture-identifier',
    HEALTHYOME_E2E_OTP: 'fixture-code',
  });
  assert.deepEqual(report.blockers, ['NATIVE_DJANGO_OTP_METHOD_REQUIRED']);
});

for (const method of ['django-phone-otp', 'django-email-otp']) {
  test(`${method} checks presence only and never exposes environment credentials`, () => {
    const report = inspectAuthPrerequisites({ extra: { readOnlyPreview: false } }, {
      HEALTHYOME_E2E_AUTH_METHOD: method,
      HEALTHYOME_E2E_IDENTIFIER: 'private-fixture-identifier',
      HEALTHYOME_E2E_OTP: 'private-fixture-otp',
    });
    assert.deepEqual(report.blockers, []);
    assert.equal(report.inputsCompatible, true);
    assert.equal(report.authenticationAttempted, false);
    assert.doesNotMatch(JSON.stringify(report), /private-fixture/);
  });
}

test('missing config fails closed and arbitrary method contents are not printed', () => {
  const report = inspectAuthPrerequisites({}, { HEALTHYOME_E2E_AUTH_METHOD: 'secret-value' });
  assert.ok(report.blockers.includes('PREVIEW_AUTH_DISABLED'));
  assert.doesNotMatch(JSON.stringify(report), /secret-value/);
});
