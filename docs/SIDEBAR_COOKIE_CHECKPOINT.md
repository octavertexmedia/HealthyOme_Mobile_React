# Customer account/sidebar and iOS Snacks icon

## Reference and scope

- Mobile starting commit: `35f7df525ec7829ab765b762643f8eb8700e3fa6`, branch `codex/mobile-parity-fixes`; initially clean.
- Compared web `main` at `ccb8eaca84ee4d3eb1e004735bf9badc2db4ba50`, `frontend/src/components/ProfileContent.tsx`, with the public `https://healthyome.in/sidebar` rendered at 411×914 in isolated installed Chrome. All non-GET/HEAD website requests were blocked. No web checkout/working-tree edits.
- The native account page is the destination of the existing top profile icon. This change fills that customer menu, not an admin drawer or a new navigation system.
- No new dependency, Expo CLI/Go/EAS invocation, Firebase change, checkout rewrite, real login, order, payment, deployment, merge, or Actions upload.

## Menu mapping in display order

| Group | Label | Native destination/action | Access |
| --- | --- | --- | --- |
| Orders | All Subscriptions | `/subscription/my` | Sign-in on tap |
| Orders | My Orders | `/orders` | Sign-in on tap |
| Orders | My training (added) | `/functional-training/my` | Sign-in on tap; shared training flag |
| Your Information | Saved Address | `/profile-pages/addresses` | Sign-in on tap |
| Your Information | Favourites | `/profile-pages/favourites` | Sign-in on tap |
| Payments | My Rewards | `/rewards` | Sign-in on tap |
| Payments | Payment Modes | `/profile-pages/payment` | Sign-in on tap; existing payment-method explanation, not saved cards |
| Payments | Offers | `/profile-pages/offers` | Sign-in on tap |
| Support | About Healthy-O-Me (added) | `https://healthyome.in/about` in browser | Public |
| Support | Help & Support | `/profile-pages/support` | Public |
| Support | Contact & Enquiries (added) | `https://healthyome.in/contact` in browser | Public |
| Support | Business Partnerships (added) | `https://healthyome.in/business` in browser | Public |
| Support | FAQs | `/profile-pages/faqs` | Public |
| Support | App tour (added) | `/profile-pages/tour` | Public; native guide, no persistent-state writes |
| Accounts | Notifications | `/profile-pages/notifications` | Signed-in only |
| Accounts | Settings (moved/renamed from Edit Profile) | `/profile-pages/edit` | Signed-in only |
| Accounts | Notification Preferences (retained native extra) | `/profile-pages/preferences` | Signed-in only |
| Accounts | Terms & Privacy | `/profile-pages/legal`, then existing Terms or Privacy page | Public |
| Accounts | Data Deletion (retained native extra) | `/profile-pages/data-deletion` | Public entry; no deletion performed |
| Accounts | Logout / Sign In | Existing logout / login route | Appropriate to session |

Guests previously saw only Support and Account groups. They now see protected customer entries with a lock and sign-in hint, preserving the intended allowlisted route after login. No authentication wall was added to public catalogues. Cached active-subscription data is explicitly hidden for guests and its query stays disabled. Training stays hidden when settings are unresolved or disabled; catalogue flags do not erase order/subscription history. The native tour reuses those feature gates and never resets onboarding, cart or session state.

All three external public destinations returned HTTP 200 to HEAD requests. They have an external-link glyph, screen-reader browser hint, and a useful error alert if browser launch fails. Their forms were not submitted. Unlike the web's animated overlay, the native App tour is a replayable guide with real catalogue links and Home/Back exits.

## Icon and accessibility

- iOS Snacks now uses the **already installed FontAwesome 5 `cookie-bite` solid vector glyph**, not an SF Symbol. The installed iOS 26.5 public `SFSymbols.framework/CoreGlyphs.bundle/name_availability.plist` and `sf-symbols-typescript` catalogue contain no cookie/biscuit entry. No invented symbol name or asset download.
- `mappin.and.ellipse`, `person.crop.circle` and `cart` top-bar SF Symbols remain unchanged. Android retains its Material cookie icon.
- Menu targets have a 48-point minimum height, wrapping text, semantic button/link roles, sign-in hints, stronger heading contrast, and the existing shell's safe-area ownership. Legal and tour detail pages use the compact shared header with no duplicate tabs.
- Code-review and frontend skill guidance informed typed menu actions, explicit public/protected routing, feature gates, accessible targets and regressions; no web-framework scaffolding was introduced.

## Validation

- `npm run check`: lint and TypeScript passed; **325 tests / 50 suites passed**. One existing ProductReviews `act(...)` warning appeared without test failure.
- `node --test scripts/*.test.cjs`: **15 passed**.
- `git diff --check`: passed.
- Added regression coverage for exact groups/order, guest redirects, protected native destinations, disabled/unresolved training, public browser links/failure, native legal destinations, replay-without-storage-writes, cookie rendering and unchanged header symbols.
- iOS 26.5 simulator rendered the new guest menu, lock indicators and bitten-cookie icon via the existing native shell and Metro. iOS tap/scroll/CTA automation is not claimed: the Mac's input/accessibility permissions remain unavailable and were not bypassed.
- Build hashes, additional Android checks and screenshots are recorded in the accompanying local/draft checkpoint report after compilation; this document alone is not a distribution/release approval.

Firebase activation and the separately reported iOS checkout issue are not resolved by this change. No production authentication, customer account, order, payment or enquiry submission was tested.
