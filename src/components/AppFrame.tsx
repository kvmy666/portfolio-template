"use client";

import type { ReactNode } from "react";

import type { LocaleStrings, SiteConfig } from "@/content/schema";
import { Dock, type DockItemId } from "./Dock";
import { LocaleProvider, useLocale } from "./LocaleProvider";
import { Utilities } from "./Utilities";

type AppFrameProps = {
  site: SiteConfig;
  dictionaries: Record<string, LocaleStrings>;
  children: ReactNode;
  activeDockItem?: DockItemId;
  dockHrefPrefix?: string;
  backHref?: string;
};

export function AppFrame({
  site,
  dictionaries,
  children,
  activeDockItem,
  dockHrefPrefix,
  backHref,
}: AppFrameProps) {
  return (
    <LocaleProvider site={site} dictionaries={dictionaries}>
      <AppFrameChrome
        site={site}
        activeDockItem={activeDockItem}
        dockHrefPrefix={dockHrefPrefix}
        backHref={backHref}
      >
        {children}
      </AppFrameChrome>
    </LocaleProvider>
  );
}

function AppFrameChrome({
  site,
  activeDockItem,
  dockHrefPrefix,
  backHref,
  children,
}: Omit<AppFrameProps, "dictionaries">) {
  const { t } = useLocale();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <div
        className="page-glow pointer-events-none fixed inset-0 -z-10"
        aria-hidden="true"
      />

      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 font-medium text-accent-contrast focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        {t.ui.skipToContent}
      </a>

      <Utilities backHref={backHref} />
      <Dock
        features={site.features}
        activeOverride={activeDockItem}
        hrefPrefix={dockHrefPrefix}
      />

      {children}
    </div>
  );
}
