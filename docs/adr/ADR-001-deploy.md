# ADR-001: Static export and Cloudflare Pages Functions

## Context

The portfolio is a content-driven single-page site. Its pages can be compiled
ahead of time from JSON content. The contact form needs a small server-side
boundary for email delivery and abuse control, but the rest of the site does not
need a persistent application server.

The project targets an open-source template that should be cheap to host and
simple to fork.

## Decision

Propose deploying a static Next.js export to Cloudflare Pages, with Cloudflare
Pages Functions providing the contact endpoint.

The static export covers the home page, generated metadata, and assets. Pages
Functions handle request validation, rate limiting, and outbound email. Secrets
live in Cloudflare environment variables and are never shipped to the browser.

## Consequences

- Hosting cost and operational surface stay small.
- Pages are served from a CDN by default.
- Server-only features such as request-time personalization, ISR, and dynamic
  routes are unavailable unless they move to Functions or another runtime.
- The contact flow depends on Cloudflare-specific Functions, KV, and secret
  configuration.
- Switching to a Node.js host requires a new deployment ADR.
- Static export must be validated before this ADR moves from Proposed to
  Accepted.

## Status

Proposed
