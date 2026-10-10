# Date-wise menu and login artwork checkpoint

The latest instruction explicitly lifts the earlier build hold. Keep the selective
navigation from `e0bcffb1e9bec9ee5ccf300e58ace7b6739ff2ae`, add the exact supplied
login artwork, show real dated menu data, and refresh the two existing apps. Firebase
integration is not part of this runnable checkpoint; native Firebase packages and
platform config files are absent, and no auth/security setting has been changed.

## Read-only backend evidence

On 2026-10-10, credential-free GETs for `healthy-home-style-lunch-meals` resolved
meal-plan type **74** and returned **19 published date entries** in the requested
2026-10-10 through 2026-11-07 range (last published entry 2026-10-31).
Evidence: `artifacts/date-wise-menu-live-evidence.json`.

The deployed menu response has date, meal name/image, meal-time name, dietary type
and nullable nutrition; it has no category or meal-time IDs. The inspected backend
accepts only `slug`, `meal_plan_type`, `from`, `to`. Native sends those exact parameters,
checks the returned slug/type/date window, validates rows and sorts chronologically.
Query keys include slug, type ID and both bounds. Category/slot filtering happens
locally using the selected plan's known category and meal-time names. Unknown or
foreign selections fail closed; unsupported query parameters are not invented.

The API response included Dinner rows although this selected plan publishes only
Lunch. Native filters those out. The response also has a kitchen row literally named
“No meal”; the app preserves its meaning and does not replace it with invented food.
All-null macros show “Nutrition not published”; real zero values remain visible.
Selecting an absent day shows “No published menu” instead of a fabricated placeholder.
Date ranges use Asia/Kolkata; date-only service labels never shift with device timezone.

“Available menu” now fetches a dated preview and always opens the backend day-wise
screen, including when the marketing configuration contains a static menu-card image.
The backend itself may synthesize a catalog fallback when no assignments exist; its
response does not expose that provenance. Native displays the API response, cannot
certify internal publishing workflow, and makes no delivery promise for missing dates.

## Exact login artwork

The supplied Library PNG was materialized unchanged and inspected. It is a composite
logo/wordmark: 1519×1519, 269598 bytes, 2169375 fully transparent pixels and 57490
partially transparent pixels. SHA-256:
`c7589a326a16844845be7b262337a67b244f0d4a04584769421966fa1e95eafc`.

`assets/images/branding/healthyome-login.png` is displayed once on login/OTP, centered
with `contain`, an unchanged square aspect ratio and a transparent container. Its
responsive size is capped at 300 points and 30% of viewport height to leave room for
the form. The compact browsing header still uses the two original images; app icons
and unrelated screens were not replaced. No generated or pixel-edited asset is used.

## Validation/build scope

Checks cover static-card-to-dated-menu navigation, correct selected plan/category/slot,
unpublished dates, failed requests, chronological sorting, malformed/cross-plan data,
India-midnight behavior, null/zero nutrition and original login artwork. Native build
inputs are preflighted once; use the existing cached Android toolchain offline. iOS
has no new native modules and can load the fresh source through the existing Metro.
Only HealthyOMe application processes may restart; preserve the simulators and Metro.

Do not interpret prior binary artifacts or screenshots as this checkpoint's result.
The accompanying final artifact report records actual build/signature hashes, source
commit, app versions, test results and screenshot acceptance or exact blockers.
Read-only preview remains enabled: no OTP, order, payment or customer data mutation.
