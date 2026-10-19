import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./fixtures";

const githubHeaders = {
  "access-control-allow-origin": "*",
  "content-type": "application/json",
};

test("project detail route renders in the locked block order", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { level: 1, name: "Demo Project One" }),
  ).toBeVisible();

  const headings = await page
    .locator("main h2")
    .evaluateAll((elements) =>
      elements.map((element) => element.textContent?.trim() ?? ""),
    );

  expect(headings.slice(0, 4)).toEqual([
    "Overview",
    "Tech stack",
    "Features",
    "Deep-dive",
  ]);
});

test("project detail omits retrospective, CTA, and review status", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(/retrospective/i);
  expect(bodyText).not.toMatch(/\bCTA\b/i);
  expect(bodyText).not.toMatch(/review status/i);
  expect(bodyText).not.toMatch(/under review/i);
});

test("feature lenses show counts and filter in place", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  const allLens = page.getByTestId("lens-all");
  await expect(allLens).toContainText("(3)");
  await expect(page.getByTestId("lens-ux")).toContainText("(2)");
  await expect(page.getByTestId("lens-security")).toContainText("(1)");
  await expect(page.getByTestId("lens-testing")).toContainText("(2)");
  await expect(page.getByTestId("lens-performance")).toContainText("(1)");

  await page.getByTestId("lens-security").click();

  await expect(page).toHaveURL(/#security$/);
  await expect(page.getByTestId("lens-security")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  const cards = page.getByTestId("feature-card");
  await expect(cards).toHaveCount(1);

  const tagGroups = await cards.evaluateAll((elements) =>
    elements.map((element) =>
      Array.from(element.querySelectorAll('[data-testid="feature-tag"]')).map(
        (tag) => tag.textContent?.trim() ?? "",
      ),
    ),
  );

  for (const tags of tagGroups) {
    expect(tags).toContain("Security");
  }
});

test("a testing hash selects the Testing lens on load", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.goto("/projects/demo-project-one#testing", {
    waitUntil: "networkidle",
  });

  await expect(page.getByTestId("lens-testing")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("lens-all")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await expect(page.getByTestId("feature-card")).toHaveCount(2);
});

test("feature media loads lazily or with no video preload", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  const lazyImages = page.locator('img[loading="lazy"]');
  const lazyVideos = page.locator('video[preload="none"]');

  expect(
    (await lazyImages.count()) + (await lazyVideos.count()),
  ).toBeGreaterThan(0);
});

test("showcase card navigates to the project detail route", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const card = page.getByTestId("showcase-card").first();
  await expect(card).toBeVisible();
  await card.click();

  await expect(page).toHaveURL(/\/projects\/demo-project-one$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Demo Project One" }),
  ).toBeVisible();
});

test("unknown project slugs return 404", { tag: "@phase3" }, async ({ page }) => {
  const response = await page.goto("/projects/does-not-exist", {
    waitUntil: "domcontentloaded",
  });

  expect(response?.status()).toBe(404);
});

test("metrics render live downloads from github and mirror plus stars", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.route("**/api.github.com/**", async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname.endsWith("/releases")) {
      const mirror = pathname.includes("demo-project-one-mirror");
      const releases = mirror
        ? [{ assets: [{ download_count: 50 }] }]
        : [
            {
              assets: [{ download_count: 100 }, { download_count: 23 }],
            },
          ];

      await route.fulfill({
        status: 200,
        headers: githubHeaders,
        body: JSON.stringify(releases),
      });
      return;
    }

    if (pathname.endsWith("/repos/example/demo-project-one")) {
      await route.fulfill({
        status: 200,
        headers: githubHeaders,
        body: JSON.stringify({ stargazers_count: 42 }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers: githubHeaders,
      body: JSON.stringify({ message: "Not Found" }),
    });
  });

  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  const metrics = page.getByTestId("project-metrics").first();
  await expect(metrics).toBeVisible();
  await expect(metrics.getByTestId("metric-downloads")).toHaveText("173");
  await expect(metrics.getByTestId("metric-stars")).toHaveText("42");
});

test("metrics failure keeps the static fallback without console errors", { tag: "@phase3" }, async ({
  page,
}) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.route("**/api.github.com/**", (route) => route.abort());

  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  const metrics = page.getByTestId("project-metrics").first();
  await expect(metrics.getByTestId("metric-downloads")).toHaveText("11");
  await expect(metrics.getByTestId("metric-stars")).toHaveText("7");

  await page.waitForTimeout(500);

  await expect(metrics.getByTestId("metric-downloads")).toHaveText("11");
  await expect(metrics.getByTestId("metric-stars")).toHaveText("7");
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((text) => /unhandled/i.test(text))).toEqual([]);
});

test("project page has no horizontal overflow and code scrolls at 390px", { tag: "@phase3" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

  const pre = page.locator('pre[dir="ltr"]');
  await expect(pre).toBeVisible();
  await pre.scrollIntoViewIfNeeded();

  const scrollable = await pre.evaluate(
    (element) => element.scrollWidth > element.clientWidth,
  );
  expect(scrollable).toBe(true);

  const scrollLeft = await pre.evaluate((element) => {
    element.scrollLeft = 120;
    return element.scrollLeft;
  });
  expect(scrollLeft).toBeGreaterThan(0);

  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.documentWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth + 1,
  );
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth + 1,
  );
});

test("project page has no critical or serious axe violations", { tag: "@a11y" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });

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
