# Medical Classifications — Repository Guidelines

Tools for browsing Ukrainian medical classifications: АКМІ (ACHI, procedures) and МКХ-10 (ICD-10, diagnoses). The active clients are an Expo mobile app and a Telegram bot. There is no root package manifest; each directory is set up and run on its own.

## Project map

| Directory      | Purpose                                                                                |
| -------------- | -------------------------------------------------------------------------------------- |
| `achi-mobile`  | Expo / React Native app for АКМІ and МКХ-10, published on the App Store; npm; Pro IAP  |
| `achi`         | Python Telegram bot (`python-telegram-bot`) for АКМІ, deployed to Fly.io as `achi-bot` |
| `mkh10`        | Python parser that generates МКХ-10 JSON                                               |
| `data-source`  | АКМІ source data, НК 026:2021 (`nk-026-2021.csv`, plus PDF and XLSX)                   |
| `mkh10-data`   | МКХ-10 source data, НК 025:2021 (`nk-025-2021.csv`)                                    |
| `Green ACHI`   | Legacy native iOS Xcode project; not built by CI                                       |
| `docs/plans`   | Implementation plans; finished plans move to `docs/plans/completed`                    |

Follow `achi-mobile/AGENTS.md` when working in the mobile app.

## Data pipeline

Clients bundle pre-generated JSON and read no source files at runtime. Generated JSON is committed; regenerate it instead of hand-editing it. All three generators currently reproduce the committed files byte for byte.

- Mobile АКМІ: from `achi-mobile`, run `npx ts-node scripts/generate-achi-data.ts`. It reads `../data-source/nk-026-2021.csv` and writes `achi-mobile/data/achi.json`.
- Mobile МКХ-10: from `mkh10`, run `python3 mkh10_parser.py`. It reads `../mkh10-data/nk-025-2021.csv` and writes `mkh10/data/mkh10.json`. Copy that file to `achi-mobile/data/mkh10.json`; the two copies are currently identical.
- Bot АКМІ: from `achi`, run `python3 achi_parser.py`. It reads the same `../data-source/nk-026-2021.csv` and writes `achi/data/achi.json`. Both АКМІ generators apply the same rules, so the app and bot contain the same codes and names.
- The app imports both files statically in `achi-mobile/lib/classifier-provider.tsx` (`@/data/achi.json`, `@/data/mkh10.json`). The bot loads `data/achi.json` relative to its working directory.
- Source CSVs use `;` as the delimiter. In `nk-026-2021.csv`, fields that contain `;` (class 21 lab test names) are double-quoted, so parse it as CSV rather than splitting lines.
- `nk-026-2021.csv` matches `nk-026-2021.xlsx` except for 24 names in the 96xxx codes, which follow the official `nk-026-2021.pdf` (the XLSX has older wording there). The PDF is the official edition published by dec.gov.ua.
- In АКМІ, classes 20–22 and two class 13 codes have `__` for hierarchy levels they lack. The generators turn an unnamed level into a `_` category, which app and bot navigation skip, and omit `__` codes. The source also mixes look-alike Latin letters into Ukrainian words and a Cyrillic `А` into two codes; the generators normalize both. Two pairs of blocks (675/677, 1450/1451) share a truncated name, so the second block's key gets its number appended.

## Telegram bot (`achi`)

- Install with `pip install -r requirements.txt`, then run `TOKEN=<bot token> python3 achi_bot.py` from `achi/`. The bot uses long polling (`run_polling`) and has no tests or linter.
- Pushing to `main` with changes under `achi/**` runs `.github/workflows/fly.yml`. It builds and pushes `solomkinmv/achi_bot:latest` to Docker Hub, then runs `flyctl deploy --remote-only`. `achi/fly.toml` deploys that image.
- The Dockerfile uses `python:3.12-slim`; `python-telegram-bot` 22.x requires Python 3.10 or later.
- Dependabot opens weekly updates for pip (`/achi`) and GitHub Actions.

## Mobile app (`achi-mobile`)

- Install with `npm ci` and run `npm start`. CI (`.github/workflows/achi-mobile-ci.yml`, Node 22) runs `npm run format:check`, `npm run lint`, `npx tsc --noEmit` and `npm test` for changes under `achi-mobile/**`.
- The Pro in-app purchase, release, simulator workflow and code conventions are in `achi-mobile/AGENTS.md`.

## Secrets

Never commit or log secret values.

- Bot: the Telegram token is read from the `TOKEN` environment variable. `fly.toml` does not define it, so it must be set in the Fly app's environment.
- CI: the GitHub Actions secrets are `FLY_API_TOKEN`, `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.
- Mobile: `achi-mobile/.gitignore` excludes `.env*.local`, signing material (`*.p8`, `*.p12`, `*.key`, `*.jks`, `*.mobileprovision`, `*.pem`), generated `ios/` and `android/`, and `*.ipa`.

## Commits

Use Conventional Commits, as in the git log: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:` and `ci:`. Add a scope when it helps, for example `chore(deps):` or `feat(mobile):`. Write summaries in imperative, lower case.
