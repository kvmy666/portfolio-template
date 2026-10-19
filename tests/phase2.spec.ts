import { expect, test } from "@playwright/test";

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
