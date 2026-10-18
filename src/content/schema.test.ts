import { describe, expect, it } from "vitest";

import siteJson from "../../content/site.json";
import {
  ProjectSchema,
  ProjectsSchema,
  SiteConfigSchema,
} from "./schema";

type SiteFixture = {
  name: string;
  role: Record<string, string>;
  pitch: Record<string, string>;
  email: string;
  links: {
    github: string | null;
    linkedin: string | null;
    website: string | null;
  };
  defaultLocale: string;
  locales: { code: string; label: string; dir: string; htmlLang: string }[];
  features: {
    cv: boolean;
    contact: boolean;
    metrics: boolean;
    splash3d: boolean;
    laptop: boolean;
  };
  contact: {
    recipient: string;
    labels: Record<string, string[]>;
  };
};

function validSite(): SiteFixture {
  return structuredClone(siteJson) as SiteFixture;
}

function validProject() {
  return {
    slug: "demo-project-fixture",
    demo: true,
    name: { en: "Demo Project Fixture" },
    summary: { en: "A short fixture summary." },
    description: { en: "A fixture description for schema tests." },
    order: 1,
    platform: "web" as const,
    tech: ["TypeScript"],
    features: [
      {
        title: { en: "Fast by default" },
        description: { en: "A short feature description." },
        tags: ["Performance" as const],
      },
    ],
    metrics: null,
    repo: null,
    store: null,
    packageId: null,
    logo: "/demo/logo-1.svg",
  };
}

describe("SiteConfigSchema", () => {
  it("accepts the demo site configuration", () => {
    const result = SiteConfigSchema.safeParse(validSite());

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe(siteJson.name);
      expect(result.data.defaultLocale).toBe(siteJson.defaultLocale);
      expect(result.data.locales).toHaveLength(siteJson.locales.length);
    }
  });

  it("rejects role content without the default locale key", () => {
    const fixture = validSite();
    const { defaultLocale } = fixture;
    delete fixture.role[defaultLocale];

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["role", defaultLocale],
            message: expect.stringContaining("default locale"),
          }),
        ]),
      );
    }
  });

  it("rejects an invalid text direction", () => {
    const fixture = validSite();
    fixture.locales[0].dir = "sideways";

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["locales", 0, "dir"],
          }),
        ]),
      );
    }
  });

  it("rejects a defaultLocale that is not declared in locales", () => {
    const fixture = validSite();
    fixture.defaultLocale = "fr";

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["defaultLocale"],
          }),
        ]),
      );
    }
  });

  it("rejects unknown top-level keys", () => {
    const result = SiteConfigSchema.safeParse({
      ...validSite(),
      unexpected: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("ProjectsSchema", () => {
  it("accepts a valid demo project", () => {
    const result = ProjectSchema.safeParse(validProject());

    expect(result.success).toBe(true);
  });

  it("rejects duplicate project slugs", () => {
    const project = ProjectSchema.parse(validProject());
    const duplicate = structuredClone(project);

    const result = ProjectsSchema.safeParse([project, duplicate]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: [1, "slug"],
            message: expect.stringContaining("Duplicate project slug"),
          }),
        ]),
      );
    }
  });
});
