# Customer journey acceptance gaps — 10 October 2026

## Current correction checkpoint

This is a guest-flow correction, not complete web/mobile parity or a store release.
Base mobile commit: `895180ba238564a055589560176c46a4a154c354`.
The source commit containing this report is the current checked checkpoint.

The live healthyome.in walkthrough is the behavioral reference. Its browser was
1180×757 with a centered 430px app column, not mobile-device emulation. The saved
Home and public customization screenshots were materialized locally from Library
and inspected. Local web source at `4ea260f09cc94774dc219cfb0cb3a295522342f1`
supplements these observations; it does not establish the deployed commit.
The separately reviewed feature branch has not been merged by this mobile task.

## Corrected

- Removed mandatory GPS/pickup selection from onboarding and splash routing.
  Skip/finish now opens Home. The old location link redirects safely to Home.
  No saved delivery addresses, backend pickup records or location permissions
  were deleted or rewritten.
- Public subscription acquisition now follows category → plan list → slug-based
  detail → customization. `/subscription` opens public categories; personal
  history is `/subscription/my`, with `/subscription/active` retained as an alias.
- Customization uses the actual plan, diet-category IDs, periods, prices, allowed
  meal times and selection limit. The default chooses Veg when available and
  its longest period, without assuming a category ID. Sunday starts and optional
  Sunday veg-day selection are disabled; the next-day default skips Sunday.
- Guest Checkout requests sign-in, retaining plan ID/slug, date, meal times,
  veg weekdays, instructions and WhatsApp preference in the allowlisted return
  path. No address, token or health information is put in that path.
- Removing the last meal time disables Checkout. The displayed estimate uses
  the exact selected pricing row multiplied by selected slots, not a cheapest
  variant or copied web amount. Final purchase pricing remains server-owned.
- Private subscription history and address queries stay disabled for guests.
  Personal notification/profile links open history, not the public catalogue.
- Current production flags disable Quick Meals and enable Snacks. The native
  catalogue tab follows these flags. Disabled Menu/meal deep links return Home;
  quick-meal Home categories, strips and featured entries are hidden.

## Verified public production source

The web browser uses same-origin `/api/shop` via
`frontend/src/lib/shopApiBase.ts`; the Docker `http://web:8000/api/shop` address
is server-internal, not a mobile base URL. `healthyome.com/api/shop/meals/`
redirected to canonical `https://healthyome.in/api/shop/meals/`.

Unauthenticated GETs returned HTTP 200 for meals, subscription plans, browse
categories, browse catalogue, the home-style lunch overview, and site settings.
Observed data: 2 quick-meal rows, 76 subscription pricing rows, 4 browse
categories and 8 meal-plan types. Counts/prices are observations, not constants
embedded in the app. The disabled quick-meal catalogue is not exposed merely
because its API returns data.

The checkpoint's `app.json` selects `https://healthyome.in/api/shop` with
`readOnlyPreview: true`. Native runtime reads this bundled source configuration.
Preview requests omit credentials, session restoration/push registration are
skipped, and POST/PUT/PATCH/DELETE are rejected before reaching the network.
This safety flag intentionally prevents sign-in and all production submissions
until an authenticated test scope is approved.

## Evidence and limitations

- Lint and TypeScript pass. Jest: 113 tests in 28 suites. Native script tests: 8.
- Public Android categories, plan list, detail and customization rendered with
  real data. Tapping Checkout opened sign-in without creating a booking/order.
  See the accompanying guest runtime report for final APK and interaction status.
- iOS runtime confirms guest state, the production base and read-only mode.
  Public categories/customization render, but an OS “Open in Healthy-O-Me?”
  dialog obstructed visual acceptance. The user was asked to tap Open once;
  macOS UI automation timed out and was not treated as a successful interaction.
- One iOS Hermes SIGSEGV occurred during the editing/hot-reload session. Relaunch
  restored the app; root cause is unresolved. Existing duplicate RCTSwiftUI
  class/background-mode warnings remain release blockers to investigate.
- No OTP, account/address/health submission, order, booking, payment (including
  zero-rupee), fulfillment, refund, deployment or merge was performed.
- Tests validate return-path preservation; actual post-login continuation is
  untested while the corrected phone/account and allowed writes are pending.

## Remaining prioritized work

1. Finish uninterrupted iOS visual acceptance and Android guest snack/detail/
   local-cart/public-checkout acceptance. Do not equate API availability or unit
   tests with a recorded customer journey.
2. Complete subscription UI parity: menu-card/day-wise nutrition schedule,
   Quick subscribe, date-range/holiday calendar, compact selectors and matching
   content/layout. Current native detail/customization is public but not a
   pixel-equivalent reproduction of the inspected web screenshots.
3. Implement per-order delivery-address selection without changing the account
   default. Current checkout still falls back to default/first saved address.
   Bind quote, payment payload and fulfillment to the same selected address.
4. Move consultation health capture before payment. Current native booking
   still pays immediately after booking creation; the management health form
   is too late. Validate with mocks before any authorized account writes.
5. Close referral capture, public product-review/error/pagination/write flows,
   account-entry auth boundaries, and the complete flag-driven navigation set
   (live Home/Snacks/Training/Orders/Dietitian versus native account tab).
6. Resolve backend/release blockers separately: JWT inbox support, refresh
   behavior, payment reconciliation/webhook regressions/refund accounting,
   store signing, privacy, real-device testing and native runtime warnings.
   Never fall back to legacy unpaid `orders/place` or claim payment reliability
   from mocked verification alone. Preserve typed completion IDs and paid
   subscriptions whose menu is pending.

## Recommended next acceptance milestone

Complete the recorded guest subscription and snack-shopping loops on both
platforms against the inspected live flow, with zero production submissions.
Then select the order-local address + pre-payment consultation-health milestone.
Authenticated acceptance requires the corrected test phone/account and explicit
allowed writes; payment acceptance additionally needs approved payment isolation.

The Library reference influenced public/private route separation, plan-driven
selection rules, disabled-slot checkout and the remaining visual-gap list.
