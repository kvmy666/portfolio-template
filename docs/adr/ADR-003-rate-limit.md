# ADR-003: Rate limiting: in-memory development, Cloudflare KV production

## Context

A public contact endpoint can be abused for spam and email-quota exhaustion.
The site has no database. Development and tests need to run without Cloudflare
bindings, while a deployed Worker needs a limit shared across instances.

## Decision

Use a fixed-window limiter of **5 requests per 10 minutes** per client IP.

- **Development and tests** use a module-level `Map` attached to `globalThis`
  so it survives Next.js HMR. This is per process and is not a production
  guarantee.
- **Production on Cloudflare** uses a KV namespace
  (`RATE_LIMIT_KV_NAMESPACE_ID`) with the same limit and window. Keys should use
  a privacy-preserving identifier such as a hash of the IP, not the raw address.
  KV is eventually consistent, so the limit is approximate under concurrency.
- The endpoint fails closed with `429` when a request is over the limit and
  returns `Retry-After`. It does not reveal whether an address is blocked.

Store entries expire with the window. A KV outage must not silently disable the
limiter; the endpoint should fail closed while the static site remains
available.

## Consequences

- Local development and Playwright need no KV binding.
- The in-memory limiter is not shared between server instances and does not
  survive restarts.
- Production requires a KV binding and hashed keys.
- KV is eventually consistent, so limits may be exceeded briefly.
- Limits may need adjustment if legitimate traffic is blocked.

## Status

Proposed
