# Deployment

Deployment is not implemented in Phase 0. The deployment design is recorded in
[ADR-001](./adr/ADR-001-deploy.md) with status **Proposed**.

## Proposed target

The proposed architecture is a static export deployed to Cloudflare Pages, with
Cloudflare Pages Functions handling the contact form, email delivery, and rate
limiting.

The expected shape is:

1. Set `output: "export"` in `next.config.ts` when the static-export decision is
   accepted.
2. Run `npm run build` to produce the `out/` directory.
3. Deploy `out/` to a Cloudflare Pages project.
4. Add Pages Functions for contact requests.
5. Configure the environment variables documented in `.env.example`.
6. Add a KV namespace for rate limiting per ADR-003.

Until ADR-001 is accepted, `next.config.ts` does not enable static export, and
the contact section uses a mailto link rather than a form endpoint.

## Environment variables

`.env.example` lists the expected variable names with empty values:

- `CONTACT_PROVIDER`
- `RESEND_API_KEY`
- `CONTACT_TO`
- `RATE_LIMIT_KV_NAMESPACE_ID`

Never commit real values. The privacy scan and the CI gitleaks job are
guardrails, not a substitute for reviewing your diff.

## Alternatives

- Vercel hosting with a Next.js runtime.
- Any static host with an external form provider.
- A self-hosted Node.js server.

Record a new ADR before changing the deployment target.
