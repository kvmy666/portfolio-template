## Summary

<!-- What changed and why? Keep it focused. -->

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Tests
- [ ] Performance or accessibility
- [ ] CI, tooling, or dependencies
- [ ] Breaking change (describe the migration below)

## Testing

<!-- List the commands you ran and any manual checks. -->

```bash
npm run verify:fast
npm run test:e2e -- --project=chromium-desktop
npm run test:a11y -- --project=chromium-desktop
```

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run size`
- [ ] `node scripts/check-privacy.mjs`
- [ ] Playwright E2E
- [ ] Playwright accessibility
- [ ] Lighthouse (if rendering, bundles, or metadata changed)

## Checklist

- [ ] The change is reusable for any portfolio and contains no personal data.
- [ ] Copy lives in `content/` or `content/locales/`, not in components.
- [ ] No secrets, tokens, or `.env` values are committed.
- [ ] Tech and brand names are not translated.
- [ ] Feature flags and reduced-motion behavior still work.
- [ ] Docs, screenshots, `NOTICE`, or `LICENSE` were updated if needed.
- [ ] Budgets, Lighthouse thresholds, and accessibility rules were not weakened.

## Screenshots

<!-- For visual changes, include before/after images. Remove this section otherwise. -->
