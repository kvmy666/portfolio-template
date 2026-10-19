<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## FATAL RULE — testing ownership

**NEVER LET AGENTS TEST. AUTOMATE TESTS ONLY.**

Automated tests and CI are the only acceptance evidence. Agents may write or fix tests, but must not substitute manual/exploratory testing, UI inspection, or agent sign-off for automated evidence. Human-only checks belong to the owner or adopter.

# Agent onboarding

This repository is a reusable portfolio template, not a personal site. Your job
is to turn the fictional demo into the user's portfolio without leaking their
data into the template, hardcoding copy, or breaking the quality gates.

## 1. Interview the user before editing

Ask only what you need, then write the answers down before changing files.

**Project count and shape**

- How many projects do you have (0–50)?
- Which platforms are they on: web, Android, iOS, or cross-platform?
- For each project: name, slug, summary, longer description, tech stack, repo or
  store URL, and 1–6 features with tags (`UX`, `Security`, `Testing`,
  `Performance`).

**Language**

- English only, or English plus another language?
- If additional: which locale code (`ar`, `es`, `fr`, `de`, `he`, `fa`, `ur`,
  or another BCP 47 code), its label, and its direction (`ltr` / `rtl`)?
- Do not translate product names, technology names, or brand names.

**Identity**

- Display name, role, pitch, public email, canonical site URL.
- GitHub, LinkedIn, and website links (or none).
- CV PDF path, hero photo path, and laptop frame sequence (all optional).
- Contact recipient and the labels the contact form should offer.

**Optional features**

- CV, contact form, live metrics, 3D hero, and laptop animation. The canonical
  flags are `cv`, `contact`, `metrics`, `splash3d`, and `laptop` in
  `content/site.json`.

If the user has not supplied a value, use the existing demo placeholder or
`null`; never invent personal data, metrics, employer names, or URLs.

## 2. Configuration path

Run the wizard for the mechanical work:

```bash
npm run setup -- --yes --projects=<0-50> --langs=en[,<code>]
```

Useful flags: `--name`, `--email`, `--url`, `--cv`, `--photo`, `--force`,
`--help`. The wizard preserves existing site values, does not overwrite a
project with `"demo": false`, and can create zero projects. Then edit
`content/site.json`, `content/projects/*.json`, and `content/locales/*.json` by
hand for the real copy.

## 3. Commands

| Command | When to use it |
| --- | --- |
| `npm ci` | Install exactly the lockfile |
| `npm run setup` | Interactive or flag-driven configuration |
| `npm run dev` | Local development |
| `npm run build` | Production build plus route budget check |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run verify:fast` | Typecheck, lint, unit tests, knip, privacy scan |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test:a11y` | Playwright + axe accessibility tests |
| `npm run test:visual` | Visual regression tests |
| `npm run test:fps` | FPS harness |
| `npm run size` | First-load and CSS budgets |
| `npm run lighthouse` | Lighthouse CI budgets |

`npm run test:e2e`, `test:a11y`, `test:visual`, and `test:fps` start the app
through Playwright's `webServer` command, which rebuilds if needed. Use
`--project=chromium-desktop` to narrow a run; mobile coverage uses the
`webkit-mobile` project.

## 4. Architecture map

```
content/                  Data only: identity, projects, locales
  site.json               SiteConfigSchema input
  projects/*.json         One project per file, ProjectSchema
  locales/*.json          UI dictionaries, LocaleStringsSchema
src/app/                  Next.js App Router routes and metadata
  page.tsx                Home page composition
  projects/[slug]/page.tsx Project detail route
  api/contact/route.ts    Contact form backend
  layout.tsx, sitemap.ts, robots.ts, opengraph-image.tsx
src/components/           Rendering engine and client interactions
  PortfolioShell.tsx      Home sections and optional-feature composition
  AppFrame.tsx            Theme, locale, dock, skip link
  Dock.tsx                Desktop dock and mobile bottom bar
  LocaleProvider.tsx      Live locale/direction state
  HeroSplash.tsx          Optional 3D hero
  LaptopScrub.tsx         Optional scroll-scrub laptop
  ProjectView.tsx         Project detail, lenses, feature cards
  ProjectMetrics.tsx      Fallback metrics -> live metrics
  CVModal.tsx             CV dialog
  ContactForm.tsx         Contact form client
src/content/              Zod schemas and server-side content loaders
src/i18n/                 Locale lookup helpers
src/lib/                  Metrics, contact validation, build-time helpers
scripts/                  Setup wizard, budgets, privacy scan
tests/                    Playwright suites and shared fixtures
docs/                     Setup, content, architecture, deployment, FAQ
```

Rules of thumb:

- `content/` is data. Components are the engine.
- Pages and server loaders validate data at build time; invalid JSON must fail
  with a useful path.
- The contact API is the only request-time server boundary.
- Optional UI is dynamically imported and gated by feature flags.
- Locale selection is client-side (no locale route prefix) and updates `lang`
  and `dir` without navigation.

## 5. Do not

- **Do not commit personal data.** No real names, emails, phone numbers,
  addresses, private URLs, tokens, or employer data in the template, tests,
  docs, screenshots, or demo content.
- **Do not hardcode user copy in components.** Put identity and project copy in
  `content/`, and shared UI labels in `content/locales/*.json`.
- **Do not commit secrets.** Use `.env.local` locally and host secrets in
  production. Never put keys in `content/site.json`, docs, or tests.
- **Do not translate technical names.** Keep framework, product, and brand names
  as written (`Next.js`, `TypeScript`, `GitHub`, and so on).
- **Do not remove validation or fallbacks** to make a build pass. Fix the data or
  the code.
- **Do not change route budgets, Lighthouse thresholds, or accessibility rules**
  to hide a regression.
- **Do not add a second contact provider** without documenting its env vars and
  updating the API status matrix.
- **Do not replace generated demo assets with third-party media** unless the
  license is compatible and recorded in `NOTICE`.

## 6. Verification checklist

Run these before declaring the task complete:

```bash
npm run verify:fast
npm run build
npm run size
node scripts/check-privacy.mjs
npm run test:e2e -- --project=chromium-desktop
npm run test:a11y -- --project=chromium-desktop
npm run lighthouse
```

Also confirm:

- [ ] `content/site.json` validates and `npm run build` passes the route budgets.
- [ ] Projects render in order, project detail pages resolve, and the lens filters
  still work.
- [ ] Every configured locale has a dictionary; RTL layouts still read correctly.
- [ ] Disabled feature flags remove their sections and their dock links.
- [ ] Screenshots and docs contain no personal data.
- [ ] No new secrets or environment values were committed.
- [ ] `NOTICE` and `LICENSE` are accurate if assets or dependencies changed.
