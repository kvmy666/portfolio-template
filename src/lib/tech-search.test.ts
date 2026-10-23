import { describe, expect, it } from "vitest";

import demo1 from "../../content/projects/demo-1.json";
import demo2 from "../../content/projects/demo-2.json";
import demo3 from "../../content/projects/demo-3.json";
import {
  hasCuratedTechQuery,
  techSearchHref,
  techSearchQuery,
} from "./tech-search";

const projects = [demo1, demo2, demo3];

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
    const missing = projects.flatMap((project) =>
      project.tech.filter((technology) => !hasCuratedTechQuery(technology)),
    );

    expect(missing).toEqual([]);
  });
});
