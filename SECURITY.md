# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| Earlier pre-release versions | No |

Security fixes land on `main` and are released in the current 1.x line.

## Reporting a vulnerability

Do not open a public issue for a vulnerability.

Report privately through GitHub Security Advisories:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability** (or open
   <https://github.com/kvmy666/portfolio-template/security/advisories/new>).
3. Include affected versions, a description, reproduction steps, and the impact
   you believe is possible.

GitHub keeps the report private and notifies the maintainers. There is no
personal email address for security reports. Do not include secrets, tokens, or
real user data in the report; use redacted examples.

## What to include

- The affected route, component, schema, workflow, or dependency.
- A minimal reproduction or proof of concept.
- Whether the issue requires a specific environment, configuration, or feature
  flag.
- Any suggested fix or mitigation.

## Response expectations

Maintainers will acknowledge a report through the advisory, investigate, and
coordinate a fix and disclosure. Please allow time for a patched release before
public disclosure.

## Scope

In scope:

- The contact API (`src/app/api/contact/route.ts`) including origin checks,
  validation, and rate limiting.
- Content and schema validation, build-time configuration, and server-side
  loaders.
- Dependency vulnerabilities that affect the shipped application.
- Secrets exposure in the repository, CI, or generated build output.
- Workflow security in `.github/workflows/`.

Out of scope:

- Vulnerabilities in a user's own deployment configuration, hosting account,
  email provider, or content.
- Reports requiring access to a private environment or data you do not own.
- Social engineering, spam, and denial-of-service against third-party services.
- Automated dependency alerts with no demonstrated impact.

## Deployment responsibilities

Users deploying the template are responsible for:

- Setting `RESEND_API_KEY`, `CONTACT_FROM`, and `CONTACT_TO` as host secrets.
- Replacing the in-memory rate limiter with a shared store in production.
- Keeping dependencies and the Node.js runtime patched.
- Configuring the canonical `url` so contact origin checks match the real site.
- Never setting `CONTACT_DEV_MODE=1` in production.
