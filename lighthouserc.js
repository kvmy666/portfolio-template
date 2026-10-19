const fs = module.require("node:fs");
const path = module.require("node:path");

function firstProjectSlug() {
  const override = (process.env.LHCI_PROJECT_SLUG || "").trim();

  if (override) {
    return override;
  }

  const projectsDirectory = path.join(__dirname, "content", "projects");

  if (!fs.existsSync(projectsDirectory)) {
    return null;
  }

  const files = fs
    .readdirSync(projectsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  for (const fileName of files) {
    try {
      const project = JSON.parse(
        fs.readFileSync(path.join(projectsDirectory, fileName), "utf8"),
      );

      if (typeof project.slug === "string" && project.slug.trim().length > 0) {
        return project.slug.trim();
      }
    } catch {
      // Content validation reports malformed files; skip them here.
    }
  }

  return null;
}

const projectSlug = firstProjectSlug();
const urls = ["http://localhost:3000"];

if (projectSlug) {
  urls.push(`http://localhost:3000/projects/${projectSlug}`);
}

module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      url: urls,
      numberOfRuns: Number(process.env.LHCI_NUMBER_OF_RUNS || 3),
      settings: {
        chromeFlags: "--no-sandbox",
        throttlingMethod: "devtools",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
        "first-contentful-paint": ["error", { maxNumericValue: 1500 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 200000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./.lighthouseci",
    },
  },
};
