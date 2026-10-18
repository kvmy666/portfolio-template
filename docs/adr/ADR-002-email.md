# ADR-002: Email delivery provider

## Context

The contact form needs to deliver a small volume of messages to the site owner.
The template should work on a free tier and should not require a custom mail
server. Some users will not want to create an account with a transactional email
provider.

## Decision

Propose Resend on its free tier as the default email provider, behind a provider
adapter selected by `CONTACT_PROVIDER`.

If a deployment cannot use Resend, fall back to Web3Forms. The fallback must
preserve the same server-side validation and rate-limit checks. Provider
credentials stay in environment variables; they are never exposed to the client.

## Consequences

- The default path is a small HTTPS request from a Pages Function.
- Free-tier limits are sufficient for a personal portfolio, but they are not a
  guarantee.
- The adapter adds a small amount of server code and configuration.
- Web3Forms may have different deliverability and privacy characteristics.
- Email provider outages affect the contact form, not the rest of the site.
- No provider is wired up in Phase 0; the contact section remains a mailto link.

## Status

Proposed
