# ACHI Mobile

Mobile app for Ukrainian medical classification code lookup. Supports two classifiers:

- **АКМІ (ACHI)** — Australian Classification of Health Interventions, Ukrainian adaptation (НК 024:2019)
- **МКХ-10 (ICD-10)** — International Classification of Diseases, 10th Revision, Ukrainian adaptation (НК 025:2021)

Users can switch between classifiers using the segmented control on the Explore tab. Each classifier has independent search, browsing, and bookmarks.

## Development

```bash
npm install
npm start
```

## iOS Standalone Installation

To build and install a release version on a physical iPhone (without dev server):

### Prerequisites

- Xcode installed
- iPhone connected (USB or wirelessly paired via Xcode)
- Valid Apple Developer account signed in to Xcode

### Option 1: Build via Xcode (Recommended for first-time setup)

1. Generate native iOS project (if not already done):

   ```bash
   npx expo prebuild --platform ios
   ```

2. Open the project in Xcode:

   ```bash
   open ios/achimobile.xcworkspace
   ```

3. Configure signing:
   - Select the **achimobile** target
   - Go to **Signing & Capabilities** tab
   - Check **Automatically manage signing**
   - Select your **Team** from the dropdown

4. Build and run:
   - Select your iPhone as the destination
   - Press `Cmd+R` or Product → Run

### Option 2: Command Line Build (After signing is configured)

1. Generate native iOS project (if not already done):

   ```bash
   npx expo prebuild --platform ios
   ```

2. Build the release version:

   ```bash
   cd ios
   xcodebuild -workspace achimobile.xcworkspace -scheme achimobile -configuration Release -destination 'generic/platform=iOS' -allowProvisioningUpdates
   ```

3. Find your device UDID:

   ```bash
   xcrun xctrace list devices
   ```

4. Install on device:
   ```bash
   xcrun devicectl device install app --device <DEVICE_UDID> ~/Library/Developer/Xcode/DerivedData/achimobile-*/Build/Products/Release-iphoneos/achimobile.app
   ```

### Troubleshooting

**Signing errors:** If you see "No Account for Team" or "No profiles found", open Xcode and configure signing manually (Option 1).

**Node not found:** If Xcode can't find Node, update `ios/.xcode.env.local`:

```bash
export NODE_BINARY=/opt/homebrew/bin/node
```

**Clean build:** If you encounter build issues:

```bash
cd ios
rm -rf ~/Library/Developer/Xcode/DerivedData/achimobile-*
pod install
```

## TestFlight Deployment

To build and upload the app to TestFlight for beta testing:

### Prerequisites

- Fastlane installed (`brew install fastlane`)
- EAS CLI installed (`npm install -g eas-cli`)
- Apple ID with App Store Connect access
- App-specific password (generate at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords)

### Build Locally

Run a local production build:

```bash
npx eas-cli build --platform ios --profile production --local
```

This creates an `.ipa` file in the project directory.

### Upload to TestFlight

Upload the built `.ipa` to App Store Connect:

```bash
xcrun altool --upload-app -f <path-to-ipa> -t ios -u <apple-id> -p <app-specific-password>
```

Example:

```bash
xcrun altool --upload-app -f build-1234567890.ipa -t ios -u your@email.com -p xxxx-xxxx-xxxx-xxxx
```

After upload, the build will appear in App Store Connect → TestFlight within a few minutes.

### Alternative: EAS Cloud Build

If you prefer cloud builds (requires EAS account):

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

Note: Cloud builds require the Xcode 26 image (configured in `eas.json`) for the `.icon` App Icon format.

## Pro purchase testing

Pro is a one-time, non-consumable purchase with product ID
`com.solomkinmv.achi_mobile.pro`. The intended base price is USD 2.99; the
paywall always displays the store's localized price. App Store Connect pricing
must be configured separately; editing `Products.storekit` does not change it.

### Local StoreKit

1. Run `npm ci`, then `npx expo prebuild --platform ios` to restore native dependencies.
2. Start Metro with `npx expo start --dev-client` and open
   `ios/MedichniKodi.xcworkspace` in Xcode.
3. Use a toolchain/runtime compatible with Expo SDK 54. In the `MedichniKodi`
   scheme's Run options, `Products.storekit` should already be selected by the
   config plugin. Run from Xcode to activate the local StoreKit session.
4. If the development client asks for a server, select this project's Metro URL.
5. Open Pro from the app, verify the $2.99 test price, and exercise purchase,
   cancellation, restore, and restart. Use Xcode's StoreKit transaction manager
   for pending approval and refund/revocation scenarios.

The plugin copies the source configuration and writes
`../MedichniKodi/Products.storekit`, relative to the `.xcodeproj` directory.
It repairs old references and survives repeated/fresh prebuilds. Do not maintain
these settings by hand inside the generated `ios/` folder. A normal CLI launch
is not proof that a local StoreKit session was activated.

The paywall exposes `pro.purchase`, `pro.restore`, `pro.retry`, `pro.close`, and
`pro.status` automation IDs. Failed store reads offer retry; pending transactions
remain pending until the store resolves them. Closing the paywall does not cancel
a transaction. Cached Pro access survives store/network errors; successful fresh
entitlement checks can remove access after revocation without deleting user data.

### Real-device sandbox and release

Use a signed build on an iPhone with local StoreKit configuration disabled.
Confirm the product belongs to this app in App Store Connect, is non-consumable,
is available in the test storefront, and has the intended USD 2.99 base price.
Confirm account agreements and product metadata, then use an Apple sandbox tester.
Verify purchase, cancellation, restart, and restore after reinstall; verify a
second-device restore when available. Local StoreKit tests do not replace this.

Do not use `npm run deploy:ios` for a build-only check: it uploads/submits as well.
The current validation results and remaining release blockers are recorded in
`../docs/plans/pro-purchase-validation.md`.

### Native navigation compatibility

`react-native-screens` is pinned to 4.17.1, above Expo 54's bundled 4.16.x range,
to incorporate the upstream iOS 26 back-button interaction fixes. Keep the native
Expo Router back button; do not replace it with a custom press target to mask the
library issue. Expo dependency checks may flag this deliberate override. Rebuild
the native app after changing it, and verify repeated folder push/back cycles,
swipe-back, tabs, and form sheets on device. See upstream
[issue 12778](https://github.com/react-navigation/react-navigation/issues/12778)
and [screens PR 3173](https://github.com/software-mansion/react-native-screens/pull/3173).

### Native headers and Liquid Glass

All stacks share `components/navigation-header.tsx`: transparent iOS bars, a native
soft top scroll edge on Liquid Glass, and the system material fallback on older
iOS. Android/web retain themed opaque headers. Keep scroll content directly under
the native screen with automatic content insets; do not add opaque header overrides
or a second custom blur/gradient layer. Large titles remain on the tab root screens.

SDK 54 does not expose `Stack.Toolbar`. The adapter uses native-stack 7.11.0's
`unstable_headerLeftItems`/`unstable_headerRightItems` for UIKit buttons with SF
Symbols, and HeaderButton on other platforms. The versioned screens 4.17.1 patch
accepts native-stack's newer title/titleStyle keys and maps the stable item
identifier to UIKit's accessibilityIdentifier. Spoken accessibility labels stay
separate from automation IDs. `npm install`/`npm ci` applies the patch via
`postinstall` and fails if it cannot apply; do not skip install scripts for native
builds. Reassess/remove the patch when upgrading screens, and migrate the adapter
to Stack.Toolbar with an SDK upgrade rather than adding a second navigation layer.

After header changes, verify light/dark scrolling, large-title collapse, repeated
back taps and gestures, bookmark state changes, folder Add/Done, and modal Close
with a note keyboard open. JS tests do not prove UIKit hit testing.
