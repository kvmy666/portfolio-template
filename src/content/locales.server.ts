import "server-only";

import fs from "node:fs";
import path from "node:path";

import { defaultLocale } from "@/i18n";
import { LocaleStringsSchema, type LocaleStrings } from "./schema";

const localesDirectory = path.join(process.cwd(), "content", "locales");

export function getLocaleStrings(code: string): LocaleStrings {
  const filePath = path.join(localesDirectory, `${code}.json`);
  const fallbackPath = path.join(localesDirectory, `${defaultLocale}.json`);
  const selectedPath = fs.existsSync(filePath) ? filePath : fallbackPath;

  if (!fs.existsSync(selectedPath)) {
    throw new Error(
      `Missing locale dictionary. Add content/locales/${code}.json or content/locales/${defaultLocale}.json.`,
    );
  }

  const raw = JSON.parse(fs.readFileSync(selectedPath, "utf8")) as unknown;
  const result = LocaleStringsSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const location = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `- ${location}: ${issue.message}`;
      })
      .join("\n");

    throw new Error(
      `Invalid locale dictionary at ${selectedPath}. Fix these problems before building:\n${details}`,
    );
  }

  return result.data;
}
