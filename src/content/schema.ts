import { z } from "zod";

export const localeCodeSchema = z
  .string()
  .min(2)
  .max(35)
  .regex(
    /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/,
    "Locale codes must look like en, ar, es, or pt-BR",
  );

export const LocalizedStringSchema = z
  .record(localeCodeSchema, z.string().trim().min(1))
  .refine((value) => Object.keys(value).length > 0, {
    message: "A localized string needs at least one locale",
  });

export const LocaleConfigSchema = z.strictObject({
  code: localeCodeSchema,
  label: z.string().trim().min(1),
  dir: z.enum(["ltr", "rtl"]),
  htmlLang: z.string().trim().min(1),
});

const FeatureFlagsSchema = z.strictObject({
  cv: z.boolean(),
  contact: z.boolean(),
  metrics: z.boolean(),
  splash3d: z.boolean(),
  laptop: z.boolean(),
});

const LinksSchema = z.strictObject({
  github: z.url().nullable(),
  linkedin: z.url().nullable(),
  website: z.url().nullable(),
});

const ContactSchema = z.strictObject({
  recipient: z.email(),
  labels: z.record(localeCodeSchema, z.array(z.string().trim().min(1)).min(1)),
});

type IssueContext = {
  addIssue: (issue: {
    code: "custom";
    message: string;
    path: (string | number)[];
  }) => void;
};

function requireDefaultLocaleKey(
  value: Record<string, unknown>,
  defaultLocale: string,
  path: (string | number)[],
  ctx: IssueContext,
) {
  if (!(defaultLocale in value)) {
    ctx.addIssue({
      code: "custom",
      message: `Missing the default locale key "${defaultLocale}"`,
      path: [...path, defaultLocale],
    });
  }
}

function rejectUnknownLocaleKeys(
  value: Record<string, unknown>,
  allowedLocales: string[],
  path: (string | number)[],
  ctx: IssueContext,
) {
  for (const key of Object.keys(value)) {
    if (!allowedLocales.includes(key)) {
      ctx.addIssue({
        code: "custom",
        message: `Locale "${key}" is not declared in siteConfig.locales`,
        path: [...path, key],
      });
    }
  }
}

export const SiteConfigSchema = z
  .strictObject({
    name: z.string().trim().min(1),
    role: LocalizedStringSchema,
    pitch: LocalizedStringSchema,
    email: z.email(),
    links: LinksSchema,
    defaultLocale: localeCodeSchema,
    locales: z.array(LocaleConfigSchema).min(1),
    features: FeatureFlagsSchema,
    contact: ContactSchema,
  })
  .superRefine((config, ctx) => {
    const codes = config.locales.map((locale) => locale.code);
    const uniqueCodes = new Set(codes);

    if (!codes.includes(config.defaultLocale)) {
      ctx.addIssue({
        code: "custom",
        message: `defaultLocale "${config.defaultLocale}" must appear in locales`,
        path: ["defaultLocale"],
      });
    }

    if (uniqueCodes.size !== codes.length) {
      ctx.addIssue({
        code: "custom",
        message: "Locale codes must be unique",
        path: ["locales"],
      });
    }

    requireDefaultLocaleKey(config.role, config.defaultLocale, ["role"], ctx);
    requireDefaultLocaleKey(config.pitch, config.defaultLocale, ["pitch"], ctx);
    requireDefaultLocaleKey(
      config.contact.labels,
      config.defaultLocale,
      ["contact", "labels"],
      ctx,
    );

    rejectUnknownLocaleKeys(config.role, codes, ["role"], ctx);
    rejectUnknownLocaleKeys(config.pitch, codes, ["pitch"], ctx);
    rejectUnknownLocaleKeys(config.contact.labels, codes, ["contact", "labels"], ctx);
  });

export const featureTagSchema = z.enum([
  "UX",
  "Security",
  "Testing",
  "Performance",
]);

export const ProjectFeatureSchema = z.strictObject({
  title: LocalizedStringSchema,
  description: LocalizedStringSchema,
  tags: z
    .array(featureTagSchema)
    .min(1)
    .refine((tags) => new Set(tags).size === tags.length, {
      message: "Feature tags must be unique",
    }),
});

const ProjectMetricsSchema = z.strictObject({
  github: z.number().int().nonnegative().nullable(),
  mirror: z.number().int().nonnegative().nullable(),
});

const platformSchema = z.enum(["web", "android", "ios", "cross-platform"]);

export function createProjectSchema(defaultLocale: string) {
  return z
    .strictObject({
      slug: z
        .string()
        .min(1)
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          "Slugs must use lowercase letters, numbers, and hyphens",
        ),
      demo: z.boolean(),
      name: LocalizedStringSchema,
      summary: LocalizedStringSchema,
      description: LocalizedStringSchema,
      order: z.number().int().nonnegative(),
      platform: platformSchema,
      tech: z.array(z.string().trim().min(1)).min(1),
      features: z.array(ProjectFeatureSchema).min(1),
      metrics: ProjectMetricsSchema.nullable(),
      repo: z.url().nullable(),
      store: z.url().nullable(),
      packageId: z.string().trim().min(1).nullable(),
      logo: z.string().trim().regex(/^\//, "Logo paths must start with /"),
    })
    .superRefine((project, ctx) => {
      requireDefaultLocaleKey(project.name, defaultLocale, ["name"], ctx);
      requireDefaultLocaleKey(project.summary, defaultLocale, ["summary"], ctx);
      requireDefaultLocaleKey(
        project.description,
        defaultLocale,
        ["description"],
        ctx,
      );

      project.features.forEach((feature, index) => {
        requireDefaultLocaleKey(
          feature.title,
          defaultLocale,
          ["features", index, "title"],
          ctx,
        );
        requireDefaultLocaleKey(
          feature.description,
          defaultLocale,
          ["features", index, "description"],
          ctx,
        );
      });
    });
}

export const ProjectSchema = createProjectSchema("en");

function addDuplicateSlugIssues(
  projects: { slug: string }[],
  ctx: IssueContext,
) {
  const seen = new Map<string, number>();

  projects.forEach((project, index) => {
    const firstIndex = seen.get(project.slug);
    if (firstIndex !== undefined) {
      ctx.addIssue({
        code: "custom",
        message: `Duplicate project slug "${project.slug}" (first used at index ${firstIndex})`,
        path: [index, "slug"],
      });
    } else {
      seen.set(project.slug, index);
    }
  });
}

export function createProjectsSchema(defaultLocale: string) {
  return z
    .array(createProjectSchema(defaultLocale))
    .superRefine((projects, ctx) => addDuplicateSlugIssues(projects, ctx));
}

export const ProjectsSchema = createProjectsSchema("en");

export const LocaleStringsSchema = z.strictObject({
  _meta: z.string().min(1).optional(),
  _todo: z.string().min(1).optional(),
  nav: z.strictObject({
    home: z.string().min(1),
    about: z.string().min(1),
    projects: z.string().min(1),
    contact: z.string().min(1),
  }),
  hero: z.strictObject({
    aboutMe: z.string().min(1),
    portfolio: z.string().min(1),
    demo: z.string().min(1),
  }),
  projects: z.strictObject({
    empty: z.string().min(1),
    emptyHint: z.string().min(1),
    countOne: z.string().min(1),
    countMany: z.string().min(1),
    title: z.string().min(1),
    demo: z.string().min(1),
    repository: z.string().min(1),
    store: z.string().min(1),
  }),
  platforms: z.strictObject({
    web: z.string().min(1),
    android: z.string().min(1),
    ios: z.string().min(1),
    crossPlatform: z.string().min(1),
  }),
  tags: z.strictObject({
    UX: z.string().min(1),
    Security: z.string().min(1),
    Testing: z.string().min(1),
    Performance: z.string().min(1),
  }),
  metrics: z.strictObject({
    title: z.string().min(1),
    github: z.string().min(1),
    mirror: z.string().min(1),
  }),
  cv: z.strictObject({
    title: z.string().min(1),
    body: z.string().min(1),
    request: z.string().min(1),
    action: z.string().min(1),
  }),
  contact: z.strictObject({
    submit: z.string().min(1),
    title: z.string().min(1),
    subjectFallback: z.string().min(1),
  }),
  footer: z.strictObject({
    rights: z.string().min(1),
    builtWith: z.string().min(1),
  }),
  visual: z.strictObject({
    portfolio: z.string().min(1),
    demo: z.string().min(1),
  }),
  ui: z.strictObject({
    skipToContent: z.string().min(1),
    primaryNav: z.string().min(1),
    language: z.string().min(1),
    changeLanguage: z.string().min(1),
    siteControls: z.string().min(1),
    theme: z.string().min(1),
    switchToLight: z.string().min(1),
    switchToDark: z.string().min(1),
    email: z.string().min(1),
    website: z.string().min(1),
  }),
});

export type LocaleConfig = z.infer<typeof LocaleConfigSchema>;
export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type SiteConfigInput = z.input<typeof SiteConfigSchema>;
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type FeatureTag = z.infer<typeof featureTagSchema>;
export type ProjectFeature = z.infer<typeof ProjectFeatureSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectSchema>;
export type LocaleStrings = z.infer<typeof LocaleStringsSchema>;
