# Content authoring

All content is data. No personal values belong in React components.

## Site configuration

`content/site.json` is validated by `SiteConfigSchema` in
`src/content/schema.ts`. `site.config.ts` parses it at build time and throws a
clear error if it is invalid.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Display name |
| `role` | localized string | The default locale key is required |
| `pitch` | localized string | Short introduction |
| `email` | email | Contact address |
| `links.github` | URL or null | Optional |
| `links.linkedin` | URL or null | Optional |
| `links.website` | URL or null | Optional |
| `defaultLocale` | locale code | Must appear in `locales` |
| `locales` | locale array | Unique `code`, `label`, `dir`, `htmlLang` |
| `features` | object | Five boolean feature flags |
| `hero.photo` | site path or null | Hero portrait; null keeps the demo avatar |
| `hero.laptopFrames` | site path array or null | Frame sequence for the About laptop scrub |
| `about.intro` | localized string | About copy and the laptop screen intro |
| `contact.recipient` | email | Contact form recipient |
| `contact.labels` | localized string array | Reasons for contact |

Localized values are objects keyed by locale code:

```json
{
  "en": "Software Engineer",
  "ar": "مهندس برمجيات"
}
```

The default locale key is required. If a locale is missing, the UI falls back
to the default locale.

### About intro and laptop frames

`about.intro` is used for the About section copy and is repeated inside the CSS
laptop screen. It is not part of the UI dictionary, so each site owns its own
wording:

```json
{
  "about": {
    "intro": {
      "en": "I turn ideas into fast, accessible products...",
      "ar": "أحوّل الأفكار إلى منتجات سريعة وسهلة الوصول..."
    }
  }
}
```

`hero.laptopFrames` is either `null` or an ordered array of public paths:

```json
{
  "hero": {
    "photo": null,
    "laptopFrames": ["/frames/frame-001.webp", "/frames/frame-002.webp"]
  }
}
```

Recommended: 60–90 WebP frames, no more than 2.5 MB total. Every path must
start with `/` and point at a file under `public/`. The frames are preloaded and
drawn into a fixed 16:10 canvas container, so the page does not shift. With
`null` (the template default) the About section uses a CSS 3D laptop instead.
Desktop pins the section and scrubs with GSAP; mobile auto-plays the opening
once; reduced motion shows the open state immediately.

## Feature flags

| Flag | Effect |
| --- | --- |
| `cv` | Shows the CV request action |
| `contact` | Shows the contact section and dock link |
| `metrics` | Shows live metrics when a project has sources or fallback values |
| `splash3d` | Shows the 3D hero card |
| `laptop` | Shows the scroll-driven laptop visual |

Flags are independent. Turning all of them off leaves a text-first page.

## Projects

Each file in `content/projects/` is validated by `ProjectSchema`. Files are
sorted by `order`, then by slug. Duplicate slugs are rejected.

```json
{
  "slug": "demo-project-one",
  "demo": true,
  "name": { "en": "Demo Project One" },
  "summary": { "en": "A short card summary." },
  "description": { "en": "A longer description." },
  "order": 1,
  "platform": "web",
  "tech": ["TypeScript", "Next.js"],
  "features": [
    {
      "title": { "en": "Fast first paint" },
      "oneLiner": { "en": "A server-rendered shell reaches the screen quickly." },
      "description": { "en": "Why this matters." },
      "tags": ["Performance", "UX"],
      "media": {
        "src": "/demo/feature-1.svg",
        "alt": { "en": "Abstract dashboard with a fast-loading page skeleton." },
        "type": "image"
      },
      "evidence": { "en": "Measured with a Lighthouse budget on every build." }
    }
  ],
  "metrics": null,
  "sources": { "github": null, "mirror": null },
  "deepDive": {
    "architecture": { "en": "A server-rendered app with validated content." },
    "code": {
      "language": "TypeScript",
      "snippet": "export const value = 1;"
    }
  },
  "repo": null,
  "store": null,
  "packageId": null,
  "logo": "/demo/logo-1.svg"
}
```

Field notes:

- `platform` is `web`, `android`, `ios`, or `cross-platform`.
- `features[]` each need `title`, `oneLiner`, `description`, and a non-empty,
  unique `tags` list. Tags accept `UX`, `Security`, `Testing`, and
  `Performance`.
- `features[].media` is either `null` or
  `{ "src": "/public/path", "alt": localized string, "type": "image" | "video" }`.
- `features[].evidence` is `null` or a localized string describing what was
  checked and how.
- `metrics` is either `null` or a static fallback:
  `{ "github": number | null, "mirror": number | null }`. Here `github` is the
  fallback star count and `mirror` is the fallback download count. Live values
  replace them after the page mounts; when a request fails the fallback stays
  visible.
- `sources` holds optional repository identifiers as full `owner/repo` slugs:
  `{ "github": "owner/repo" | null, "mirror": "owner/repo" | null }`. `github`
  supplies stars and its release downloads. `mirror` supplies additional release
  downloads. Both are combined for the downloads metric.

### Live metrics

When the `metrics` feature flag is on and a project has at least one source,
the card and detail header show live downloads and GitHub stars. Downloads sum
`assets[].download_count` across releases from both `sources.github` and
`sources.mirror`; stars come from the GitHub repository. A successful response
is cached in `sessionStorage` under a `metrics:<slug>` key that also includes
both source slugs, for one hour. Changing either source therefore invalidates
the cached value. Network
failures, rate limits, and malformed responses are silent: the static `metrics`
fallback remains on screen. The template intentionally does not show Google
Play install counts or review status.
- `deepDive.architecture` is `null` or a localized string.
- `deepDive.code` is `null` or `{ "language": string, "snippet": string }`.
  When both deep-dive fields are null the section is omitted.
- `repo`, `store`, and `packageId` are optional and nullable. A `packageId`
  without a `store` URL links to Google Play.
- `logo` is a public path that starts with `/`.
- `demo: true` marks a generated placeholder. The setup wizard manages these.
  Real projects should use `demo: false`.

### Project detail page

Every project slug becomes a static `/projects/<slug>` page. The page keeps the
locked block order: header, overview, tech stack, features, and deep-dive.
Feature lenses (`All`, `UX`, `Security`, `Testing`, `Performance`) filter the
feature cards in place. Counts come from the current project. Opening
`/projects/<slug>#security` selects the Security lens, and clicking a lens
updates the URL hash with `history.replaceState` so the page does not navigate.

### Feature media rules

- Use one image or short video per feature; `media` may be `null`.
- Keep videos at six seconds or shorter, muted, looping, and `playsInline`.
  Prefer WebM; animated GIF is acceptable as a fallback.
- Keep images at or below 1.5 MB and videos at or below 2.5 MB.
- Media renders inside a fixed `16/10` box, so provide artwork at that aspect
  ratio to avoid cropping surprises. All media paths must start with `/`.
- Write `alt` for the meaning of the media, not just its appearance.

### Deep-dive

Use `deepDive` for architecture notes and a short, representative code sample.
The UI shows the `language` label above a `<pre><code>` block. Do not add
retrospectives, CTAs, publication status, or review status to project content;
the template intentionally omits those blocks.

An empty `content/projects/` folder is valid. The home page renders the
localized empty state instead of a grid, and no project routes are generated.

## UI strings

`content/locales/en.json` and `content/locales/ar.json` hold the interface
dictionary. Every dictionary contains:

- `nav.home`, `nav.about`, `nav.projects`, `nav.contact`
- `hero.aboutMe`
- `projects.empty`
- `projectDetail.*` (detail headings, lenses, and evidence labels)
- `contact.submit`
- `footer.rights`
- optional `_meta` and `_todo` notes

When the wizard adds a language, it copies the English dictionary and adds a
`_todo` marker. Translate the values before shipping that locale.

## Demo assets

`public/demo/logo-*.svg`, `public/demo/feature-*.svg`, and
`src/app/icon.svg` are generated artwork released under CC0. Replace them with
your own assets, or keep the generated shapes. Update the `logo` and `media.src`
paths in each project if you change the filenames.

## Privacy

Run the privacy scan before committing:

```bash
node scripts/check-privacy.mjs
```

The scan covers `content/`, `src/`, `site.config.ts`, `public/`, `.env*`,
`docs/`, and `README.md`.
