# Cohesive mobile source checkpoint — 10 October 2026

This is a source/test checkpoint and safe guest-preview handoff, not full
web/mobile parity, authenticated customer acceptance or store readiness.
Branch: `codex/mobile-parity-fixes`; base:
`17ebcc008fecc9f2cb89dcb8bc16e3ffc81f066b`. The commit containing this document
identifies this source checkpoint. Subsequent artifact evidence records its
exact commit, APK hash, build result and actual device coverage separately.

## Implemented and fixture-tested

- Central customer flags drive Home, tabs, Snacks and Training direct-route
  guards. Loaded settings default missing flags to enabled, matching web main
  `ccb8eaca84ee4d3eb1e004735bf9badc2db4ba50`; absent settings fail closed.
  Home-only card flags do not hide the corresponding service tab. Production
  currently exposes Home, Snacks, Training, Orders and Dietitian. The Account
  entry remains in the Home header; paid training history remains reachable.
- Checkout exposes an order-local saved-address picker. Initial selection uses
  default/first, but choosing another address does not call set-default or
  update the address. Quote, payment order and fulfillment share its ID.
  Address removal, quote refresh failure, changed cart/address/coupon/session
  and duplicate submits fail closed. Session changes remount private state.
- Consultation booking creates the pending booking, then opens a private
  health form, then saves validated health before allowing payment. Existing
  unpaid bookings use the same route. Only booking ID travels in navigation
  or payment metadata. Draft health stays in component memory; the UI discloses
  that the verified backend save also updates the customer's health profile.
  Save errors, unconfirmed/closed bookings, unmount and session changes block
  subsequent payment. No health save or booking was executed live.
- Public product reviews retain credential-free paginated reads. A separate
  session-scoped editor loads `my_review` and can create/update using the
  verified POST contract (rating 1–5, comment maximum 2,000 characters).
  Guests return through allowlisted login routes. The snack modal closes before
  navigation; Back to product can reopen the selected snack. Duplicate saves,
  malformed responses and late-session results are covered by tests. Preview
  mode disables saving; no review was submitted.
- Original `logo.png` and `logo_text.png` were downloaded from
  `https://healthyome.vercel.app/`, returned HTTP 200, and were inspected.
  Unmodified images are reused with `contain`, without tint, in the shared
  brand lockup on Home, login, verification, onboarding and the JavaScript
  splash. Native launcher/splash assets are unchanged and remain a separate
  acceptance item.

Prices remain API-driven. No local price override or backend change was made.
The code-review skill guided session-race handling, private-data separation,
bounded review pagination and explicit failure tests.

## Brand provenance

| Original asset | Pixels | Bytes | SHA-256 |
| --- | --- | --- | --- |
| `healthyome-logo.png` | 4000×4000, alpha | 824325 | `e2d5933eb2f58837188667deb20e388aa7a3032f0ee162c67076328570f0db32` |
| `healthyome-wordmark.png` | 4000×1192, alpha | 451271 | `5a108ac8b18f01d293740737aba33c0706b963c424ee4de79eff155aa0fc80bd` |

The wide wordmark is not stretched into a square launcher icon. Unit coverage
checks aspect-preserving rendering, nominal image boxes and absence of tint.

## Existing-tool validation and local E2E

Installed Node/Jest/TypeScript/ESLint, Chrome, ADB, Android SDK 36,
NDK 27.1.12297006, JDK 17 and cached Gradle 9.0.0 are used. No Expo CLI,
Expo Go, EAS, Maestro/Playwright installation, paid testing service or Actions
artifact upload is required. Missing prerequisites terminate the new scripts;
they do not run install/retry loops.

`npm run check` runs lint, TypeScript and the aggregate fixture suite.
`node --test scripts/start-native-metro.test.cjs scripts/prepare-standalone-android.test.cjs`
passes 8 native-tool tests. Exact aggregate results are included in the artifact
handoff; source tests are not evidence that production writes were executed.

`npm run capture:web-reference` uses existing Chrome and Node's CDP/WebSocket
support with a new temporary profile. It blocks all non-GET/HEAD web requests.
It successfully captured public Home at **411×914 CSS pixels**, with the five
expected navigation labels. The rendered page, not an assumed deployed Git
revision, is the visual baseline. The previous 1180px browser capture with a
centered 430px column was not mobile emulation.

After installing the independently verified safe-preview APK, use:

```bash
HEALTHYOME_ANDROID_SERIAL=emulator-5556 npm run test:guest-device
```

This free local ADB smoke runner checks public Home, Snacks, subscription
categories, Training, Dietitian and the review-login boundary. It does not
install software, erase app data, enter credentials or submit forms. It records
only public screenshots/UI text. It is a route smoke test, not a complete
purchase flow, screenshot-diff system or authenticated E2E suite. It assumes
onboarding is already complete and the selected device has the verified APK.
The test emulator is API 34, 1080×2400 pixels at 420 dpi (~411.43×914.29 dp).

## Safety and exact remaining blockers

1. Bundled `readOnlyPreview: true` remains in force against the verified
   production public API. Writes and credentials are blocked before networking;
   session restore and push registration are skipped. Thus this APK intentionally
   cannot complete OTP sign-in or any transaction.
2. Account authentication/browsing was authorized separately, but the fixed
   test OTP referenced in the parent message was not available through the
   supported thread reader (zero turns returned). No OTP was guessed, logged
   or embedded. Actual auth acceptance needs the supplied OTP and an explicitly
   scoped authentication-enabled test configuration; other production writes
   remain unapproved. Do not disable all preview guards silently.
3. Health save also mutates the profile. Address/cart saves, reviews, pending
   bookings and payments require separately approved test writes/isolation.
   Public payment configuration is live mode; no charge, order, refund,
   zero-value purchase or fulfillment is authorized by these tests.
4. iOS visual acceptance remains blocked by the existing OS open-link dialog.
   Mac accessibility/input-posting preflight returned false. No denied click
   was retried, permission changed, or simulator/Metro restarted. The user must
   dismiss the dialog before visual checks continue.
5. The previous iOS native-constant/Hermes crash did not reproduce on one cold
   launch and one full reload, but remains unresolved. Native warnings,
   real-device push/payment behavior, signing/privacy/GST/webhook/reconciliation
   gates and clean-clone native generation/build remain open.
6. Visual equivalence is not achieved. Home now has an explicit brand bar absent
   from the captured web viewport; hero/card spacing, bottom-navigation shape,
   product/menu/nutrition/date-calendar layouts and physical-device sizes need
   measured comparison. Native launcher/splash branding is not updated here.
7. Incoming signup referral attribution, verified account deletion/photo and
   training cancellation/rescheduling contracts, and custom-bowl fulfillment
   remain separate gaps. The prior dependency-audit baseline also remains open.

## Recommended next milestone

Record the complete guest snack/detail/local-cart/checkout-login and subscription
loops on Android, unblock iOS, then close measured visual differences against
the 411px reference. Follow with the corrected test-account login/return path
in a narrowly scoped build; do not allow purchase/profile mutations implicitly.
Only then select disposable-account address/health/review writes and isolated
payment acceptance. Keep server quotes authoritative and existing release
artifacts as clearly labelled history.
