import Image from "next/image";

import { siteConfig } from "../../site.config";
import { getLocaleStrings } from "@/content/locales.server";
import { getAllProjects } from "@/content/projects.server";
import type { FeatureTag, Project } from "@/content/schema";
import { defaultLocale, localized } from "@/i18n";
import { getCopyrightYear } from "@/lib/build-time";

const platformLabels: Record<Project["platform"], string> = {
  web: "Web",
  android: "Android",
  ios: "iOS",
  "cross-platform": "Cross-platform",
};

const tagStyles: Record<FeatureTag, string> = {
  UX: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Security: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Testing: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Performance: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

function getInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "YN";
}

export default async function Home() {
  const locale = defaultLocale;
  const strings = getLocaleStrings(locale);
  const projects = getAllProjects();
  const role = localized(siteConfig.role, locale);
  const pitch = localized(siteConfig.pitch, locale);
  const contactLabels =
    siteConfig.contact.labels[locale] ??
    siteConfig.contact.labels[defaultLocale] ??
    [];
  const features = siteConfig.features;
  const showVisual = features.splash3d || features.laptop;
  const year = await getCopyrightYear();

  const navItems = [
    { href: "#home", label: strings.nav.home },
    { href: "#about", label: strings.nav.about },
    { href: "#projects", label: strings.nav.projects },
    ...(features.contact
      ? [{ href: "#contact", label: strings.nav.contact }]
      : []),
  ];

  const socialLinks = [
    siteConfig.links.github
      ? { href: siteConfig.links.github, label: "GitHub" }
      : null,
    siteConfig.links.linkedin
      ? { href: siteConfig.links.linkedin, label: "LinkedIn" }
      : null,
    siteConfig.links.website
      ? { href: siteConfig.links.website, label: "Website" }
      : null,
    { href: `mailto:${siteConfig.email}`, label: "Email" },
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

  const mailtoHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
    contactLabels[0] ?? "Hello",
  )}`;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div className="page-glow pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />

      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 font-medium text-accent-contrast focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <a href="#home" className="text-sm font-semibold tracking-tight">
            {siteConfig.name}
          </a>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 pt-14 sm:pt-20"
      >
        <section
          id="home"
          className={`scroll-mt-24 ${
            showVisual
              ? "grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
              : ""
          }`}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {role}
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              {siteConfig.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              {pitch}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {strings.nav.projects}
              </a>
              <a
                href="#about"
                className="rounded-full border border-line bg-card px-5 py-3 text-sm font-semibold transition hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {strings.hero.aboutMe}
              </a>
              {features.cv ? (
                <a
                  href={`mailto:${siteConfig.email}?subject=CV%20request`}
                  className="rounded-full px-5 py-3 text-sm font-semibold text-muted transition hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Request CV
                </a>
              ) : null}
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-flex items-center gap-1.5 transition hover:text-accent"
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                  >
                    {link.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {showVisual ? (
            <div className="space-y-10">
              {features.splash3d ? (
                <div className="hero-scene mx-auto w-full max-w-sm" aria-hidden="true">
                  <div className="hero-card relative overflow-hidden rounded-[2rem] p-7 text-white">
                    <div className="hero-card-grid absolute inset-0 opacity-40" />
                    <div className="relative flex items-center justify-between">
                      <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
                        Portfolio
                      </span>
                      <span className="text-xs text-white/70">Demo</span>
                    </div>
                    <div className="relative mt-16 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/30 bg-white/15 text-3xl font-semibold tracking-tight backdrop-blur">
                      {getInitials(siteConfig.name)}
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
                <div className="laptop-stage mx-auto w-full max-w-md" aria-hidden="true">
                  <div className="laptop-screen overflow-hidden p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="h-2 w-24 rounded-full bg-indigo-400/70" />
                      <div className="mt-4 space-y-2.5">
                        <div className="code-line w-full" />
                        <div className="code-line w-5/6" />
                        <div className="code-line w-2/3" />
                        <div className="code-line w-3/4" />
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
                          <div className="h-1.5 w-10 rounded-full bg-cyan-300/70" />
                          <div className="mt-2 h-1.5 w-14 rounded-full bg-white/20" />
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-3">
                          <div className="h-1.5 w-8 rounded-full bg-fuchsia-300/70" />
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

        <section id="about" className="mt-28 scroll-mt-24">
          <div className="rounded-[2rem] border border-line bg-card p-8 shadow-sm sm:p-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {strings.nav.about}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {strings.hero.aboutMe}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
                  {pitch}
                </p>
              </div>
              {features.cv ? (
                <a
                  href={`mailto:${siteConfig.email}?subject=CV%20request`}
                  className="w-fit rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Request CV
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

        {metricsProjects.length > 0 ? (
          <section aria-labelledby="metrics-heading" className="mt-8">
            <h2 id="metrics-heading" className="sr-only">
              Live metrics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-line bg-card p-6">
                <p className="text-sm font-medium text-muted">GitHub stars</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {githubTotal.toLocaleString(locale)}
                </p>
              </div>
              <div className="rounded-3xl border border-line bg-card p-6">
                <p className="text-sm font-medium text-muted">Mirror downloads</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {mirrorTotal.toLocaleString(locale)}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section id="projects" className="mt-28 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                {strings.nav.projects}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Selected work
              </h2>
            </div>
            <p className="text-sm text-muted">
              {projects.length} {projects.length === 1 ? "project" : "projects"}
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-line bg-card/60 p-12 text-center">
              <p className="text-lg font-medium">{strings.projects.empty}</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                Add JSON files under content/projects to fill this grid.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.slug}
                  className="group flex h-full flex-col rounded-3xl border border-line bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={project.logo}
                        alt=""
                        width={52}
                        height={52}
                        unoptimized
                        className="h-13 w-13 rounded-2xl border border-line bg-background object-contain"
                      />
                      <div>
                        <h3 className="font-semibold tracking-tight">
                          {localized(project.name, locale)}
                        </h3>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-muted">
                          {platformLabels[project.platform]}
                        </p>
                      </div>
                    </div>
                    {project.demo ? (
                      <span className="rounded-full border border-line bg-background px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                        Demo
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-5 flex-1 text-sm leading-6 text-muted">
                    {localized(project.summary, locale)}
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
                      <li key={localized(feature.title, locale)}>
                        <p className="text-sm font-medium">
                          {localized(feature.title, locale)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {feature.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${tagStyles[tag]}`}
                            >
                              {tag}
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
                          className="text-accent hover:underline"
                        >
                          Repository
                        </a>
                      ) : null}
                      {project.store ? (
                        <a
                          href={project.store}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-accent hover:underline"
                        >
                          Store
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        {features.contact ? (
          <section id="contact" className="mt-28 scroll-mt-24">
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card p-8 shadow-sm sm:p-12">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {strings.nav.contact}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Start a conversation
                </h2>
                <p className="mt-4 text-lg leading-8 text-muted">{pitch}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={mailtoHref}
                    className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-contrast shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {strings.contact.submit}
                  </a>
                  <span className="text-sm text-muted">{siteConfig.email}</span>
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 pb-28 text-sm text-muted sm:flex-row sm:items-center sm:justify-between md:pb-8">
          <p>
            © {year} {siteConfig.name}. {strings.footer.rights}
          </p>
          <p>Built with Next.js. Demo assets are generated.</p>
        </div>
      </footer>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[min(92vw,26rem)] items-center gap-1 rounded-full border border-line bg-card/90 p-1.5 shadow-2xl backdrop-blur md:hidden"
      >
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex-1 rounded-full px-2 py-2 text-center text-xs font-medium text-muted transition hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
