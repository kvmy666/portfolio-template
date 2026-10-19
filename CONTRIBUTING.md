# Contributing

Thanks for improving the portfolio template. Keep changes reusable: this
repository is a template, not anyone's personal site.

## Setup

Requirements: Node.js 22+, npm 10+, and Git.

```bash
git clone https://github.com/kvmy666/portfolio-template.git
cd portfolio-template
npm ci
npm run dev
```

Use the demo content for development. Do not add personal data, real employer
names, private URLs, or secrets to the repository.

## Branch and pull request workflow

1. Create a branch from `main`:

   ```bash
   git switch -c fix/short-description
   ```

   Use a descriptive prefix such as `feat/`, `fix/`, `docs/`, `test/`, or
   `chore/`.

2. Make a focused change and keep unrelated refactors out of the same pull
   request.
3. Run the relevant checks locally.
4. Open a pull request against `main` and fill in the template.
5. Keep the pull request mergeable. Squash merges are the default.

## Tests and quality gates

Before opening a pull request, run:

```bash
npm run verify:fast
npm run test:e2e -- --project=chromium-desktop
npm run test:a11y -- --project=chromium-desktop
```

For changes that affect bundles, rendering, or metadata, also run:

```bash
npm run build
npm run size
npm run lighthouse
```

Guidelines:

- Add or update unit tests for schema, metrics, i18n, or validation changes.
- Add or update Playwright coverage for user-visible behavior.
- Keep accessibility coverage green and do not weaken axe rules.
- Do not raise route, CSS, or Lighthouse budgets to hide a regression.
- Update docs when behavior, configuration, or environment variables change.
- Run `node scripts/check-privacy.mjs` if you touch `content/`, `src/`,
  `public/`, or `docs/`.

## Commit style

Use Conventional Commits with a concise subject:

```
feat(projects): add lens deep links
fix(contact): return 403 for disallowed origins
docs(setup): document the zero-project path
test(a11y): cover reduced motion on mobile
```

Keep each commit coherent. Explain the why in the body when the change is not
obvious. Do not include generated build output, `.env` files, or secrets.

## Scope

Good contributions include bug fixes, accessibility improvements, performance
work that respects the budgets, documentation, tests, and reusable features that
work for any user of the template.

Out of scope:

- Personal branding, personal data, or content specific to one portfolio.
- Third-party assets without a compatible license and a `NOTICE` update.
- New services or dependencies without a clear template-wide benefit.
- Changes that require a specific hosting provider to run the demo.
- Rewrites that bypass the content/schema split or hardcode copy in components.

## License

By contributing, you agree that your code contributions are licensed under the
MIT License. Demo assets remain under CC0 as described in `NOTICE`.
