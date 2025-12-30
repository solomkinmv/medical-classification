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
- Valid Apple Developer signing identity

### Build and Install

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

If Xcode can't find Node, update `ios/.xcode.env.local`:
```bash
export NODE_BINARY=/opt/homebrew/bin/node
```
