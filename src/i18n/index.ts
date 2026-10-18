import { siteConfig } from "../../site.config";
import type { LocaleConfig, LocalizedString } from "@/content/schema";

export const defaultLocale = siteConfig.defaultLocale;

export function getLocaleConfig(code: string): LocaleConfig {
  const config = siteConfig.locales.find((locale) => locale.code === code);

  if (!config) {
    throw new Error(
      `Unknown locale "${code}". Declare it in content/site.json under locales.`,
    );
  }

  return config;
}

export function isRtl(code: string): boolean {
  return getLocaleConfig(code).dir === "rtl";
}

export function localized(value: LocalizedString, locale: string): string {
  return value[locale] ?? value[defaultLocale] ?? Object.values(value)[0] ?? "";
}
