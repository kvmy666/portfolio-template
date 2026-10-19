import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env.CI);

const projects = [
  {
    name: "chromium-desktop",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "webkit-mobile",
    use: { ...devices["iPhone 13"] },
  },
];

if (process.env.PLAYWRIGHT_FIREFOX === "1") {
  projects.push({
    name: "firefox-desktop",
    use: { ...devices["Desktop Firefox"] },
  });
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: isCI ? 2 : 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects,
  webServer: {
    command:
      process.env.PLAYWRIGHT_SKIP_BUILD === "1"
        ? "npm run start"
        : "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 180_000,
    env: {
      CONTACT_DEV_MODE: "1",
    },
  },
});
