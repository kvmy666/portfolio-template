# Portfolio Template

An open-source, config-driven portfolio template for developers. It ships a
single-page Next.js 16 App Router site with React 19, TypeScript, Tailwind CSS
v4, localized content, validated JSON authoring, and a setup wizard. The
included persona and projects are a fictional demo; replace them with your own
content and assets.

## Features

- Single-page layout with a sticky header and a mobile dock
- Projects from 0 to N, read from `content/projects/*.json`
- English-only or any locale, with right-to-left support
- 3D hero card and a scroll-driven laptop scrub visual
- Optional CV action, contact section, and live metrics
- Feature flags for CV, contact, metrics, 3D splash, and laptop visuals
- Zod-validated site config, projects, and locale dictionaries
- Interactive setup wizard with non-interactive flags
- Generated demo SVG assets released under CC0
- Privacy scan, unit tests, Playwright smoke tests, Lighthouse config, and CI

## Quick start

1. Select **Use this template** on GitHub, or clone your copy:

   ```bash
   git clone <your-repository-url> my-portfolio
   cd my-portfolio
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Run the setup wizard and answer the project, language, identity, and feature
   questions:

   ```bash
   npm run setup
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

For a non-interactive setup, run:

```bash
npm run setup -- --yes --projects=3 --langs=en,ar
```

See `docs/SETUP.md` for every flag and for the verification commands.

## 🤖 Copy this message for your agent

```
Set up this portfolio template for me. First ask me:
1) How many projects do I have (0–50)?
2) Do I want English only, or English + another language (Arabic or any other)?
3) My name, role, links (GitHub/LinkedIn/website), and contact email.
4) Do I want a CV, contact form, live metrics, 3D hero, and laptop animation?

Then run `npm run setup`, fill in my content under `content/`, replace the demo assets, and run `npm run build` and `npm test` to verify. Do not invent personal data.
```

## Configuration reference

`content/site.json` is the source of truth for the site. It is validated by
`SiteConfigSchema` in `src/content/schema.ts`, parsed by `site.config.ts`, and
the build fails with a clear path-specific error if a value is invalid.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Your display name |
| `role` | localized string | Required in the default locale |
| `pitch` | localized string | Required in the default locale |
| `email` | email | Public contact address |
| `links` | object | `github`, `linkedin`, and `website` are URL or null |
| `defaultLocale` | locale code | Must appear in `locales` |
| `locales` | array | Each locale has `code`, `label`, `dir`, `htmlLang` |
| `features` | object | Boolean feature flags |
| `contact.recipient` | email | Contact recipient |
| `contact.labels` | localized string array | Contact reasons |

Localized values are objects keyed by locale code. The default locale key is
required. Unknown locales in site-level localized values are rejected, and
unknown top-level keys fail validation.

### Feature flags

Set any flag to `false` to remove that part of the page:

| Flag | Controls |
| --- | --- |
| `cv` | CV request action |
| `contact` | Contact section and dock link |
| `metrics` | Metrics panel, when project metrics exist |
| `splash3d` | 3D hero card |
| `laptop` | Scroll-driven laptop visual |

### Locales

The demo ships English and Arabic. Locale metadata drives `lang` and `dir` on
the document. Add a locale to `content/site.json`, create a matching
`content/locales/<code>.json`, and set `dir` to `rtl` when needed. The setup
wizard creates new dictionary files by copying English and adding a `_todo`
marker.

## Content authoring

Each file in `content/projects/` must validate against `ProjectSchema`:

```json
{
  "slug": "demo-project-one",
  "demo": true,
  "name": { "en": "Demo Project One" },
  "summary": { "en": "A short card summary." },
  "description": { "en": "A longer project description." },
  "order": 1,
  "platform": "web",
  "tech": ["TypeScript", "Next.js"],
  "features": [
    {
      "title": { "en": "Fast by default" },
      "description": { "en": "Why this feature matters." },
      "tags": ["Performance", "UX"]
    }
  ],
  "metrics": null,
  "repo": null,
  "store": null,
  "packageId": null,
  "logo": "/demo/logo-1.svg"
}
```

Rules and conventions:

- Slugs are unique, lowercase, and hyphenated.
- Projects sort by `order`, then by slug.
- Every localized string needs the default locale key.
- `platform` is `web`, `android`, `ios`, or `cross-platform`.
- `features[].tags` accepts `UX`, `Security`, `Testing`, and `Performance`.
- `metrics` is `null` or `{ "github": number | null, "mirror": number | null }`.
- Set `demo: false` for real work. The wizard never overwrites real projects
  unless you pass `--force`.
- An empty projects folder is valid and renders the localized empty state.

The UI dictionary in `content/locales/*.json` holds navigation, hero, empty
state, contact, and footer strings. See `docs/CONTENT.md` for the complete
reference and `docs/CUSTOMIZE.md` for theming and feature changes.

## Deployment

Deployment is not implemented in Phase 0. The proposed target is a static
export on Cloudflare Pages with Pages Functions for contact delivery. Read
`docs/DEPLOY.md`, and treat `docs/adr/ADR-001-deploy.md` as **Proposed** until
the static-export decision is accepted.

## License

Code is licensed under the MIT License. See `LICENSE`.

Demo assets are original generated SVG artwork dedicated to the public domain
under CC0. No third-party fonts, logos, screenshots, or media are bundled. See
`NOTICE` for asset details.

Copyright (c) 2026 Abdulkarim.
