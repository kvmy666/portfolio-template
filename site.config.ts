import rawSiteConfig from "./content/site.json";
import { SiteConfigSchema, type SiteConfig } from "./src/content/schema";

const result = SiteConfigSchema.safeParse(rawSiteConfig);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `- ${path}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(
    `Invalid site configuration in content/site.json. Fix these problems before building:\n${details}`,
  );
}

export const siteConfig: SiteConfig = result.data;
export type { SiteConfig };
