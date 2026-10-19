# Deployment

The contact form needs a request-time server boundary. The default build
therefore runs as a Next.js server: `npm run build` produces `.next/`, and
`npm run start` serves both pages and `/api/contact`.

A pure static export (`output: "export"`) is not compatible with a Next.js
Route Handler. If you choose static hosting, you must provide the contact
endpoint separately (for example a Cloudflare Pages Function) or disable the
contact feature.

## Proposed target: OpenNext on Cloudflare

The deployment design in [ADR-001](./adr/ADR-001-deploy.md) proposes
**OpenNext on Cloudflare Workers** so the App Router pages and the
`/api/contact` Route Handler run together. The previous static-export design is
kept as a documented fallback in the ADR.

Expected shape:

1. Build the OpenNext output for Cloudflare.
2. Deploy the Worker and static assets to Cloudflare.
3. Configure the environment variables below as Worker secrets/variables.
4. Create a KV namespace for the production rate limiter (ADR-003).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Production | Resend API token. Without it, request handling returns `202 { provider: "dev" }` outside production and `503` in production. |
| `CONTACT_FROM` | Optional | Verified sender. Defaults to `Portfolio <onboarding@resend.dev>`. |
| `CONTACT_TO` | Optional | Overrides `contact.recipient` from `content/site.json`. |
| `RATE_LIMIT_KV_NAMESPACE_ID` | Production | KV namespace bound for a shared rate limit. |
| `CONTACT_DEV_MODE` | Local/e2e only | Set to `1` to allow the dev `202` response from a production server process. Never set this in production. |

Never commit real values. `.env.example` lists the names with empty values. The
privacy scan and CI gitleaks job are guardrails, not a substitute for reviewing
your diff.

## Rate limiting

The Route Handler ships an in-memory fixed-window limiter: 5 requests per 10
minutes per client IP (`x-forwarded-for` first value, then `x-real-ip`). The
`Map` is attached to `globalThis` so it survives development HMR.

An in-memory limiter is per server instance. On Cloudflare Workers, instances
are created and destroyed by the platform, so it is only a local/development
guard. Production must use Cloudflare KV (or another shared store) with the same
limit and window. The current implementation does not read
`RATE_LIMIT_KV_NAMESPACE_ID`; wire the KV bucket before relying on the limit in
production. Keep the endpoint's fail-closed behavior when the shared store is
unavailable.

## Contact API behavior

| Condition | Status |
| --- | --- |
| Accepted and sent (or dev mode without a provider key) | `202` |
| Honeypot field `company` is filled | `202`, no provider call |
| Invalid JSON or invalid fields | `400` |
| Disallowed `Origin` header | `403` |
| Fifth-request limit exceeded in the window | `429` + `Retry-After` |
| Provider request fails | `502` |
| Production without `RESEND_API_KEY` | `503` |

Requests without an `Origin` header (same-origin server-to-server, CLI, or
Playwright API calls) are allowed. Message bodies and email addresses are never
logged.

## Static export note

`/api/contact` is a server Route Handler. A static export cannot serve it. Use a
server host (including OpenNext on Cloudflare) or move contact delivery to a
Pages Function and point the form at that function. If the form is disabled,
set `features.contact` to `false` and the section, dock link, and API are unused.

## Alternatives

- Vercel hosting with a Next.js runtime.
- A self-hosted Node.js server.
- Static hosting with an external form provider.

Record a new ADR before changing the deployment target.
