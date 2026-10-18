import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "../../site.config";
import { defaultLocale, getLocaleConfig, localized } from "@/i18n";
import "./globals.css";

const localeConfig = getLocaleConfig(defaultLocale);
const role = localized(siteConfig.role, defaultLocale);
const pitch = localized(siteConfig.pitch, defaultLocale);

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${role}`,
  description: pitch,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  keywords: [role, "portfolio", "software", "projects"],
  openGraph: {
    title: `${siteConfig.name} — ${role}`,
    description: pitch,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${siteConfig.name} — ${role}`,
    description: pitch,
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={localeConfig.htmlLang}
      dir={localeConfig.dir}
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
