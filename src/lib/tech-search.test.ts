import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  hasCuratedTechQuery,
  techSearchHref,
  techSearchQuery,
} from "./tech-search";

type DemoProject = { tech?: unknown };

// Read from disk so the test still compiles when setup removes demo projects.
const projectsDir = path.join(process.cwd(), "content", "projects");
const demoProjects: DemoProject[] = fs.existsSync(projectsDir)
  ? fs
      .readdirSync(projectsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) =>
        JSON.parse(fs.readFileSync(path.join(projectsDir, file), "utf8")),
      )
  : [];

describe("techSearchHref", () => {
  it("builds the exact URL for a curated plain name", () => {
    expect(techSearchHref("Kotlin")).toBe(
      "https://www.google.com/search?q=what%20is%20Kotlin%20programming%20language",
    );
  });

  it("disambiguates Room from a physical room", () => {
    expect(techSearchHref("Room")).toMatch(
      /what%20is%20Room%20persistence%20library%20Android$/,
    );
  });

  it("encodes spaces in a curated multi-word technology", () => {
    expect(techSearchHref("Jetpack Compose")).toBe(
      "https://www.google.com/search?q=what%20is%20Jetpack%20Compose%20Android%20UI%20toolkit",
    );
  });

  it("returns curated queries and falls back for unknown names", () => {
    expect(techSearchQuery("TypeScript")).toBe(
      "TypeScript programming language",
    );
    expect(techSearchQuery("Unknown Tech")).toBe("Unknown Tech");
  });

  it("falls back to the raw name for unknown technologies", () => {
    expect(techSearchHref("C++ & C#")).toBe(
      "https://www.google.com/search?q=what%20is%20C%2B%2B%20%26%20C%23",
    );
  });
});

describe("project technology coverage", () => {
  it("has a curated query for every technology label", () => {
    for (const project of demoProjects) {
      const tech = Array.isArray(project.tech) ? project.tech : [];
      const missing = tech.filter(
        (technology) =>
          typeof technology === "string" && !hasCuratedTechQuery(technology),
      );

      expect(missing).toEqual([]);
    }
  });
});
