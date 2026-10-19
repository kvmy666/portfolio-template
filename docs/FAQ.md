# FAQ

## How do I add a project?

Create a new JSON file in `content/projects/`, for example
`content/projects/my-app.json`, and follow the schema in
[`CONTENT.md`](./CONTENT.md):

- Unique lowercase `slug`, plus a stable `order`.
- Localized `name`, `summary`, and `description` with the default locale key.
- `platform`, at least one `tech` entry, and at least one feature.
- `demo: false` for real work.
- Optional `repo`, `store`, `packageId`, `logo`, `metrics`, and `sources`.

No component changes are required. The home grid and
`/projects/<slug>` page are generated from the folder, and `/sitemap.xml`
includes every entry. Run `npm run build` or restart `npm run dev` to see it.
Delete a file to remove a project; keep at least zero — an empty folder renders
the localized empty state.

## How do I add a locale?

1. Add the locale to `content/site.json`:

   ```json
   {
     "defaultLocale": "en",
     "locales": [
       { "code": "en", "label": "English", "dir": "ltr", "htmlLang": "en" },
       { "code": "es", "label": "Español", "dir": "ltr", "htmlLang": "es" }
     ]
   }
   ```

2. Add the same key to every localized site value (`role`, `pitch`,
   `about.intro`, and `contact.labels`).
3. Copy `content/locales/en.json` to `content/locales/es.json` and translate the
   UI strings. Keep the object shape unchanged.
4. For right-to-left languages set `dir` to `rtl`; the document direction and
   Arabic font stack follow the active locale.
5. Run `npm run build` and check the language control.

The wizard can create a second locale placeholder:

```bash
npm run setup -- --yes --projects=3 --langs=en,es
```

It copies English and adds a `_todo` marker. It supports English plus one
additional locale. Do not translate product names, framework names, or brand
names.

## How do I change colors?

Edit the design tokens in `src/app/globals.css`:

- `:root, [data-theme="dark"]` for the dark palette.
- `[data-theme="light"]` for the light palette.
- `@theme inline` maps those CSS variables to Tailwind utilities.

The main tokens are `--background`, `--foreground`, `--card`, `--line`,
`--muted`, `--accent`, `--accent-strong`, `--primary-text`, and `--danger`.
Change them in both themes so contrast remains valid, then rerun
`npm run test:a11y` and `npm run lighthouse`.

## How do I add laptop frames?

Render a frame sequence, put the files in `public/` (for example
`public/frames/`), and list them in order:

```json
{
  "hero": {
    "photo": null,
    "laptopFrames": ["/frames/frame-001.webp", "/frames/frame-002.webp"]
  }
}
```

Use 60–90 WebP frames and keep the total under about 2.5 MB. Paths must start
with `/`. The component preloads the frames and draws them into a fixed-aspect
canvas, so layout does not shift. On desktop the section is pinned and scrubbed;
on mobile it plays once when it enters the viewport; with reduced motion it shows
the static open state. Set the value to `null` or `[]` to use the CSS demo
laptop.

## How do I disable a feature?

Set the relevant flag to `false` in `content/site.json`:

```json
{
  "features": {
    "cv": false,
    "contact": false,
    "metrics": false,
    "splash3d": false,
    "laptop": false
  }
}
```

The CV section, contact section, metrics panel, 3D hero, and laptop visual are
removed, along with their dock links where applicable. The page remains usable
with every flag disabled. If contact is disabled, `/api/contact` still exists but
nothing in the UI calls it; you can also remove the route when self-hosting.

## How do I deploy it?

The contact form needs a request-time server, so deploy the Next.js server
output rather than a static export. The documented target is OpenNext on
Cloudflare Workers. At minimum:

1. Set `url` in `content/site.json` to the exact production origin.
2. Run `npm ci && npm run build`.
3. Set `RESEND_API_KEY`, `CONTACT_FROM`, and `CONTACT_TO` as host secrets.
4. Configure a shared rate-limit store for production.
5. Deploy and verify `/`, a project route, `/sitemap.xml`, and the contact form.

See [`DEPLOY.md`](./DEPLOY.md) and
[`adr/ADR-001-deploy.md`](./adr/ADR-001-deploy.md) for the full matrix,
including the static-export caveat.

## Why are metrics not showing or not updating?

Check, in order:

1. `features.metrics` is `true` in `content/site.json`.
2. The project's `sources.github` and/or `sources.mirror` contain full
   `owner/repo` slugs. A missing source means no live value for it.
3. The repository has releases with downloadable assets. Downloads come from
   `assets[].download_count`; stars come from the GitHub repository endpoint.
4. The browser can reach `api.github.com`. Failed or malformed requests are
   silent and keep the static fallback.
5. The one-hour `sessionStorage` cache. Clear `metrics:<slug>` entries or the
   whole site storage, then reload.
6. The API rate limit. Unauthenticated GitHub requests are limited per IP; wait
   and retry.

Static `metrics` values render immediately and are replaced only after live
values arrive. If the live request fails, the fallback remains by design.

## How do I change the contact provider?

The shipped route in `src/app/api/contact/route.ts` sends through Resend when
`RESEND_API_KEY` is set. Without a key it returns a dev `202` outside production
and `503` in production. To use another provider:

1. Keep the shared Zod schema and origin, honeypot, and rate-limit checks.
2. Replace only the provider call and keep the same status codes, or document a
   new status matrix.
3. Add the provider's environment variables to `.env.example` and
   `docs/DEPLOY.md`.
4. Never log message bodies or email addresses.
5. Update tests that assert the contact API behavior.

`CONTACT_DEV_MODE=1` is for tests only. Never set it in production.

## Why does the build fail after I edit content?

The schemas in `src/content/schema.ts` are strict. The error names the exact
path, for example a missing default-locale key, a duplicate slug, an unknown
locale, or a path that does not start with `/`. Fix the data instead of
loosening the schema. Run `npm test` for schema examples and
`node scripts/check-privacy.mjs` after editing content.

## Where do screenshots and docs live?

README screenshots are in `docs/screenshots/`. They are documentation assets,
not part of the deployed site; do not put them in `public/` unless the app
actually serves them.
