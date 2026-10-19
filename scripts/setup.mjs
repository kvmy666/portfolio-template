#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const contentDirectory = path.join(repoRoot, "content");
const projectsDirectory = path.join(contentDirectory, "projects");
const localesDirectory = path.join(contentDirectory, "locales");
const sitePath = path.join(contentDirectory, "site.json");

const DEFAULT_FEATURES = {
  cv: true,
  contact: true,
  metrics: true,
  splash3d: true,
  laptop: true,
};

const DEFAULT_SITE = {
  name: "Your Name",
  role: "Software Engineer",
  pitch: "I build fast, accessible products for the web and Android.",
  email: "you@example.com",
  url: "https://example.com",
  github: "https://github.com/your-handle",
  linkedin: "https://linkedin.com/in/your-handle",
  website: null,
};

const DEFAULT_CV_FILE = "/demo/cv.pdf";

const DEFAULT_ABOUT_INTRO = {
  en: "I turn ideas into fast, accessible products that people enjoy using.",
  ar: "أحوّل الأفكار إلى منتجات سريعة وسهلة الوصول يستمتع الناس باستخدامها.",
};

const LOCALE_META = {
  en: { label: "English", dir: "ltr" },
  ar: { label: "العربية", dir: "rtl" },
  es: { label: "Español", dir: "ltr" },
  fr: { label: "Français", dir: "ltr" },
  de: { label: "Deutsch", dir: "ltr" },
  he: { label: "עברית", dir: "rtl" },
  fa: { label: "فارسی", dir: "rtl" },
  ur: { label: "اردو", dir: "rtl" },
};

const RTL_LOCALES = new Set(["ar", "he", "fa", "ur"]);

const DEFAULT_EN_STRINGS = {
  _meta: "Demo UI strings. Replace these with your own copy.",
  nav: {
    home: "Home",
    about: "About",
    projects: "Projects",
    contact: "Contact",
  },
  hero: {
    aboutMe: "About me",
    portfolio: "Portfolio",
    demo: "Demo",
    demoPhoto: "Demo photo",
  },
  projects: {
    empty: "Projects are coming soon.",
    emptyHint: "Add JSON files under content/projects to fill this grid.",
    countOne: "{count} project",
    countMany: "{count} projects",
    title: "Selected work",
    demo: "Demo",
    repository: "Repository",
    store: "Store",
  },
  projectDetail: {
    backToProjects: "Back to projects",
    overview: "Overview",
    techStack: "Tech stack",
    features: "Features",
    deepDive: "Deep-dive",
    lenses: "Lenses",
    all: "All",
    evidence: "Evidence",
    noMedia: "No media",
    github: "GitHub",
    playStore: "Google Play",
  },
  platforms: {
    web: "Web",
    android: "Android",
    ios: "iOS",
    crossPlatform: "Cross-platform",
  },
  tags: {
    UX: "UX",
    Security: "Security",
    Testing: "Testing",
    Performance: "Performance",
  },
  metrics: {
    title: "Live metrics",
    github: "GitHub stars",
    mirror: "Mirror downloads",
  },
  cv: {
    title: "Curriculum Vitae",
    body: "View or download a copy of my CV.",
    request: "View CV",
    action: "View CV",
    view: "View CV",
    download: "Download",
    openInNewTab: "Open in new tab",
    close: "Close CV preview",
    preview: "CV preview",
  },
  contact: {
    submit: "Send message",
    sending: "Sending…",
    title: "Start a conversation",
    subjectFallback: "Hello",
    name: "Name",
    email: "Email",
    label: "Label",
    message: "Message",
    success: "Thanks — your message has been sent.",
    error: "Something went wrong. Please try again or email me directly.",
    errors: {
      name: "Enter your name (2–80 characters).",
      email: "Enter a valid email address.",
      label: "Choose a subject.",
      message: "Write a message between 10 and 2000 characters.",
    },
  },
  footer: {
    rights: "All rights reserved.",
    builtWith: "Built with Next.js. Demo assets are generated.",
  },
  visual: {
    portfolio: "Portfolio",
    demo: "Demo",
  },
  ui: {
    skipToContent: "Skip to content",
    primaryNav: "Primary",
    language: "Language",
    changeLanguage: "Change language",
    siteControls: "Site controls",
    theme: "Theme",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    email: "Email",
    website: "Website",
  },
};

const USAGE = `Usage: npm run setup [-- --yes] [--projects=N] [--langs=en|en,ar|en,es] [--name=...] [--email=...] [--url=...] [--cv=/path] [--photo=/path] [--force]

Options:
  --yes              Use safe defaults and skip prompts
  --projects=N       Number of demo projects to create (0-50)
  --langs=en[,code]  English only, or English plus one locale
  --name=NAME        Override the display name
  --email=EMAIL      Override the contact email
  --url=URL          Override the public site URL (http or https)
  --cv=/path         Absolute site path for the CV PDF (blank clears it)
  --photo=/path      Absolute site path for the hero photo (blank clears it)
  --force            Allow replacing a demo path that holds a real project
  --help             Show this help`;

class InputError extends Error {}

function fail(message) {
  throw new InputError(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    fail(`Could not read ${relativePath(filePath)}: ${message}`);
  }
}

function readJsonIfExists(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function requireText(value, label) {
  const text = String(value ?? "").trim();
  if (!text) {
    fail(`${label} cannot be empty`);
  }
  return text;
}

function requireEmail(value) {
  const email = requireText(value, "Email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(`"${email}" is not a valid email address`);
  }
  return email;
}

function optionalSitePhoto(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  if (!text.startsWith("/")) {
    fail('--photo must be an absolute site path that starts with "/"');
  }

  return text;
}

function optionalCvFile(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  if (!text.startsWith("/")) {
    fail('cv.file must be null or an absolute site path starting with "/"');
  }

  return text;
}

function savedCvFile(existingSite) {
  if (isPlainObject(existingSite.cv) && Object.hasOwn(existingSite.cv, "file")) {
    return optionalCvFile(existingSite.cv.file);
  }

  return DEFAULT_CV_FILE;
}

function laptopFrames(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    fail("hero.laptopFrames must be null or an array of site paths");
  }

  const frames = value.map((frame) => {
    if (typeof frame !== "string" || !frame.trim().startsWith("/")) {
      fail('Every hero.laptopFrames entry must start with "/"');
    }
    return frame.trim();
  });

  return frames.length > 0 ? frames : null;
}

function optionalUrl(value, label) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  let url;
  try {
    url = new URL(text);
  } catch {
    fail(`${label} must be a valid absolute URL`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    fail(`${label} must use http or https`);
  }

  return url.toString();
}

function requireSiteUrl(value, label) {
  const text = requireText(value, label);
  const url = optionalUrl(text, label);

  if (!url) {
    fail(`${label} must be a valid absolute URL`);
  }

  return url;
}

function parseProjects(value) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) {
    fail("--projects must be an integer from 0 to 50");
  }

  const count = Number(text);
  if (count < 0 || count > 50) {
    fail("--projects must be an integer from 0 to 50");
  }

  return count;
}

function parseLocaleCodes(value) {
  const codes = String(value)
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  if (codes.length < 1 || codes.length > 2) {
    fail("--langs accepts English only (en) or English plus one locale (en,ar)");
  }

  if (codes[0] !== "en") {
    fail("English (en) must be the first locale");
  }

  if (new Set(codes).size !== codes.length) {
    fail("Locale codes must be unique");
  }

  for (const code of codes) {
    if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)) {
      fail(`"${code}" is not a valid locale code`);
    }
  }

  return codes;
}

function parseArgs(argv) {
  const options = {
    yes: false,
    force: false,
    help: false,
    projects: null,
    langs: null,
    name: null,
    email: null,
    url: null,
    cv: undefined,
    photo: undefined,
  };

  for (const argument of argv) {
    if (argument === "--yes") {
      options.yes = true;
    } else if (argument === "--force") {
      options.force = true;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument.startsWith("--projects=")) {
      options.projects = parseProjects(argument.slice("--projects=".length));
    } else if (argument.startsWith("--langs=")) {
      options.langs = parseLocaleCodes(argument.slice("--langs=".length));
    } else if (argument.startsWith("--name=")) {
      options.name = requireText(argument.slice("--name=".length), "Name");
    } else if (argument.startsWith("--email=")) {
      options.email = requireEmail(argument.slice("--email=".length));
    } else if (argument.startsWith("--url=")) {
      options.url = requireSiteUrl(
        argument.slice("--url=".length),
        "Site URL",
      );
    } else if (argument.startsWith("--cv=")) {
      options.cv = optionalCvFile(argument.slice("--cv=".length));
    } else if (argument.startsWith("--photo=")) {
      options.photo = optionalSitePhoto(argument.slice("--photo=".length));
    } else {
      fail(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function localeConfig(code, existingLocales) {
  const existing = Array.isArray(existingLocales)
    ? existingLocales.find(
        (locale) =>
          isPlainObject(locale) &&
          locale.code === code &&
          typeof locale.label === "string" &&
          (locale.dir === "ltr" || locale.dir === "rtl") &&
          typeof locale.htmlLang === "string",
      )
    : undefined;

  if (existing) {
    return {
      code,
      label: existing.label,
      dir: existing.dir,
      htmlLang: existing.htmlLang,
    };
  }

  const meta = LOCALE_META[code];
  return {
    code,
    label: meta?.label ?? code,
    dir: RTL_LOCALES.has(code) ? "rtl" : "ltr",
    htmlLang: code,
  };
}

function readProjectEntries() {
  if (!fs.existsSync(projectsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => {
      const filePath = path.join(projectsDirectory, fileName);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return {
          fileName,
          filePath,
          data,
          valid: isPlainObject(data),
        };
      } catch {
        return { fileName, filePath, data: null, valid: false };
      }
    });
}

function existingLocaleCodes(existingSite) {
  if (!Array.isArray(existingSite.locales)) {
    return ["en", "ar"];
  }

  const codes = existingSite.locales
    .map((locale) => (isPlainObject(locale) ? locale.code : null))
    .filter((code) => typeof code === "string");

  if (
    codes.length >= 1 &&
    codes.length <= 2 &&
    codes[0] === "en" &&
    new Set(codes).size === codes.length &&
    codes.every((code) => /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code))
  ) {
    return codes;
  }

  return ["en", "ar"];
}

function existingBoolean(features, key) {
  return isPlainObject(features) && typeof features[key] === "boolean"
    ? features[key]
    : DEFAULT_FEATURES[key];
}

function existingText(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function existingLink(links, key) {
  if (!isPlainObject(links)) {
    return undefined;
  }
  if (links[key] === null) {
    return null;
  }
  return typeof links[key] === "string" ? links[key] : undefined;
}

async function ask(rl, label, defaultValue) {
  const suffix =
    defaultValue === null || defaultValue === undefined || defaultValue === ""
      ? ""
      : ` [${defaultValue}]`;
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  return answer === "" ? defaultValue : answer;
}

async function askProjectCount(rl, defaultValue) {
  while (true) {
    const answer = await ask(
      rl,
      "How many projects do you have? (0-50)",
      String(defaultValue),
    );
    try {
      return parseProjects(answer);
    } catch (error) {
      if (!(error instanceof InputError)) {
        throw error;
      }
      console.log(`  ${error.message}`);
    }
  }
}

async function askLocaleCodes(rl, currentCodes) {
  const current = currentCodes[1] ?? "";
  const currentChoice =
    current === ""
      ? "1"
      : { ar: "2", es: "3", fr: "4", de: "5" }[current] ?? "6";

  console.log("Language setup:");
  console.log("  1) English only");
  console.log("  2) English + Arabic");
  console.log("  3) English + Spanish");
  console.log("  4) English + French");
  console.log("  5) English + German");
  console.log("  6) English + custom code");

  while (true) {
    const choice = await ask(rl, "Choose 1-6", currentChoice);

    if (choice === "1") {
      return ["en"];
    }

    const fixed = { "2": "ar", "3": "es", "4": "fr", "5": "de" }[choice];
    if (fixed) {
      return ["en", fixed];
    }

    if (choice === "6") {
      const code = await ask(
        rl,
        "Locale code (for example pt-BR)",
        current || "es",
      );
      try {
        return parseLocaleCodes(`en,${code}`);
      } catch (error) {
        if (!(error instanceof InputError)) {
          throw error;
        }
        console.log(`  ${error.message}`);
      }
    } else {
      console.log("  Choose a number from 1 to 6.");
    }
  }
}

async function askOptionalUrl(rl, label, currentValue) {
  const suffix = currentValue ? ` [${currentValue}]` : "";
  const answer = (
    await rl.question(`${label}${suffix} (blank keeps, - clears): `)
  ).trim();

  if (answer === "") {
    return currentValue ?? null;
  }
  if (answer === "-") {
    return null;
  }
  return optionalUrl(answer, label);
}

async function askBoolean(rl, label, defaultValue) {
  const hint = defaultValue ? "Y/n" : "y/N";

  while (true) {
    const answer = (await rl.question(`${label}? [${hint}]: `))
      .trim()
      .toLowerCase();
    if (answer === "") {
      return defaultValue;
    }
    if (answer === "y" || answer === "yes") {
      return true;
    }
    if (answer === "n" || answer === "no") {
      return false;
    }
    console.log("  Answer y or n.");
  }
}

function filteredLocalized(value, codes) {
  if (!isPlainObject(value)) {
    return {};
  }

  const result = {};
  for (const code of codes) {
    if (typeof value[code] === "string" && value[code].trim()) {
      result[code] = value[code].trim();
    }
  }
  return result;
}

function filteredLabels(value, codes) {
  if (!isPlainObject(value)) {
    return {};
  }

  const result = {};
  for (const code of codes) {
    if (
      Array.isArray(value[code]) &&
      value[code].length > 0 &&
      value[code].every((label) => typeof label === "string" && label.trim())
    ) {
      result[code] = value[code].map((label) => label.trim());
    }
  }
  return result;
}

function validateSite(site) {
  if (!isPlainObject(site)) {
    fail("The generated site configuration is not an object");
  }

  requireText(site.name, "Name");
  requireEmail(site.email);
  requireEmail(site.contact?.recipient);
  requireSiteUrl(site.url, "Site URL");

  if (site.defaultLocale !== "en") {
    fail("The setup wizard requires English (en) as the default locale");
  }

  if (!Array.isArray(site.locales) || site.locales.length < 1) {
    fail("At least one locale is required");
  }

  const codes = site.locales.map((locale) => locale.code);
  if (!codes.includes("en")) {
    fail("English (en) must be declared in locales");
  }
  if (new Set(codes).size !== codes.length) {
    fail("Locale codes must be unique");
  }

  for (const locale of site.locales) {
    if (!isPlainObject(locale)) {
      fail("Every locale needs a configuration object");
    }
    if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale.code)) {
      fail(`Invalid locale code: ${locale.code}`);
    }
    requireText(locale.label, `Locale label for ${locale.code}`);
    if (locale.dir !== "ltr" && locale.dir !== "rtl") {
      fail(`Invalid direction for ${locale.code}`);
    }
    requireText(locale.htmlLang, `htmlLang for ${locale.code}`);
  }

  if (!isPlainObject(site.role) || !requireText(site.role.en, "Role")) {
    fail("The role needs an English value");
  }
  if (!isPlainObject(site.pitch) || !requireText(site.pitch.en, "Pitch")) {
    fail("The pitch needs an English value");
  }

  for (const key of Object.keys(DEFAULT_FEATURES)) {
    if (typeof site.features?.[key] !== "boolean") {
      fail(`Feature flag "${key}" must be a boolean`);
    }
  }

  if (!isPlainObject(site.cv)) {
    fail("cv must be an object with a file value");
  }
  if (
    site.cv.file !== null &&
    (typeof site.cv.file !== "string" || !site.cv.file.startsWith("/"))
  ) {
    fail('cv.file must be null or an absolute site path starting with "/"');
  }

  if (!isPlainObject(site.hero)) {
    fail("hero must be an object with a photo value");
  }
  if (
    site.hero.photo !== null &&
    (typeof site.hero.photo !== "string" || !site.hero.photo.startsWith("/"))
  ) {
    fail('hero.photo must be null or an absolute site path starting with "/"');
  }

  if (site.hero.laptopFrames !== null) {
    if (
      !Array.isArray(site.hero.laptopFrames) ||
      site.hero.laptopFrames.some(
        (frame) => typeof frame !== "string" || !frame.startsWith("/"),
      )
    ) {
      fail(
        'hero.laptopFrames must be null or an array of site paths starting with "/"',
      );
    }
  }

  if (
    !isPlainObject(site.about) ||
    !isPlainObject(site.about.intro) ||
    !requireText(site.about.intro.en, "About intro")
  ) {
    fail("about.intro needs an English value");
  }

  for (const key of ["github", "linkedin", "website"]) {
    const value = site.links?.[key];
    if (value !== null && typeof value !== "string") {
      fail(`links.${key} must be a URL or null`);
    }
    if (typeof value === "string") {
      optionalUrl(value, `links.${key}`);
    }
  }

  if (
    !isPlainObject(site.contact.labels) ||
    !Array.isArray(site.contact.labels.en) ||
    site.contact.labels.en.length === 0
  ) {
    fail("contact.labels needs at least one English label");
  }

  for (const code of Object.keys(site.contact.labels)) {
    if (!codes.includes(code)) {
      fail(`contact.labels.${code} is not a declared locale`);
    }
  }
}

function demoProject(index) {
  const words = [
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  const arabicWords = [
    "واحد",
    "اثنان",
    "ثلاثة",
    "أربعة",
    "خمسة",
    "ستة",
    "سبعة",
    "ثمانية",
    "تسعة",
    "عشرة",
  ];
  const englishName = words[index - 1]
    ? `Demo Project ${words[index - 1]}`
    : `Demo Project ${index}`;
  const arabicName = arabicWords[index - 1]
    ? `مشروع تجريبي ${arabicWords[index - 1]}`
    : `مشروع تجريبي ${index}`;
  const platform = ["web", "android", "cross-platform"][(index - 1) % 3];

  return {
    slug: `demo-project-${index}`,
    demo: true,
    name: { en: englishName, ar: arabicName },
    summary: {
      en: "A generated demo project for the portfolio template.",
      ar: "مشروع تجريبي مُنشأ لقالب معرض الأعمال.",
    },
    description: {
      en: "Replace this stub with your own project. The setup wizard creates these demo entries so the layout has something to render.",
      ar: "استبدل هذا النموذج بمشروعك. ينشئ معالج الإعداد هذه الإدخالات التجريبية ليعرض التخطيط محتوى.",
    },
    order: index,
    platform,
    tech: ["TypeScript", "Next.js"],
    features: [
      {
        title: { en: "Fast first paint", ar: "عرض أول سريع" },
        oneLiner: {
          en: "A server-rendered shell reaches the screen quickly.",
          ar: "هيكل يُعرض من الخادم يصل إلى الشاشة بسرعة.",
        },
        description: {
          en: "Server-rendered pages keep the first view quick.",
          ar: "صفحات تُعرض من الخادم تحافظ على سرعة العرض الأول.",
        },
        tags: ["Performance", "UX"],
        media: {
          src: "/demo/feature-1.svg",
          alt: {
            en: "Abstract dashboard with a fast-loading page skeleton.",
            ar: "لوحة تجريدية تعرض هيكل صفحة سريعة التحميل.",
          },
          type: "image",
        },
        evidence: {
          en: "Verified with a performance budget on every build.",
          ar: "تم التحقق عبر ميزانية أداء في كل عملية بناء.",
        },
      },
      {
        title: { en: "Accessible interactions", ar: "تفاعلات سهلة الوصول" },
        oneLiner: {
          en: "Every action is reachable without a pointer.",
          ar: "يمكن الوصول إلى كل إجراء دون مؤشر.",
        },
        description: {
          en: "Keyboard and screen-reader paths are part of the design.",
          ar: "مسارات لوحة المفاتيح وقارئات الشاشة جزء من التصميم.",
        },
        tags: ["UX", "Testing"],
        media: {
          src: "/demo/feature-2.svg",
          alt: {
            en: "Abstract interface with a highlighted keyboard focus ring.",
            ar: "واجهة تجريدية مع إبراز حلقة تركيز لوحة المفاتيح.",
          },
          type: "image",
        },
        evidence: {
          en: "Covered by automated keyboard checks.",
          ar: "مغطى بفحوص آلية للوحة المفاتيح.",
        },
      },
      {
        title: { en: "Validated inputs", ar: "مدخلات مُتحقق منها" },
        oneLiner: {
          en: "One rule set guards the client and the server.",
          ar: "مجموعة قواعد واحدة تحمي العميل والخادم.",
        },
        description: {
          en: "Shared schemas reject malformed content before it reaches the page.",
          ar: "مخططات مشتركة ترفض المحتوى غير الصالح قبل وصوله إلى الصفحة.",
        },
        tags: ["Security", "Testing"],
        media: {
          src: "/demo/feature-3.svg",
          alt: {
            en: "Abstract form with a validation check mark.",
            ar: "نموذج تجريدي مع علامة تحقق.",
          },
          type: "image",
        },
        evidence: null,
      },
    ],
    metrics: null,
    sources: { github: null, mirror: null },
    deepDive: {
      architecture: {
        en: "A single app renders static project routes. Content is validated at build time so malformed entries fail early.",
        ar: "تطبيق واحد يعرض مسارات المشاريع الثابتة. يُتحقق من المحتوى وقت البناء لتظهر الإدخالات غير الصالحة مبكرًا.",
      },
      code: {
        language: "TypeScript",
        snippet:
          "export function assertSlug(value: string): string {\n  if (!/^[a-z0-9-]+$/.test(value)) {\n    throw new Error(`Invalid slug: ${value}`);\n  }\n  return value;\n}",
      },
    },
    repo: null,
    store: null,
    packageId: null,
    logo: `/demo/logo-${((index - 1) % 3) + 1}.svg`,
  };
}

function syncProjects(target, options) {
  let entries = readProjectEntries();
  const readDemoEntries = () =>
    entries
      .filter((entry) => entry.valid && entry.data.demo === true)
      .sort(
        (left, right) =>
          (left.data.order ?? 0) - (right.data.order ?? 0) ||
          left.fileName.localeCompare(right.fileName),
      );

  let demoEntries = readDemoEntries();
  const hasRealProjects = entries.some(
    (entry) => entry.valid && entry.data.demo === false,
  );

  if (target < demoEntries.length) {
    for (const entry of demoEntries.slice(target)) {
      fs.unlinkSync(entry.filePath);
      console.log(`Removed ${relativePath(entry.filePath)}`);
    }
    entries = readProjectEntries();
    demoEntries = readDemoEntries();
  }

  if (hasRealProjects && !options.force) {
    console.log("Real projects found; demo stubs were not added.");
    return;
  }

  let demoCount = demoEntries.length;
  let index = 1;

  while (demoCount < target && index <= 250) {
    const fileName = `demo-${index}.json`;
    const filePath = path.join(projectsDirectory, fileName);
    const existing = entries.find((entry) => entry.fileName === fileName);

    if (existing) {
      if (existing.valid && existing.data.demo === true) {
        index += 1;
        continue;
      }
      if (!options.force) {
        if (existing.valid && existing.data.demo === false) {
          index += 1;
          continue;
        }
        console.log(
          `Skipped ${relativePath(filePath)} because it is not a demo stub.`,
        );
        index += 1;
        continue;
      }
    }

    writeJson(filePath, demoProject(index));
    demoCount += 1;
    console.log(
      `${existing ? "Replaced" : "Created"} ${relativePath(filePath)}`,
    );
    entries = readProjectEntries();
    index += 1;
  }

  if (demoCount < target) {
    console.log(
      `Warning: created ${demoCount} demo stubs because some demo paths hold other files.`,
    );
  }
}

function removeStaleLocaleFiles(codes) {
  if (!fs.existsSync(localesDirectory)) {
    return;
  }

  const selected = new Set(codes);

  for (const fileName of fs.readdirSync(localesDirectory)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }

    const code = fileName.slice(0, -".json".length);
    if (code === "en" || selected.has(code)) {
      continue;
    }

    if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code)) {
      continue;
    }

    const filePath = path.join(localesDirectory, fileName);
    if (!fs.statSync(filePath).isFile()) {
      continue;
    }

    fs.unlinkSync(filePath);
    console.log(
      `Removed ${relativePath(filePath)} because it is not in the selected locales.`,
    );
  }
}

function ensureLocaleFiles(codes) {
  const englishPath = path.join(localesDirectory, "en.json");
  const englishStrings = fs.existsSync(englishPath)
    ? readJson(englishPath)
    : DEFAULT_EN_STRINGS;

  if (!fs.existsSync(englishPath)) {
    writeJson(englishPath, englishStrings);
    console.log("Created content/locales/en.json");
  }

  removeStaleLocaleFiles(codes);

  for (const code of codes) {
    if (code === "en") {
      continue;
    }

    const filePath = path.join(localesDirectory, `${code}.json`);
    if (fs.existsSync(filePath)) {
      continue;
    }

    const strings = structuredClone(englishStrings);
    strings._todo = `Translate this file for ${LOCALE_META[code]?.label ?? code}. Replace every English string.`;
    writeJson(filePath, strings);
    console.log(
      `Created ${relativePath(filePath)} with a _todo marker (translation needed).`,
    );
  }
}

async function collectAnswers(rl, existingSite, projectCount, options) {
  const name = options.name ?? existingText(existingSite.name, DEFAULT_SITE.name);
  const role = existingText(existingSite.role?.en, DEFAULT_SITE.role);
  const email = options.email ?? existingText(existingSite.email, DEFAULT_SITE.email);
  const currentCodes = options.langs ?? existingLocaleCodes(existingSite);
  const savedGithub = existingLink(existingSite.links, "github");
  const savedLinkedin = existingLink(existingSite.links, "linkedin");
  const github =
    savedGithub === undefined ? DEFAULT_SITE.github : savedGithub;
  const linkedin =
    savedLinkedin === undefined ? DEFAULT_SITE.linkedin : savedLinkedin;

  if (!rl) {
    return {
      name,
      role,
      email,
      url: options.url ?? existingSite.url ?? DEFAULT_SITE.url,
      codes: currentCodes,
      projectCount: options.projects ?? projectCount,
      github,
      linkedin,
      photo:
        options.photo !== undefined
          ? options.photo
          : (existingSite.hero?.photo ?? null),
      cvFile:
        options.cv !== undefined
          ? options.cv
          : savedCvFile(existingSite),
      laptopFrames: laptopFrames(existingSite.hero?.laptopFrames),
      aboutIntro: isPlainObject(existingSite.about?.intro)
        ? existingSite.about.intro
        : DEFAULT_ABOUT_INTRO,
      features: {
        cv: existingBoolean(existingSite.features, "cv"),
        contact: existingBoolean(existingSite.features, "contact"),
        metrics: existingBoolean(existingSite.features, "metrics"),
        splash3d: existingBoolean(existingSite.features, "splash3d"),
        laptop: existingBoolean(existingSite.features, "laptop"),
      },
    };
  }

  console.log("");
  const answers = {};

  answers.name =
    options.name ?? (await ask(rl, "Name", name));
  answers.role = await ask(rl, "Role", role);
  answers.projectCount =
    options.projects ?? (await askProjectCount(rl, projectCount));
  answers.codes = options.langs ?? (await askLocaleCodes(rl, currentCodes));
  answers.email = options.email ?? requireEmail(await ask(rl, "Email", email));
  answers.url =
    options.url ??
    requireSiteUrl(
      await ask(rl, "Site URL", existingSite.url ?? DEFAULT_SITE.url),
      "Site URL",
    );
  const currentCvFile = savedCvFile(existingSite);
  const cvAnswer = await ask(
    rl,
    'CV PDF path (blank keeps, "-" clears)',
    currentCvFile ?? "-",
  );
  answers.cvFile = options.cv;
  if (answers.cvFile === undefined) {
    answers.cvFile = cvAnswer === "-" ? null : optionalCvFile(cvAnswer);
  }
  answers.github = await askOptionalUrl(rl, "GitHub URL", github);
  answers.linkedin = await askOptionalUrl(rl, "LinkedIn URL", linkedin);
  answers.photo =
    options.photo !== undefined
      ? options.photo
      : (existingSite.hero?.photo ?? null);
  answers.laptopFrames = laptopFrames(existingSite.hero?.laptopFrames);
  answers.aboutIntro = isPlainObject(existingSite.about?.intro)
    ? existingSite.about.intro
    : DEFAULT_ABOUT_INTRO;
  answers.features = {
    cv: await askBoolean(
      rl,
      "Enable CV",
      existingBoolean(existingSite.features, "cv"),
    ),
    contact: await askBoolean(
      rl,
      "Enable contact section",
      existingBoolean(existingSite.features, "contact"),
    ),
    metrics: await askBoolean(
      rl,
      "Enable live metrics",
      existingBoolean(existingSite.features, "metrics"),
    ),
    splash3d: await askBoolean(
      rl,
      "Enable 3D hero",
      existingBoolean(existingSite.features, "splash3d"),
    ),
    laptop: await askBoolean(
      rl,
      "Enable laptop animation",
      existingBoolean(existingSite.features, "laptop"),
    ),
  };

  return answers;
}

function buildSite(existingSite, answers) {
  const role = filteredLocalized(existingSite.role, answers.codes);
  role.en = requireText(answers.role, "Role");

  const pitch = filteredLocalized(existingSite.pitch, answers.codes);
  pitch.en = existingText(
    existingSite.pitch?.en,
    DEFAULT_SITE.pitch,
  );

  const labels = filteredLabels(existingSite.contact?.labels, answers.codes);
  labels.en = labels.en ?? ["Coop training"];

  const aboutIntro = filteredLocalized(answers.aboutIntro, answers.codes);
  aboutIntro.en = existingText(
    isPlainObject(answers.aboutIntro) ? answers.aboutIntro.en : null,
    DEFAULT_ABOUT_INTRO.en,
  );

  const site = {
    name: requireText(answers.name, "Name"),
    role,
    pitch,
    email: requireEmail(answers.email),
    url: requireSiteUrl(answers.url, "Site URL"),
    links: {
      github: optionalUrl(answers.github, "GitHub URL"),
      linkedin: optionalUrl(answers.linkedin, "LinkedIn URL"),
      website: optionalUrl(
        existingLink(existingSite.links, "website") ?? null,
        "Website URL",
      ),
    },
    defaultLocale: "en",
    locales: answers.codes.map((code) =>
      localeConfig(code, existingSite.locales),
    ),
    features: {
      cv: answers.features.cv,
      contact: answers.features.contact,
      metrics: answers.features.metrics,
      splash3d: answers.features.splash3d,
      laptop: answers.features.laptop,
    },
    contact: {
      recipient: requireEmail(answers.email),
      labels,
    },
    cv: {
      file: optionalCvFile(answers.cvFile ?? null),
    },
    hero: {
      photo: answers.photo ?? null,
      laptopFrames: laptopFrames(answers.laptopFrames),
    },
    about: {
      intro: aboutIntro,
    },
  };

  validateSite(site);
  return site;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(USAGE);
    return;
  }

  const existingSite = readJsonIfExists(sitePath);
  const baseSite = isPlainObject(existingSite) ? existingSite : {};
  const projectEntries = readProjectEntries();
  const projectCount = fs.existsSync(projectsDirectory)
    ? projectEntries.length
    : 3;
  const interactive = !options.yes && process.stdin.isTTY;
  const rl = interactive
    ? createInterface({ input, output })
    : null;

  try {
    const answers = await collectAnswers(
      rl,
      baseSite,
      projectCount,
      options,
    );
    const site = buildSite(baseSite, answers);

    writeJson(sitePath, site);
    console.log(`Wrote ${relativePath(sitePath)}`);

    ensureLocaleFiles(answers.codes);
    syncProjects(answers.projectCount, options);

    console.log("");
    console.log("Next steps:");
    console.log("  1. Run npm run dev");
    console.log("  2. Edit content/site.json, content/projects, and content/locales");
    console.log("  3. Replace the generated demo assets in public/demo");
    console.log("  4. Follow docs/DEPLOY.md when you are ready to deploy");
  } finally {
    rl?.close();
  }
}

main().catch((error) => {
  if (error instanceof InputError) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
