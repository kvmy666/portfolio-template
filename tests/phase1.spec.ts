import fs from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

type LocaleConfig = {
  code: string;
  label: string;
  dir: "ltr" | "rtl";
  htmlLang: string;
};

type SiteFixture = {
  defaultLocale: string;
  locales: LocaleConfig[];
};

const site = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content", "site.json"), "utf8"),
) as SiteFixture;

function trackConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  return errors;
}

test("desktop uses a vertical dock and mobile uses a bottom bar", { tag: "@phase1" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const dock = page.getByTestId("dock");
  await expect(dock).toBeVisible();
  await expect(page.locator("header")).toHaveCount(0);

  const desktopBox = await dock.boundingBox();
  expect(desktopBox).not.toBeNull();
  expect(desktopBox!.x).toBeLessThan(140);
  expect(desktopBox!.height).toBeGreaterThan(desktopBox!.width);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });

  const mobileDock = page.getByTestId("dock");
  await expect(mobileDock).toBeVisible();
  await expect(page.locator("header")).toHaveCount(0);

  const mobileBox = await mobileDock.boundingBox();
  expect(mobileBox).not.toBeNull();
  expect(mobileBox!.width).toBeGreaterThan(mobileBox!.height);
  expect(mobileBox!.y + mobileBox!.height).toBeGreaterThan(844 - 120);
});

test("dock scroll-spy activates the current section", { tag: "@phase1" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const projectsLink = page
    .getByTestId("dock")
    .getByRole("link", { name: "Projects" });

  await projectsLink.click();
  await expect(page.locator("#projects")).toBeInViewport();
  await expect(projectsLink).toHaveAttribute("aria-current", "true");
  await expect(projectsLink).toHaveAttribute("data-active", "true");
});

test("theme toggle flips, persists, and logs no errors", { tag: "@phase1" }, async ({
  page,
}) => {
  const errors = trackConsoleErrors(page);

  await page.goto("/", { waitUntil: "networkidle" });

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: /switch to light theme/i }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("theme")))
    .toBe("light");

  await page.reload({ waitUntil: "networkidle" });
  await expect(html).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("locale switching updates direction without navigation", { tag: "@phase1" }, async ({
  page,
}) => {
  test.skip(site.locales.length <= 1, "Only one locale is configured");

  await page.goto("/", { waitUntil: "networkidle" });

  const defaultIndex = site.locales.findIndex(
    (locale) => locale.code === site.defaultLocale,
  );
  const target = site.locales[(defaultIndex + 1) % site.locales.length];

  const trigger = page.getByRole("button", { name: /change language/i });
  await trigger.click();

  const html = page.locator("html");
  await expect(html).toHaveAttribute("dir", target.dir);
  await expect(html).toHaveAttribute("lang", target.htmlLang);
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem("locale")))
    .toBe(target.code);

  const navigationCount = await page.evaluate(
    () => performance.getEntriesByType("navigation").length,
  );
  expect(navigationCount).toBe(1);

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("dir", target.dir);
  await expect(page.locator("html")).toHaveAttribute("lang", target.htmlLang);
});

test("home page has no critical or serious axe violations", { tag: "@a11y" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );

  expect(
    violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
});
