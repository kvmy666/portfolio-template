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
| `metrics` | Shows live metrics when project metrics exist |
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
      "title": { "en": "Fast by default" },
      "description": { "en": "Why this matters." },
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

Field notes:

- `platform` is `web`, `android`, `ios`, or `cross-platform`.
- `features[].tags` accepts `UX`, `Security`, `Testing`, and `Performance`.
- `metrics` is either `null` or `{ "github": number | null, "mirror": number | null }`.
- `repo`, `store`, and `packageId` are optional and nullable.
- `logo` is a public path that starts with `/`.
- `demo: true` marks a generated placeholder. The setup wizard manages these.
  Real projects should use `demo: false`.

An empty `content/projects/` folder is valid. The home page renders the
localized empty state instead of a grid.

## UI strings

`content/locales/en.json` and `content/locales/ar.json` hold the interface
dictionary. Every dictionary contains:

- `nav.home`, `nav.about`, `nav.projects`, `nav.contact`
- `hero.aboutMe`
- `projects.empty`
- `contact.submit`
- `footer.rights`
- optional `_meta` and `_todo` notes

When the wizard adds a language, it copies the English dictionary and adds a
`_todo` marker. Translate the values before shipping that locale.

## Demo assets

`public/demo/logo-*.svg` and `src/app/icon.svg` are generated artwork released
under CC0. Replace them with your own assets, or keep the generated shapes.
Update the `logo` path in each project if you change the filenames.

## Privacy

Run the privacy scan before committing:

```bash
node scripts/check-privacy.mjs
```

The scan covers `content/`, `src/`, `site.config.ts`, `public/`, `.env*`,
`docs/`, and `README.md`.
