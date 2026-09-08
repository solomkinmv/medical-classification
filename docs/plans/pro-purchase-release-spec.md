# Pro Purchase Release Readiness

Status: Implementation and automated validation completed; native purchase and device sandbox verification remain open.
Date: 2026-09-07

## Goal

Make the existing one-time Pro upgrade in Medical Codes reliable and ready for iOS release. Pro continues to unlock unlimited bookmarks, folders, and notes. The existing free experience and purchase model remain unchanged.

Success means users can see the store price, buy Pro, retain access across restarts, and restore access after reinstalling or changing devices using the purchasing Apple account. Cancellation, pending purchases, and failures must leave the app usable.

## Pre-Implementation Evidence

- The screenshot showed the app's own store-unavailable alert because no matching product had loaded; it does not establish a specific native StoreKit error.
- Product ID is `com.solomkinmv.achi_mobile.pro`; iOS bundle ID is `com.solomkinmv.achi-mobile`.
- `achi-mobile/Products.storekit` nests products under `storekit` and uses a numeric version instead of the expected top-level product array and version object.
- The config plugin writes a scheme reference without the required relative traversal and skips any existing StoreKit reference. Validate the precise resolution against Xcode during implementation.
- Product fetch failures only reach the console. The paywall represents a missing product as loading and still allows tapping the purchase button.
- The provider grants Pro without checking the callback's product ID or purchase state. Native verification behavior must be checked in the locked expo-iap implementation before relying on it.
- Entitlement reconciliation uses a ten-second grace period against previously fetched purchases. Restore feedback uses a 500 ms delay instead of an authoritative result.
- JavaScript dependencies and CocoaPods are absent from this checkout. No end-to-end purchase has been verified in this session.
- Existing uncommitted changes in app configuration, the paywall, StoreKit data, and the plugin must be preserved and incorporated.
- The historical completed plan is not evidence that current sandbox acceptance criteria pass.

## Requirements

### Product and Paywall

- Fetch the configured non-consumable after store connection and show its localized store price. Never offer a hardcoded fallback price.
- Represent loading, ready, unavailable/error, purchasing, pending, and restoring distinctly where relevant.
- Disable purchase until a product is available; prevent duplicate or competing purchase/restore requests.
- Failed or empty product queries provide understandable Ukrainian feedback and a retry action. Connection and stalled operations must offer recovery rather than an indefinite spinner.
- Cancellation returns to a usable screen without an error alert. Pending/deferred transactions do not unlock Pro or pretend that a purchase failed; later completion is processed.
- Preserve the existing visual language. Add stable semantic `testID` values to touched controls and state indicators, including forwarding IDs through wrappers. Keep accessibility labels separate.

### Entitlement and Transactions

- Grant Pro only for the expected product with a completed, verified transaction or authoritative active entitlement. Establish what the installed native library already verifies.
- Use StoreKit/native entitlement results as authority. AsyncStorage is an offline cache, not proof of a new purchase.
- Preserve previously established access during network/store failures. A successful fresh authoritative result showing no entitlement may remove access; stale pre-purchase results must not overwrite a newer purchase.
- Persist access across restart; recover unfinished transactions and process duplicate callbacks idempotently.
- Finish non-consumable transactions after entitlement delivery. A finish failure must be recoverable without losing legitimately purchased access.
- Handle revocation/refund when reflected by a fresh authoritative store result. Do not delete bookmarks, folders, or notes when entitlement changes.
- Explicit restore uses the supported store synchronization flow and returns a deterministic owned/not-owned/error result. Feedback must not depend on a timer or React render timing.
- Reconcile access when appropriate on startup and return to foreground, avoiding overlapping stale results.

### Development and Release Environments

- StoreKit data and the Expo plugin are the durable source of local test configuration. No fix may depend on manually maintained generated `ios/` edits.
- Fresh and repeated prebuilds must produce a valid configuration and exactly one resolvable scheme reference; existing incorrect references must be repaired.
- Demonstrate that the launch used for local testing actually activates StoreKit testing. A successful native build alone is insufficient.
- Local StoreKit testing and App Store sandbox testing are separate checks. Device sandbox validation must run without a local StoreKit override.
- Confirm the App Store Connect product, app association, availability, metadata, pricing, and account prerequisites before device validation.
- Diagnostic logs identify operation, product ID, and error code without exposing transaction tokens or receipts to users or logs.

## Scope Boundaries

No subscriptions, new paid features, redesign, SDK migration, Android release certification, new user-account system, or backend service is planned. Keep existing Android behavior intact. Native StoreKit verification is the intended iOS approach; if the installed SDK cannot expose sufficient verified entitlement information, document the gap and revisit the design before expanding scope.

Creating this specification does not authorize uploading builds, changing live pricing, submitting for review, or publishing the app. Prepare and validate locally; obtain explicit authorization for those external actions.

## Acceptance Evidence

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| Fresh/repeated prebuild | Valid product and one resolvable scheme reference | Generated-project check plus Xcode load |
| Product loads | Store-supplied localized price; purchase enabled | Simulator and device sandbox |
| Empty query, disconnected store, fetch failure | Recovery UI; no purchase request | Automated tests and simulated failure |
| Purchase completes | Pro enabled, persisted, transaction finished | Automated tests and native purchase |
| Cancel or reject | No unlock; controls usable | Automated tests and native cancellation |
| Pending then complete | No premature unlock; later completion honored | Automated tests and StoreKit simulation |
| Duplicate, unrelated, unverified event | No erroneous grant or repeated side effects | Automated tests |
| Finish fails/relaunch | Legitimate access retained; transaction recoverable | Automated tests and local simulation |
| Restart/offline | Established access retained; store errors do not revoke | Automated tests and app restart |
| Stale fetch races with purchase | New entitlement not overwritten | Automated tests |
| Restore after reinstall/device change | Pro restored for purchasing account | Real-device sandbox; second device if available |
| Restore finds none/fails | Accurate distinct feedback; no stuck spinner | Automated tests and sandbox/local checks |
| Refund/revocation | Fresh store state removes access, preserves data | StoreKit simulation and automated tests |
| Feature gates | Existing free limits and all three Pro benefits behave correctly | Focused regression checks |

Record build, OS, launch method, environment, and result for native checks. Mark unavailable cases as unverified, not passed. Release readiness requires real-device sandbox purchase and restore evidence; mocks and local StoreKit alone cannot establish it.

## Remaining Decisions and Dependencies

- User confirmed USD 2.99. Local test price is updated; verify the same base price in App Store Connect before release.
- Device sandbox testing requires access to the Apple project/account, a suitable iPhone, and a sandbox tester. A second device is needed to directly verify device migration.
- Inspect locked expo-iap verification, synchronization, pending-event, and transaction-replay semantics during implementation before selecting exact APIs.
- Confirm signing and current build-image availability before preparing a release candidate; this is not an invitation to broadly upgrade dependencies.

Implementation sequence: [Implementation plan](pro-purchase-release-plan.md).
