# Add МКХ-10 (ICD-10) Support to Mobile App

## Overview
Add МКХ-10 (ICD-10) disease classification support to the existing АКМІ mobile app. Users will be able to switch between АКМІ (procedures) and МКХ-10 (diseases) classifiers within the same app using a tab switcher. This makes the app a comprehensive Ukrainian medical coding reference tool.

Data source: **НК 025:2021** from meddata.pp.ua — official Ukrainian national classifier with 16,960 records, bilingual (UA+EN), including 5-digit МКХ-10-АМ codes.

## Context
- **Existing app**: React Native Expo 54, TypeScript, Tailwind/NativeWind
- **Existing data pattern**: CSV → Python parser → hierarchical JSON → bundled in app
- **Key files to modify**:
  - `achi-mobile/lib/types.ts` — add МКХ-10 types
  - `achi-mobile/lib/data-provider.tsx` — add classifier context/switcher
  - `achi-mobile/lib/search.ts` — adapt search for МКХ-10
  - `achi-mobile/lib/navigation.ts` — adapt navigation for МКХ-10 hierarchy
  - `achi-mobile/lib/favorites-provider.tsx` — namespace favorites by classifier
  - `achi-mobile/app/(tabs)/explore/index.tsx` — add classifier switcher UI
  - `achi-mobile/app/(tabs)/search/index.tsx` — search across active classifier
  - `achi-mobile/app/procedure/[code].tsx` — display МКХ-10 disease details
- **New files**:
  - `mkh10/mkh10_parser.py` — parse meddata CSV into hierarchical JSON
  - `achi-mobile/data/mkh10.json` — generated МКХ-10 data
  - `achi-mobile/lib/classifier-provider.tsx` — classifier switcher context

## Data Source Attribution (for Apple Review)
- **Classifier**: НК 025:2021 "Класифікатор хвороб та споріднених проблем охорони здоров'я"
- **Publisher**: Міністерство охорони здоров'я України
- **Approved by**: Наказ Міністерства економіки України від 04.08.2021 № 360-21
- **Effective from**: 01.09.2021
- **Harmonized with**: ICD-10-AM (Australian Modification), 1 July 2017
- **Digital data source**: meddata.pp.ua
- **Official PDF**: https://www.dec.gov.ua/wp-content/uploads/2021/11/naczionalnyj-klasyfikator-nk-025.pdf

## Development Approach
- **Testing approach**: Regular (code first, then tests)
- Complete each task fully before moving to the next
- Make small, focused changes
- Run tests after each change
- Maintain backward compatibility with existing ACHI functionality

## МКХ-10 Hierarchy (5 levels)
```
Class (Клас 1..22)
  └── Block (A00-A09, etc.)
       └── Nosology/3-char (A00, A01, etc.)
            └── Disease/4-digit (A00.0, A00.1, etc.)
                 └── Disease/5-digit (A41.50, etc.) — МКХ-10-АМ extension, optional
```

CSV columns (meddata.pp.ua):
```
0: Клас        (e.g. "Клас 1")
1: Опис класу  (e.g. "ДЕЯКІ ІНФЕКЦІЙНІ ТА ПАРАЗИТАРНІ ХВОРОБИ (A00-B99)")
2: Код блоку   (e.g. "A00-A09")
3: Назва блоку (e.g. "Кишкові інфекційні хвороби")
4: Код нозології    (e.g. "A00")
5: Нозологія EN     (e.g. "Cholera")
6: Нозологія UA     (e.g. "Холера")
7: Код 4-digit      (e.g. "A00.0")
8: 4-digit EN       (e.g. "Cholera due to Vibrio cholerae 01, biovar cholerae")
9: 4-digit UA       (e.g. "Холера, спричинена холерним вібріоном 01, biovar cholera")
10: Код 5-digit     (e.g. "A41.50" or "-")
11: 5-digit EN      (e.g. "-" when no 5-digit)
12: 5-digit UA      (e.g. "Септицемія, спричинена неуточненими грамнегативними організмами")
```

## Progress Tracking
- Mark completed items with `[x]` immediately when done
- Add newly discovered tasks with ➕ prefix
- Document issues/blockers with ⚠️ prefix

## Implementation Steps

### Task 1: Create МКХ-10 data parser
- [x] Create `mkh10/mkh10_parser.py` that reads `mkh10-data/nk-025-2021.csv`
- [x] Build 5-level hierarchy: Class → Block → Nosology → 4-digit → 5-digit (optional leaf)
- [x] Output format must match the existing ACHI JSON pattern (nested dict with `children`, leaf arrays with `code`, `name_ua`, `name_en`)
- [x] Handle the 5-digit codes: when present (not "-"), they become leaf children under the 4-digit code; when absent, the 4-digit code is the leaf
- [x] Generate `mkh10/data/mkh10.json` and copy to `achi-mobile/data/mkh10.json`
- [x] Validate output: verify record counts (22 classes, 228 blocks, 2078 nosologies, correct leaf counts)
- [x] Run parser and verify output JSON is well-formed

### Task 2: Add МКХ-10 types to the app
- [x] Add `Mkh10Data` interface to `lib/types.ts` (reuse the same `CategoryNode`/`CategoryChildren` pattern but with МКХ-10 level names)
- [x] Add `DiagnosisCode` interface (similar to `ProcedureCode` but for diseases: `code`, `name_ua`, `name_en`)
- [x] Add `ClassifierType` type: `"achi" | "mkh10"`
- [x] Update `PathSegment` level union to include МКХ-10 levels: `"class" | "block" | "nosology" | "disease"` (alongside existing ACHI levels)
- [x] Add type guards for МКХ-10 data if needed
- [x] Verify TypeScript compilation passes

### Task 3: Create classifier switcher context
- [x] Create `lib/classifier-provider.tsx` with `ClassifierType` state (`"achi"` | `"mkh10"`)
- [x] Provide `activeClassifier`, `setActiveClassifier`, `activeData` (returns the correct JSON based on selection)
- [x] Import both `achi.json` and `mkh10.json` data files
- [x] Persist selected classifier in AsyncStorage
- [x] Wrap the provider in `app/_layout.tsx` (inside existing providers)
- [x] Verify app still builds and renders ACHI data correctly

### Task 4: Update data-provider and navigation for multi-classifier support
- [x] Update `useAchiData()` hook to use data from classifier context (or add a new `useClassifierData()` hook)
- [x] Update `navigation.ts` `LEVEL_ORDER` to support МКХ-10 levels (class → block → nosology → disease)
- [x] Update `getLevelLabel()` in `procedure/[code].tsx` to return correct labels based on classifier type
- [x] Update `search.ts` to work with both data formats (the `searchProcedures` function should work generically since it traverses the same tree structure)
- [x] Verify explore/search still works for ACHI

### Task 5: Add classifier switcher UI to Explore tab
- [x] Add a segmented control / pill switcher at the top of Explore screen: "АКМІ" | "МКХ-10"
- [x] Use the classifier context to switch the displayed data
- [x] Update header subtitle text based on active classifier (e.g., "Австралійська класифікація медичних інтервенцій" vs "Міжнародна класифікація хвороб")
- [x] Use a distinct accent color for МКХ-10 (e.g., emerald/green to differentiate from sky blue)
- [x] Verify switching between classifiers works, explore tab shows correct categories

### Task 6: Update Search to work with active classifier
- [x] Search tab should search within the currently active classifier
- [x] Update search results display to show correct accent color based on classifier
- [x] Update empty state message if needed
- [x] Verify search works for both ACHI and МКХ-10 codes/names

### Task 7: Update Procedure/Disease detail screen
- [x] Update `procedure/[code].tsx` to find the code in the active classifier's data
- [x] Update breadcrumb labels to show МКХ-10 hierarchy labels (Клас, Блок, Нозологія, etc.)
- [x] Use classifier-appropriate accent color
- [x] Verify detail screen works for both ACHI procedures and МКХ-10 diagnoses

### Task 8: Update Favorites for multi-classifier support
- [x] Namespace favorites storage: use separate AsyncStorage keys (`achi_favorites` and `mkh10_favorites`)
- [x] Update `favorites-provider.tsx` to filter by active classifier
- [x] Update Pinned screen to show favorites from the active classifier
- [x] Verify bookmarking works independently for ACHI and МКХ-10

### Task 9: Update About screen with МКХ-10 attribution
- [x] Add МКХ-10 data source information to the About screen
- [x] Include: НК 025:2021, МОЗ України, effective date, ICD-10-AM harmonization
- [x] Add reference link to official PDF
- [x] Verify about screen renders correctly

### Task 10: Verify acceptance criteria
- [x] Verify ACHI explore/search/pinned still works correctly (no regression)
- [x] Verify МКХ-10 explore: 22 classes displayed, navigation through all 5 levels works
- [x] Verify МКХ-10 search: codes and names searchable in both languages
- [x] Verify МКХ-10 favorites: bookmarking works independently from ACHI
- [x] Verify classifier switcher persists across app restarts
- [x] Verify app builds for iOS (EAS build or local Xcode)
- [x] Run linter - all issues must be fixed
- [x] Check TypeScript types - no errors

### Task 11: [Final] Update documentation
- [ ] Update `achi-mobile/README.md` if needed (mention МКХ-10 support)
- [ ] Update Obsidian knowledge base notes with any new findings

## Technical Details

### JSON Output Format (МКХ-10)
```json
{
  "children": {
    "Деякі інфекційні та паразитарні хвороби": {
      "clazz": "Клас 1",
      "code": "A00-B99",
      "name_ua": "Деякі інфекційні та паразитарні хвороби",
      "children": {
        "Кишкові інфекційні хвороби": {
          "code": "A00-A09",
          "name_ua": "Кишкові інфекційні хвороби",
          "children": {
            "Холера": {
              "code": "A00",
              "name_ua": "Холера",
              "name_en": "Cholera",
              "children": [
                {
                  "code": "A00.0",
                  "name_ua": "Холера, спричинена холерним вібріоном 01, biovar cholera",
                  "name_en": "Cholera due to Vibrio cholerae 01, biovar cholerae"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

For nosologies that have 5-digit codes, the 4-digit code becomes a category node (not a leaf), and 5-digit codes become the leaf array.

### Classifier Switcher Design
- Segmented control at top of Explore tab (iOS native feel)
- Two segments: "АКМІ" and "МКХ-10"
- Accent colors: sky-500 for ACHI, emerald-500 for МКХ-10
- State persisted in AsyncStorage

## Post-Completion

**Manual verification:**
- Test on iOS simulator and physical device
- Test dark mode and light mode
- Test offline behavior (data is bundled)
- Test with VoiceOver accessibility
- Verify app size doesn't grow excessively (МКХ-10 JSON should be ~3-5MB)

**App Store submission:**
- Update app description to mention МКХ-10 support
- Update screenshots
- Add data attribution in app description and About screen
