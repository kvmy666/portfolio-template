import { siteConfig } from "../../site.config";
import { PortfolioShell } from "@/components/PortfolioShell";
import { getLocaleStrings } from "@/content/locales.server";
import { getAllProjects } from "@/content/projects.server";
import type { LocaleStrings } from "@/content/schema";
import { getCopyrightYear } from "@/lib/build-time";

export default async function Home() {
  const projects = getAllProjects();
  const year = await getCopyrightYear();

  const dictionaries = Object.fromEntries(
    siteConfig.locales.map((locale) => [
      locale.code,
      getLocaleStrings(locale.code),
    ]),
  ) as Record<string, LocaleStrings>;

  return (
    <PortfolioShell
      site={siteConfig}
      projects={projects}
      dictionaries={dictionaries}
      year={year}
    />
  );
}
