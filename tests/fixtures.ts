import { test as base, expect } from "@playwright/test";

const githubHeaders = {
  "access-control-allow-origin": "*",
  "content-type": "application/json",
};

/**
 * Keep browser tests offline by default. Individual tests can register a more
 * specific route after this auto fixture to mock success or failure.
 */
export const test = base.extend<{ githubStub: void }>({
  githubStub: [
    async ({ page }, use) => {
      await page.route("**/api.github.com/**", (route) =>
        route.fulfill({
          status: 200,
          headers: githubHeaders,
          body: "[]",
        }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
