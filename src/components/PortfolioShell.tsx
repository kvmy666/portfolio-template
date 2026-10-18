"use client";

import Image from "next/image";

import type {
  FeatureTag,
  LocaleStrings,
  LocalizedString,
  Project,
  SiteConfig,
} from "@/content/schema";
import { Dock } from "./Dock";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { Utilities } from "./Utilities";

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

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "YN";
}

type PortfolioShellProps = {
  site: SiteConfig;
  projects: Project[];
  dictionaries: Record<string, LocaleStrings>;
  year: number;
};

export function PortfolioShell({
  site,
  projects,
  dictionaries,
  year,
}: PortfolioShellProps) {
  return (
    <LocaleProvider site={site} dictionaries={dictionaries}>
      <PortfolioContent site={site} projects={projects} year={year} />
    </LocaleProvider>
  );
}

function PortfolioContent({
  site,
  projects,
  year,
}: Omit<PortfolioShellProps, "dictionaries">) {
  const { t, locale } = useLocale();
  const features = site.features;
  const role = localized(site.role, locale, site.defaultLocale);
  const pitch = localized(site.pitch, locale, site.defaultLocale);
  const contactLabels =
    site.contact.labels[locale] ??
    site.contact.labels[site.defaultLocale] ??
    [];
  const showVisual = features.splash3d || features.laptop;

  const socialLinks = [
    site.links.github
      ? { href: site.links.github, label: "GitHub" }
      : null,
    site.links.linkedin
      ? { href: site.links.linkedin, label: "LinkedIn" }
      : null,
    site.links.website
      ? { href: site.links.website, label: t.ui.website }
      : null,
    { href: `mailto:${site.email}`, label: t.ui.email },
  ].filter((link): link is { href: string; label: string } => link !== null);

  const metricsProjects = features.metrics
    ? projects.filter(
        (project) =>
          project.metrics !== null &&
          (project.metrics.github !== null || project.metrics.mirror !== null),
      )
    : [];
  const githubTotal = metricsProjects.reduce(
    (total, project) => total + (project.metrics?.github ?? 0),
    0,
  );
  const mirrorTotal = metricsProjects.reduce(
    (total, project) => total + (project.metrics?.mirror ?? 0),
    0,
  );

  const mailtoHref = `mailto:${site.email}?subject=${encodeURIComponent(
    contactLabels[0] ?? t.contact.subjectFallback,
  )}`;
  const cvMailto = `mailto:${site.email}?subject=${encodeURIComponent(
    t.cv.request,
  )}`;

  const projectCountLabel = (
    projects.length === 1 ? t.projects.countOne : t.projects.countMany
  ).replace("{count}", projects.length.toLocaleString(locale));

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div
        className="page-glow pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      />

      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 font-medium text-accent-contrast focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        {t.ui.skipToContent}
      </a>

      <Utilities />
      <Dock features={features} />

      <main id="main" className="page-main page-container flex-1">
        <section
          id="home"
          className={showVisual ? "hero-grid" : undefined}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-text">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              {role}
            </p>
            <h1 className="mt-6 max-w-3xl">{site.name}</h1>
            <p className="measure mt-6 text-muted">{pitch}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {t.nav.projects}
              </a>
              <a
                href="#about"
                className="inline-flex items-center rounded-full border border-line bg-card px-5 py-3 text-sm font-semibold transition hover:border-accent/40 hover:text-primary-text"
              >
                {t.hero.aboutMe}
              </a>
              {features.cv ? (
                <a
                  href="#cv"
                  className="inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-muted transition hover:text-primary-text"
                >
                  {t.cv.request}
                </a>
              ) : null}
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {socialLinks.map((link) => {
                const external = link.href.startsWith("http");

                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-1.5 transition hover:text-primary-text"
                      {...(external
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                    >
                      {link.label}
                      {external ? <span aria-hidden="true">↗</span> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {showVisual ? (
            <div className="space-y-10">
              {features.splash3d ? (
                <div
                  className="hero-scene mx-auto w-full max-w-sm"
                  aria-hidden="true"
                >
                  <div className="hero-card relative overflow-hidden rounded-xl p-7 text-white">
                    <div className="hero-card-grid absolute inset-0 opacity-40" />
                    <div className="relative flex items-center justify-between">
                      <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
                        {t.visual.portfolio}
                      </span>
                      <span className="text-xs text-white/70">
                        {t.visual.demo}
                      </span>
                    </div>
                    <div className="relative mt-16 flex h-24 w-24 items-center justify-center rounded-lg border border-white/30 bg-white/15 text-3xl font-semibold backdrop-blur">
                      {getInitials(site.name)}
                    </div>
                    <div className="relative mt-8 space-y-3">
                      <div className="h-2.5 w-3/4 rounded-full bg-white/50" />
                      <div className="h-2.5 w-1/2 rounded-full bg-white/30" />
                      <div className="h-2.5 w-2/3 rounded-full bg-white/20" />
                    </div>
                    <div className="relative mt-8 flex gap-2">
                      <span className="h-8 w-20 rounded-full bg-white/20" />
                      <span className="h-8 w-14 rounded-full bg-white/10" />
                    </div>
                  </div>
                </div>
              ) : null}

              {features.laptop ? (
                <div
                  className="laptop-stage mx-auto w-full max-w-md"
                  aria-hidden="true"
                >
                  <div className="laptop-screen overflow-hidden p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-muted" />
                      <span className="h-2 w-2 rounded-full bg-accent/60" />
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    </div>
                    <div className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-4">
                      <div className="h-2 w-24 rounded-full bg-primary-text/70" />
                      <div className="mt-4 space-y-2.5">
                        <div className="code-line w-full" />
                        <div className="code-line w-5/6" />
                        <div className="code-line w-2/3" />
                        <div className="code-line w-3/4" />
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-sm border border-white/10 bg-white/[0.05] p-3">
                          <div className="h-1.5 w-10 rounded-full bg-primary-text/70" />
                          <div className="mt-2 h-1.5 w-14 rounded-full bg-white/20" />
                        </div>
                        <div className="rounded-sm border border-white/10 bg-white/[0.05] p-3">
                          <div className="h-1.5 w-8 rounded-full bg-primary-text/50" />
                          <div className="mt-2 h-1.5 w-12 rounded-full bg-white/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="laptop-base" />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section id="about" className="mt-24">
          <div className="rounded-xl border border-line bg-card p-8 shadow-sm sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-text">
                  {t.nav.about}
                </p>
                <h2 className="mt-3">{t.hero.aboutMe}</h2>
                <p className="measure mt-4 text-muted">{pitch}</p>
              </div>
              {features.cv ? (
                <a
                  href="#cv"
                  className="w-fit rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition hover:-translate-y-0.5"
                >
                  {t.cv.request}
                </a>
              ) : null}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {contactLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-line bg-background px-3 py-1.5 text-sm text-muted"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {features.metrics && metricsProjects.length > 0 ? (
          <section aria-labelledby="metrics-heading" className="mt-8">
            <h2 id="metrics-heading" className="sr-only">
              {t.metrics.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-card p-6">
                <p className="text-sm font-medium text-muted">
                  {t.metrics.github}
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {githubTotal.toLocaleString(locale)}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-card p-6">
                <p className="text-sm font-medium text-muted">
                  {t.metrics.mirror}
                </p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {mirrorTotal.toLocaleString(locale)}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section id="projects" className="mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-text">
                {t.nav.projects}
              </p>
              <h2 className="mt-3">{t.projects.title}</h2>
            </div>
            <p className="text-sm text-muted">{projectCountLabel}</p>
          </div>

          {projects.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-line bg-card/60 p-12 text-center">
              <p className="text-lg font-medium">{t.projects.empty}</p>
              <p className="measure mx-auto mt-2 text-sm text-muted">
                {t.projects.emptyHint}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const platformKey =
                  project.platform === "cross-platform"
                    ? "crossPlatform"
                    : project.platform;

                return (
                  <article
                    key={project.slug}
                    className="group flex h-full flex-col rounded-lg border border-line bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={project.logo}
                          alt=""
                          width={52}
                          height={52}
                          unoptimized
                          className="h-12 w-12 rounded-md border border-line bg-background object-contain"
                        />
                        <div>
                          <h3>{localized(project.name, locale, site.defaultLocale)}</h3>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-muted">
                            {t.platforms[platformKey]}
                          </p>
                        </div>
                      </div>
                      {project.demo ? (
                        <span className="rounded-full border border-line bg-background px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                          {t.projects.demo}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-5 flex-1 text-sm leading-6 text-muted">
                      {localized(project.summary, locale, site.defaultLocale)}
                    </p>

                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {project.tech.map((technology) => (
                        <li
                          key={technology}
                          className="rounded-full border border-line bg-background px-2.5 py-1 text-xs text-muted"
                        >
                          {technology}
                        </li>
                      ))}
                    </ul>

                    <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                      {project.features.slice(0, 2).map((feature) => (
                        <li
                          key={localized(
                            feature.title,
                            locale,
                            site.defaultLocale,
                          )}
                        >
                          <p className="text-sm font-medium">
                            {localized(
                              feature.title,
                              locale,
                              site.defaultLocale,
                            )}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {feature.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${tagStyles[tag]}`}
                              >
                                {t.tags[tag]}
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>

                    {project.repo || project.store ? (
                      <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
                        {project.repo ? (
                          <a
                            href={project.repo}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-primary-text hover:underline"
                          >
                            {t.projects.repository}
                          </a>
                        ) : null}
                        {project.store ? (
                          <a
                            href={project.store}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-primary-text hover:underline"
                          >
                            {t.projects.store}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {features.cv ? (
          <section id="cv" className="mt-24">
            <div className="rounded-xl border border-line bg-card p-8 shadow-sm sm:p-12">
              <h2>{t.cv.title}</h2>
              <p className="measure mt-4 text-muted">{t.cv.body}</p>
              <a
                href={cvMailto}
                className="mt-8 inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition hover:-translate-y-0.5"
              >
                {t.cv.action}
              </a>
            </div>
          </section>
        ) : null}

        {features.contact ? (
          <section id="contact" className="mt-24">
            <div className="relative overflow-hidden rounded-xl border border-line bg-card p-8 shadow-sm sm:p-12">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="measure relative">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-text">
                  {t.nav.contact}
                </p>
                <h2 className="mt-3">{t.contact.title}</h2>
                <p className="mt-4 text-muted">{pitch}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={mailtoHref}
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast shadow-lg shadow-accent/20 transition hover:-translate-y-0.5"
                  >
                    {t.contact.submit}
                  </a>
                  <span className="text-sm text-muted">{site.email}</span>
                </div>
                {contactLabels.length > 0 ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {contactLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-line bg-background px-3 py-1.5 text-sm text-muted"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-line/70">
        <div className="page-container flex flex-col gap-2 py-8 pb-28 text-sm text-muted sm:flex-row sm:items-center sm:justify-between md:pb-8">
          <p>
            © {year} {site.name}. {t.footer.rights}
          </p>
          <p>{t.footer.builtWith}</p>
        </div>
      </footer>
    </div>
  );
}
