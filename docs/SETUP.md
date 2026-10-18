# Setup

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- Git

## Create your copy

Use the **Use this template** button on GitHub, or clone the repository:

```bash
git clone <your-repository-url> my-portfolio
cd my-portfolio
npm ci
```

## Run the setup wizard

```bash
npm run setup
```

The wizard asks for:

1. Your name
2. Your role
3. How many projects you have (0-50)
4. Whether you want English only or English plus another language
5. Your contact email
6. Optional GitHub and LinkedIn URLs
7. Which feature flags to enable

It writes `content/site.json`, creates demo project stubs, and creates a
translated-locale placeholder file when you add a second language.

### Non-interactive setup

```bash
npm run setup -- --yes --projects=3 --langs=en,ar
```

Supported flags:

| Flag | Meaning |
| --- | --- |
| `--yes` | Use safe defaults and skip prompts |
| `--projects=N` | Create exactly N demo project files (0-50) |
| `--langs=en` | English only |
| `--langs=en,ar` | English plus Arabic |
| `--langs=en,es` | English plus Spanish |
| `--name=NAME` | Override the display name |
| `--email=EMAIL` | Override the contact email |
| `--force` | Allow replacing a real project at a `demo-*.json` path |

The wizard is non-destructive by default. It preserves existing site values,
never overwrites a project with `"demo": false`, and does not delete real
projects. Running it again with the same options is safe.

## Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
node scripts/check-privacy.mjs
```

`npm run verify` runs all five checks in that order. Browser tests are separate:

```bash
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

## Troubleshooting

- **The build says the site configuration is invalid.** Read the error path. It
  points to the exact key in `content/site.json` that failed validation.
- **A localized value is missing.** The default locale key (`en` in the demo)
  is required for the site, projects, and project features.
- **The privacy scan fails.** Replace or remove the flagged value. Attribution
  text is only allowed in `README.md`, `NOTICE`, and `LICENSE`.
- **Port 3000 is busy.** Stop the other process or start Next.js with a
  different port, then adjust the Playwright and Lighthouse URLs.
