# Razorpay native/web contract review — 2026-10-10

This is a source review plus one unauthenticated, read-only production status
request. No OTP, login, payment attempt, order, refund or fulfillment was made.
No SDK upgrade, backend change, credential change or global configuration change
was performed. The local backend inspected is commit
`4ea260f09cc94774dc219cfb0cb3a295522342f1`; production code parity is not established.

## Production testing blocker

At `2026-10-10T12:14:17.770Z`, GET
`https://healthyome.com/api/shop/payments/razorpay/public-key/` reported
`enabled=true`, `is_live=true`, a live-mode public key, and saved cards enabled.
No key value is recorded here. The inspected backend chooses one global
`PaymentGatewaySettings` row; no segregated test-account payment path was found
in the inspected payment implementation. Production URL and Razorpay mode are
independent. Do not switch the global live keys to test a customer account.

The supplied test phone still needs correction by the user. Testing also needs
an approved server-controlled test path with segregated records and real
fulfillment/notifications disabled. Even a zero-value completion creates real
fulfillment and is not an authorized workaround. The current test APK retains
the existing development API configuration; changing it is not evidence of a
safe production test mode.

## Existing contract and safe source fixes

- Native and web both use the backend Razorpay order-creation endpoints,
  server-returned amount/currency/order ID, and server verification. Public key
  IDs come from the backend; signing and webhook secrets remain server-side.
- Food-plan purchase/recharge uses prepaid Orders checkout. No automatic
  Razorpay Subscriptions mandate was added or inferred from the product name.
- This checkpoint fixes a native/web mismatch: native now requires
  `verified === true` before reporting either a charged or zero-value checkout
  as paid. Web already checked this flag.
- A per-hook in-flight guard rejects overlapping payment starts. Four mocked
  tests cover unverified responses, confirmed success, zero-value completion
  and duplicate starts. This is not cross-device or restart-safe idempotency.
- Existing global query mutation retries remain disabled. No transport retry
  was added to transaction creation.

Server-created orders and server-side signature verification are required by
the [official Android integration guide](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-android/)
and [iOS integration guide](https://razorpay.com/docs/payments/payment-gateway/react-native-integration/standard/integration-steps-ios/).

## Blockers found in local backend code — report only

1. **Capture/amount/currency verification before fulfillment.** In
   `shop/api/payments.py:805`, verification checks transaction ownership and
   conditionally compares the stored order ID, then verifies the posted
   signature. It calls fulfillment and marks the local transaction captured.
   The inspected route does not fetch/check the gateway payment's captured
   status, amount or currency first. Require a nonempty stored order mapping,
   verify against that stored ID, and verify captured payment details before
   fulfillment. This is a source finding, not a production exploit test.
2. **Webhook event deduplication.** The receiver at
   `shop/api/payments.py:1140` verifies a signature over the request body and has
   transaction-state/fulfillment protections, but no persistent
   `x-razorpay-event-id` dedupe was found in the inspected handler. Duplicate and
   out-of-order events need explicit coverage; existing backend tests were not
   run. Razorpay documents raw-body verification and event-ID dedupe in
   [Validate and Test Webhooks](https://razorpay.com/docs/webhooks/validate-test/).
3. **Test-account isolation.** Do not test production completion until a
   pre-existing safe path is confirmed or separately scoped and approved. A
   live public key, a test phone, or a coupon alone provides no isolation.

## Native/web differences still open

- Web passes customer name/email/contact prefill and backend-provided
  customer/saved-card options; the current native helper does not yet forward
  those optional values.
- Native checks the public key and native SDK after creating a nonzero
  transaction. Move capability/config preflight before any transaction where
  possible to avoid orphan attempts.
- The native helper has no durable pending-payment recovery after app loss,
  network loss or uncertain verification. A failure after SDK success must not
  invite an unqualified second charge; reconcile the existing transaction
  before offering a deliberate new attempt. Backend reconciliation code exists
  but was not exercised or deployed.
- Distinguish transport retries from deliberate new attempts. Agree backend
  idempotency/status contracts before adding retries; do not blindly reuse an
  order for a new failed-payment attempt. See the current
  [Orders API](https://razorpay.com/docs/api/orders/create/).
- Physical-device UPI Intent/QR, app-switch recovery and iOS URL-scheme setup
  remain unverified. Live payment testing needs separate approval. Do not add
  a manual Android UPI Collect flow; the
  [migration notice](https://razorpay.com/docs/announcements/upi-collect-migration/standard-integration)
  distinguishes the remaining iOS exemptions. No Expo Go/QR preview is claimed
  to support native payments.

## Offering delivery-model review

- Delivered meals and their prepaid recurring deliveries are physical goods.
  No StoreKit or Play Billing implementation was added for these flows.
- `shop/consult_catalog.py` fallback session SKUs describe individual video or
  phone consultations. Its diet-plan SKUs bundle a custom plan with follow-ups;
  this is not evidence that every admin-managed production SKU is exclusively
  a live, non-replayable one-to-one service. The catalogue is database-managed
  and the fallback is not proof of current live offers.
- Functional training is represented as a monthly membership, recurring time
  windows and trainer availability. The schema/API do not explicitly establish
  in-person versus remote, individual versus group, or replayability.
- Obtain the actual delivery model for each diet-plan/training SKU before
  treating it as eligible for external checkout. No new group-class,
  downloadable-plan or premium-digital checkout was enabled by this review.
