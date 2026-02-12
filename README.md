# Medical Classifications

Apps for browsing Ukrainian medical classifications.

## Apps

1. **achi-mobile** — React Native (Expo) mobile app for browsing АКМІ and МКХ-10 — [App Store](https://apps.apple.com/ua/app/%D0%BC%D0%B5%D0%B4%D0%B8%D1%87%D0%BD%D1%96-%D0%BA%D0%BE%D0%B4%D0%B8/id6758305387)
2. **achi** — Telegram bot: [АКМІ-selector](https://t.me/achi_selector_bot)
3. **Green ACHI** — iOS app (legacy)

## Classifiers

| Classifier | Standard | Source | Codes |
|---|---|---|---|
| АКМІ (ACHI) | НК 026:2021 | `data-source/nk-026-2021.csv` | 6,728 procedures |
| МКХ-10 (ICD-10) | НК 025:2021 | `mkh10-data/nk-025-2021.csv` | 16,960 diagnoses |

## Data Generation

The mobile app uses pre-generated JSON files (`achi-mobile/data/*.json`) built from source CSVs.

### ACHI (АКМІ)

```bash
cd achi-mobile
npx ts-node scripts/generate-achi-data.ts
```

- Input: `data-source/nk-026-2021.csv`
- Output: `achi-mobile/data/achi.json`

### МКХ-10 (ICD-10)

```bash
cd mkh10
python3 mkh10_parser.py
```

- Input: `mkh10-data/nk-025-2021.csv`
- Output: `achi-mobile/data/mkh10.json`

## Repository Structure

```
├── achi-mobile/          # React Native (Expo) mobile app
│   ├── data/             # Generated JSON (achi.json, mkh10.json)
│   └── scripts/          # ACHI data generator (TypeScript)
├── achi/                 # Telegram bot
├── data-source/          # Source CSV for АКМІ (НК 026:2021)
├── mkh10-data/           # Source CSV for МКХ-10 (НК 025:2021)
├── mkh10/                # МКХ-10 parser (Python)
└── Green ACHI/           # Legacy iOS app
```
