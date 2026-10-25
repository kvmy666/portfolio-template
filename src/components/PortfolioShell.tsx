"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type {
  LocaleStrings,
  LocalizedString,
  Project,
  SiteConfig,
} from "@/content/schema";
import { techSearchHref } from "@/lib/tech-search";
import { AppFrame } from "./AppFrame";
import { PdfIcon, WordIcon } from "./CvFileIcons";
import { useLocale } from "./LocaleProvider";
import { ProjectMetrics } from "./ProjectMetrics";

const HeroSplash = dynamic(() => import("./HeroSplash"), { ssr: false });

const ContactForm = dynamic(
  () => import("./ContactForm").then((module) => module.ContactForm),
  { ssr: false, loading: () => <ContactFormSkeleton /> },
);

const LaptopScrub = dynamic(
  () => import("./LaptopScrub").then((module) => module.LaptopScrub),
  { ssr: false, loading: () => <LaptopScrubSkeleton /> },
);

function ContactFormSkeleton() {
  return (
    <div className="mt-8 space-y-5" aria-hidden="true" data-contact-skeleton>
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1].map((column) => (
          <div key={column} className="space-y-2">
            <div className="h-4 w-24 rounded bg-line/60" />
            <div className="h-[46px] rounded-lg border border-line bg-background" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-28 rounded bg-line/60" />
        <div className="h-[46px] rounded-lg border border-line bg-background" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-line/60" />
        <div className="h-[132px] rounded-lg border border-line bg-background" />
      </div>
      <div className="h-11 w-36 rounded-full bg-line/60" />
    </div>
  );
}

function LaptopScrubSkeleton() {
  return (
    <div className="laptop-scrub" aria-hidden="true" data-laptop-skeleton>
      <div className="laptop-scrub-glow" />
      <div className="laptop-frame-stage animate-pulse" />
    </div>
  );
}

function LazyOnView({
  children,
  placeholder,
  rootMargin = "600px",
}: {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      return;
    }

    const element = containerRef.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setVisible(true), 0);

      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return <div ref={containerRef}>{visible ? children : placeholder}</div>;
}

function GithubMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.51 2.87 8.33 6.84 9.68.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.23 10.23 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function localized(
  value: LocalizedString,
  locale: string,
  fallback: string,
): string {
  return value[locale] ?? value[fallback] ?? Object.values(value)[0] ?? "";
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
    <AppFrame site={site} dictionaries={dictionaries}>
      <PortfolioContent site={site} projects={projects} year={year} />
    </AppFrame>
  );
}

function PortfolioContent({
  site,
  projects,
  year,
}: Omit<PortfolioShellProps, "dictionaries">) {
  const { t, locale } = useLocale();
  const aboutSectionRef = useRef<HTMLElement>(null);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 751px)");
    const update = () => setShowSplash(query.matches);
    const timer = window.setTimeout(update, 0);

    query.addEventListener("change", update);

    return () => {
      window.clearTimeout(timer);
      query.removeEventListener("change", update);
    };
  }, []);
  const features = site.features;
  const role = localized(site.role, locale, site.defaultLocale);
  const pitch = localized(site.pitch, locale, site.defaultLocale);
  const aboutIntro =
    localized(site.about.intro, locale, site.defaultLocale) || pitch;
  const contactLabels =
    site.contact.labels[locale] ??
    site.contact.labels[site.defaultLocale] ??
    [];
  const heroPhoto = site.hero.photo ?? "/demo/avatar.svg";
  const showDemoPhotoCaption = site.hero.photo === null;
  const cvFile = features.cv ? site.cv.file : null;
  const cvWordFile = features.cv ? site.cv.downloadFile : null;

  const socialLinks = [
    site.links.github ? { href: site.links.github, label: "GitHub" } : null,
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

  const mailtoHref = `mailto:${site.email}`;

  const projectCountLabel = (
    projects.length === 1 ? t.projects.countOne : t.projects.countMany
  ).replace("{count}", projects.length.toLocaleString(locale));

  return (
    <>
      <main id="main" className="page-main page-container flex-1">
        <section id="home" className="hero-grid">
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
              {cvFile ? (
                <a
                  href={cvFile}
                  target="_blank"
                  rel="noopener noreferrer"
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

          <div className="hero-panel-wrap">
            <div className="hero-panel" data-hero-panel aria-hidden="true">
              <div className="hero-panel-inner">
                <div className="hero-splash-poster" />
                {features.splash3d && showSplash ? <HeroSplash /> : null}
                {/* eslint-disable-next-line @next/next/no-img-element -- CSS background LCP replaced with an eager, explicitly sized image. */}
                <img
                  src={heroPhoto}
                  alt=""
                  width={480}
                  height={640}
                  decoding="async"
                  fetchPriority="high"
                  data-hero-photo
                  className="hero-photo"
                />
                <div className="hero-photo-fade" />
                {showDemoPhotoCaption ? (
                  <span className="hero-demo-caption">{t.hero.demoPhoto}</span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section
          id="about"
          ref={aboutSectionRef}
          className="about-section mt-24"
        >
          <div className="about-card rounded-xl border border-line bg-card p-8 shadow-sm sm:p-12">
            <div className={features.laptop ? "about-grid" : undefined}>
              <div className="about-copy">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-text">
                  {t.nav.about}
                </p>
                <h2 className="mt-3">{t.hero.aboutMe}</h2>
                <p className="measure mt-4 text-muted">{aboutIntro}</p>

                {cvFile ? (
                  <a
                    href={cvFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex w-fit rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition hover:-translate-y-0.5"
                  >
                    {t.cv.request}
                  </a>
                ) : null}

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

              {features.laptop ? (
                <LazyOnView placeholder={<LaptopScrubSkeleton />}>
                  <LaptopScrub
                    frames={site.hero.laptopFrames}
                    mobileFrames={site.hero.laptopMobileFrames}
                    intro={aboutIntro}
                    mark={t.visual.portfolio}
                  />
                </LazyOnView>
              ) : null}
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
                    className="group relative flex h-full flex-col rounded-lg border border-line bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl focus-within:border-accent/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1.5">
                          <Image
                            src={project.logo}
                            alt=""
                            width={52}
                            height={52}
                            unoptimized
                            className="h-12 w-12 rounded-md border border-line bg-background object-contain"
                          />
                          {project.repo ? (
                            <span
                              className="inline-flex text-muted"
                              title={t.projectDetail.github}
                              data-testid="showcase-github"
                            >
                              <GithubMark />
                              <span className="sr-only">
                                {t.projectDetail.github}
                              </span>
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <h3>
                            <Link
                              prefetch={false}
                              href={`/projects/${project.slug}`}
                              data-testid="showcase-card"
                              className="after:absolute after:inset-0 after:content-['']"
                            >
                              {localized(
                                project.name,
                                locale,
                                site.defaultLocale,
                              )}
                            </Link>
                          </h3>
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

                    {features.metrics ? (
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
                        variant="card"
                      />
                    ) : null}

                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {project.tech.map((technology) => (
                        <li key={technology}>
                          <a
                            href={techSearchHref(technology)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${technology} — Google (${t.projectDetail.openInNewTab})`}
                            aria-label={`${technology} — Google (${t.projectDetail.openInNewTab})`}
                            className="relative z-10 inline-block rounded-full border border-line bg-background px-2.5 py-1 text-xs text-muted transition duration-200 hover:border-accent/30 hover:bg-accent/10 hover:text-primary-text focus-visible:border-accent/30 focus-visible:bg-accent/10 focus-visible:text-primary-text"
                          >
                            {technology}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {cvFile ? (
          <section id="cv" className="mt-24">
            <div className="rounded-xl border border-line bg-card p-8 shadow-sm sm:p-12">
              <h2>{t.cv.title}</h2>
              <p className="measure mt-4 text-muted">{t.cv.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={cvFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast shadow-lg shadow-accent/20 transition hover:-translate-y-0.5"
                >
                  {t.cv.view}
                </a>
                <span className="text-sm text-muted">{t.cv.download}:</span>
                <a
                  href={cvFile}
                  download
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40 hover:text-primary-text"
                  aria-label={`${t.cv.download} PDF`}
                >
                  <PdfIcon /> <span aria-hidden="true">PDF</span>
                </a>
                {cvWordFile ? (
                  <a
                    href={cvWordFile}
                    download
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40 hover:text-primary-text"
                    aria-label={`${t.cv.download} Word`}
                  >
                    <WordIcon /> <span aria-hidden="true">Word</span>
                  </a>
                ) : null}
              </div>
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
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-text">
                  {t.nav.contact}
                </p>
                <h2 className="mt-3">{t.contact.title}</h2>
                <p className="measure mt-4 text-muted">{pitch}</p>
                <div className="max-w-2xl">
                  <LazyOnView placeholder={<ContactFormSkeleton />}>
                    <ContactForm key={locale} labels={contactLabels} />
                  </LazyOnView>
                </div>
                <p className="mt-6 text-sm text-muted">
                  <a
                    href={mailtoHref}
                    className="transition hover:text-primary-text"
                  >
                    {site.email}
                  </a>
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-line/70">
        <div className="page-container page-footer flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. {t.footer.rights}
          </p>
          <p>{t.footer.builtWith}</p>
        </div>
      </footer>
    </>
  );
}
