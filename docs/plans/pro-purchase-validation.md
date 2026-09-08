# Pro Purchase Validation

Date: 2026-09-07
Status: Implementation tested automatically; not yet certified release-ready.

## Implemented

- USD 2.99 local non-consumable configuration using the existing SKU.
- Durable schema and scheme-reference repair through the Expo plugin.
- Direct store results, product loading/unavailable/retry states, duplicate-action prevention, cancellation/error recovery, and pending feedback.
- Verified active iOS entitlement before purchase delivery; ordered cache writes, stale-query protection, foreground reconciliation, and explicit unfinished-transaction recovery.
- Synchronizing restore with owned/not-owned/error outcomes; removed timing heuristics.
- Stable paywall automation IDs and wrapper forwarding.

## Automated Evidence

- Baseline: 7 Jest suites, 63 tests passed before changes.
- Updated: 8 suites, 75 tests passed; TypeScript and Expo lint passed.
- Coverage includes empty catalog, reconnect, offline cached access, duplicate and unrelated events, unverified/historical transactions, deferred completion, late completion, unfinished startup transactions, finish failure/replay, stale query and hydration races, revocation, restore sync failure, unmount during verification, and paywall controls.
- Plugin tests exercise copied product data, price, repeated application, old-reference repair, and missing source failure.
- Disposable project prebuild exercised fresh and repeated generation without deleting the working native folder. Final reference resolution is checked relative to the `.xcodeproj` directory.

## Native Evidence and Corrections

- Workspace: `achi-mobile/ios/MedichniKodi.xcworkspace`; scheme: `MedichniKodi`; configuration: Debug.
- Restored lockfile dependencies and CocoaPods, including OpenIAP Apple 1.3.14.
- Read OpenIAP's native implementation: active purchase queries filter through StoreKit signature verification; `currentEntitlementIOS` verifies the current entitlement; startup unfinished processing stores transactions but does not emit them to JavaScript. The provider therefore explicitly queries and delivers unfinished transactions.
- Xcode's StoreKit editor opens the corrected file, recognizes Pro Unlock, and recognizes the selected scheme configuration.
- Correction to earlier chat advice: Xcode resolves the scheme reference from the `.xcodeproj` directory. The correct copied-file reference is `../MedichniKodi/Products.storekit`. The initially proposed `../../` reference was wrong and was corrected after observing Xcode's missing-file diagnostic.
- XcodeBuildMCP native build succeeded with Xcode 27 beta after passing `IPHONEOS_DEPLOYMENT_TARGET=15.1` as a build argument. Two old dependency resource targets otherwise fail the new toolchain's minimum-target check. The build emitted dependency warnings; it was not warning-free.
- Fixed the generated local Node path for this machine. This is local build environment state, not application source.
- iOS 27 launch fails before JavaScript with `UIScene life cycle is required for apps built with this SDK`. This is an Expo 54/toolchain compatibility blocker, separate from the IAP change.
- On the installed iOS 18.5 simulator, Xcode Run Without Building launches the binary with the scheme configuration and reaches the development-client server picker. Metro was available. The simulator's Open confirmation did not respond to automation, preventing a completed app purchase test.
- AXe with the default beta developer directory fails because SimulatorKit.framework moved. Selecting the stable developer directory allowed hierarchy reads, but taps did not complete the Open confirmation. Do not record those attempted taps as successful verification.

## Remaining Release Gates

- Native paywall price display, local purchase/cancellation/restore, pending approval, refund, and restart must be observed using a compatible functioning simulator/toolchain. Automated equivalents passed, but native purchase completion remains unverified.
- App Store Connect metadata and availability were inspected in the device follow-up below. The exact current price still needs verification; no live configuration was changed.
- Real-device sandbox purchase and restore after reinstall, and second-device restore, remain unverified. A connected iPhone appeared in Xcode with iOS 27; no purchase was attempted on it.
- Resolve Expo/toolchain compatibility and check the configured EAS image before preparing a release candidate. This change does not upgrade Expo or promise iOS 27 readiness.
- No upload, submission, publication, or live-price change was performed.

## Real-Device Follow-up

- Connected iPhone 16 Pro Max confirmed using Apple's device CLI. The user confirmed signing in with the existing sandbox tester.
- App Store Connect has one existing Pro non-consumable: `com.solomkinmv.achi_mobile.pro`, Apple ID `6759211831`, status Prepare for Submission, all countries/regions selected, Ukrainian localization, base storefront Ukraine (USD).
- The app and local StoreKit fixture incorrectly used a hyphen in the SKU. Corrected them to the existing underscore SKU; the bundle ID remains unchanged. A new exact-SKU regression test failed before the correction; all 76 tests passed afterward.
- Signed Release build with stable Xcode 26.6 failed before compilation: `No Accounts` and cached provisioning profile does not include the available Apple Development certificate. User must sign into Xcode with the developer account, not the sandbox tester.
- Unsigned Release device build succeeded with stable Xcode 26.6 / iPhoneOS 26.5 SDK and `IPHONEOS_DEPLOYMENT_TARGET=15.1`. Artifact: `/tmp/medical-device-validation/Build/Products/Release-iphoneos/MedichniKodi.app`; build log: `/tmp/medical-device-compile.log`. This proves compilation only, not installation or iOS 27 runtime compatibility. TypeScript, lint, and `git diff --check` also passed after the SKU correction.
- App Store Connect displays an updated Apple Developer Program License Agreement requiring Account Holder review. No agreement was accepted by the agent.
- App Store Connect's observed app ID is `6758305387`; `eas.json` currently contains `67583305387`. Reconcile this submission configuration before any upload or submission.
- No app was installed and no sandbox purchase was attempted during this signing-blocked step.

### After Developer Account Sign-in

- Signed Release build succeeded with Xcode 26.6 after the user's Xcode sign-in. Installed successfully on the connected iPhone 16 Pro Max running iOS 27 beta.
- Launched using `devicectl` with the `achimobile://pro` payload, without Xcode StoreKit test-session injection. The app process remained running (PID 5965); the earlier SDK 27 lifecycle assertion did not occur in this SDK 26.5 build.
- Runtime log: `/tmp/medical-device-runtime.log`; installation result: `/tmp/medical-device-install.json`. Startup logged background-delegate configuration warnings, but no purchase outcome was observed.
- Physical-device screen access through Device Hub timed out. Awaiting the user's visible paywall price/status before attempting sandbox purchase. Native product loading, purchase, and restore are not yet verified.

### User Screenshot Evidence

- The user's device screenshot confirms the native Pro screen loads the store price `3,99 USD`. This differs from the intended USD 2.99; no live price was changed.
- The next screenshot confirms Apple's Sandbox purchase sheet, the existing tester, a one-time USD 3.99 purchase, and an explicit no-charge testing notice. Purchase completion and restore are still unverified.
- The screenshot also exposes nested glass styling on the app's close button. Removed the inner SwiftUI glass Button, leaving the native header background and one accessible React Native press target with the stable test ID. The new regression test failed before the change; all 77 tests and TypeScript passed afterward. This visual fix has not been installed on the device, to avoid interrupting the active purchase test.

### Purchase Completion and Confirmation UI

- Subsequent user screenshots confirm Apple's sandbox purchase-success alert and the app's unlocked Pro state. This verifies one real-device sandbox purchase and entitlement delivery; restore, refund, offline restart, and fresh-install recovery remain separate checks.
- Apple's English success alert and `[Environment: Sandbox]` text are system purchase UI, not app-owned strings.
- Replaced the generic owned-state copy with `Pro активовано!` and the three unlocked features plus descriptions. Removed automatic back navigation so the confirmation stays visible until explicitly dismissed. Success content scrolls for smaller screens/larger text; automation IDs include `pro.success` and `pro.done`.
- Updated the entitlement-transition regression test: observed failure with automatic dismissal, then all 77 tests, TypeScript, and lint passed with the new persistent summary.
- Signed updated Release build succeeded, was installed over the existing app without uninstalling, and launched on the iPhone with the Pro deep link. This update includes the close-button glass fix. Awaiting a fresh screenshot for visual verification; build log `/tmp/medical-device-ui-build.log`, install result `/tmp/medical-device-ui-install.json`.

### Header Alignment Follow-up

- The user reported that the custom close view remained misaligned. Replaced its fixed-size React Native / SwiftUI composition with React Navigation's standard `HeaderButton` inside Expo Router's existing `Stack.Screen` header slot. No custom sizing, padding, or glass layer is added.
- The shared iOS control preserves its Ukrainian accessibility label and `pro.close` automation ID; the procedure screen now supplies `procedure.close` as well. Declared the already-installed `@react-navigation/elements` version directly without upgrading it.
- Added a regression assertion requiring the navigation HeaderButton; it failed before the replacement. All 77 tests, TypeScript, and lint passed afterward. On-device alignment still requires visual confirmation of this revision.
- Signed Release build succeeded and was installed and launched on the iPhone. Build log: `/tmp/medical-device-header-build.log`; install result: `/tmp/medical-device-header-install.json`. The bundled JavaScript includes the new procedure close identifier.

### Close Navigation Follow-up

- The user reported that both the header and success-summary close buttons did nothing. Both called `router.back()` unconditionally, while our device launch opened the Pro route directly without ensuring a previous route existed.
- Added one shared close handler using `router.canGoBack()`: back when history exists, otherwise `router.replace("/")`, which redirects to Explore. Kept navigation-header rendering unchanged.
- Expanded the screen mock to render the actual header slot so tests exercise both close handlers. Both no-history tests failed before the fix; all 80 tests, TypeScript, and lint passed afterward.
- Signed Release build succeeded, installed, and launched directly into Pro for user verification. Logs: `/tmp/medical-device-close-build.log` and `/tmp/medical-device-close-install.json`. Actual device taps remain pending user confirmation.

## Folder Usability Follow-up

- The user reported an empty folder with a missing icon, inset gray rectangle, and `(tabs)` back label, and could not discover how to add codes. Existing assignment was hidden behind a long press on a saved code.
- Added a visible `Додати коди` empty-state action and standard navigation HeaderButton. Selection mode lists saved codes with checked membership and a Done header action. Membership changes persist through the existing folder provider and never delete a saved bookmark.
- Added a no-bookmarks route to Explore and guarded selection edits with Pro access. Wait for favorites/folders storage readiness before displaying a missing-folder state.
- The folder page now uses a consistent opaque themed background, a nontransparent standard header with a minimal back label, and an Ionicons folder illustration rather than an invalid SF Symbol name.
- Regression coverage: visible add action, header/background options, add/remove membership, no-bookmark guidance, Pro guard (including access loss mid-selection), loading and missing-folder states. The six initial tests failed before implementation. Full suite passed all 88 tests across 10 suites, including eight folder-screen tests. TypeScript, lint, and diff checks passed.
- Signed Release build succeeded and installed without removing app data. Logs: `/tmp/medical-device-folder-build.log` and `/tmp/medical-device-folder-install.json`. Launch into Saved was denied because the device was locked; user must unlock and open the installed app. Folder visuals and actual selection taps remain pending on-device confirmation.

## Native Back-Button Investigation

- User reports folder native back-button taps fail while swipe-back works. The folder uses Expo Router's standard native stack back control, with no custom `headerLeft`. Swipe success means this is not the earlier no-history Pro-close case.
- Installed screens 4.16.0 contains an iOS 26 workaround disabling the back-button wrapper in `navigationBar:shouldPopItem:` and restoring it in a later callback. Upstream PR 3173 removes this workaround. React Navigation issue 12778 reports the matching unresponsive-back behavior fixed in screens 4.17.x.
- Updated only `react-native-screens` to 4.17.1 (including its Release-build fix), within upstream's supported React Native/Fabric range. This deliberately exceeds Expo 54's bundled 4.16.x recommendation; no Expo version-check exclusion was added. Retained the native back button and gesture behavior. Actual device regression verification remains required.
- All 88 tests across 10 suites, TypeScript, lint, and diff checks passed. CocoaPods resolved RNScreens 4.17.1. These checks do not validate native navigation-bar hit testing; repeat folder open/tap-back cycles, swipe-back, tab switching, and modal dismissal on the iPhone.
- Signed Release build succeeded, installed over the existing app without uninstalling, and launched with the Saved deep link. Evidence: `/tmp/medical-device-screens-build.log`, `/tmp/medical-device-screens-install.json`, and `/tmp/medical-device-screens-launch.json`. Actual back-button taps remain pending user verification.
- The user subsequently confirmed that the folder back-button issue was fixed on the installed build.

## Note Keyboard and Bookmark Header Follow-up

- User screenshot showed the keyboard covering the note editor in the procedure form sheet, and an extra colored circle inside the native bookmark header bubble.
- Enabled the ScrollView's native keyboard-inset adjustment, interactive iOS keyboard dismissal, and handled action taps while the keyboard is open. Scroll to the editor/actions after its content layout changes and after keyboard presentation, removing the keyboard listener when editing ends. Long notes use a bounded, internally scrollable input.
- Replaced the procedure header's circular list-style bookmark component with the standard navigation HeaderButton and an undecorated animated icon. Preserved bookmark toggle/limit behavior, haptics, and animation; list bookmark controls are unchanged.
- Added stable procedure content, bookmark, note-input, and note-action automation IDs and note-input accessibility labeling. Regression tests cover keyboard configuration and listener cleanup, editor scrolling, multiline save/cancel/empty-delete behavior, native header action wiring, bookmark limits, and Pro gating. On-device keyboard geometry and header visuals still require confirmation.
- Full verification passed all 96 tests across 11 suites, TypeScript, lint, and diff checks. Signed Release build succeeded and installed without uninstalling. Launch was denied because the device was locked; the user must unlock and open the app. Evidence: `/tmp/medical-device-note-build.log`, `/tmp/medical-device-note-install.json`, `/tmp/medical-device-note-launch.json`.
- After the user unlocked the phone, the updated app launched successfully (`/tmp/medical-device-note-launch-unlocked.json`).

## Close While Editing Follow-up

- User reports the code-details Close button fails only while the keyboard is open. This distinguishes the issue from the earlier missing-history Pro close case; native touch delivery remains unobserved directly.
- Kept the standard native stack header and CloseButton, but made this modal's header nontransparent with a themed background so it does not overlay the keyboard-adjusted editor. Close now explicitly dismisses the keyboard before navigating back. Saved notes and unsaved-draft persistence semantics are unchanged.
- The screen test now renders both actual header slots. Added regressions for the nonoverlay header configuration and keyboard-dismiss-before-back ordering while an unsaved draft is present, with no save/delete side effects. Both new tests failed before implementation; all 98 tests across 11 suites, TypeScript, lint, and diff checks passed afterward. Native hit testing still needs device confirmation.
- Initial signed build failed in Metro cache clearing with `ENOTEMPTY` against the shared temporary cache. Retried with an isolated build `TMPDIR`, without deleting or modifying another build's cache.
- The isolated retry succeeded and installed over the existing app. Launch was denied because the iPhone was locked. Evidence: `/tmp/medical-device-edit-close-build-retry.log`, `/tmp/medical-device-edit-close-install.json`, and `/tmp/medical-device-edit-close-launch.json`. Verify one tap on Close while the note keyboard is still open after unlocking and opening the installed app.

## Native Header and Liquid Glass Remediation

- Supersedes the opaque procedure/folder header workarounds above. All stacks now share transparent iOS header configuration, native soft top scroll-edge treatment on Liquid Glass, and legacy system material only on older iOS. Android/web retain themed opaque bars. No custom gradient or extra glass wrapper was added.
- Pro Close, procedure Close/Bookmark, and folder Add/Done now use native UIKit bar-button items through the installed native-stack API. SDK 54 has no Stack.Toolbar; the unstable API is isolated in one adapter. Native back controls and gestures remain unchanged.
- Added a small versioned screens patch for UIKit accessibility identifiers and native-stack's newer title/titleStyle keys. Postinstall applies the patch with failure propagation. SF Symbols and spoken accessibility labels are separate from stable automation IDs.
- Kept keyboard-aware scrolling and explicit keyboard dismissal before Close, added a no-history destination for direct procedure links, and added missing automatic scroll insets to the Pro success state. Native bookmark actions retain haptics, state changes, and Pro-limit handling; only the old custom icon-scale animation was removed from the header.
- The updated procedure/folder regression tests failed on the opaque configuration before implementation. Added native/fallback header configuration, action wiring, tab-layout inheritance, haptic/state, and direct-link dismissal coverage. Native build and visual verification results follow below.
- All 110 tests across 13 suites passed. TypeScript, lint, targeted formatting, and diff checks passed. The screens patch applied successfully to a clean published 4.17.1 package and matched the local patched native file; postinstall also passed.
- Simulator verification was attempted in an isolated iOS 26.5 simulator. The MCP build selected Xcode beta despite its environment override, so that build was cancelled and retried with the stable Xcode CLI. Extreme host load (load average over 1000) slowed compilation and simulator startup; the extra simulator build was stopped and only this task's simulator was shut down to reduce load. No simulator visual or native-touch acceptance is claimed. The signed iPhone build remains the native verification path.
- Signed Release build succeeded with stable Xcode 26.6 / iOS SDK 26.5, including recompilation of the patched RNSBarButtonItem implementation. Installed over the existing iPhone app without uninstalling, and launched via the Saved deep link. A subsequent device process listing confirmed the new app executable was still running (PID 7629). Evidence: `/tmp/medical-device-glass-build.log`, `/tmp/medical-device-glass-install.json`, `/tmp/medical-device-glass-launch.json`, `/tmp/medical-device-glass-processes.json`.
- Final device acceptance remains pending: scroll lists/details in light and dark appearance to confirm the native soft edge and large-title behavior; tap Close with the note keyboard open; toggle the bookmark; exercise folder Add/Done and repeated native back/swipe navigation. Successful build, installation, process launch, and JS callback tests are not proof of UIKit visual or touch behavior.

## iOS 26 Header Comparison

- Repeated the visual check on the isolated Medical Glass QA simulator (iPhone 17 Pro, iOS 26.5, CC4E05E8-D93D-41C0-8729-E51B92AB12DE). Built the unchanged application source in Release with stable Xcode 26.6 / simulator SDK 26.5. Build succeeded, MCP installation and launch succeeded (PID 59358). Build log: `/tmp/medical-glass-ios26-build.log`.
- Used AXe to select MKH-10, scroll the Explore list in dark mode, switch to About, and return. Verified the large title collapses to a compact title and a progressive blur remains beneath it, without the horizontal hard cutoff visible in the user's iOS 27 screenshot. The fade persisted after tab switching.
- Screenshots and UI snapshots are outside Git in `/tmp/medical-ios26-header-evidence/`. Main comparison: `ios26-dark-comparison.png`; after tab switching: `ios26-dark-returned.png`; initial large title: `ios26-dark-top.png`. Runtime and bundle SDK both verified as 26.5.
- This establishes a visual difference between the iOS 26 simulator and the iOS 27 phone, not the exact cause: OS behavior versus navigation-library interaction on iOS 27 remains unconfirmed. No application styling or phone installation changed in this comparison. Simulator left running for inspection.
