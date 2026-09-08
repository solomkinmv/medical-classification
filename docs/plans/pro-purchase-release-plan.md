# Pro Purchase Implementation Plan

Status: Code implemented and automated checks passed. Native purchase and device sandbox acceptance remain open; see [validation record](pro-purchase-validation.md).
Date: 2026-09-07
Specification: [Pro Purchase Release Readiness](pro-purchase-release-spec.md).

## 1. Restore a Reproducible Baseline

- Verify the intended checkout and capture existing changes before editing.
- Restore dependencies using the lockfile and install native pods with the project's supported toolchain. Record versions and any existing build/test failures.
- Read the installed expo-iap native and hook implementations for product fetching, verification, restore synchronization, purchase state, and transaction replay. Choose supported APIs based on that evidence.
- Establish separate local StoreKit and device sandbox run instructions. Prefer XcodeBuildMCP for native operations and AXe for simulator interaction.

Exit: A documented baseline and an explicit verified-entitlement API strategy. Do not silently introduce a backend or SDK migration to solve a newly discovered gap.

## 2. Repair Durable Local StoreKit Configuration

Files: `achi-mobile/Products.storekit`, `achi-mobile/plugins/withStoreKitConfig.js`, and `achi-mobile/app.json` as needed.

- Correct the StoreKit schema while preserving the product identity and localized descriptions. Keep the test price clearly distinct from the unresolved live-price decision.
- Repair scheme path generation and updates to existing references. Validate missing source files, generated file references, and fresh-prebuild mod ordering.
- Add focused plugin tests for fresh generation, repair of a bad reference, and repeated execution without duplicates.
- Exercise a fresh prebuild in a disposable project copy containing the current source changes; do not delete the user's working native directory to test regeneration.
- Open/run the generated setup through a launch that activates the local StoreKit configuration and verify product loading. Do not assume a generic simulator launch applies Xcode scheme options.

Exit: Local product metadata loads, configuration survives regeneration, and the launch procedure is reproducible.

## 3. Make Purchase and Entitlement State Deterministic

Files: `achi-mobile/lib/pro-provider.tsx`, its tests, and only small supporting modules if needed.

- Separate product-query state, transaction activity, and entitlement state. Define structured results for restore and immediate purchase-request failures.
- Validate product identity, completed state, and native verification before granting access.
- Replace the ten-second grace heuristic with sequencing that prevents stale entitlement queries from overwriting later purchase results.
- Preserve cached access on failed verification queries; reconcile it with successful current store results and handle foreground refresh.
- Make delivery and transaction finishing idempotent and recoverable. Account for pending events, cancellation, direct rejections, replay, and finish failures.
- Use explicit synchronization for user-triggered restore and return owned/not-owned/error from the actual completed operation.
- Add bounded recovery for stalled operations without treating a late valid purchase as invalid or allowing duplicate purchases while the store still owns a pending request.

Verification: Provider tests cover matching/unrelated/unverified transactions, pending completion, cache hydration races, stale fetches, failures, cancellation, duplicate events, finish failure/replay, restore outcomes, and revocation. Assert behavior rather than implementation-specific timing.

Exit: Access reflects verified store state, with tested offline behavior and no arbitrary reconciliation delays.

## 4. Connect the Paywall to Explicit Outcomes

Files: `achi-mobile/app/pro.tsx`, paywall tests, and touched wrapper components.

- Render actual localized price, loading, unavailable/retry, purchase activity, pending feedback, and restore activity from provider state.
- Disable invalid/repeated actions and remove the 500 ms restore-result timer.
- Reset UI correctly for cancellation, failure, completion, and unmount/reopen. Keep technical diagnostics out of user-facing messages.
- Add stable automation IDs such as `pro.purchase`, `pro.restore`, `pro.retry`, `pro.close`, and `pro.status`; forward IDs to native hosts.
- Keep Ukrainian copy and the current design consistent, with accessible roles and labels.

Verification: Focused screen tests for state transitions, disabled controls, retry, restore outcomes, cancellation, and an explicit success summary that remains visible until dismissed. Check that feature gates and stored user data remain intact.

Exit: No missing-product state masquerades as endless loading, and every completed/failed operation leaves usable controls.

## 5. Verify Native Local Behavior

- Run focused tests, TypeScript checking, and lint. Run the full existing Jest suite once after integration; distinguish pre-existing failures from regressions.
- Use local StoreKit to exercise product loading, purchase, cancellation, pending completion, restore, relaunch, replay, and refund/revocation where supported.
- Check the original paywall scenario with simulator automation using stable identifiers.
- Record environment and evidence against the specification's acceptance matrix.
- Add concise setup/troubleshooting instructions to `achi-mobile/README.md`, including regeneration and launch requirements.

Exit: Local acceptance cases pass with evidence; unsupported native cases remain explicitly marked for follow-up.

## 6. Verify Apple Sandbox and Prepare Release Handoff

- Inspect App Store Connect setup and resolve the intended live-price decision. Report missing product/account prerequisites; do not silently change live settings.
- Prepare a signed device build with no local StoreKit override. Validate the configured build environment before using it.
- On a real iPhone, verify localized product loading, purchase, cancellation, restart, restore after reinstall, and store-error recovery. Verify a second-device restore if available.
- If distribution/upload is required, prepare the concrete artifact and instructions, then obtain authorization before uploading or submitting. Do not use the combined `deploy:ios` script as a build-only command: it also submits the artifact.
- Complete the evidence matrix and document remaining external blockers. Report local testing and sandbox testing separately.

Exit: Release-ready only after required device sandbox evidence and account/product prerequisites are satisfied. App Store submission and publication remain separate actions.

## Deliverables

- Durable StoreKit/plugin corrections.
- Reliable provider and paywall behavior with focused regression coverage.
- Reproducible local and sandbox testing instructions.
- Acceptance record with passed, failed, and unverified cases, plus any remaining release blockers.

This plan does not mark historical checklist entries as verified and does not treat a successful build as proof of a successful purchase.
