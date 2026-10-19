import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  label: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(2000),
  company: z.string().max(200).optional(),
});

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isAllowedOrigin(
  origin: string | null | undefined,
  siteUrl: string,
): boolean {
  if (!origin) {
    return false;
  }

  let parsed: URL;
  let site: URL;

  try {
    parsed = new URL(origin);
    site = new URL(siteUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  if (parsed.origin === site.origin) {
    return true;
  }

  return LOCAL_HOSTNAMES.has(parsed.hostname);
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, RateLimitBucket>;

type RateLimitGlobal = typeof globalThis & {
  __portfolioContactRateLimit?: RateLimitStore;
};

const rateLimitGlobal = globalThis as RateLimitGlobal;

function getStore(): RateLimitStore {
  rateLimitGlobal.__portfolioContactRateLimit ??= new Map();
  return rateLimitGlobal.__portfolioContactRateLimit;
}

const MAX_TRACKED_KEYS = 10_000;

export function takeRateLimit(
  key: string,
  limit = 5,
  windowMs = 10 * 60 * 1000,
): RateLimitResult {
  const store = getStore();
  const now = Date.now();

  if (store.size > MAX_TRACKED_KEYS) {
    for (const [storedKey, bucket] of store) {
      if (bucket.resetAt <= now) {
        store.delete(storedKey);
      }
    }
  }

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;

  return {
    ok: true,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: 0,
  };
}
