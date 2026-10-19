import type { MetadataRoute } from "next";

import { siteConfig } from "../../site.config";
import { getAllProjects } from "@/content/projects.server";

export const dynamic = "force-static";

function absoluteUrl(path: string): string {
  return `${siteConfig.url.replace(/\/$/, "")}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...getAllProjects().map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
