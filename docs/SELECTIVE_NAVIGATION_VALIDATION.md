# Selective navigation checkpoint — 2026-10-10

This supersedes the earlier policy that kept the full brand header on subscription
details/setup, Cart and Profile. Implementation began from mobile commit
`e079d1ba6c53e739ae856193ce6221a188b3a20d`; the commit containing this report is
the revised source checkpoint. No native binary was rebuilt in this pass.

## Explicit route policy

| Routes | Full location/brand/profile/cart header | Bottom tabs | Route controls |
| --- | --- | --- | --- |
| Home, main menu/catalog, Snacks, Training, Dietitian; equivalent service-index aliases | Yes, once | Yes | Content heading as needed |
| Subscription categories/plan list, Orders, Profile | No | Yes | Compact Back/title/Cart bar |
| Plan details/menu/customization, Cart, account pages, service/order/subscription details | No | No | Compact route controls; no second branded bar |
| Checkout, consultation health, review editing | No | No | Task-specific Back/title and CTA |
| Login/OTP/onboarding | No | No | Existing route-owned Back/Close and branding |

`shellPolicy.ts` uses exact allowlists rather than prefix-wide branding. Unknown
routes default to no global chrome. Group aliases, trailing slashes and query strings
are covered by tests. Screen-owned headers and the shared shell never both introduce
a brand row on details.

`ScreenHeader` replaces duplicated inline bars in subscription browsing/details/setup,
Cart, Checkout, Profile and Orders. Back follows history or a safe deep-link fallback.
Cart remains reachable while setting up a plan; Cart/Checkout avoid recursive cart
buttons. Existing in-memory draft retention is unchanged. No checkout or auth contract
was changed by the navigation work.

## Both platforms

- Android: Material back/cart/location/profile icons, 64dp compact top bars, left-aligned
  20sp titles, 48dp header controls, ripple feedback, selected-tab tonal indicators,
  12sp tab labels and a 72dp navigation area. System fonts are retained.
- iOS: genuine SF Symbols, 52pt compact bars with centered 17pt titles and 44pt
  controls. Full brand bars remain limited to primary browsing.
- Shared CTAs have at least 48dp Android / 44pt iOS height. They remain in normal
  layout, not overlaid on scroll content. Cart no longer reserves an obsolete 120pt
  list spacer. The native Android manifest already uses `adjustResize`; iOS shell
  keyboard avoidance is retained, while auth owns its own keyboard handling.
- The shell consumes top/bottom/side system insets exactly once for non-auth routes,
  including when no global bar is present. Children receive zero remaining insets;
  auth/onboarding retain their own insets. This avoids a status-bar collision when
  removing the old global header.
- Android's larger header controls reserve equal 104dp side zones for the centered
  brand; iOS uses 96pt. Original brand proportions are unchanged and clamp on narrow
  screens. Neither rejected generated logo is used.

## Verification and limitations

Full `npm run check` passed after the route changes: lint, TypeScript and 257 Jest
tests / 42 suites. All 13 Node tests (auth preflight plus existing native preparation
helpers) passed. A follow-up 49-test run passed after restoring the established
shared-button rendering implementation while retaining the larger touch targets.
The final 72-test navigation/icon check passed, including actual Material icon
mapping assertions and SF Symbol back/cart/location/profile mappings. TypeScript,
targeted lint, guest-harness syntax, and `git diff --check` also passed after those
final assertions. No screenshot is represented as a substitute for these checks.

An initial targeted run exposed two test-fixture gaps caused by the newly shared cart
action importing the real cart store. The fixtures were corrected; no missing runtime
software was installed or retried. These were Jest isolation errors, not failed device
logins. Native build/SDK checks were not repeatedly run.

Screenshots inspected on the existing simulators:

- `artifacts/ios-selective-subscription-list.png`: current Metro source, one compact
  Back/title/Cart bar, no global brand row, one bottom tab bar, content below the status
  area. The public deep link succeeded without an OS confirmation dialog.
- `artifacts/ios-selective-plan-detail.png`: current Metro source, compact route bar,
  no bottom tabs, visible Quick subscribe/Customize CTAs above the home-indicator area.
  These CTAs were not activated. This is visual evidence, not authenticated E2E.
- `artifacts/ios-selective-header-current.png`: an earlier login screenshot confirmed
  no global header/tabs and the original opaque logo backgrounds. It predates the
  final shared-button adjustment and is not final button-layout evidence.
- `artifacts/android-selective-header-old-apk.png`: the installed Android APK still
  displays the old home/navigation implementation. It is explicitly NOT acceptance
  evidence for this source. Its bundled JS cannot hot-reload through Metro; a new
  Android build is held pending approved faithful transparent branding assets.

The Android guest harness now asserts route-specific brand/header/tab counts, with
separate source-HEAD and installed-binary provenance. It was syntax-checked but not
run against the known-stale APK. No iOS tap/keyboard/back gesture coverage is claimed;
the public `simctl openurl` checks do not establish accessibility-input permission.

Original asset hashes remain unchanged:

- Logo: `e2d5933eb2f58837188667deb20e388aa7a3032f0ee162c67076328570f0db32`.
- Wordmark: `5a108ac8b18f01d293740737aba33c0706b963c424ee4de79eff155aa0fc80bd`.

Auth prerequisites and the Firebase-web/native-JWT mismatch are recorded separately
in `AUTH_E2E_PREFLIGHT.md`. The supplied OTP was not accessible from the supported
parent-thread reader. No credential values were guessed, printed, saved or submitted.
Read-only preview remains enabled; no orders, payments, account writes, backend auth
changes, Expo CLI/EAS invocation, installs, builds, deployments or CI artifact uploads
were performed. Simulator and Metro processes were preserved.

Next acceptance gate: approved faithful transparent assets, one rebuilt safe-preview
Android APK with matching source provenance, then Android guest route smoke and paired
device screenshots. Auth-capable testing remains a separate explicit configuration
decision and must retain money/fulfillment restrictions.
