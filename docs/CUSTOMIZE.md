# Customize

## Theme

The color tokens and font stacks live in `src/app/globals.css` under `:root`,
the dark-mode media query, and `@theme inline`. Change those variables to
change the palette across the page. No font files are bundled; the template
uses a system font stack.

## Feature flags

Edit `content/site.json`:

```json
{
  "features": {
    "cv": true,
    "contact": true,
    "metrics": true,
    "splash3d": true,
    "laptop": true
  }
}
```

The flags control the CV action, contact section, metrics panel, 3D hero card,
and laptop visual. The page remains usable with every flag disabled.

## Navigation and copy

Navigation labels and shared UI copy live in `content/locales/`. Update both
`en.json` and any additional locale files. Page-specific headings such as
"Selected work" are intentionally generic and can be edited in
`src/app/page.tsx`.

## Projects

Add or replace JSON files in `content/projects/`. Use a unique slug, a stable
`order`, and at least one feature. Set `demo: false` for real work. Remove the
demo files when you no longer need them. The setup wizard can create zero demo
projects:

```bash
npm run setup -- --yes --projects=0 --langs=en
```

## Locales and right-to-left layouts

Add a locale to `content/site.json`, create the matching dictionary in
`content/locales/`, and set `dir` to `rtl` for right-to-left languages. The
layout reads `htmlLang` and `dir` from the default locale in
`src/app/layout.tsx`. Locale-specific routing is not part of Phase 0.

## Demo assets

Replace the generated SVGs in `public/demo/` and update each project's `logo`
path. The application icon is `src/app/icon.svg`. Do not add third-party logos
or media unless you have the rights to redistribute them, and update `NOTICE`
when required.

## Validation

Schemas live in `src/content/schema.ts`. If you add a required field, update:

1. The schema.
2. `content/site.json` and project files.
3. The setup wizard in `scripts/setup.mjs` if the field is part of setup.
4. Tests in `src/content/schema.test.ts`.
