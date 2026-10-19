# Portfolio Template

An open-source, config-driven portfolio template for developers. It ships a
single-page Next.js 16 App Router site with React 19, TypeScript, Tailwind CSS
v4, localized content, validated JSON authoring, and a setup wizard. The
included persona and projects are a fictional demo; replace them with your own
content and assets.

## Features

- Single-page layout with a vertical desktop dock and a mobile bottom bar
- Floating theme and locale controls with no page reload
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
| `hero.photo` | site path or null | Hero portrait; null uses the demo avatar |
| `hero.laptopFrames` | site path array or null | Scroll-scrub frame sequence; null uses the CSS demo laptop |
| `about.intro` | localized string | About section copy and laptop-screen intro |
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
| `metrics` | Live downloads and GitHub stars, with static fallbacks |
| `splash3d` | 3D hero card |
| `laptop` | Scroll-driven laptop visual |

### Live metrics

With `metrics` enabled, project cards and detail headers show downloads and
GitHub stars. Downloads combine `assets[].download_count` from releases in both
`sources.github` and `sources.mirror`; stars come from the GitHub repository.
The static `metrics` values render immediately, then live values replace them
after mount. Successful responses are cached in `sessionStorage` under a
`metrics:<slug>` key that includes both source slugs for one hour. Failed or
malformed requests are silent and leave the fallback in place. Google Play
install counts and review status are intentionally not shown.

### Laptop visual and frames

The laptop visual lives in the About section. By default `hero.laptopFrames` is
`null`, so the template renders a CSS 3D demo laptop whose lid opens with the
scroll progress. Replace it with a frame sequence to use rendered artwork:

```json
{
  "hero": {
    "photo": null,
    "laptopFrames": [
      "/frames/frame-001.webp",
      "/frames/frame-002.webp",
      "/frames/frame-003.webp"
    ]
  }
}
```

Paths are public URLs and must start with `/`. Put the files in
`public/frames/` (or any public folder) and keep the order correct. Recommended:
60–90 frames, WebP, and no more than 2.5 MB total. The component preloads every
frame, draws the current frame into a fixed-aspect canvas with
`object-fit: contain` behavior, and therefore does not shift layout. The list
may also be `null` (or empty) to keep the CSS fallback.

On screens wider than 750px, the section is pinned with GSAP ScrollTrigger and
the visual eases toward the scroll target with exponential smoothing. On mobile
the visual is not pinned: it plays once for about 1.8 seconds when it enters the
viewport. With `prefers-reduced-motion: reduce`, the laptop is shown in its
static open state with no pin or loop.

### Locales

The demo ships English and Arabic. Locale metadata drives `lang` and `dir` on
the document. The floating theme and locale controls apply changes without a
full page reload and remember the choice in local storage. Add a locale to
`content/site.json`, create a matching
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
      "title": { "en": "Fast first paint" },
      "oneLiner": { "en": "A server-rendered shell reaches the screen quickly." },
      "description": { "en": "Why this feature matters." },
      "tags": ["Performance", "UX"],
      "media": {
        "src": "/demo/feature-1.svg",
        "alt": { "en": "Abstract dashboard with a fast-loading page skeleton." },
        "type": "image"
      },
      "evidence": { "en": "Measured with a performance budget on every build." }
    }
  ],
  "metrics": null,
  "sources": { "github": null, "mirror": null },
  "deepDive": {
    "architecture": { "en": "A server-rendered app with validated content." },
    "code": { "language": "TypeScript", "snippet": "export const value = 1;" }
  },
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
- Each feature needs `title`, `oneLiner`, `description`, and one or more unique
  tags from `UX`, `Security`, `Testing`, and `Performance`.
- `features[].media` is `null` or `{ "src": "/path", "alt": localized, "type": "image" | "video" }`.
  Keep videos muted, looping, `playsInline`, six seconds or shorter, and at most
  2.5 MB. Keep images at or below 1.5 MB. Prefer WebM over GIF.
- `features[].evidence` is `null` or a localized note about what was checked and
  how.
- `metrics` is `null` or a static fallback
  `{ "github": number | null, "mirror": number | null }`, where `github` is the
  fallback stars and `mirror` is the fallback downloads.
- `sources` holds optional full `owner/repo` slugs:
  `{ "github": "owner/repo" | null, "mirror": "owner/repo" | null }`. Stars come
  from `github`; downloads sum releases from both sources.
- `deepDive` holds optional architecture copy and a short code sample:
  `{ "architecture": localized | null, "code": { "language", "snippet" } | null }`.
- Set `demo: false` for real work. The wizard never overwrites real projects
  unless you pass `--force`.
- An empty projects folder is valid and renders the localized empty state.

Each project renders at `/projects/<slug>` in a fixed block order: header,
overview, tech stack, features (with lens filters), and deep-dive. Lens filters
include `All`, `UX`, `Security`, `Testing`, and `Performance`; a deep link such
as `/projects/<slug>#security` selects a lens without navigating. Project
content intentionally has no CTA, retrospective, or review/publication status
blocks.

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
under CC0. Fonts are fetched at build time from Google Fonts under the SIL Open
Font License. No third-party logos, screenshots, or media are bundled. See
`NOTICE` for asset details.

Copyright (c) 2026 Abdulkarim.
