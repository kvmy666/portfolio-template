export type ProjectMetrics = {
  downloads: number | null;
  stars: number | null;
};

export type MetricsSources = {
  github: string | null;
  mirror: string | null;
};

export const METRICS_CACHE_TTL_MS = 60 * 60 * 1000;

const API_BASE = "https://api.github.com/repos";

function normalizeRepo(repo: string | null): string | null {
  if (typeof repo !== "string") {
    return null;
  }

  const trimmed = repo.trim().replace(/^\/+|\/+$/g, "");

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function buildReleaseUrl(repo: string): string {
  return `${API_BASE}/${normalizeRepo(repo) ?? repo}/releases?per_page=100`;
}

export function buildRepoUrl(repo: string): string {
  return `${API_BASE}/${normalizeRepo(repo) ?? repo}`;
}

function isFiniteCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function sumAssetDownloads(releases: unknown): number {
  if (!Array.isArray(releases)) {
    return 0;
  }

  let total = 0;

  for (const release of releases) {
    if (
      typeof release !== "object" ||
      release === null ||
      !Array.isArray((release as { assets?: unknown }).assets)
    ) {
      continue;
    }

    for (const asset of (release as { assets: unknown[] }).assets) {
      if (typeof asset !== "object" || asset === null) {
        continue;
      }

      const count = (asset as { download_count?: unknown }).download_count;

      if (isFiniteCount(count)) {
        total += Math.trunc(count);
      }
    }
  }

  return total;
}

export function formatCount(n: number, locale: string): string {
  if (!Number.isFinite(n)) {
    return "0";
  }

  try {
    return new Intl.NumberFormat(locale).format(n);
  } catch {
    return new Intl.NumberFormat("en").format(n);
  }
}

export function metricsCacheKey(
  slug: string,
  sources: MetricsSources,
): string {
  const github = sources.github ?? "";
  const mirror = sources.mirror ?? "";

  return `metrics:${slug}:${github}:${mirror}`;
}

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function isProjectMetrics(value: unknown): value is ProjectMetrics {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { downloads?: unknown; stars?: unknown };

  return (
    (candidate.downloads === null || isFiniteCount(candidate.downloads)) &&
    (candidate.stars === null || isFiniteCount(candidate.stars))
  );
}

export function readCachedMetrics(
  slug: string,
  sources: MetricsSources,
  now = Date.now(),
): ProjectMetrics | null {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  const key = metricsCacheKey(slug, sources);

  try {
    const raw = storage.getItem(key);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      value?: unknown;
      expiresAt?: unknown;
    };

    if (
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now ||
      !isProjectMetrics(parsed.value)
    ) {
      storage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be unavailable; caching is best effort.
    }

    return null;
  }
}

export function writeCachedMetrics(
  slug: string,
  sources: MetricsSources,
  value: ProjectMetrics,
  now = Date.now(),
): void {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      metricsCacheKey(slug, sources),
      JSON.stringify({
        value,
        expiresAt: now + METRICS_CACHE_TTL_MS,
      }),
    );
  } catch {
    // Ignore quota and private-browsing failures; live values still render.
  }
}

async function fetchJson(
  url: string,
  signal: AbortSignal,
): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

async function fetchDownloads(
  sources: MetricsSources,
  signal: AbortSignal,
): Promise<number | null> {
  const repos = [normalizeRepo(sources.github), normalizeRepo(sources.mirror)]
    .filter((repo): repo is string => repo !== null);

  if (repos.length === 0) {
    return null;
  }

  const results = await Promise.all(
    repos.map(async (repo) => {
      const releases = await fetchJson(buildReleaseUrl(repo), signal);

      return Array.isArray(releases) ? sumAssetDownloads(releases) : null;
    }),
  );

  let total = 0;

  for (const value of results) {
    if (value === null) {
      return null;
    }

    total += value;
  }

  return total;
}

async function fetchStars(
  repo: string | null,
  signal: AbortSignal,
): Promise<number | null> {
  if (!repo) {
    return null;
  }

  const payload = await fetchJson(buildRepoUrl(repo), signal);

  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const stars = (payload as { stargazers_count?: unknown }).stargazers_count;

  return isFiniteCount(stars) ? Math.trunc(stars) : null;
}

export async function fetchProjectMetrics(
  sources: MetricsSources,
  signal: AbortSignal,
): Promise<ProjectMetrics> {
  const github = normalizeRepo(sources.github);

  const [downloads, stars] = await Promise.all([
    fetchDownloads({ github, mirror: normalizeRepo(sources.mirror) }, signal),
    fetchStars(github, signal),
  ]);

  return { downloads, stars };
}

export function resolveMetrics(
  live: ProjectMetrics | null,
  fallback: ProjectMetrics | null,
): ProjectMetrics | null {
  if (!live && !fallback) {
    return null;
  }

  const downloads = live?.downloads ?? fallback?.downloads ?? null;
  const stars = live?.stars ?? fallback?.stars ?? null;

  if (downloads === null && stars === null) {
    return null;
  }

  return { downloads, stars };
}
