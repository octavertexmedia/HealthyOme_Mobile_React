# Guest correction runtime checkpoint — 10 October 2026

## Safety and source

Mobile base: `895180ba238564a055589560176c46a4a154c354` on
`codex/mobile-parity-fixes`. The new source commit accompanies this report.
Production base: `https://healthyome.in/api/shop`, verified against web same-origin
configuration and unauthenticated HTTP 200 public catalogue responses.
`app.json` enables read-only guest preview: no credentials are attached, no
session is restored, no push token is registered, and API writes are blocked.
No Expo CLI, Expo Go, EAS, missing-software installation, CI run or artifact
upload to Actions was used. Existing local dependencies and direct native tools
were used. Previous APK/Simulator artifacts are preserved.

## Automated checks

- `npm run check`: ESLint and TypeScript pass; 113 Jest tests / 28 suites pass.
- Native Metro/standalone preparation scripts: 8 Node tests pass.
- Regression coverage: public category/list/detail/customization, private history,
  safe back fallback, onboarding skip/legacy location, retained checkout return
  intent, category membership, Sunday default, zero-slot disabled Checkout,
  disabled meal routes, credential-free public GET and preview write rejection.

## Android

Existing QuickDeliver_API34 arm64 emulator, `emulator-5556`; SDK/Gradle/Java
already installed. Direct Metro bundle and cached offline `:app:assembleDebug`
succeeded. Sandbox Gradle lock sockets were denied once; executing the same
installed tool outside that sandbox resolved the permission issue without
downloading dependencies. A launch wait initially timed out during cold startup;
the activity subsequently resumed and public catalogue content rendered.

Final APK: `artifacts/HealthyOMe-guest-production-final.apk`, 228586360 bytes.
SHA-256: `506ef2cfbc1e398de6c13a5d3908667ecc737381955f9df7eff4ce72c554615e`.
APK Signature Scheme v2 verification passes. This is a debug-signed standalone
guest preview, not a production signing/store-ready build.
Categories → actual home-style plan → actual detail → public customization →
Checkout → sign-in were navigated and captured. Home-style data showed the
server's 20-day/default ₹4200 row and shorter durations, matching the live
walkthrough observation without embedding those amounts in source. No phone
number was entered and no OTP was requested.
An old `/onboarding/location` link now returns to Home without a pickup chooser.
The optional GPS/pickup screen is no longer part of the browsing journey.

## iOS

Existing iPhone 17 / iOS 26.5 simulator; Metro PID 87458 / port 8081 preserved.
The installed correctly signed simulator shell uses the current Metro source.
Debugger read only guest/configuration flags: guest=true, correct production
base, readOnlyPreview=true. No token/profile values were read by that check.
Public categories and customization rendered behind a persistent OS open-link
confirmation. Visual acceptance is incomplete until it is dismissed. System
Events automation timed out; no UI automation software was installed.

A Hermes `EXC_BAD_ACCESS` / SIGSEGV was captured at 18:42 local during editing/
hot reload; relaunch succeeded. Its cause is not established. Duplicate SwiftUI
class and background-mode warnings remain. No new iOS archive is advertised as
verified; the prior Simulator ZIP still needs Metro and is not an iPhone IPA.

## Evidence files

- `artifacts/guest-check.log`, `guest-native-script-tests.log`
- `artifacts/guest-android-accepted-build.log`, `guest-android-bundle.log`
- `artifacts/guest-android-plans.png`, `guest-android-detail.png`
- `artifacts/guest-android-customize-final.png`, `guest-android-checkout-login.png`
- `artifacts/guest-ios-categories.png`, `guest-ios-customization-blocked.png`
- `artifacts/guest-ios-settled-runtime.log`
- `artifacts/production-*-readonly.json` (public, read-only snapshots)
- `artifacts/live-web-reference/web-home.png`, `web-customize.png`

Web references were inspected locally via the Library skill. The web screenshots
are a desktop browser's centered mobile-style column, not device emulation.
No authenticated purchase/lifecycle acceptance or complete visual parity is
claimed. See CUSTOMER_JOURNEY_GAPS.md for the concrete remaining milestone.
