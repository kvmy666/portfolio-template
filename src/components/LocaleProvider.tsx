"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  LocaleConfig,
  LocaleStrings,
  SiteConfig,
} from "@/content/schema";

type LocaleContextValue = {
  locale: string;
  setLocale: (code: string) => void;
  t: LocaleStrings;
  dir: LocaleConfig["dir"];
  isRtl: boolean;
  locales: LocaleConfig[];
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  site: SiteConfig;
  dictionaries: Record<string, LocaleStrings>;
  children: ReactNode;
};

function readStoredLocale(): string | null {
  try {
    return window.localStorage.getItem("locale");
  } catch {
    return null;
  }
}

export function LocaleProvider({
  site,
  dictionaries,
  children,
}: LocaleProviderProps) {
  const defaultLocale = site.defaultLocale;
  const [locale, setLocaleState] = useState(defaultLocale);

  const localeMap = useMemo(
    () => new Map(site.locales.map((item) => [item.code, item])),
    [site.locales],
  );

  const applyLocale = useCallback(
    (code: string) => {
      const config = localeMap.get(code) ?? localeMap.get(defaultLocale);

      if (!config) {
        return;
      }

      document.documentElement.lang = config.htmlLang;
      document.documentElement.dir = config.dir;
      setLocaleState(config.code);
    },
    [defaultLocale, localeMap],
  );

  useEffect(() => {
    const stored = readStoredLocale();

    if (!stored || stored === locale || !localeMap.has(stored)) {
      return;
    }

    const timer = window.setTimeout(() => applyLocale(stored), 0);

    return () => window.clearTimeout(timer);
  }, [applyLocale, locale, localeMap]);

  const setLocale = useCallback(
    (code: string) => {
      if (!localeMap.has(code)) {
        return;
      }

      applyLocale(code);

      try {
        window.localStorage.setItem("locale", code);
      } catch {
        // Storage can be unavailable in private browsing; the session still works.
      }
    },
    [applyLocale, localeMap],
  );

  const value = useMemo<LocaleContextValue>(() => {
    const config = localeMap.get(locale) ?? localeMap.get(defaultLocale);
    const dictionary =
      dictionaries[locale] ??
      dictionaries[defaultLocale] ??
      dictionaries[site.locales[0]?.code ?? defaultLocale];

    return {
      locale,
      setLocale,
      t: dictionary,
      dir: config?.dir ?? "ltr",
      isRtl: (config?.dir ?? "ltr") === "rtl",
      locales: site.locales,
    };
  }, [
    defaultLocale,
    dictionaries,
    locale,
    localeMap,
    setLocale,
    site.locales,
  ]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }

  return context;
}
