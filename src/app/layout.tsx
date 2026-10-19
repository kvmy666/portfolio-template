import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { siteConfig } from "../../site.config";
import { defaultLocale, getLocaleConfig, localized } from "@/i18n";
import "./globals.css";

const display = localFont({
  src: [
    { path: "../fonts/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/space-grotesk-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: false,
});

const body = localFont({
  src: [
    { path: "../fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

const arabic = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-arabic-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-arabic-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
  preload: false,
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
      className={`${display.variable} ${body.variable} ${arabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        {children}
      </body>
    </html>
  );
}
