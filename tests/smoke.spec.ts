import fs from "node:fs";
import path from "node:path";

import { expect, test } from "./fixtures";

type SiteIdentity = {
  name: string;
};

const site = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content", "site.json"), "utf8"),
) as SiteIdentity;

test("home renders the site name without console errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { level: 1, name: site.name }),
  ).toBeVisible();
  expect(await page.title()).toContain(site.name);
  await expect.poll(() => consoleErrors).toEqual([]);
  await expect.poll(() => pageErrors).toEqual([]);
});
