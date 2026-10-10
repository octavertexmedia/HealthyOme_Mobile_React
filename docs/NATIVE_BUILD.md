# Native development builds

Build the existing native projects directly with Gradle and Xcode. These builds
do not require an Expo account, Expo Go, EAS, or a cloud build service. The app
currently includes Expo libraries and Expo Router as source dependencies;
removing those libraries would be a separate React Native migration.

Razorpay and Sentry use native modules. Validate those integrations with a native
development build, never with a production payment account during routine
development.

## What is configured

- `react-native-razorpay` is a locked dependency.
- `usePayment` drives the backend-authoritative
  `create-order -> Razorpay SDK -> verify` flow, including the separate
  zero-rupee completion endpoint.
- Expo Notifications and Sentry native modules are part of the existing projects.
- `ios/` and `android/` are generated and ignored. The commands below require
  those local projects and the already installed native dependencies; a clean
  clone does not contain them.

## Local build

From the repository root, with the Android SDK, JDK, Xcode, JavaScript
dependencies, and CocoaPods dependencies already installed:

```bash
cd android
SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew assembleDebug
cd ..

SENTRY_DISABLE_AUTO_UPLOAD=true RCT_NO_LAUNCH_PACKAGER=1 SKIP_BUNDLING=1 xcodebuild \
  -workspace ios/HealthyOMe.xcworkspace \
  -scheme HealthyOMe \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/healthyome-ios-derived \
  -disableAutomaticPackageResolution \
  CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- ONLY_ACTIVE_ARCH=YES ARCHS=arm64 \
  build
```

The Android output is `android/app/build/outputs/apk/debug/app-debug.apk`.
The iOS output is
`/tmp/healthyome-ios-derived/Build/Products/Debug-iphonesimulator/HealthyOMe.app`.
The iOS app is an ad-hoc-signed arm64 simulator artifact; it cannot be installed
on a physical iPhone. Keep simulator signing enabled: the earlier unsigned
build compiled but failed at runtime with SecureStore's "A required entitlement
isn't present" error. Xcode must embed the simulated application entitlement.
Manually adding restricted entitlements to the unsigned executable's code
signature is not an equivalent repair and was rejected by macOS.

Debug builds skip JavaScript bundling and normally load JavaScript from a local
development server. Compiling these artifacts therefore verifies native
integration, but does not establish standalone startup or end-to-end behavior.
No JavaScript development server, Expo CLI, or cloud service is started by the
commands above. A self-contained release build and physical iPhone installation
require separate bundling and Apple signing setup.

A real device and backend test-mode credentials are required for payment-method
UI and push-delivery validation.

## Native JavaScript server (no Expo CLI)

Check that port 8081 is free or already belongs to this project before starting
another server. From the repository root, use the installed Metro library:

```bash
node scripts/start-native-metro.cjs
```

The server binds only to `127.0.0.1:8081`; `/status` returns
`packager-status:running`. It supports the existing native entry URL and
preserves absolute HMR URLs, avoiding the previously observed Metro
"Expecting the request url to have a valid protocol" crash. Its URL tests run
with `node --test scripts/start-native-metro.test.cjs`. Missing dependencies
must be resolved deliberately; the script never downloads or retries installs.
This is a local simulator server, not a production service or physical-device
LAN setup. The bundled standalone Android APK does not require it.

## Standalone Android test APK

The follow-up delivery adds `scripts/bundle-native.cjs`, which invokes the
installed Metro library directly to generate a production-mode JavaScript
bundle and copy the native assets. It does not start a development server or
invoke Expo CLI. It uses the repository's existing Metro configuration and
Expo/NativeWind libraries; it does not remove them.

```bash
node scripts/bundle-native.cjs android
cd android
NODE_ENV=production SENTRY_DISABLE_AUTO_UPLOAD=true ./gradlew :app:assembleDebug \
  --offline --init-script ../scripts/standalone-android.init.gradle
```

Preflight the Gradle distribution/cache, SDK 36, NDK 27.1.12297006, JDK 17,
JavaScript dependencies, and generated native project before running. The audit
machine used the already downloaded Gradle 9.0.0 distribution and its existing
`/tmp/healthyome-gradle-home` cache, avoiding new dependency downloads.

`scripts/bundle-native.cjs android` first runs the repository-owned
`scripts/prepare-standalone-android.cjs`. It locates the generated Kotlin
application from `app.json`, then idempotently adds this argument to
`ExpoReactHostFactory.getDefaultReactHost` so a bundled Debug test artifact
loads its bundled JavaScript:

```kotlin
useDevSupport = BuildConfig.DEBUG && !assets.list("").orEmpty().contains("index.android.bundle"),
```

The preparation script can also be run separately with
`node scripts/prepare-standalone-android.cjs`. It refuses missing projects,
unsupported templates and conflicting custom settings rather than overwriting
them; it does not install software or generate a native project. Four fixture
tests (`node --test scripts/prepare-standalone-android.test.cjs`) cover fresh
templates, idempotence, conflicting templates/settings and CRLF preservation.
The actual generated project is still ignored. A fresh-clone generation and
build has not been verified; reproducible hook application is not a claim of
clean-clone build readiness.

The init script adds only the generated test bundle/assets to the Debug source
set. It retains the existing Android Debug signing key and application ID; it
is not a Play Store release and cannot replace an installation signed with a
different key. `HealthyOMe-standalone-test.apk` is delivered separately from the
original server-dependent `HealthyOMe-debug.apk`.

For local Android Emulator and iOS Simulator Maestro smoke tests, see
`docs/QUALITY_AND_CLOUD_TESTING.md`. No cloud workflow or paid service is used.

## Payment safety

- The Razorpay public key ID comes from the backend; no payment secret belongs
  in the mobile repository.
- Use only a non-production backend and Razorpay test mode for payment testing.
- A successful verification can create server-side order records. Do not run it
  without an approved disposable test account and explicit authorization.
- Cancellation and zero-charge behavior should be exercised before any
  test-mode payment completion.
