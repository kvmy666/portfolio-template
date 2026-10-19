import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "../../../../site.config";
import { ProjectView } from "@/components/ProjectView";
import { getLocaleStrings } from "@/content/locales.server";
import { getAllProjects, getProject } from "@/content/projects.server";
import type { LocaleStrings } from "@/content/schema";
import { localized } from "@/i18n";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return { title: `Not found — ${siteConfig.name}` };
  }

  const name = localized(project.name, siteConfig.defaultLocale);
  const summary = localized(project.summary, siteConfig.defaultLocale);

  return {
    title: `${name} — ${siteConfig.name}`,
    description: summary,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const dictionaries = Object.fromEntries(
    siteConfig.locales.map((locale) => [
      locale.code,
      getLocaleStrings(locale.code),
    ]),
  ) as Record<string, LocaleStrings>;

  return (
    <ProjectView
      project={project}
      site={siteConfig}
      dictionaries={dictionaries}
    />
  );
}
