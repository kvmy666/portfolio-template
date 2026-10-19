import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { siteConfig } from "../../site.config";
import { defaultLocale, getLocaleConfig, localized } from "@/i18n";
import "./globals.css";

const display = localFont({
  src: [
    { path: "../fonts/space-grotesk-variable.woff2", weight: "300 700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

const body = localFont({
  src: [
    { path: "../fonts/inter-variable.woff2", weight: "100 900", style: "normal" },
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
const title = `${siteConfig.name} — ${role}`;
const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteConfig.name} — ${role}`,
};

const localeBootstrap = Object.fromEntries(
  siteConfig.locales.map((locale) => [
    locale.code,
    { htmlLang: locale.htmlLang, dir: locale.dir },
  ]),
);

const initScript = `(function(){try{var root=document.documentElement;var theme=localStorage.getItem("theme");root.dataset.theme=theme==="light"?"light":"dark";var locales=${JSON.stringify(
  localeBootstrap,
)};var stored=localStorage.getItem("locale");if(stored&&Object.prototype.hasOwnProperty.call(locales,stored)){root.lang=locales[stored].htmlLang;root.dir=locales[stored].dir;}}catch(error){}})();`;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  jobTitle: role,
  url: siteConfig.url,
  email: siteConfig.email,
  sameAs: [siteConfig.links.github, siteConfig.links.linkedin].filter(
    (link): link is string => link !== null,
  ),
};

const personJsonLdScript = JSON.stringify(personJsonLd).replace(
  /</g,
  "\\u003c",
);

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title,
  description: pitch,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  keywords: [role, "portfolio", "software", "projects"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title,
    description: pitch,
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: pitch,
    images: [socialImage],
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
        <link
          rel="preload"
          as="image"
          href={siteConfig.hero.photo ?? "/demo/avatar.svg"}
          fetchPriority="high"
        />
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLdScript }}
        />
        {children}
      </body>
    </html>
  );
}
