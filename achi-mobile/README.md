# ACHI Mobile

Mobile app for ACHI (Australian Classification of Health Interventions) code lookup.

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
