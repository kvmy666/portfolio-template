"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { BackArrow } from "./BackArrow";
import { useLocale } from "./LocaleProvider";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </svg>
  );
}

function LocaleSwitcher() {
  const { locale, locales, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = locales.find((item) => item.code === locale) ?? locales[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && !triggerRef.current?.parentElement?.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!current || locales.length <= 1) {
    return null;
  }

  const label = `${current.code.toUpperCase()} — ${t.ui.changeLanguage}: ${current.label}`;

  if (locales.length === 2) {
    const nextIndex =
      (locales.findIndex((item) => item.code === locale) + 1) % locales.length;
    const next = locales[nextIndex];

    return (
      <button
        ref={triggerRef}
        type="button"
        className="utility-button"
        aria-label={label}
        title={`${t.ui.language}: ${current.label}`}
        onClick={() => setLocale(next.code)}
      >
        {current.code.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="utility-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${t.ui.language}: ${current.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        {current.code.toUpperCase()}
      </button>

      {open ? (
        <div className="locale-menu" role="menu" aria-label={t.ui.language}>
          {locales.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={item.code === locale}
              className="locale-menu-item"
              onClick={() => {
                setLocale(item.code);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              <span>{item.label}</span>
              <span aria-hidden="true">{item.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ThemeToggle() {
  const { t } = useLocale();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTheme(
        document.documentElement.dataset.theme === "light" ? "light" : "dark",
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const isLight = theme === "light";
  const label = isLight ? t.ui.switchToDark : t.ui.switchToLight;

  return (
    <button
      type="button"
      className="utility-button"
      aria-label={label}
      title={`${t.ui.theme}: ${isLight ? t.ui.switchToDark : t.ui.switchToLight}`}
      aria-pressed={isLight}
      onClick={() => {
        const next = isLight ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        setTheme(next);

        try {
          window.localStorage.setItem("theme", next);
        } catch {
          // Storage can be unavailable in private browsing; the session still works.
        }
      }}
    >
      {isLight ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

export function Utilities({ backHref }: { backHref?: string }) {
  const { t } = useLocale();

  return (
    <aside
      className="utilities ltr:flex-row-reverse"
      aria-label={t.ui.siteControls}
    >
      {backHref ? (
        <Link
          prefetch={false}
          href={backHref}
          className="utility-button"
          aria-label={t.projectDetail.backToProjects}
          title={t.projectDetail.backToProjects}
        >
          <BackArrow />
        </Link>
      ) : null}
      <LocaleSwitcher />
      <ThemeToggle />
    </aside>
  );
}
