import siteJson from "../content/site.json";
import { expect, test } from "./fixtures";

type HeroMediaConfig = {
  laptopFrames?: string[] | null;
  laptopMobileFrames?: string[] | null;
};

const heroMedia = siteJson.hero as unknown as HeroMediaConfig;
const mobileLaptopFrames = heroMedia.laptopMobileFrames ?? [];
const expectedMobileLaptopMode =
  mobileLaptopFrames.length > 0 ? "frames" : "css";

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

async function assertCenteredLaptopScrub(
  page: import("@playwright/test").Page,
) {
  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toHaveAttribute("data-laptop-gsap", "native");
  await expect(visual).toHaveAttribute("data-laptop-pinned", "false");

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });

  await expect
    .poll(() => readLaptopProgress(page), { timeout: 20_000 })
    .toBeLessThan(0.05);

  const { absTop, viewportHeight } = await visual.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      absTop: rect.top + window.scrollY,
      viewportHeight: window.innerHeight,
    };
  });
  const startY = absTop - viewportHeight * 0.8;
  const endY = absTop - viewportHeight * 0.05;

  const scrollToRatio = (ratio: number) => {
    const y = startY + (endY - startY) * ratio;

    return page.evaluate((scrollTop) => {
      window.scrollTo(0, scrollTop);
      window.dispatchEvent(new Event("scroll"));
    }, y);
  };

  const inViewport = () =>
    visual.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        top: rect.top,
        viewportHeight: window.innerHeight,
      };
    });

  await scrollToRatio(0.2);
  await expect
    .poll(() => readLaptopProgress(page), { timeout: 5000 })
    .toBeGreaterThan(0.4);

  const openingRect = await inViewport();
  expect(openingRect.top).toBeLessThan(openingRect.viewportHeight);
  expect(openingRect.bottom).toBeGreaterThan(0);

  await scrollToRatio(0.5);
  await expect
    .poll(() => readLaptopProgress(page), { timeout: 5000 })
    .toBeGreaterThan(0.9);

  await scrollToRatio(0.9);
  await expect
    .poll(() => readLaptopProgress(page), { timeout: 5000 })
    .toBeLessThan(0.4);

  const closingRect = await inViewport();
  expect(closingRect.top).toBeLessThan(closingRect.viewportHeight);
  expect(closingRect.bottom).toBeGreaterThan(0);

  await scrollToRatio(1);
  await expect
    .poll(() => readLaptopProgress(page), { timeout: 5000 })
    .toBeLessThan(0.05);

  await scrollToRatio(0.5);
  await expect
    .poll(() => readLaptopProgress(page), { timeout: 5000 })
    .toBeGreaterThan(0.9);
}

test("laptop scrub responds to desktop scroll", { tag: "@phase2" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveAttribute("data-laptop-mode", "css");

  await assertCenteredLaptopScrub(page);
});

test("laptop scrub responds to mobile scroll", { tag: "@phase2" }, async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });

  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toBeVisible({ timeout: 20_000 });
  await expect(visual).toHaveAttribute(
    "data-laptop-mode",
    expectedMobileLaptopMode,
  );

  if (expectedMobileLaptopMode === "frames") {
    await expect(visual.locator("canvas.laptop-frame-canvas")).toBeVisible();
    await expect(visual).toHaveAttribute("data-laptop-frame-set", "mobile");
    await expect(visual).toHaveAttribute(
      "data-laptop-frames",
      String(mobileLaptopFrames.length),
    );
  }

  await assertCenteredLaptopScrub(page);
});

test("reduced motion opens the laptop statically", { tag: "@phase2" }, async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });

  const visual = page.locator("[data-laptop-visual]");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveAttribute("data-laptop-gsap", "native");
  await expect(visual).toHaveAttribute("data-laptop-pinned", "false");
  await expect(visual).toHaveAttribute("data-laptop-autoplay", "false");
  await expect.poll(() => readLaptopProgress(page)).toBeCloseTo(1, 3);
});
