import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { LocaleStringsSchema } from "@/content/schema";

const repoRoot = process.cwd();
const localesDirectory = path.join(repoRoot, "content", "locales");
const componentsDirectory = path.join(repoRoot, "src", "components");

function readDictionary(code: string): Record<string, unknown> {
  const filePath = path.join(localesDirectory, `${code}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    unknown
  >;
}

function flattenKeys(
  value: Record<string, unknown>,
  prefix = "",
): string[] {
  return Object.entries(value)
    .flatMap(([key, entry]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
        return flattenKeys(entry as Record<string, unknown>, fullKey);
      }

      return [fullKey];
    })
    .sort();
}

function flattenValues(
  value: Record<string, unknown>,
  prefix = "",
): { key: string; value: unknown }[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
      return flattenValues(entry as Record<string, unknown>, fullKey);
    }

    return [{ key: fullKey, value: entry }];
  });
}

const en = readDictionary("en");
const ar = readDictionary("ar");

describe("locale dictionaries", () => {
  it("have exactly the same key set", () => {
    expect(flattenKeys(ar)).toEqual(flattenKeys(en));
  });

  it("contain no empty strings", () => {
    for (const [code, dictionary] of [
      ["en", en],
      ["ar", ar],
    ] as const) {
      const empty = flattenValues(dictionary)
        .filter(
          ({ value }) =>
            typeof value !== "string" || value.trim().length === 0,
        )
        .map(({ key }) => `${code}.${key}`);

      expect(empty).toEqual([]);
    }
  });

  it("match LocaleStringsSchema", () => {
    expect(LocaleStringsSchema.safeParse(en).success).toBe(true);
    expect(LocaleStringsSchema.safeParse(ar).success).toBe(true);
  });
});

describe("component copy", () => {
  const forbidden = [
    "Selected work",
    "Back to projects",
    "Curriculum Vitae",
    "Downloads",
    "Stars",
    "Demo photo",
    "Request CV",
  ];

  it("does not hardcode translatable UI strings in components", () => {
    const componentFiles = fs
      .readdirSync(componentsDirectory)
      .filter((file) => file.endsWith(".tsx"))
      .map((file) => path.join(componentsDirectory, file));

    const violations = componentFiles.flatMap((filePath) => {
      const source = fs.readFileSync(filePath, "utf8");

      return forbidden
        .filter((phrase) => source.includes(phrase))
        .map(
          (phrase) =>
            `${path.relative(repoRoot, filePath)}: "${phrase}"`,
        );
    });

    expect(violations).toEqual([]);
  });
});
