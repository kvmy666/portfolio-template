import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
