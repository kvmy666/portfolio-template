import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildReleaseUrl,
  buildRepoUrl,
  fetchProjectMetrics,
  formatCount,
  METRICS_CACHE_TTL_MS,
  metricsCacheKey,
  readCachedMetrics,
  sumAssetDownloads,
  writeCachedMetrics,
} from "./metrics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sumAssetDownloads", () => {
  it("sums asset downloads across every release", () => {
    const releases = [
      {
        assets: [{ download_count: 10 }, { download_count: 32 }],
      },
      {
        assets: [{ download_count: 8 }],
      },
      {
        assets: [],
      },
    ];

    expect(sumAssetDownloads(releases)).toBe(50);
  });

  it("ignores malformed releases and assets", () => {
    const releases = [
      null,
      "release",
      { assets: null },
      { assets: [{ download_count: "12" }, { download_count: -4 }] },
      { assets: [{ download_count: Number.NaN }, { download_count: 5 }] },
      { assets: [null, { download_count: 7.9 }] },
    ];

    expect(sumAssetDownloads(releases)).toBe(12);
  });

  it("returns 0 for empty arrays and non-array input", () => {
    expect(sumAssetDownloads([])).toBe(0);
    expect(sumAssetDownloads(null)).toBe(0);
    expect(sumAssetDownloads({ assets: [{ download_count: 4 }] })).toBe(0);
  });
});

describe("GitHub URLs", () => {
  it("builds release and repository endpoints from owner/repo slugs", () => {
    expect(buildReleaseUrl("owner/repo")).toBe(
      "https://api.github.com/repos/owner/repo/releases?per_page=100",
    );
    expect(buildRepoUrl("owner/repo")).toBe(
      "https://api.github.com/repos/owner/repo",
    );
  });
});

describe("formatCount", () => {
  it("formats counts for English and Arabic locales", () => {
    expect(formatCount(1234, "en")).toBe("1,234");
    expect(formatCount(1234, "ar")).toBe(
      new Intl.NumberFormat("ar").format(1234),
    );
  });
});

class MemoryStorage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("session cache", () => {
  it("keys entries by slug and both sources", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });

    const sources = { github: "owner/repo", mirror: "owner/mirror" };
    const value = { downloads: 12, stars: 3 };

    expect(metricsCacheKey("demo", sources)).toBe(
      "metrics:demo:owner/repo:owner/mirror",
    );

    writeCachedMetrics("demo", sources, value, 1_000);
    expect(readCachedMetrics("demo", sources, 1_000)).toEqual(value);
    expect(
      readCachedMetrics(
        "demo",
        { github: "owner/other", mirror: null },
        1_000,
      ),
    ).toBeNull();
  });

  it("expires entries after one hour", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("window", { sessionStorage: storage });

    const sources = { github: "owner/repo", mirror: null };
    const value = { downloads: 9, stars: 2 };

    writeCachedMetrics("demo", sources, value, 1_000);

    expect(
      readCachedMetrics("demo", sources, 1_000 + METRICS_CACHE_TTL_MS - 1),
    ).toEqual(value);
    expect(
      readCachedMetrics("demo", sources, 1_000 + METRICS_CACHE_TTL_MS),
    ).toBeNull();
  });
});

describe("fetchProjectMetrics", () => {
  it("combines downloads from github and mirror with GitHub stars", async () => {
    const githubReleases = [
      { assets: [{ download_count: 100 }, { download_count: 23 }] },
    ];
    const mirrorReleases = [{ assets: [{ download_count: 50 }] }];

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === buildReleaseUrl("owner/repo")) {
        return {
          ok: true,
          json: async () => githubReleases,
        };
      }

      if (url === buildReleaseUrl("owner/mirror")) {
        return {
          ok: true,
          json: async () => mirrorReleases,
        };
      }

      if (url === buildRepoUrl("owner/repo")) {
        return {
          ok: true,
          json: async () => ({ stargazers_count: 42 }),
        };
      }

      return { ok: false, json: async () => null };
    });

    vi.stubGlobal("fetch", fetchMock);

    const metrics = await fetchProjectMetrics(
      { github: "owner/repo", mirror: "owner/mirror" },
      new AbortController().signal,
    );

    expect(metrics).toEqual({ downloads: 173, stars: 42 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns null values when responses are malformed or fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/releases")) {
          return { ok: true, json: async () => ({ not: "an array" }) };
        }

        return { ok: false, json: async () => null };
      }),
    );

    const metrics = await fetchProjectMetrics(
      { github: "owner/repo", mirror: "owner/mirror" },
      new AbortController().signal,
    );

    expect(metrics).toEqual({ downloads: null, stars: null });
  });

  it("skips null sources without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const metrics = await fetchProjectMetrics(
      { github: null, mirror: null },
      new AbortController().signal,
    );

    expect(metrics).toEqual({ downloads: null, stars: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
