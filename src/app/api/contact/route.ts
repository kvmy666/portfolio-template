import { siteConfig } from "../../../../site.config";
import {
  contactRequestSchema,
  isAllowedOrigin,
  takeRateLimit,
} from "@/lib/contact";

export const runtime = "nodejs";

function json(
  body: Record<string, unknown>,
  status: number,
  headers?: Record<string, string>,
) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first.slice(0, 100);
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp ? realIp.slice(0, 100) : "unknown";
}

function isHoneypotFilled(payload: unknown): boolean {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const company = (payload as Record<string, unknown>).company;
  return typeof company === "string" && company.trim().length > 0;
}

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.CONTACT_DEV_MODE !== "1"
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (origin !== null && !isAllowedOrigin(origin, siteConfig.url)) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (isHoneypotFilled(payload)) {
    return json({ ok: true }, 202);
  }

  const parsed = contactRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "invalid",
        fields: parsed.error.issues.map((issue) =>
          issue.path.length > 0 ? issue.path.join(".") : "(root)",
        ),
      },
      400,
    );
  }

  const rateLimit = takeRateLimit(`contact:${clientIp(request)}`);

  if (!rateLimit.ok) {
    return json(
      { ok: false, error: "rate_limited" },
      429,
      { "retry-after": String(rateLimit.retryAfter) },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (isProduction()) {
      return json({ ok: false, error: "unavailable" }, 503);
    }

    return json({ ok: true, provider: "dev" }, 202);
  }

  const from =
    process.env.CONTACT_FROM ?? "Portfolio <onboarding@resend.dev>";
  const to = process.env.CONTACT_TO ?? siteConfig.contact.recipient;
  const safeLabel = parsed.data.label.replace(/[\r\n]+/g, " ").slice(0, 120);
  const text = [
    `Name: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    "",
    parsed.data.message,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[Portfolio] ${safeLabel}`,
        text,
      }),
    });

    if (!response.ok) {
      return json({ ok: false, error: "provider" }, 502);
    }
  } catch {
    return json({ ok: false, error: "provider" }, 502);
  }

  return json({ ok: true }, 202);
}
