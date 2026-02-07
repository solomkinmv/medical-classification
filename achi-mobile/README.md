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
