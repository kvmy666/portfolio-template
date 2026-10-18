import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import { siteConfig } from "../../site.config";
import { defaultLocale, getLocaleConfig, localized } from "@/i18n";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--font-arabic",
  display: "swap",
});

const localeConfig = getLocaleConfig(defaultLocale);
const role = localized(siteConfig.role, defaultLocale);
const pitch = localized(siteConfig.pitch, defaultLocale);

const localeBootstrap = Object.fromEntries(
  siteConfig.locales.map((locale) => [
    locale.code,
    { htmlLang: locale.htmlLang, dir: locale.dir },
  ]),
);

const initScript = `(function(){try{var root=document.documentElement;var theme=localStorage.getItem("theme");root.dataset.theme=theme==="light"?"light":"dark";var locales=${JSON.stringify(
  localeBootstrap,
)};var stored=localStorage.getItem("locale");if(stored&&Object.prototype.hasOwnProperty.call(locales,stored)){root.lang=locales[stored].htmlLang;root.dir=locales[stored].dir;}}catch(error){}})();`;

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
  themeColor: "#00b13f",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={localeConfig.htmlLang}
      dir={localeConfig.dir}
      data-theme="dark"
      suppressHydrationWarning
      className={`${displayFont.variable} ${bodyFont.variable} ${arabicFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        {children}
      </body>
    </html>
  );
}
