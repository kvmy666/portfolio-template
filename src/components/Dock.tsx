"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SiteConfig } from "@/content/schema";
import { useLocale } from "./LocaleProvider";

type DockItemId = "home" | "about" | "projects" | "contact";
type SpySectionId = DockItemId | "cv";

type DockItem = {
  id: DockItemId;
  href: string;
  label: string;
};

type IndicatorBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

const icons: Record<DockItemId, ReactNode> = {
  home: <HomeIcon />,
  about: <AboutIcon />,
  projects: <ProjectsIcon />,
  contact: <ContactIcon />,
};

export function Dock({ features }: { features: SiteConfig["features"] }) {
  const { t, dir } = useLocale();
  const dockRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Partial<Record<DockItemId, HTMLAnchorElement | null>>>(
    {},
  );
  const [active, setActive] = useState<SpySectionId>("home");
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null);

  const items = useMemo<DockItem[]>(
    () => [
      { id: "home", href: "#home", label: t.nav.home },
      { id: "about", href: "#about", label: t.nav.about },
      { id: "projects", href: "#projects", label: t.nav.projects },
      ...(features.contact
        ? [{ id: "contact" as const, href: "#contact", label: t.nav.contact }]
        : []),
    ],
    [features.contact, t.nav],
  );

  const spyIds = useMemo<SpySectionId[]>(
    () => [
      "home",
      "about",
      "projects",
      ...(features.cv ? (["cv"] as const) : []),
      ...(features.contact ? (["contact"] as const) : []),
    ],
    [features.contact, features.cv],
  );

  useEffect(() => {
    const elements = spyIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) {
      return;
    }

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        }

        const next = spyIds.find((id) => visible.has(id));

        if (next) {
          setActive(next);
        }
      },
      { rootMargin: "-18% 0px -65% 0px", threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [spyIds]);

  const dockActive: DockItemId = active === "cv" ? "projects" : active;

  const measure = useCallback(() => {
    const dock = dockRef.current;
    const item = itemRefs.current[dockActive];

    if (!dock || !item) {
      setIndicator(null);
      return;
    }

    const dockRect = dock.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const styles = window.getComputedStyle(dock);
    const borderLeft = Number.parseFloat(styles.borderLeftWidth) || 0;
    const borderTop = Number.parseFloat(styles.borderTopWidth) || 0;

    setIndicator({
      x: itemRect.left - dockRect.left - borderLeft,
      y: itemRect.top - dockRect.top - borderTop,
      width: itemRect.width,
      height: itemRect.height,
    });
  }, [dockActive]);

  useEffect(() => {
    let cancelled = false;

    measure();

    const dock = dockRef.current;
    const item = itemRefs.current[dockActive];
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            if (!cancelled) {
              measure();
            }
          });

    if (dock) {
      observer?.observe(dock);
    }
    if (item) {
      observer?.observe(item);
    }

    window.addEventListener("resize", measure);

    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) {
            measure();
          }
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [dir, dockActive, measure]);

  return (
    <nav
      ref={dockRef}
      aria-label={t.ui.primaryNav}
      className="dock"
      data-testid="dock"
    >
      <span
        className="dock-indicator"
        data-ready={indicator ? "true" : "false"}
        aria-hidden="true"
        style={
          indicator
            ? {
                width: `${indicator.width}px`,
                height: `${indicator.height}px`,
                transform: `translate3d(${indicator.x}px, ${indicator.y}px, 0)`,
              }
            : undefined
        }
      />

      {items.map((item) => {
        const isActive = dockActive === item.id;

        return (
          <a
            key={item.id}
            ref={(node) => {
              itemRefs.current[item.id] = node;
            }}
            href={item.href}
            className="dock-item"
            aria-label={item.label}
            aria-current={isActive ? "true" : undefined}
            data-active={isActive ? "true" : undefined}
            onClick={() => setActive(item.id)}
          >
            {icons[item.id]}
            <span className="dock-caption" aria-hidden="true">
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
