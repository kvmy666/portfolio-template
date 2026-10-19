import { expect, test } from "./fixtures";

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

test.describe("hero splash", () => {
  test.describe.configure({ mode: "serial" });

  test("hero splash canvas initializes without console errors", { tag: "@phase2" }, async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    const canvas = page.locator("[data-hero-canvas]");
    await expect(canvas).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document
              .querySelector("[data-hero-canvas]")
              ?.getAttribute("data-hero-ready") ?? null,
        ),
      )
      .toBe("true");

    expect(errors).toEqual([]);
  });

  test("hero splash falls back when WebGL is unavailable", { tag: "@phase2" }, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;

      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        contextId: string,
        ...args: unknown[]
      ) {
        if (
          contextId === "webgl" ||
          contextId === "webgl2" ||
          contextId === "experimental-webgl"
        ) {
          return null;
        }

        return Reflect.apply(original, this, [contextId, ...args]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("[data-hero-fallback]")).toBeVisible();
  });

  test("reduced motion renders a static hero panel without errors", { tag: "@phase2" }, async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator("[data-hero-panel]")).toBeVisible();
    await expect(page.locator("[data-hero-canvas]")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document
              .querySelector("[data-hero-canvas]")
              ?.getAttribute("data-hero-ready") ?? null,
        ),
      )
      .toBe("true");

    expect(errors).toEqual([]);
  });
});

function readLaptopProgress(page: import("@playwright/test").Page) {
  return page
    .locator("[data-laptop-visual]")
    .evaluate((element) =>
      Number(
        (element as HTMLElement).dataset.laptopProgress ??
          (element as HTMLElement).style.getPropertyValue("--laptop-progress"),
      ),
    );
}

test("laptop scrub responds to desktop scroll", { tag: "@phase2" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveAttribute("data-laptop-mode", "css");
  await expect(visual).toHaveAttribute("data-laptop-pinned", "true");

  const aboutTop = await page.locator("#about").evaluate((element) => {
    return element.getBoundingClientRect().top + window.scrollY;
  });

  await page.evaluate((scrollTop) => {
    window.scrollTo(0, scrollTop);
  }, aboutTop + 500);

  await expect
    .poll(() => readLaptopProgress(page), { timeout: 5000 })
    .toBeGreaterThan(0.15);

  const progress = await readLaptopProgress(page);
  expect(progress).toBeLessThanOrEqual(1);
});

test("laptop auto-plays once on mobile", { tag: "@phase2" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveAttribute("data-laptop-autoplay", "true");
  await expect(visual).not.toHaveAttribute("data-laptop-gsap", "true");

  await page.evaluate(() => {
    document.querySelector("#about")?.scrollIntoView({ block: "center" });
  });

  await expect
    .poll(() => readLaptopProgress(page), { timeout: 4000 })
    .toBeGreaterThanOrEqual(0.99);
  await expect(visual).toHaveAttribute("data-laptop-autoplayed", "true");
});

test("reduced motion opens the laptop statically", { tag: "@phase2" }, async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveAttribute("data-laptop-pinned", "false");
  await expect(visual).toHaveAttribute("data-laptop-autoplay", "false");
  await expect.poll(() => readLaptopProgress(page)).toBeCloseTo(1, 3);
});
