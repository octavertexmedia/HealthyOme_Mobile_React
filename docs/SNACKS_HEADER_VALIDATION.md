# Snacks: one header and one cart action

## Screenshot diagnosis

The user's Library screenshot `libfile_439ea530c1c88191a3c7a7bb9d81d231` (version 0, original name `image(20261010-181542).png`) was materialized with its identity preserved and visually inspected. It is **HealthyOme's Healthy Snacks catalogue**, not Ragiji or CocoDaily. The screenshot shows both the shared brand/location/profile/cart row and the catalogue's own green Back/title/cart row, with Snacks selected in the bottom tabs.

`app/(tabs)/snacks.tsx` re-exports `app/snacks/index.tsx`. Both therefore require the same shared route policy. Previously `/snacks` was in `brandedBrowseRoutes`, making bottom-tab browsing unnecessarily imply a second top header.

## Correction

- Remove `/snacks` from the **shared branded-header allowlist**, while retaining it in the independent bottom-tab allowlist. Route normalization covers `/snacks`, its trailing slash, `/(tabs)/snacks`, and `?snackId=` deep links. No screen-local CSS/visibility trick.
- Retain one local Back/title/Cart row, using the existing native platform icons. Back and Cart have 48-point targets and accessibility labels. Back falls back to Home when a cold deep link has no history; Cart navigates without stacking duplicates and keeps its item-count badge.
- Remove the conditional floating View Cart shortcut, so the one-cart invariant also holds when the cart is non-empty. Remove its unused styles and unnecessary 140-point bottom spacer. Product add-to-cart/quantity actions are unchanged.
- The shell still consumes system insets exactly once; the catalogue receives zero consumed insets, and the persistent bottom tabs own their bottom safe area. No redundant global title bar or brand row is rendered above Snacks.
- Home's approved location/profile/cart SF Symbols, other route policies, the new bitten-cookie bottom icon and the entire customer sidebar parity checkpoint remain intact.

## Regression coverage

`CustomerShell.test.tsx` renders the **real Snacks screen inside the real shared shell** (data hooks mocked) for both 0 and 2 cart items. It asserts one local header, exactly one cart navigation button, no floating View Cart, clear Back, no global header/brand, retained selected Snacks tab, correct top/bottom inset ownership, 48-point targets, cart navigation and cold-link Back fallback.

`shellPolicy.test.ts` covers canonical/tab-alias/query/trailing-slash variants. Existing neighboring detail cases—meal detail, cart, subscription details/menu/customization/management, trainer, consultation booking, profile/legal and product-review focused routes—continue to reject global top chrome. An unknown future Snacks detail route also fails closed instead of inheriting the browsing header.

Native iOS screenshot `artifacts/ios-snacks-one-header-final.png` records the actual corrected catalogue. It is render evidence, not native gesture E2E: Mac input permissions remain unavailable and were not bypassed. Android's already diagnosed package-manager/install stall is unchanged; do not retry installation for this checkpoint without resolving it. A previous Android screenshot must not be treated as current-code validation.

The final checkpoint report records the exact tested commit, checks, build hashes and draft artifacts. No login/OTP, payment, order, production mutation, Firebase change or unrelated app edit is part of this correction.
