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
  hero: {
    photo: string | null;
    laptopFrames: string[] | null;
  };
  about: {
    intro: Record<string, string>;
  };
};

function validSite(): SiteFixture {
  return structuredClone(siteJson) as SiteFixture;
}

type ProjectFixture = {
  slug: string;
  demo: boolean;
  name: Record<string, string>;
  summary: Record<string, string>;
  description: Record<string, string>;
  order: number;
  platform: "web" | "android" | "ios" | "cross-platform";
  tech: string[];
  features: {
    title: Record<string, string>;
    oneLiner: Record<string, string>;
    description: Record<string, string>;
    tags: ("UX" | "Security" | "Testing" | "Performance")[];
    media: {
      src: string;
      alt: Record<string, string>;
      type: "image" | "video";
    } | null;
    evidence: Record<string, string> | null;
  }[];
  metrics: { github: number | null; mirror: number | null } | null;
  sources: { github: string | null; mirror: string | null };
  deepDive: {
    architecture: Record<string, string> | null;
    code: { language: string; snippet: string } | null;
  };
  repo: string | null;
  store: string | null;
  packageId: string | null;
  logo: string;
};

function validProject(): ProjectFixture {
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
        oneLiner: { en: "Instant first paint" },
        description: { en: "A short feature description." },
        tags: ["Performance" as const],
        media: {
          src: "/demo/feature-1.svg",
          alt: { en: "Abstract performance dashboard" },
          type: "image" as const,
        },
        evidence: { en: "Measured with Lighthouse." },
      },
    ],
    metrics: null,
    sources: { github: null, mirror: null },
    deepDive: {
      architecture: { en: "A small server-rendered app." },
      code: {
        language: "TypeScript",
        snippet: "export const value = 1;",
      },
    },
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

  it("accepts a null or absolute hero photo path", () => {
    const noPhoto = validSite();
    noPhoto.hero.photo = null;
    expect(SiteConfigSchema.safeParse(noPhoto).success).toBe(true);

    const withPhoto = validSite();
    withPhoto.hero.photo = "/demo/avatar.svg";
    expect(SiteConfigSchema.safeParse(withPhoto).success).toBe(true);
  });

  it("accepts null, empty, and absolute laptop frame paths", () => {
    const noFrames = validSite();
    noFrames.hero.laptopFrames = null;
    expect(SiteConfigSchema.safeParse(noFrames).success).toBe(true);

    const emptyFrames = validSite();
    emptyFrames.hero.laptopFrames = [];
    expect(SiteConfigSchema.safeParse(emptyFrames).success).toBe(true);

    const withFrames = validSite();
    withFrames.hero.laptopFrames = [
      "/frames/frame-001.webp",
      "/frames/frame-002.webp",
    ];
    expect(SiteConfigSchema.safeParse(withFrames).success).toBe(true);
  });

  it("rejects a relative laptop frame path", () => {
    const fixture = validSite();
    fixture.hero.laptopFrames = ["frames/frame-001.webp"];

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["hero", "laptopFrames", 0],
          }),
        ]),
      );
    }
  });

  it("requires about.intro in the default locale", () => {
    const fixture = validSite();
    delete fixture.about.intro[fixture.defaultLocale];

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["about", "intro", fixture.defaultLocale],
            message: expect.stringContaining("default locale"),
          }),
        ]),
      );
    }
  });

  it("rejects about.intro locales that are not declared", () => {
    const fixture = validSite();
    fixture.about.intro.fr = "Bonjour";

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["about", "intro", "fr"],
          }),
        ]),
      );
    }
  });

  it("rejects a relative hero photo path", () => {
    const fixture = validSite();
    fixture.hero.photo = "demo/avatar.svg";

    const result = SiteConfigSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["hero", "photo"],
          }),
        ]),
      );
    }
  });
});

describe("ProjectsSchema", () => {
  it("accepts a valid demo project", () => {
    const result = ProjectSchema.safeParse(validProject());

    expect(result.success).toBe(true);
  });

  it("accepts nullable media, evidence, and deep-dive", () => {
    const fixture = validProject();
    fixture.features[0].media = null;
    fixture.features[0].evidence = null;
    fixture.deepDive.architecture = null;
    fixture.deepDive.code = null;

    expect(ProjectSchema.safeParse(fixture).success).toBe(true);
  });

  it("requires one-liners in the default locale", () => {
    const fixture = validProject();
    delete fixture.features[0].oneLiner.en;

    const result = ProjectSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["features", 0, "oneLiner", "en"],
            message: expect.stringContaining("default locale"),
          }),
        ]),
      );
    }
  });

  it("requires media alt text in the default locale", () => {
    const fixture = validProject();
    if (!fixture.features[0].media) {
      throw new Error("Fixture media should exist");
    }
    delete fixture.features[0].media.alt.en;

    const result = ProjectSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["features", 0, "media", "alt", "en"],
          }),
        ]),
      );
    }
  });

  it("rejects a relative media path", () => {
    const fixture = validProject();
    if (!fixture.features[0].media) {
      throw new Error("Fixture media should exist");
    }
    fixture.features[0].media.src = "demo/feature-1.svg";

    const result = ProjectSchema.safeParse(fixture);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["features", 0, "media", "src"],
          }),
        ]),
      );
    }
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
