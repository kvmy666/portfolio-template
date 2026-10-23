"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  FeatureTag,
  LocaleStrings,
  LocalizedString,
  Media,
  Project,
  SiteConfig,
} from "@/content/schema";
import { techSearchHref } from "@/lib/tech-search";
import { AppFrame } from "./AppFrame";
import { useLocale } from "./LocaleProvider";
import { ProjectMetrics } from "./ProjectMetrics";

const lenses: FeatureTag[] = ["UX", "Security", "Testing", "Performance"];

const hashToLens: Record<string, FeatureTag> = {
  ux: "UX",
  security: "Security",
  testing: "Testing",
  performance: "Performance",
};

const tagStyles: Record<FeatureTag, string> = {
  UX: "border border-accent/30 bg-accent/10 text-primary-text",
  Security: "border border-line bg-background text-muted",
  Testing: "border border-accent/20 bg-accent/5 text-primary-text",
  Performance: "border border-accent/40 bg-accent/15 text-primary-text",
};

function localized(
  value: LocalizedString,
  locale: string,
  fallback: string,
): string {
  return value[locale] ?? value[fallback] ?? Object.values(value)[0] ?? "";
}

type ProjectViewProps = {
  project: Project;
  site: SiteConfig;
  dictionaries: Record<string, LocaleStrings>;
};

export function ProjectView({ project, site, dictionaries }: ProjectViewProps) {
  return (
    <AppFrame
      site={site}
      dictionaries={dictionaries}
      activeDockItem="projects"
      dockHrefPrefix="/"
      backHref="/#projects"
    >
      <ProjectContent project={project} site={site} />
    </AppFrame>
  );
}

function ProjectContent({
  project,
  site,
}: Omit<ProjectViewProps, "dictionaries">) {
  const { t, locale } = useLocale();
  const [lens, setLens] = useState<FeatureTag | null>(null);

  useEffect(() => {
    const applyHash = () => {
      const key = window.location.hash.replace(/^#/, "").toLowerCase();
      setLens(hashToLens[key] ?? null);
    };

    applyHash();
    window.addEventListener("hashchange", applyHash);

    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  const counts = useMemo(() => {
    const map = new Map<FeatureTag, number>(lenses.map((tag) => [tag, 0]));

    for (const feature of project.features) {
      for (const tag of feature.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }

    return map;
  }, [project.features]);

  const selectLens = useCallback((next: FeatureTag | null) => {
    setLens(next);

    const base = `${window.location.pathname}${window.location.search}`;
    const nextHash = next ? `#${next.toLowerCase()}` : "";
    window.history.replaceState(null, "", `${base}${nextHash}`);
  }, []);

  const visibleFeatures = lens
    ? project.features.filter((feature) => feature.tags.includes(lens))
    : project.features;

  const platformKey =
    project.platform === "cross-platform" ? "crossPlatform" : project.platform;
  const playStoreHref = project.packageId
    ? (project.store ??
      `https://play.google.com/store/apps/details?id=${encodeURIComponent(
        project.packageId,
      )}`)
    : null;
  const storeLabel = project.store
    ? t.projects.store
    : t.projectDetail.playStore;

  return (
    <main id="main" className="page-main page-container flex-1">
      <header className="rounded-xl border border-line bg-card p-8 shadow-sm sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Image
            src={project.logo}
            alt=""
            width={88}
            height={88}
            unoptimized
            className="h-20 w-20 shrink-0 rounded-lg border border-line bg-background object-contain"
          />
          <div className="min-w-0">
            <h1>{localized(project.name, locale, site.defaultLocale)}</h1>
            <p className="measure mt-4 text-muted">
              {localized(project.summary, locale, site.defaultLocale)}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-text">
            {t.platforms[platformKey]}
          </span>
          {project.tech.slice(0, 3).map((technology) => (
            <a
              key={technology}
              href={techSearchHref(technology)}
              target="_blank"
              rel="noopener noreferrer"
              title={`${technology} — Google (${t.projectDetail.openInNewTab})`}
              aria-label={`${technology} — Google (${t.projectDetail.openInNewTab})`}
              className="rounded-full border border-line bg-background px-3 py-1 text-xs text-muted transition duration-200 hover:border-accent/30 hover:bg-accent/10 hover:text-primary-text focus-visible:border-accent/30 focus-visible:bg-accent/10 focus-visible:text-primary-text"
            >
              {technology}
            </a>
          ))}
        </div>

        {project.repo || playStoreHref ? (
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold">
            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-primary-text hover:underline"
              >
                {t.projectDetail.github}
                <span className="sr-only">
                  , {t.projectDetail.openInNewTab}
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            {playStoreHref ? (
              <a
                href={playStoreHref}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-primary-text hover:underline"
              >
                {storeLabel}
                <span className="sr-only">
                  , {t.projectDetail.openInNewTab}
                </span>
                <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        ) : null}

        {site.features.metrics ? (
          <ProjectMetrics
            slug={project.slug}
            sources={project.sources}
            fallback={
              project.metrics
                ? {
                    downloads: project.metrics.mirror,
                    stars: project.metrics.github,
                  }
                : null
            }
            locale={locale}
            variant="detail"
          />
        ) : null}
      </header>

      <section aria-labelledby="overview-heading" className="mt-16">
        <h2 id="overview-heading">{t.projectDetail.overview}</h2>
        <p className="measure mt-4 whitespace-pre-line text-muted">
          {localized(project.description, locale, site.defaultLocale)}
        </p>
      </section>

      <section aria-labelledby="tech-stack-heading" className="mt-16">
        <h2 id="tech-stack-heading">{t.projectDetail.techStack}</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {project.tech.map((technology) => (
            <li key={technology}>
              <a
                href={techSearchHref(technology)}
                target="_blank"
                rel="noopener noreferrer"
                title={`${technology} — Google (${t.projectDetail.openInNewTab})`}
                aria-label={`${technology} — Google (${t.projectDetail.openInNewTab})`}
                className="inline-block rounded-full border border-line bg-card px-3.5 py-1.5 text-sm text-muted transition duration-200 hover:border-accent/30 hover:bg-accent/10 hover:text-primary-text focus-visible:border-accent/30 focus-visible:bg-accent/10 focus-visible:text-primary-text"
              >
                {technology}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="features-heading" className="mt-16">
        <h2 id="features-heading">{t.projectDetail.features}</h2>

        <div
          role="group"
          aria-label={t.projectDetail.lenses}
          className="mt-5 flex flex-wrap gap-2"
        >
          <button
            type="button"
            aria-pressed={lens === null}
            onClick={() => selectLens(null)}
            data-testid="lens-all"
            className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-primary-text aria-pressed:border-accent/40 aria-pressed:bg-accent/10 aria-pressed:text-primary-text"
          >
            {t.projectDetail.all}
            <span className="ms-1.5 text-xs tabular-nums">
              ({project.features.length})
            </span>
          </button>
          {lenses
            .filter((tag) => (counts.get(tag) ?? 0) > 0)
            .map((tag) => {
              const count = counts.get(tag) ?? 0;

              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={lens === tag}
                  onClick={() => selectLens(tag)}
                  data-testid={`lens-${tag.toLowerCase()}`}
                  className="rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-medium text-muted transition hover:border-accent/40 hover:text-primary-text aria-pressed:border-accent/40 aria-pressed:bg-accent/10 aria-pressed:text-primary-text"
                >
                  {t.tags[tag]}
                  <span className="ms-1.5 text-xs tabular-nums">({count})</span>
                </button>
              );
            })}
        </div>

        {visibleFeatures.length === 0 ? (
          <p
            data-testid="lens-empty"
            className="mt-8 rounded-lg border border-dashed border-line bg-card p-8 text-center text-sm text-muted"
          >
            {t.projectDetail.emptyLens}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {visibleFeatures.map((feature, index) => (
            <article
              key={`${localized(
                feature.title,
                site.defaultLocale,
                site.defaultLocale,
              )}-${index}`}
              data-testid="feature-card"
              className="flex flex-col rounded-lg border border-line bg-card p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3>{localized(feature.title, locale, site.defaultLocale)}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      data-testid="feature-tag"
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${tagStyles[tag]}`}
                    >
                      {t.tags[tag]}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-sm font-medium text-primary-text">
                {localized(feature.oneLiner, locale, site.defaultLocale)}
              </p>

              <FeatureMedia
                media={feature.media}
                locale={locale}
                defaultLocale={site.defaultLocale}
                placeholder={t.projectDetail.noMedia}
              />

              <p className="mt-5 flex-1 text-sm leading-6 text-muted">
                {localized(feature.description, locale, site.defaultLocale)}
              </p>

              {feature.evidence ? (
                <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                  <span className="font-semibold text-primary-text">
                    {t.projectDetail.evidence}:
                  </span>{" "}
                  {localized(feature.evidence, locale, site.defaultLocale)}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {project.deepDive.architecture || project.deepDive.code ? (
        <section aria-labelledby="deep-dive-heading" className="mt-16">
          <h2 id="deep-dive-heading">{t.projectDetail.deepDive}</h2>

          {project.deepDive.architecture ? (
            <p className="measure mt-4 whitespace-pre-line text-muted">
              {localized(
                project.deepDive.architecture,
                locale,
                site.defaultLocale,
              )}
            </p>
          ) : null}

          {project.deepDive.code ? (
            <div className="mt-6 min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-card">
              <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                {project.deepDive.code.language}
              </div>
              <pre
                dir="ltr"
                tabIndex={0}
                aria-label={`${t.projectDetail.deepDive}: ${project.deepDive.code.language}`}
                className="max-w-full overflow-x-auto p-4 text-start text-sm leading-6"
              >
                <code className="whitespace-pre">
                  {project.deepDive.code.snippet}
                </code>
              </pre>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function FeatureMedia({
  media,
  locale,
  defaultLocale,
  placeholder,
}: {
  media: Media | null;
  locale: string;
  defaultLocale: string;
  placeholder: string;
}) {
  return (
    <div className="mt-5 aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-background">
      {media ? (
        media.type === "image" ? (
          <img
            src={media.src}
            alt={localized(media.alt, locale, defaultLocale)}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            className="h-full w-full object-cover"
            muted
            loop
            playsInline
            preload="none"
            aria-label={localized(media.alt, locale, defaultLocale)}
          >
            <source src={media.src} />
          </video>
        )
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-muted">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="m4 16 5-5 4 4 3-3 4 4" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
          <span>{placeholder}</span>
        </div>
      )}
    </div>
  );
}
