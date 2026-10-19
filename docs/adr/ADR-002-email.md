# ADR-002: Email delivery provider

## Context

The contact form needs to deliver a small volume of messages to the site owner.
The template should work on a free tier and should not require a custom mail
server. Some users will not want to create an account with a transactional email
provider.

## Decision

Propose Resend on its free tier as the default email provider. The current
implementation sends through Resend when `RESEND_API_KEY` is present;
`CONTACT_PROVIDER` is reserved for a future adapter.

If a deployment cannot use Resend, fall back to Web3Forms. The fallback must
preserve the same server-side validation, honeypot, origin, and rate-limit
checks. Provider credentials stay in environment variables; they are never
exposed to the client.

## Consequences

- The default path is a small HTTPS request from the contact Route Handler.
- Free-tier limits are sufficient for a personal portfolio, but they are not a
  guarantee.
- Resend is implemented behind the `/api/contact` boundary. `CONTACT_PROVIDER`
  remains reserved for a future adapter; only Resend is wired today.
- Web3Forms may have different deliverability and privacy characteristics.
- Email provider outages affect the contact form, not the rest of the site.
- Without `RESEND_API_KEY`, development returns a `202` dev response and
  production returns `503`; the form is not silently dropped.

## Status

Proposed
