"use client";

import { useEffect, useMemo, useState } from "react";

import {
  fetchProjectMetrics,
  formatCount,
  metricsCacheKey,
  readCachedMetrics,
  resolveMetrics,
  writeCachedMetrics,
  type MetricsSources,
  type ProjectMetrics as MetricsValue,
} from "@/lib/metrics";
import { useLocale } from "./LocaleProvider";

export type ProjectMetricsProps = {
  slug: string;
  sources: MetricsSources;
  fallback: MetricsValue | null;
  locale: string;
  variant: "card" | "detail";
};

function DownloadIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function StarIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 3.6 2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.88l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L12 3.6Z" />
    </svg>
  );
}

export function ProjectMetrics({
  slug,
  sources,
  fallback,
  locale,
  variant,
}: ProjectMetricsProps) {
  const { t } = useLocale();
  const github = sources.github;
  const mirror = sources.mirror;
  const normalizedSources = useMemo<MetricsSources>(
    () => ({ github, mirror }),
    [github, mirror],
  );
  const cacheKey = metricsCacheKey(slug, normalizedSources);
  const [live, setLive] = useState<{
    key: string;
    value: MetricsValue;
  } | null>(null);

  useEffect(() => {
    if (!github && !mirror) {
      return;
    }

    const cached = readCachedMetrics(slug, { github, mirror });

    if (cached) {
      const cachedTimer = window.setTimeout(() => {
        setLive({ key: cacheKey, value: cached });
      }, 0);

      return () => window.clearTimeout(cachedTimer);
    }

    const controller = new AbortController();

    fetchProjectMetrics({ github, mirror }, controller.signal)
      .then((value) => {
        if (controller.signal.aborted) {
          return;
        }

        if (value.downloads !== null || value.stars !== null) {
          writeCachedMetrics(slug, { github, mirror }, value);
        }

        setLive({ key: cacheKey, value });
      })
      .catch(() => {
        // Failures keep the static fallback; the UI never surfaces fetch errors.
      });

    return () => controller.abort();
  }, [cacheKey, github, mirror, slug]);

  const liveValue = live?.key === cacheKey ? live.value : null;
  const resolved = resolveMetrics(liveValue, fallback);

  if (!resolved) {
    return null;
  }

  const isCard = variant === "card";
  const iconSize = isCard ? 12 : 14;
  const downloadsValue =
    resolved.downloads === null
      ? null
      : formatCount(resolved.downloads, locale);
  const starsValue =
    resolved.stars === null ? null : formatCount(resolved.stars, locale);

  return (
    <dl
      data-testid="project-metrics"
      data-variant={variant}
      aria-label={t.metrics.title}
      className={
        isCard
          ? "mt-4 flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-xs"
          : "mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
      }
    >
      {downloadsValue !== null ? (
        <div
          className="inline-flex min-w-0 items-center gap-1.5"
          title={t.metrics.downloadsSource}
          aria-label={`${t.metrics.downloads}: ${downloadsValue}. ${t.metrics.downloadsSource}`}
        >
          <span className="text-primary-text" aria-hidden="true">
            <DownloadIcon size={iconSize} />
          </span>
          <dt
            className={
              isCard
                ? "text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted"
                : "font-medium text-muted"
            }
          >
            {t.metrics.downloads}
          </dt>
          <dd
            data-testid="metric-downloads"
            className="min-h-5 font-semibold tabular-nums"
          >
            {downloadsValue}
          </dd>
        </div>
      ) : null}

      {starsValue !== null ? (
        <div
          className="inline-flex min-w-0 items-center gap-1.5"
          title={t.metrics.starsSource}
          aria-label={`${t.metrics.stars}: ${starsValue}. ${t.metrics.starsSource}`}
        >
          <span className="text-primary-text" aria-hidden="true">
            <StarIcon size={iconSize} />
          </span>
          <dt
            className={
              isCard
                ? "text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted"
                : "font-medium text-muted"
            }
          >
            {t.metrics.stars}
          </dt>
          <dd
            data-testid="metric-stars"
            className="min-h-5 font-semibold tabular-nums"
          >
            {starsValue}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
