# Native dev build — live Razorpay card payments

The app runs in **Expo Go** for day-to-day JS work, but Razorpay is a **native module**
(`react-native-razorpay`) that Expo Go cannot load. Card/UPI payment therefore returns
`payment_sdk_missing` in Expo Go (checkout shows "online payment needs the latest app
build"). The **zero-rupee / 100%-coupon** path and **Cash-on-nothing** cases work without
the SDK. To exercise real payments you need a **development build** (dev client).

No app code changes are needed — `usePayment` already loads the SDK when present and falls
back gracefully when it isn't.

## What's already set up
- `react-native-razorpay@^3` is in `package.json`.
- `usePayment` (`src/features/payments/hooks/usePayment.ts`) drives:
  `create-order → Razorpay SDK → verify` (and `complete-zero-order` for ₹0).
- `eas.json` has `development` (iOS **simulator**) and `development-device` (real device) profiles.
- App config (`app.json`) is CNG/managed; a prebuild will generate `ios/` + `android/`.

## Option A — local build (fastest to iterate)
```bash
cd mobile
npx expo prebuild                 # generates ios/ + android/ from app.json (one time)
npx expo run:ios                  # builds the dev client + installs on the booted simulator
# then: npx expo start --dev-client   (Metro serves JS into the dev build)
```
> `react-native-razorpay` needs iOS deployment target ≥ 12 and CocoaPods; `expo prebuild`
> + `pod install` (run automatically by `run:ios`) handle linking.
> Razorpay's checkout UI works in the simulator for the flow, but **use a real device with
> test keys for a true end-to-end charge**.

## Option B — EAS cloud build (no local Xcode needed)
```bash
cd mobile
eas login
eas build --profile development --platform ios     # simulator .app (see eas.json)
# or a real device:
eas build --profile development-device --platform ios
# install the artifact, then:
npx expo start --dev-client
```

## Razorpay keys
- The **key id** comes from the backend: `GET /api/shop/payments/razorpay/public-key/`
  (`usePayment` fetches it; nothing to hardcode in the app).
- Backend test keys live in `web/docs/RAZORPAY_TEST_KEYS.md`.

## Verifying the flow
1. Add a meal to cart → Checkout → Proceed to Pay.
2. Razorpay sheet opens (dev build only) → complete with a test method.
3. App calls `/payments/razorpay/verify/`; on success the order rows are created and the
   app navigates to `/orders/my/{id}`.
4. 100%-coupon → `zero_rupee` path settles via `/payments/razorpay/complete-zero-order/`
   with **no** SDK — testable in Expo Go too.
