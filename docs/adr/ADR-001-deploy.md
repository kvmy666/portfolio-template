# ADR-001: Deploy with OpenNext on Cloudflare

## Context

The portfolio is a content-driven single-page site whose pages can be compiled
ahead of time from JSON content. Phase 4a adds `/api/contact` as a Next.js Route
Handler for validation, rate limiting, and email delivery. A Route Handler needs
a request-time runtime and cannot be served by a static export.

The project targets an open-source template that should be cheap to host and
simple to fork. Cloudflare remains the proposed host.

## Decision

Propose deploying the Next.js app with **OpenNext on Cloudflare Workers**. Pages,
assets, and the `/api/contact` Route Handler then run from the same application
and share environment configuration. Secrets (`RESEND_API_KEY`,
`CONTACT_FROM`, `CONTACT_TO`) live in Cloudflare Workers configuration and are
never shipped to the browser. Rate limiting uses Cloudflare KV in production as
described in ADR-003.

### Fallback

If OpenNext is not adopted, the alternative is a static export
(`output: "export"`) for the pages plus a Cloudflare Pages Function that
implements the same contact contract. That fallback must reproduce the Route
Handler's validation, honeypot, origin check, rate limit, and provider
behavior. Supporting both paths indefinitely is not a goal.

## Consequences

- Hosting cost and operational surface stay small.
- Pages are served from Cloudflare's CDN.
- A request-time runtime is available for the contact endpoint without a
  separate service.
- The deployment depends on the OpenNext adapter's compatibility with the
  current Next.js version.
- Server-only features beyond route handlers still need explicit validation on
  the chosen runtime.
- The static-export fallback carries a second implementation of the contact
  boundary and must be kept in sync with the Route Handler.
- Switching to a Node.js host requires a new deployment ADR.

## Status

Proposed
