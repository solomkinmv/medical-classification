# In-App Purchase: Pro Unlock

## Overview
Add a one-time "Pro" in-app purchase ($2.99) to Медичні Коди using `expo-iap` that unlocks power-user features:
- **Unlimited bookmarks** (free users limited to 3 per classifier)
- **Custom folders** to organize bookmarks into named collections
- **Annotations/Notes** on any medical code

The core browse, search, and basic bookmark (up to 3) experience remains free.

## Context
- **Favorites system**: `lib/favorites-provider.tsx` — React Context + AsyncStorage, per-classifier
- **Pinned screen**: `app/(tabs)/pinned/index.tsx` — flat FlatList of bookmarked LeafCodes
- **Root layout**: `app/_layout.tsx` — provider hierarchy: Classifier > Favorites > RecentSearches
- **Types**: `lib/types.ts` — LeafCode, ClassifierType, CategoryNode
- **No existing tests** in the project
- **No existing monetization**
- **iOS only** in production, bundle ID: `com.solomkinmv.achi-mobile`
- **Expo 54** with dev-client already configured

## expo-iap Reference

**Install**: `npx expo install expo-iap`

**Config** (app.json plugins):
```json
["expo-iap"],
["expo-build-properties", {"android": {"kotlinVersion": "2.2.0"}}]
```

**Prerequisites**: Expo SDK 53+, iOS 15+, custom dev client (all met)

**Primary API — `useIAP` hook**:
```tsx
import { useIAP } from 'expo-iap';

const {
  connected,           // boolean — store connection status
  products,            // Product[] — fetched products
  availablePurchases,  // Purchase[] — owned purchases (for restore)
  fetchProducts,       // (params) => Promise<void>
  requestPurchase,     // (props) => Promise<void>
  finishTransaction,   // (params) => Promise<void>
  getAvailablePurchases, // () => Promise<void> — restore
} = useIAP({
  onPurchaseSuccess: async (purchase) => { /* verify + finish */ },
  onPurchaseError: (error) => { /* handle */ },
});
```

**Purchase flow for non-consumable**:
```tsx
// 1. Fetch product
fetchProducts({ skus: ['com.solomkinmv.achi-mobile.pro'], type: 'in-app' });

// 2. Purchase
requestPurchase({
  request: {
    apple: { sku: 'com.solomkinmv.achi-mobile.pro' },
    google: { skus: ['com.solomkinmv.achi-mobile.pro'] },
  },
  type: 'in-app',
});

// 3. In onPurchaseSuccess callback:
finishTransaction({ purchase, isConsumable: false });
```

**Restore**: `getAvailablePurchases()` → check `availablePurchases` for product ID

**Error utilities**: `isUserCancelledError(e)`, `getUserFriendlyErrorMessage(e)`, `ErrorCode` enum

**Key error codes**: `UserCancelled`, `AlreadyOwned`, `NetworkError`, `ItemUnavailable`, `BillingUnavailable`

## Development Approach
- **Testing approach**: Code first, then tests
- Complete each task fully before moving to the next
- Make small, focused changes
- **CRITICAL: every task MUST include new/updated tests** for code changes in that task
- **CRITICAL: all tests must pass before starting next task**
- **CRITICAL: update this plan file when scope changes during implementation**

## Testing Strategy
- **Unit tests**: Set up Jest + React Native Testing Library as first task
- **No e2e tests** — not adding in this scope

## Progress Tracking
- Mark completed items with `[x]` immediately when done
- Add newly discovered tasks with ➕ prefix
- Document issues/blockers with ⚠️ prefix

## Implementation Steps

### Task 1: Set up test infrastructure
- [x] Install jest, @testing-library/react-native, and related dev dependencies
- [x] Configure jest for Expo/React Native
- [x] Add `test` script to package.json
- [x] Create a trivial test to verify setup works
- [x] Run tests — must pass before next task

### Task 2: Install and configure expo-iap
- [x] Run `npx expo install expo-iap expo-build-properties`
- [x] Add plugins to app.json:
  ```json
  "plugins": [
    "expo-router",
    "expo-localization",
    "expo-iap",
    ["expo-build-properties", { "android": { "kotlinVersion": "2.2.0" } }]
  ]
  ```
- [x] Define product ID constant in `lib/constants.ts`: `PRO_PRODUCT_ID = 'com.solomkinmv.achi-mobile.pro'`
- [x] Create `lib/pro-provider.tsx` with React Context:
  - `isPro: boolean` — persisted in AsyncStorage as cache
  - `isProLoading: boolean`
  - `purchasePro()` — triggers `requestPurchase` via expo-iap
  - `restorePurchases()` — triggers `getAvailablePurchases`
  - On mount: check AsyncStorage cache + call `getAvailablePurchases` to verify
  - `onPurchaseSuccess`: set `isPro = true`, persist to AsyncStorage, call `finishTransaction({ purchase, isConsumable: false })`
  - `onPurchaseError`: handle with `isUserCancelledError` (silent) vs show `getUserFriendlyErrorMessage`
  - `product: Product | null` — fetched product info for displaying price
  - On `connected`: call `fetchProducts({ skus: [PRO_PRODUCT_ID], type: 'in-app' })`
- [x] Export `useProStatus()` hook that returns `{ isPro, isProLoading, purchasePro, restorePurchases, product }`
- [x] Add `ProProvider` to root layout in `app/_layout.tsx` (wrap around FavoritesProvider)
- [x] Write tests for ProProvider (mock expo-iap module)
- [x] Run tests — must pass before next task

### Task 3: Add bookmark limit for free users (3 per classifier)
- [x] Add `BOOKMARK_LIMIT_FREE = 3` constant to `lib/constants.ts`
- [x] Modify `lib/favorites-provider.tsx`:
  - Import `useProStatus` from pro-provider
  - Add `canAddFavorite: boolean` to context (true if Pro OR count < 3)
  - Add `favoritesRemaining: number` to context
  - Modify `toggleFavorite`: when adding and limit reached, don't add — instead set a `limitReached` flag
- [x] Create `components/UpgradePrompt.tsx` — an Alert-based prompt shown when limit hit:
  - Title: "Обмеження безкоштовної версії"
  - Message: "Безкоштовна версія дозволяє зберігати до 3 закладок. Оновіть до Pro для необмежених закладок, папок та нотаток."
  - Buttons: "Оновити до Pro" (navigates to /pro) and "Скасувати"
- [x] Wire upgrade prompt: when `toggleFavorite` is called at limit, show prompt
- [x] Ensure existing bookmarks (>3) from before update are preserved and visible (just can't add more)
- [x] Write tests for bookmark limit logic (under limit, at limit, Pro bypasses limit, removing still works)
- [x] Run tests — must pass before next task

### Task 4: Create Pro upgrade screen
- [x] Create `app/pro.tsx` — modal screen showing Pro features and purchase button:
  - Feature list with icons: unlimited bookmarks, folders, notes
  - Price from `product.displayPrice` (fallback "$2.99")
  - "Купити Pro" button → calls `purchasePro()`
  - "Відновити покупки" link → calls `restorePurchases()`
  - Loading state while purchase is processing
  - Success state → auto-dismiss
  - Already Pro state → "Ви вже маєте Pro!"
- [x] Add route to stack navigator in `app/_layout.tsx` (modal presentation)
- [x] Write tests for Pro screen rendering states (loading, default, already pro)
- [x] Run tests — must pass before next task

### Task 5: Add custom folders for bookmarks (Pro feature)
- [x] Add `Folder` type to `lib/types.ts`:
  ```typescript
  interface Folder {
    id: string;
    name: string;
    classifier: ClassifierType;
    codeRefs: string[];
  }
  ```
- [x] Create `lib/folders-provider.tsx` with React Context:
  - `folders: Folder[]` for active classifier
  - `createFolder(name: string): void`
  - `deleteFolder(id: string): void`
  - `renameFolder(id: string, name: string): void`
  - `addToFolder(folderId: string, code: string): void`
  - `removeFromFolder(folderId: string, code: string): void`
  - `getFolderForCode(code: string): Folder | null`
  - Persist to AsyncStorage with key `${classifier}_folders`
- [x] Add `FoldersProvider` to root layout (inside ProProvider, around FavoritesProvider)
- [x] Update `app/(tabs)/pinned/index.tsx`:
  - Show folders section above bookmarks list (Pro only, gated behind `isPro`)
  - "+ Нова папка" button → text input prompt
  - Each folder: name + code count, tappable to view contents
  - Swipe-to-delete or long-press for rename/delete
- [x] Create `app/folder/[id].tsx` — folder detail screen showing codes in that folder
- [x] Add "Додати в папку" action on bookmark items (Pro only)
- [x] Free users: hide folder UI entirely
- [x] Write tests for folders-provider logic (CRUD operations, persistence)
- [x] Run tests — must pass before next task

### Task 6: Add annotations/notes on codes (Pro feature)
- [x] Create `lib/notes-provider.tsx` with React Context:
  - `getNote(code: string): string | null`
  - `setNote(code: string, text: string): void`
  - `deleteNote(code: string): void`
  - `hasNote(code: string): boolean`
  - Persist to AsyncStorage with key `${classifier}_notes` as `Record<string, string>`
- [x] Add `NotesProvider` to root layout (inside FoldersProvider)
- [x] Update procedure detail modal (`app/procedure/[code].tsx`):
  - Below procedure details, show notes section (Pro only)
  - If no note: "Додати нотатку" button
  - If note exists: display note text with edit/delete buttons
  - Inline text input for editing
- [x] Show note indicator on AccentCard in pinned/search results if note exists for that code
- [x] Free users: hide notes UI, or show "Pro" badge as teaser
- [x] Write tests for notes-provider logic (get, set, delete, persistence)
- [x] Run tests — must pass before next task

### Task 7: Verify acceptance criteria
- [ ] Verify: free users can bookmark up to 3 codes per classifier
- [ ] Verify: hitting bookmark limit shows upgrade prompt
- [ ] Verify: Pro purchase flow works (StoreKit sandbox)
- [ ] Verify: Pro unlocks unlimited bookmarks
- [ ] Verify: Pro unlocks folder creation and management
- [ ] Verify: Pro unlocks notes on codes
- [ ] Verify: restore purchases works
- [ ] Verify: existing bookmarks (>3) are preserved after update
- [ ] Run full test suite — all tests pass
- [ ] Run linter (`npm run lint`) — all issues fixed
- [ ] TypeScript type check passes

### Task 8: Update app metadata
- [ ] Bump app version in app.json (1.0.0 → 1.1.0)
- [ ] Update README if needed

## Technical Details

**IAP Product:**
- Product ID: `com.solomkinmv.achi-mobile.pro`
- Type: Non-consumable
- Price: $2.99 (Tier 1)
- Must be configured in App Store Connect before testing

**AsyncStorage Keys (new):**
- `iap_pro_purchased` — boolean cache of Pro status
- `achi_folders` / `mkh10_folders` — JSON array of Folder objects
- `achi_notes` / `mkh10_notes` — JSON `Record<string, string>`

**Provider Hierarchy (updated):**
```
ClassifierProvider
  └─ ProProvider (new — needs classifier for restore check)
       └─ FavoritesProvider (now reads isPro for limit)
            └─ FoldersProvider (new — Pro-gated)
                 └─ NotesProvider (new — Pro-gated)
                      └─ RecentSearchesProvider
```

## Post-Completion

**App Store Connect setup (manual):**
- Create IAP product with ID `com.solomkinmv.achi-mobile.pro`
- Set price tier to $2.99
- Add localized description in Ukrainian
- Submit for review alongside app update

**Testing with real purchases:**
- Create sandbox tester in App Store Connect
- Test on physical device with sandbox account
- Test restore flow
- Test persistence across reinstalls
