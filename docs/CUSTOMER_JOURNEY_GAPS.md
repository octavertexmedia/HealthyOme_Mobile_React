# Customer journey acceptance gaps — 2026-10-10

This checkpoint is not complete web/mobile parity. The comparison below used
the local web/backend checkout at `4ea260f09cc94774dc219cfb0cb3a295522342f1`
and mobile customer code. A separate dev/main web branch review is in progress;
this local web snapshot must not be mistaken for the agreed post-merge target.
No web branch was merged or modified.

## Evidence levels

- **Rendered:** Android API 34 and iPhone 17/iOS 26.5 both display onboarding
  and Home. Screenshots are local delivery evidence, not full-flow acceptance.
- **Runtime:** iOS SecureStore successfully read a deliberately nonexistent,
  nonsecret probe key. No token was read, exported, or stored in plaintext.
- **Read-only backend check:** the configured development endpoint
  `GET https://dev.healthyome.com/api/shop/meals/` returned HTTP 200 with
  `count: 0` and an empty results list. The earlier guessed `/meal-items/`
  diagnostic returned 404; it is not the endpoint used by this application.
- **Source/tests only:** navigation fixes below have regression coverage;
  authenticated persistence, OTPs, purchases, fulfillment, and refunds remain
  untested. No test data was manufactured in the live backend.

## Concrete paired-source findings

Web paths are relative to the web repository; mobile paths are relative to this
repository. Line numbers refer to the inspected checkpoint, before small fixes.

| Journey gap | Paired source evidence | Checkpoint disposition |
| --- | --- | --- |
| Cart product cannot reopen its details | Web `frontend/src/components/cart/CartLineItem.tsx:36`; mobile `app/cart/index.tsx:63` | Meal row image/title now links to its actual detail screen; UI and malformed-row tests pass. Snack/custom-bowl rows are not sent to nonexistent detail routes. |
| Guest favourite loses the meal after login | Web `frontend/src/components/menu/MenuItemModal.tsx:177`; mobile `app/meal/[id].tsx:80` and `app/(auth)/verify.tsx:81` | Meal return intent is now passed through the existing allowlisted redirect path. Actual OTP/login remains untested. |
| Home subscription acquisition entry opens management | Web `frontend/src/components/dashboard/MobileHome.tsx:91` and `frontend/src/app/(app)/subscription/categories/page.tsx:70`; mobile `app/(tabs)/index.tsx:395` | Home now opens the existing public plans browser. Full web category-first/period-first discovery parity is still open. |
| Per-order address choice is absent | Web `frontend/src/app/(app)/checkout/page.tsx:2131`; mobile `app/checkout/index.tsx:60,544` | Open: native falls back to default/first saved address and its Change action opens account address management. Add order-local selection without mutating the account default. |
| Consultation health step occurs too late | Web `frontend/src/app/(app)/consult/booking/page.tsx:226` and `consult/health/page.tsx:326`; mobile `app/consult/booking.tsx:130` | Open: native starts payment immediately after booking creation; the later management health form does not reproduce web's pre-payment health step. |
| Signup referral capture is missing | Web `frontend/src/components/auth/ReferralCodeField.tsx:17` and `SavanaPhoneAuthPanel.tsx:207`; mobile `src/features/auth/api/auth.api.ts:21` | Open: capture, validate, persist and pass the referral code through the actual OTP contract. |
| Meal review journey is incomplete | Web `frontend/src/components/menu/ProductReviews.tsx:32`; mobile `app/meal/[id].tsx:141` | Open: native displays up to five reviews, has no write/edit path or pagination, and conflates missing data/request failure with no reviews. |
| Navigation/design/content differ materially | Web `frontend/src/components/BottomNavbar.tsx:40`; mobile `app/(tabs)/_layout.tsx:19,60` | Open: compare feature-flagged service entry points and actual content against the agreed dev/main target. Native platform conventions need not copy a desktop layout. |

The iOS onboarding screenshot also exposed a transformed adjacent-slide image
overlapping its neighbour. Slide clipping was added without changing branding.
The source change is distinct from authenticated flow verification.

Custom-bowl checkout is blocked in the inspected web checkout too
(`frontend/src/app/(app)/checkout/page.tsx:1239`). It is a shared contract gap,
not established here as a native-only regression.

## Recommended first complete acceptance milestone

**Guest shopping loop, on Android and iOS:** Home → populated catalogue → meal
details → add to local cart → reopen meal → adjust/remove → checkout sign-in
boundary, preserving the cart and return intent. Record the interaction and
matched screenshots; do not substitute unit tests for this demonstration.

Current blocker: the configured development catalogue is empty. Confirm the
correct populated staging API/data set. This does not require a payment or a
production configuration change. Continuing through sign-in requires a valid
disposable account/phone and explicit allowed test writes; continuing through
payment additionally requires an isolated test-payment path.

## Subsequent phases and exit gates

1. Agree the post-merge web customer target and close Home/catalogue/guest
   navigation and layout differences. Gate: the recorded guest loop above.
2. Complete account/address/quote/coupon/checkout and order status/reorder
   journeys, including referral capture and order-local address selection.
   Gate: disposable-account acceptance with server totals and account isolation.
3. Complete subscription discovery/purchase/schedule/pause/recharge/preferences,
   and consultation pre-payment health details; validate training/diet-plan
   delivery models before enabling external checkout for digital services.
   Gate: recorded lifecycle transitions, cancellation/error recovery and
   approved payment isolation. See `PAYMENT_REVIEW.md` for server safety blockers.
4. Release hardening: dependency findings, native warning cleanup, push,
   accessibility/small-device/offline recovery, privacy/data deletion,
   production environment selection, real-device testing, signing/build numbers
   and clean-clone native reproducibility. Gate: signed store candidates and
   authorized acceptance, not debug/simulator artifacts.
