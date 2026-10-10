# Auth / E2E checkpoint — 2026-10-10

Reviewed mobile source: `e079d1ba6c53e739ae856193ce6221a188b3a20d`.
Backend/web source inspected read-only: `4ea260f09cc94774dc219cfb0cb3a295522342f1`.
This does not establish that production runs that backend revision.

## Supported contracts (code-verified, not live-authenticated)

| Client | Verification | Result |
| --- | --- | --- |
| Native phone | `/auth/otp/send/`, then `/auth/mobile/otp/verify/` with `phone_number` and `otp_code` | Django-issued OTP consumed; access/refresh JWT pair |
| Native email | `/auth/email-otp/send/`, then `/auth/mobile/email-otp/verify/` with `email` and `otp_code` | Django-issued email OTP consumed; access/refresh JWT pair |
| Web Firebase phone | Firebase `signInWithPhoneNumber`, confirmation, `getIdToken`, then `/auth/firebase/verify/` with `idToken` | Django session cookie; no mobile JWT pair |

Backend evidence: `shop/mobile_auth_views.py:96`, `shop/otp_auth.py:21`,
`shop/firebase_auth_views.py:60`, `shop/api_urls.py:87,129`.
Web evidence: `frontend/src/components/auth/ShopAuthUnified.tsx:628,664` and
`frontend/src/services/auth.service.ts:228`.
The separate legacy web OTP verifier also contains a trusted-test-number path;
the inspected native JWT verifier does not use it. A fixed web/Firebase test code
must not be submitted to native verification without a matching native OTP record.
No Firebase-to-mobile-JWT exchange was found in the inspected URL mappings.

## Local readiness

- Installed: Node 25.8.2, Jest, TypeScript, ESLint, ADB, Chrome, Xcode 26.6/simctl.
- Android emulator `emulator-5556` and iPhone 17 / iOS 26.5 are booted.
- Not installed in this mobile workspace: Maestro on PATH, Playwright, Firebase SDK.
  No missing tool was invoked, installed, or repeatedly retried.
- Firebase is installed in the separate web workspace; this does not enable native Firebase auth.
- Existing `test:guest-device` is Android public-guest smoke only. It changes UI routes;
  it was not run during this non-interfering auth preflight.
- Existing Chrome/CDP capture blocks non-GET/HEAD requests and is not a login harness.
- No automated iOS input harness is established. Do not treat screenshots as full E2E.

## Exact blockers / next supported action

1. `app.json` retains `readOnlyPreview: true`; the API interceptor blocks login POSTs
   and strips credentials. Keep this protection. A separately approved auth-capable
   test configuration/build is required for native authenticated E2E.
2. The supported parent-thread read returned an empty message list. The referenced
   credential message was not accessible; no account or OTP was guessed or retrieved
   from unrelated storage. Confirm whether the designated code is Firebase-only or
   a current Django-issued OTP before choosing the login flow.
3. For native login, use a current Django WhatsApp/email OTP for the designated
   account; alternatively a Firebase-to-JWT integration is a separate implementation
   decision, not a testing bypass. Web Firebase login alone cannot validate native auth.
4. Branding binaries remain on hold until faithful approved transparent assets arrive.
   The installed Android APK predates the current UI source.

## Safe repeatable checks

`npm run preflight:auth-e2e` checks configuration and environment-variable presence
only. It never contacts a server, enters an OTP, changes UI, installs software, or
prints identifiers/codes/tokens. A successful process exit means inspection completed,
not login succeeded; examine `blockers` and `authenticationAttempted`.

Optional future inputs are `HEALTHYOME_E2E_AUTH_METHOD` (`django-phone-otp` or
`django-email-otp`), `HEALTHYOME_E2E_IDENTIFIER`, and `HEALTHYOME_E2E_OTP`.
Use process environment only, not command-line literals or tracked files. No credential
file is created or loaded by this script; `.env*.local` is already ignored.

`node --test scripts/auth-e2e-preflight.test.cjs` verifies fail-closed behavior and
redaction. `src/features/auth/api/auth.api.test.ts` uses deliberately fake values and
a mocked HTTP client to pin both native contracts; it performs no real auth requests.

Checkpoint results: 5/5 Node preflight tests and 16/16 focused Jest tests across
auth API, auth store, and the preview API guard passed. The real-environment
preflight completed with authentication blocked and zero network requests.

No login, OTP send/verify, transaction, profile write, build, simulator restart,
deployment, or production configuration change was attempted during this checkpoint.
