# achi-mobile — Guidelines

The app is built with Expo SDK 54, Expo Router (typed routes), NativeWind 4 and React 19 with the New Architecture. Its display name is "Медичні Коди", its version is 1.1.0 (`app.json`), and its bundle ID is `com.solomkinmv.achi-mobile`. The generated native iOS project is named `MedichniKodi`.

## Structure

- `app/` contains the Expo Router routes: tabs under `app/(tabs)/`, `procedure/[code]`, `folder/[id]` and the `pro` paywall.
- `components/` holds shared UI. Platform variants use the `.ios.tsx` suffix next to the default `.tsx`, for example `Card`, `EmptyState` and `CloseButton`. All stacks share their header configuration through `components/navigation-header.tsx`.
- `lib/` holds context providers (classifier, Pro, favorites, folders, notes, recent searches), search, navigation, types and hooks.
- `data/` holds the generated `achi.json` and `mkh10.json`. The root `AGENTS.md` explains how to regenerate them; do not edit them by hand.
- `scripts/generate-achi-data.ts` is the АКМІ data generator.
- `plugins/withStoreKitConfig.js` is a config plugin that adds `Products.storekit` to the generated Xcode project and scheme.
- `patches/` holds the patch-package patches.

## Commands

- Use `npm` with the committed `package-lock.json`. `.npmrc` sets `legacy-peer-deps=true`.
- `postinstall` runs `patch-package --error-on-fail`, which applies the `react-native-screens` 4.17.1 patch. Do not skip install scripts. `react-native-screens` is deliberately pinned above Expo 54's expected range; README explains why.
- `npm start` runs the Expo dev server. `npm run ios` and `npm run android` build and launch native apps; `ios/` and `android/` are generated and gitignored.
- Lint with `npm run lint` (`expo lint`, flat config with `eslint-config-prettier`). Format with `npm run format` and `npm run format:check`. Typecheck with `npx tsc --noEmit`. CI runs these three checks.
- `npm test` runs Jest (`jest-expo` preset) with React Native Testing Library. Tests live in `__tests__/` folders under `app/`, `components/`, `lib/` and `plugins/` and use `*.test.ts(x)` or `*.test.js` names; shared helpers are in `test-utils/`. CI runs them.

## iOS simulator workflow

Use serve-sim for all simulator UI work, including viewing, interacting and taking screenshots.

- Start Metro with `npm run start:sim`, which runs `EXPO_ENABLE_SIM_PREVIEW=true expo start`. Open `http://localhost:8081/.sim` and start a simulator stream from the preview UI.
- `metro.config.js` mounts the serve-sim middleware at `/.sim` only when `EXPO_ENABLE_SIM_PREVIEW=true`. Plain `npm start` is unchanged.
- Before you reuse a Metro server on port 8081, check which checkout owns it. Do not stop another checkout's server; pass `--port` when you need a different port.
- To manage serve-sim helpers from the CLI, target an explicit simulator UDID: `SIM=<udid> npm run sim:serve` or `SIM=<udid> npm run sim:serve:kill`. Use `npm run sim:serve:list` to list running streams. Avoid unscoped shutdowns, because another session may own a different simulator stream.

## Pro in-app purchase

- Pro is a one-time, non-consumable purchase with the ID `com.solomkinmv.achi_mobile.pro` (`PRO_PRODUCT_ID` in `lib/constants.ts`). It is implemented with `expo-iap` in `lib/pro-provider.tsx` (`useProStatus`); the paywall is `app/pro.tsx`.
- Free users can keep at most `BOOKMARK_LIMIT_FREE` (3) bookmarks per classifier, enforced in `lib/favorites-provider.tsx`. Custom folders and notes are Pro features.
- For local StoreKit testing, build and run the `MedichniKodi` scheme from Xcode with `Products.storekit`. Editing that file does not change App Store Connect pricing. Do not maintain StoreKit settings by hand in the generated `ios/`. README section "Pro purchase testing" covers the local and sandbox flows. `docs/plans/pro-purchase-validation.md` records validation status and remaining release blockers.

## Release (iOS)

- `npm run deploy:ios` builds locally with `eas build --platform ios --profile production --local`, submits the newest `build-*.ipa` with `eas submit`, and then deletes that IPA. It always uploads, so do not use it for a build-only check. No CI workflow releases the app.
- In `eas.json`, the production profile uses `autoIncrement` with `appVersionSource: remote`. Build numbers therefore come from EAS; do not set `ios.buildNumber` in `app.json`.
- iPad is disabled (`supportsTablet: false`). The app icon uses the `.icon` format (`assets/images/ios.icon`), which requires an Xcode 26 toolchain.
- `README.md` documents manual Xcode, device-install and TestFlight steps.

## Code style

- Prettier: double quotes, semicolons, trailing commas, 2 spaces, 80 columns (`.prettierrc`).
- TypeScript is `strict`. Imports use the `@/` alias to the app root.
- Style with NativeWind `className`, using the Tailwind config in `tailwind.config.js` and `global.css`.
- Favorites are namespaced per classifier. Each classifier (АКМІ, МКХ-10) has its own search, browsing, bookmarks and accent colors.
