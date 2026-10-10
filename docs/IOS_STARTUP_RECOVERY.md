# iOS startup recovery and splash-only navigation

## Verified restart error, 2026-10-10

Simulator logs for HealthyOMe PID 1966 show `No script URL provided` at
20:59:46, 21:00:40 and 21:02:53 IST (15:29:46, 15:30:40 and 15:32:53 UTC).
`RCTBundleURLProvider` returned no URL: there was no listener on localhost:8081,
and this installed Debug shell has no embedded main.jsbundle fallback.

The existing Metro packages resolved locally. Starting `scripts/start-native-metro.cjs`
once restored `packager-status:running`; an app-only relaunch created PID 7319 and
rendered Home. No Expo CLI, downloads, native rebuild, device reset or dependency
installation was needed. The previous missing server's exit cause was not established.

The sole HealthyOMe crash report found was `HealthyOMe-2026-10-10-184217.ips`:
capture time 18:42:01 IST, PID 88243, EXC_BAD_ACCESS/SIGSEGV in Hermes property
construction through EXJavaScriptObject/ConstantDefinition/AppContext initialization.
That is a historical, separate native crash; restoring Metro does not prove it fixed.
The simulator log reader also produced Apple network `<compose failure [shared UUID]>`
formatting messages; these are not evidence of a new app crash. No blanket claim of
error-free operation is made. Runtime acceptance is limited to the recorded routes.

## Splash navigation cause and fix

`app/index.tsx` is a JavaScript startup route, distinct from the native storyboard.
Both this route and `app/(tabs)/index.tsx` have pathname `/`. The previous shell
allowlist therefore drew Home's header and tabs around the two-second JS splash.

The shell now also checks resolved router segments: empty/root-index segments mean
startup; `(tabs)` means Home. Startup and unresolved deep links render no top bar,
tabs, shell brand or inset consumption. The content container remains stable so this
transition does not remount the navigator. Onboarding and login remain chrome-free.
The native storyboard already contains only centered artwork and is unchanged.

Root session restoration must finish before the navigator mounts. Native splash is
hidden after a JS destination or explicit retry screen commits. Session and onboarding
storage reads have a 15-second deadline and no automatic retry; a failed/hung read
shows a separate retry action rather than silently entering Home or hiding forever.
The artificial two-second JS splash delay is removed. Startup uses one original
brand mark with contain scaling; the supplied transparent composite remains on auth.

## Evidence boundaries

Unit coverage includes startup versus resolved Home, unresolved links versus login,
preserved route mounting, restoration success/rejection/timeout, explicit retry,
onboarding routing and stale completion after unmount. Native screenshots/video and
final bundle hashes live under artifacts and are reported separately after capture.
The existing Android guest test's profile link was corrected from a route-group name
to the public `profile` URL; this is a harness correction, not an app routing fix.

Read-only preview remains on. No OTP, payment, order, profile change, Firebase package,
credential change, production deploy or artifact-heavy GitHub Actions job was run.
