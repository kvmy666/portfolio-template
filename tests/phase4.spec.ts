import fs from "node:fs";
import path from "node:path";

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

type SiteFixture = {
  name: string;
  email: string;
  url: string;
  role: Record<string, string>;
  links: { github: string | null; linkedin: string | null };
};

const site = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content", "site.json"), "utf8"),
) as SiteFixture;

const projects = fs
  .readdirSync(path.join(process.cwd(), "content", "projects"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const project = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "content", "projects", file),
        "utf8",
      ),
    ) as { slug: string };
    return project;
  });

const contactPayload = {
  name: "Demo Visitor",
  email: "visitor@example.com",
  label: "Coop training",
  message: "Hello, I would like to talk about the coop training role.",
};

async function openContact(page: Page) {
  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();
  return contact;
}

async function fillContactForm(
  contact: ReturnType<Page["locator"]>,
  overrides: Partial<typeof contactPayload> = {},
) {
  const values = { ...contactPayload, ...overrides };

  await contact.getByLabel("Name").fill(values.name);
  await contact.getByLabel("Email").fill(values.email);
  await contact.getByLabel("Label").selectOption(values.label);
  await contact.getByLabel("Message").fill(values.message);
}

function seriousViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
) {
  return violations
    .filter(
      (violation) =>
        violation.impact === "critical" || violation.impact === "serious",
    )
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.map((node) => node.target),
    }));
}

test("CV section opens a modal with the PDF preview and closes on Escape", { tag: "@phase4" }, async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const cvSection = page.locator("#cv");
  await cvSection.evaluate((el) =>
    el.scrollIntoView({
      block: "center",
      behavior: "instant",
    } as ScrollIntoViewOptions),
  );

  const trigger = cvSection.getByRole("button", { name: "View CV" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-labelledby");

  const preview = dialog.getByTitle("CV preview");
  await expect(preview).toHaveAttribute("src", "/demo/cv.pdf");
  await expect(
    dialog.getByRole("link", { name: "Download" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("contact form validates required fields and offers one label", { tag: "@phase4" }, async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const contact = await openContact(page);
  const name = contact.getByLabel("Name");
  const email = contact.getByLabel("Email");
  const message = contact.getByLabel("Message");

  await contact.getByRole("button", { name: "Send message" }).click();

  await expect(
    contact.getByText("Enter your name (2–80 characters)."),
  ).toBeVisible();
  await expect(
    contact.getByText("Enter a valid email address."),
  ).toBeVisible();
  await expect(
    contact.getByText("Write a message between 10 and 2000 characters."),
  ).toBeVisible();

  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(message).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAttribute("aria-describedby", /name-error/);

  await name.fill("Demo Visitor");
  await email.fill("not-an-email");
  await message.fill("A valid message for the contact form.");

  await contact.getByRole("button", { name: "Send message" }).click();

  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(
    contact.getByText("Enter a valid email address."),
  ).toBeVisible();

  const options = contact.getByLabel("Label").locator("option");
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveText("Coop training");
});

test("contact form posts JSON, shows success, and resets", { tag: "@phase4" }, async ({
  page,
}) => {
  const requests: { method: string; body: unknown }[] = [];

  await page.route("**/api/contact", async (route) => {
    const request = route.request();
    requests.push({
      method: request.method(),
      body: request.postDataJSON(),
    });

    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const contact = await openContact(page);
  await fillContactForm(contact);
  await contact.getByRole("button", { name: "Send message" }).click();

  const status = contact.getByRole("status");
  await expect(status).toHaveText("Thanks — your message has been sent.");

  expect(requests).toHaveLength(1);
  expect(requests[0].method).toBe("POST");
  expect(requests[0].body).toMatchObject(contactPayload);

  await expect(contact.getByLabel("Name")).toHaveValue("");
  await expect(contact.getByLabel("Email")).toHaveValue("");
  await expect(contact.getByLabel("Message")).toHaveValue("");
  await expect(contact.getByLabel("Label")).toHaveValue("Coop training");

  await expect(page).toHaveURL(/\/$/);
});

test.describe("contact API rate limiting", () => {
  test.describe.configure({ mode: "serial" });

  test("contact API rate limits after five requests per window", { tag: "@phase4" }, async ({
    request,
  }) => {
    const ip = `10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
    const headers = {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    };

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request.post("/api/contact", {
        headers,
        data: contactPayload,
      });

      expect(response.status()).toBe(202);
    }

    const limited = await request.post("/api/contact", {
      headers,
      data: contactPayload,
    });

    expect(limited.status()).toBe(429);
    expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
  });
});

test("contact API accepts the honeypot without sending", { tag: "@phase4" }, async ({
  request,
}) => {
  const response = await request.post("/api/contact", {
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.78",
    },
    data: { ...contactPayload, company: "bot" },
  });

  expect(response.status()).toBe(202);
  expect(await response.json()).toEqual({ ok: true });
});


test("switching to Arabic renders RTL copy and hides English headings", { tag: "@phase4" }, async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /change language/i }).click();

  const html = page.locator("html");
  await expect(html).toHaveAttribute("dir", "rtl");
  await expect(html).toHaveAttribute("lang", "ar");
  await expect(
    page.getByTestId("dock").getByRole("link", { name: "المشاريع" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "أعمال مختارة" }),
  ).toBeVisible();
  await expect(page.getByText("Selected work")).toHaveCount(0);
});

test("home and project pages declare canonical links", { tag: "@phase4" }, async ({
  page,
}) => {
  const canonical = page.locator('link[rel="canonical"]');

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(canonical).toHaveAttribute("href", site.url);

  await page.goto("/projects/demo-project-one", { waitUntil: "networkidle" });
  await expect(canonical).toHaveAttribute(
    "href",
    `${site.url}/projects/demo-project-one`,
  );
});

test("sitemap lists home and every project while robots points to it", { tag: "@phase4" }, async ({
  request,
}) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);

  const xml = await sitemap.text();
  expect(xml).toContain(`${site.url}/`);
  for (const project of projects) {
    expect(xml).toContain(`${site.url}/projects/${project.slug}`);
  }

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain(`Sitemap: ${site.url}/sitemap.xml`);
});

test("generated Open Graph image is a non-empty PNG", { tag: "@phase4" }, async ({
  request,
}) => {
  const response = await request.get("/opengraph-image");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");

  const body = await response.body();
  expect(body.byteLength).toBeGreaterThan(0);
});

test("Person JSON-LD is present and parses", { tag: "@phase4" }, async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const script = page.locator('script[type="application/ld+json"]');
  await expect(script).toHaveCount(1);

  const parsed = JSON.parse((await script.textContent()) ?? "null") as {
    "@type": string;
    name: string;
    jobTitle: string;
    url: string;
    email: string;
    sameAs: string[];
  };

  expect(parsed["@type"]).toBe("Person");
  expect(parsed.name).toBe(site.name);
  expect(parsed.jobTitle).toBe(site.role.en);
  expect(parsed.url).toBe(site.url);
  expect(parsed.email).toBe(site.email);
  expect(parsed.sameAs).toEqual(
    [site.links.github, site.links.linkedin].filter(
      (link): link is string => link !== null,
    ),
  );
});

test("CV dialog is centered in the viewport", { tag: "@phase4" }, async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const cvSection = page.locator("#cv");
  await cvSection.scrollIntoViewIfNeeded();
  await cvSection.getByRole("button", { name: "View CV" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const viewport = page.viewportSize();
  const box = await dialog.boundingBox();

  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();

  const horizontalGap = Math.abs(
    box!.x - (viewport!.width - box!.width - box!.x),
  );
  const verticalGap = Math.abs(
    box!.y - (viewport!.height - box!.height - box!.y),
  );

  expect(horizontalGap).toBeLessThanOrEqual(2);
  expect(verticalGap).toBeLessThanOrEqual(2);
  expect(box!.width).toBeLessThanOrEqual(960);
});

test("contact section and CV modal have no critical or serious axe violations", { tag: "@a11y" }, async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  const contact = await openContact(page);
  await expect(contact).toBeVisible();

  const contactResults = await new AxeBuilder({ page })
    .include("#contact")
    .analyze();

  expect(seriousViolations(contactResults.violations)).toEqual([]);

  const cvSection = page.locator("#cv");
  await cvSection.evaluate((el) =>
    el.scrollIntoView({
      block: "center",
      behavior: "instant",
    } as ScrollIntoViewOptions),
  );
  await cvSection.getByRole("button", { name: "View CV" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const dialogResults = await new AxeBuilder({ page })
    .include("dialog[open]")
    .analyze();

  expect(seriousViolations(dialogResults.violations)).toEqual([]);
});
