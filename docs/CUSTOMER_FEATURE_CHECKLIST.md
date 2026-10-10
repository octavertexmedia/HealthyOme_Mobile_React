# Customer app scope and remaining work — 2026-10-10

This is a source-level inventory, not a claim of completed device acceptance.
The earlier native builds passed. Current public-review source changes pass
lint, TypeScript, and 134 unit/contract/UI tests in 30 suites. Eight native-tool
fixture tests passed at the prior checkpoint; they were not rerun here.
The earlier standalone guest Android APK completed public subscription browsing
and reached sign-in from Checkout. It predates the public-review follow-up.
No authenticated transactional flow has been exercised against a live backend.

See `CUSTOMER_JOURNEY_GAPS.md` for paired web/mobile journey evidence and the
next acceptance milestone. Current production public catalogue GETs return data;
API availability and route presence do not establish a complete shopping journey.

Mobile branch: `codex/mobile-parity-fixes`.
Public-review follow-up base: `1192006d42064cac91012d6a9929e1b87af2efaa`.
The commit containing this checklist identifies the new source checkpoint.
Public-review contract evidence is web `origin/main`
`1669b5d57cb313a9b3e2afb3713f3f2b5ea59ea3` plus a live unauthenticated HTTP 200.
Earlier local backend contract evidence was read at
`4ea260f09cc94774dc219cfb0cb3a295522342f1`; its deployment parity is unverified.

| Customer feature | Code status | Verification and remaining scope |
| --- | --- | --- |
| Onboarding and location | Mandatory GPS/pickup selection removed; Skip/finish and legacy location route lead Home | Android Home/legacy-route check passed; no saved address or backend pickup record was changed. |
| Home, banners and service links | Fixed CMS carousel, layout values, promo routes and visibility flags | Code checked; backend-content variations and all links need device checks. |
| Meal catalogue, filters and details | Present, with API response/image handling | Live catalogue, filter, dietary and availability edge cases untested. |
| Snacks | Catalogue and cart support present | Live availability and mixed-cart E2E untested. |
| Public product reviews | Shared meal-detail/snack-modal public rating/count/list, pagination and explicit loading/error/empty/retry UI added | Live snack review GET HTTP 200 (empty); 21 new API/UI tests cover populated pages, malformed responses, retry and product changes. Device acceptance and review create/edit/sign-in return UI remain open; no reviews submitted. |
| Guest/account navigation | Fixed guest-safe account content and internal post-login redirects | Redirect rules covered by tests; authenticated navigation needs a test account. |
| Phone and email OTP | Send/verify/resend APIs and login screens present | No OTP sent or verified during validation. |
| Session restore and logout | Fixed token-backed restore, query-cache clearing, local cart cleanup and late-session response guards | Unit tests cover absent/failed/rotated tokens, remote logout failure and late responses. Health profile data is no longer persisted in AsyncStorage. |
| Cart | Fixed server reconciliation and local row preservation; account-owner tracking added | Reconciliation/checkout tests pass; rapid concurrent edits and cross-device cart E2E untested. |
| Checkout, addresses, delivery inputs and coupons | Fixed server quote validation, fulfillment fields, totals and fail-closed paths | Guardrail tests pass; actual checkout not executed. |
| Razorpay and zero-rupee orders | Typed create/verify/complete flow present; unsupported runtime guard; explicit server-verification and overlapping-payment protections | Native SDK compiled; payment safety behavior covered by mocked tests. Real/test-mode payment completion and timeout recovery remain untested. Production public payment status reports live mode; no account-scoped test path was found in inspected code. |
| Subscriptions: catalogue and creation | Fixed plan/period/meal-time selection and payment payload | Real purchase and server-generated delivery schedule untested. |
| Subscriptions: history and management | Added active/inactive list, schedule, preferences, selectable pause dates and partial resume | Eligible dates come from the server schedule and paused-date list. Policy/API/UI tests cover unavailable dates and empty-selection protection; authenticated save remains untested. |
| Subscription recharge | Added server quote, period/coupon selection and recharge payment | Payment and continuation fulfillment untested. |
| Per-delivery subscription addresses | Added set/reset address picker using existing per-slot backend endpoint, accepted-area filtering and closed-delivery guards | Contract/policy tests pass; saving against a test subscription still required. |
| Standing meal-time addresses | Added selectors using actual catalogue IDs, subscription-area checks and existing address create/update API | Policy/API/UI tests cover unavailable IDs, quick-only areas and explicit clearing. Server assignment across existing addresses remains untested on an account. |
| Orders | Fixed list/details, quick-meal reorder and cancellation policy | Policy tests pass; live cancellation, refund semantics, reorder and tracking transitions untested. |
| Saved addresses and service-area waitlist | Added structured fields, service-area validation and waitlist flow | Validation tests pass; real save/delete/default/waitlist requests not sent. |
| Profile and health information | Added gender, birth date, age, weight, goals, allergies, lifestyle, bio and notes; saves canonical server response | Validation and response-envelope tests pass. Phone stays read-only. Profile-photo upload has no verified API; removed nonfunctional photo control. |
| Notification inbox | Present; fixed customer route normalization and read state links | Route tests pass; live inbox mutations untested. |
| Notification preferences | Added offers/rewards/push/WhatsApp switches using profile API; push registration follows preference | Backend contract checked; preference persistence and actual push delivery untested. |
| Push notifications | Android native FCM registration and token format guard present | Android Firebase configuration and real-device receipt unverified; iOS APNs/FCM transport integration remains missing. |
| Dietician catalogue and booking | Present, with corrected payment API key | Live availability, booking, cancellation and reviews untested. |
| Consultation management | Added health form, notes, WhatsApp/reminder preferences, pause-date preferences and dietician meal-plan display | Health/date/API/UI tests pass. Pause dates are labelled as preferences only, without promising rescheduling, carry-forward, refunds or plan extensions. Authenticated persistence remains untested. |
| Functional training | Trainer catalogue/details, time-slot selection, enrollment/history and payment retry present | Live enrollment/payment untested; no verified customer cancellation/reschedule API was implemented. |
| Rewards and referrals | Catalogue, points/history, claim flow and referral sharing present | Claims and attribution untested. Incoming referral-code capture during native signup remains absent. |
| Favourites and offers | Existing saved-meal and coupon screens/APIs | Live mutation and redemption untested. |
| Support, FAQ, legal content | Customer routes and API-driven content present | External links and production content need review. |
| Data deletion | Support/email request screen added | No automatic account deletion endpoint/workflow implemented; delivery/compliance of support requests not verified. |
| Custom bowls | Builder/local cart present; checkout deliberately blocked | Backend must support authenticated custom-bowl cart/quote/payment fulfillment before enabling checkout. |

Admin/staff portals, kitchen/delivery operations, dietician/trainer back offices,
and marketing-only web pages are outside this mobile customer scope.

## Remaining release and verification work

1. Run customer acceptance on a disposable staging account: login, address,
   cart, orders, subscription management, consultation health and preferences.
2. Validate Razorpay test mode including cancellation, timeout recovery,
   duplicate-submit prevention, server verification and zero-value orders. No
   real order or charge is authorized by the local build checks.
3. Configure Android Firebase and implement/configure the iOS push transport;
   validate delivery on physical devices. Apple signing/provisioning is needed
   for physical iPhone installation.
4. Verify native referral attribution and agree the
   missing backend contracts for custom bowls, training cancellation/rescheduling, profile photos and account
   deletion before implementing them.
5. Resolve the earlier dependency-audit baseline (66 transitive findings),
   repeat accessibility/device-size/network-error testing, verify store build
   numbers/signing, and review release environment/logging/privacy settings.
   No forced dependency upgrade, paid service, CI artifact upload, merge or
   production deployment was performed. Authorized branch pushes and the draft
   test-artifact checkpoint are recorded separately in the delivery report;
   neither establishes full customer acceptance or production readiness.

The repository still depends on Expo libraries and Expo Router. A full removal
is a separate migration; no Expo CLI, Expo Go, EAS or QR preview is used in this
completion pass. The standalone Android bundler uses the installed Metro API.
Its native startup hook is now captured in an idempotent repository script;
fresh-clone native generation/build remains unverified.
