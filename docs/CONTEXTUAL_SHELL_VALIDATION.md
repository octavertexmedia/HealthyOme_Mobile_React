# Contextual shell and subscription UI — 10 October 2026

Follow-up to source `2bee2117628afdb174c3176f64cbabf91923f1ea` on
`codex/mobile-parity-fixes`. The latest user instruction supersedes the earlier
request to show navigation everywhere. The commit containing this report is
the source checkpoint; binary/device results are recorded separately.

## Screenshot-grounded corrections

The supplied duplicate-header screenshot was materialized from Library
`libfile_facd21592f34819191cc0f777e860523` and visually inspected. It showed a
shared top bar, a second brand row, and repeated location/profile/cart controls
inside the Home hero. Home no longer owns any brand or navigation row. Root
owns one `CustomerShell`; the old tab navigator renders no second tab bar.

Primary browsing, subscription setup, Cart and Profile retain navigation.
Login/OTP have no global top bar or tabs; each has one centered original brand
lockup and explicit Close/Back. Focused checkout, consultation health and review
editing omit global chrome. Native OS/Razorpay provider UI is untouched. Route
titles/back rows do not repeat branding. Header and footer occupy normal layout
space; nested content receives only unconsumed safe-area insets. Checkout and
subscription CTAs are in normal layout, not positioned over scroll content.
iOS keyboard avoidance remains active for checkout; auth owns its own keyboard
handling to avoid double compensation.

Top location/profile/cart and navigation use genuine SF Symbols on iOS through
the already installed and CocoaPods-linked `ExpoSymbols` 55.0.9. The existing
package is now a direct locked dependency; no installation was run. Symbols
are `mappin.and.ellipse`, `person.crop.circle`, and `cart`. Android uses existing
Material icons. These are not font lookalikes labelled SF Symbols. A current
iOS read-only screenshot (`artifacts/ios-contextual-home.png`, actually showing
the Guest Profile screen) confirms one top bar and one bottom bar, with the
native symbols rendered. It does not establish every iOS gesture/route.

## Branding: enlargement and exact blocker

The second supplied screenshot was materialized from Library
`libfile_d10ece7d858081918e754f22d7db0313`. Its login view visibly has separate
white rectangles behind the logo and wordmark. There is no white background
style on those image containers. Read-only PNG pixel analysis established:

| Original PNG | Fully transparent pixels | Partially transparent pixels | Opaque near-white pixels |
| --- | ---: | ---: | ---: |
| `healthyome-logo.png` (4000×4000) | 0 | 0 | 13,847,059 / 16,000,000 |
| `healthyome-wordmark.png` (4000×1192) | 0 | 0 | 4,066,979 / 4,768,000 |

All four corners are RGBA `(255,255,255,255)` in both files. Having an alpha
channel did **not** make these originals transparent. The earlier description
of them as transparent is corrected by this stronger evidence. Merely setting
`backgroundColor: transparent` cannot remove the white baked into the rasters.
No code-based pixel editing, logo recreation, tinting or destructive asset
replacement was performed. Background removal needs the authorized image-editing
handoff; until replacement assets are supplied, the white rectangles remain.

Both image boxes target 1.5× their previous visual sizes with `contain` and
unchanged proportions. Auth targets icon 75×75 and wordmark 195×45. Top-bar
targets are icon 51×51 and wordmark 168×42, plus a 12-point gap. The top bar
reserves equal 96-point side regions so the logo stays mathematically centered
despite unequal control groups. Below 423 points of usable width, the 231-point
target is proportionally clamped; e.g. a 402-point iPhone has 210 available
points, about 1.36× instead of 1.5×. This preserves 44-point control targets
without clipping or overlap. Exact 1.5× at every narrow width is geometrically
incompatible with those controls in a single centered row.

## Rendered web comparison and source corrections

Installed Chrome captured public web at 411×914 CSS pixels, with all non-GET/HEAD
requests blocked. References: `artifacts/mobile-web-reference/`:
`plan-detail-411x914.png`, `customize-411x914.png`, and corresponding metrics.
The rendered detail leads with a compact title/description/stats, a 216×288 menu
card, service/delivery facts, and docked Quick subscribe/Customize actions.
The native desktop-like large hero and text-only menu list were removed. Native
detail now uses this hierarchy and the actual API menu-card image, or a day-wise
menu route with published nutrition, plus explicit loading/error/retry states.
It never invents a 4.8 rating when the API has no rating.

The public `/subscriptions/meal-plan-menu/` GET for `high-protein-meals` / plan
69 returned its matching identity and 25 dated entries spanning 10 October–
7 November. Published nutrition can be null; the UI labels absence rather than
inventing values. No schedule mutation was made.

Customization now starts with the plan image, selectable duration/price cards,
an inline calendar that disallows past dates/Sundays, and a compact summary/CTA.
Selection is retained in memory through Cart/back/login transitions. A separate
Cart “Resume meal plan” card restores customization without pretending it is a
purchasable cart row or clearing existing meal/snack items. Cart snack rows
reopen the correct detail sheet. Unknown delivery fees are labelled “Confirmed
at checkout”; the former hard-coded ₹30 fee/₹200 free-delivery threshold is gone.
All plan prices and final payment totals remain server-owned.

Quick subscribe uses the real shortest active period for the inferred diet,
requires guest sign-in and then opens a preselected setup for confirmation.
It is **not yet identical** to web's subscription-cart quick-checkout flow.
The native date calendar does not claim unpublished holiday/end-date rules.
Service-copy fallback/complete calendar/menu interactions and spacing are not
accepted as pixel-perfect. The user-requested global brand bar is also a
deliberate difference from the captured deployed web header.

## Tests and limitations

Regression coverage includes one shell/brand/tab set, auth/focused-route
exceptions, fixed centering/safe-area layout, SF Symbol mapping, selected
duration/login-return/empty-slot retention, public menu identity/failure, native
detail image/actions and calendar rules. Aggregate command: `npm run check`.
Final counts and APK provenance accompany the artifact report.

Read-only mode is still enabled. No OTP, health/profile/address/review write,
booking, order, payment or refund was sent. No missing-tool retries, dependency
install, Expo CLI/EAS, simulator restart or Actions artifact upload occurred.
iOS input-posting/accessibility permissions were not changed or retried. A
current screenshot is unobstructed; the historical open-link dialog is no
longer visible in that capture, but automated iOS taps/navigation are unverified.
The earlier native-constant/Hermes crash remains unresolved, not silently fixed.

Next: finish the transparent-asset handoff, verify the safe Android guest routes
and paired screenshots, then complete iOS interaction acceptance and the scoped
test-account login return. Keep production mutation/payment isolation separate.
