# ADR-003: Rate limiting with Cloudflare KV

## Context

A public contact endpoint can be abused for spam and email-quota exhaustion.
The static site has no database. The deployment target proposed in ADR-001
already provides Cloudflare KV.

## Decision

Propose rate limiting contact requests with Cloudflare KV. The Pages Function
increments a short-lived counter keyed by a privacy-preserving client identifier
and rejects requests that exceed a fixed window limit.

The limit is intentionally conservative for a personal portfolio. Responses do
not reveal whether an address is blocked or whether a counter exists.

## Consequences

- Rate limiting stays close to the contact endpoint and needs no database.
- KV is eventually consistent, so limits are approximate under concurrency.
- The implementation must avoid storing raw IP addresses in keys.
- A KV outage should fail closed for the contact endpoint while leaving the
  static site available.
- Limits may need adjustment if legitimate traffic is blocked.
- Rate limiting is not implemented in Phase 0.

## Status

Proposed
