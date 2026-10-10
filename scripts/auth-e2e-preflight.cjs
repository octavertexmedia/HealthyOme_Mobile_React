/* global __dirname */
// Read-only, environment-only contract check. Never sends OTPs or contacts a server.
const fs = require('node:fs');
const path = require('node:path');

function inspectAuthPrerequisites(config, environment = {}) {
  const method = environment.HEALTHYOME_E2E_AUTH_METHOD;
  const supportedMethod = ['django-phone-otp', 'django-email-otp'].includes(method);
  const identifierPresent = Boolean(environment.HEALTHYOME_E2E_IDENTIFIER?.trim());
  const otpPresent = Boolean(environment.HEALTHYOME_E2E_OTP?.trim());
  const blockers = [];
  if (config.extra?.readOnlyPreview !== false) {
    blockers.push('PREVIEW_AUTH_DISABLED');
  }
  if (!supportedMethod) blockers.push('NATIVE_DJANGO_OTP_METHOD_REQUIRED');
  if (!identifierPresent || !otpPresent) blockers.push('ENVIRONMENT_CREDENTIALS_MISSING');
  return {
    scope: 'local preflight only; not an authenticated device test',
    authenticationAttempted: false,
    networkRequests: 0,
    // Never echo untrusted method strings, identifiers, OTPs, tokens or URLs.
    method: supportedMethod ? method : 'unsupported-or-unspecified',
    environmentInputs: { identifierPresent, otpPresent },
    blockers,
    inputsCompatible: blockers.length === 0,
    nextStep: blockers.length > 0
      ? 'Resolve the reported prerequisites. No installation or retry was attempted.'
      : 'Use a separately approved auth-capable build and designated account; this check does not log in.',
  };
}

if (require.main === module) {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')).expo;
  // Successful inspection is distinct from successful login; inspect blockers in the report.
  console.log(JSON.stringify(inspectAuthPrerequisites(config, process.env), null, 2));
}

module.exports = { inspectAuthPrerequisites };
