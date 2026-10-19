# Architecture

This template has one hard boundary: **content is data, components are the
engine**. A user can replace every piece of identity and project copy without
editing React.

## Request and render flow

```
content/site.json ──► site.config.ts ──► SiteConfigSchema
                                         │
content/projects/*.json ────────────────►├─► src/app/page.tsx ──► PortfolioShell
                                         │                         │
content/locales/*.json ─────────────────►└─► src/app/projects/[slug]/page.tsx
                                                                   │
                                                          ProjectView
```

- `site.config.ts` validates `content/site.json` at module load. Invalid data
  fails the build with the schema path.
- `src/content/projects.server.ts` reads and validates every project, sorts by
  `order` then slug, and exposes `getAllProjects` / `getProject`.
- `src/content/locales.server.ts` loads and validates each dictionary. Missing
  dictionaries fall back to the default locale file.
- The home route passes validated data into `PortfolioShell`. The project route
  uses `generateStaticParams` and `dynamicParams = false`, so unknown slugs are
  404s.
- Server components compose metadata and content. Client components own theme,
  locale, animation, modal, form, and metrics behavior.

## Content and engine split

| Path | Responsibility | Safe to edit for content? |
| --- | --- | --- |
| `content/site.json` | Identity, links, locales, features, CV, hero, contact | Yes |
| `content/projects/*.json` | One project per file | Yes |
| `content/locales/*.json` | Shared UI labels | Yes |
| `public/` | Demo assets, CV, optional frames | Yes, replace assets |
| `src/app/` | Routes, metadata, API, global styles | Only for engine changes |
| `src/components/` | Rendering and interaction | Only for engine changes |
| `src/content/schema.ts` | Zod schemas and inferred types | Only with a schema change |
| `src/lib/` | Metrics, contact helpers, build-time values | Only for logic changes |
| `scripts/` | Setup wizard, budgets, privacy scan | Infrastructure |

Components must not contain personal names, project descriptions, or shared UI
copy. Localized site values come from `site.json`; shared labels come from the
locale dictionaries; project copy comes from project files.

## Configuration schema

`src/content/schema.ts` is the contract. It uses `z.strictObject`, so unknown
keys fail rather than being silently ignored.

- `SiteConfigSchema` requires `name`, localized `role` and `pitch`, `email`,
  `url`, `links`, `defaultLocale`, `locales`, `features`, `contact`, `cv`,
  `hero`, and `about`.
- The default locale key is required in every localized site value.
- Locale keys not declared in `locales` are rejected.
- `ProjectSchema` requires a unique lowercase slug, localized copy, a platform,
  tech, at least one feature, metrics/sources, deep-dive, and a logo path.
- Feature tags are unique values from `UX`, `Security`, `Testing`, and
  `Performance`.
- Localized strings are partial records: non-default locales may be missing and
  fall back at render time.
- Frames, media, CV, and logo paths must start with `/`.

The setup wizard writes the same shape and validates it before writing. It
preserves existing values, never overwrites a project with `"demo": false`, and
removes demo projects when the requested count is lower.

## Internationalization

- `content/site.json` declares locale metadata: `code`, `label`, `dir`, and
  `htmlLang`.
- `src/i18n/index.ts` provides `localized()` lookups with default-locale
  fallback and `defaultLocale`.
- `LocaleProvider` holds the active locale in React state, updates
  `document.documentElement.lang` and `dir`, and persists the choice under the
  `locale` localStorage key. Switching does not navigate.
- The root layout renders server-side defaults from `siteConfig.defaultLocale`.
  The client provider can then switch direction without a reload.
- `html[lang="ar"]` (and the Arabic font variables) selects the Arabic font
  stack. Other RTL locales still get `dir="rtl"`; adding a script-specific font
  stack is an engine change.
- Locale-specific routes do not exist. There is one URL per page, and the
  selected locale is a client preference.
- Shared UI strings live in `content/locales/<code>.json`; site-specific copy
  lives in `site.json` and project files. Tech and brand names stay untranslated.

## Feature flags and optional UI

`features` contains five booleans: `cv`, `contact`, `metrics`, `splash3d`, and
`laptop`.

- `PortfolioShell` conditionally renders the CV section, contact section, and
  metrics. Dock entries follow the same flags.
- `HeroSplash`, `LaptopScrub`, `CVModal`, and `ContactForm` are dynamically
  imported. Offscreen sections also use an intersection observer, so optional
  code is not loaded upfront.
- The laptop defaults to a CSS 3D visual. Supplying `hero.laptopFrames` switches
  to a canvas frame sequence.
- Animations respect `prefers-reduced-motion`. Do not remove the reduced-motion
  branches when changing GSAP or Three.js code.
- The page must remain usable with every flag false.

## Metrics

`ProjectMetrics` is a client component:

1. Render the static `project.metrics` fallback (or zero/unknown state).
2. Read the session cache keyed by slug and both source slugs, with a one-hour
   TTL.
3. Fetch `https://api.github.com/repos/<owner>/<repo>` for stars and
   `.../releases?per_page=100` for downloads.
4. Sum `assets[].download_count` across both GitHub and mirror releases.
5. Write the cache and replace the fallback. Failures are silent.

The GitHub API is called directly from the browser without a token. This keeps
the template static-friendly but subjects it to per-IP rate limits. Downloads
and stars intentionally omit Google Play install counts and review status. See
`src/lib/metrics.ts` for parsing and cache helpers.

## Contact API

`src/app/api/contact/route.ts` is the only request-time endpoint:

1. Reject a present `Origin` that does not match `siteConfig.url` (localhost
   origins are allowed for development) with `403`.
2. Parse JSON; malformed bodies return `400`.
3. Return `202` without sending when the hidden `company` honeypot is filled.
4. Validate with `contactRequestSchema`; invalid fields return `400` with field
   paths.
5. Apply the in-memory fixed-window limit: 5 requests per 10 minutes per IP,
   returning `429` plus `Retry-After`.
6. Send through Resend when `RESEND_API_KEY` is set. Without a key, return a dev
   `202` outside production and `503` in production.

The handler never logs message bodies or email addresses and does not put form
data in URLs. `CONTACT_DEV_MODE=1` exists for end-to-end tests and must never be
set in production. The in-memory limiter is per process; production needs a
shared store (see `docs/adr/ADR-003-rate-limit.md`).

## SEO pipeline

- `src/app/layout.tsx` builds `metadataBase`, canonical, Open Graph, Twitter, and
  `Person` JSON-LD from validated site data.
- `src/app/sitemap.ts` enumerates the home page and every project from the
  content folder.
- `src/app/robots.ts` points at the generated sitemap.
- `src/app/opengraph-image.tsx` renders a static social card at build time.
- Project pages override metadata from the project's default-locale name and
  summary.

All absolute URLs derive from `content/site.json`'s `url`. A wrong `url` changes
canonicals, sitemap, robots, and the contact origin check together.

## Test and budget pipeline

| Layer | Tool | What it protects |
| --- | --- | --- |
| Unit | Vitest | Schema validation, i18n lookup, metrics parsing |
| E2E | Playwright (`chromium-desktop`, `webkit-mobile`) | Layout, dock, theme, locale, projects, metrics, CV, contact |
| Accessibility | Playwright + axe (`@a11y`) | Serious/critical violations on main routes |
| Visual | Playwright (`@visual`) | Stable layout and reduced-motion states |
| FPS | Playwright (`@fps`) | Animation frame budget |
| First load | `scripts/first-load-budget.mjs` | 180 kB gzip per route after `npm run build` |
| size-limit | `npm run size` | Same first-load assets plus 30 kB CSS |
| Lighthouse | `npm run lighthouse` | Performance/accessibility/best-practices/SEO ≥ 0.9, LCP ≤ 2 s, CLS ≤ 0.05, TBT ≤ 200 ms, FCP ≤ 1.5 s |
| Privacy | `node scripts/check-privacy.mjs` | Personal data and token patterns in content, source, public, docs |
| Unused code | `npm run knip` | Dead files and exports |

Playwright starts `npm run build && npm run start` through its `webServer`
config. CI runs the same commands from `.github/workflows/`: verify, E2E,
template clone, template smoke (0/3/6 projects and en/en,ar/en,es), and a nightly
cross-browser job. `verify:fast` is the local loop.

## Deployment

`next build` produces a server build. The App Router pages and the contact Route
Handler must run together, so the default deployment is not a static export.

The documented target is **OpenNext on Cloudflare Workers**:

- Build the OpenNext output and deploy the Worker plus static assets.
- Set runtime secrets for Resend and the sender/recipient addresses.
- Bind a KV namespace for a shared rate limiter; the in-memory limiter is only a
  development guard.
- Set `content/site.json` `url` to the exact production origin before building.

A static export is possible only with a separate contact endpoint (for example a
Pages Function) or with `features.contact` disabled. See `docs/DEPLOY.md` and the
ADRs for status codes and tradeoffs.
