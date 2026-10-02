import { test, expect } from "@playwright/test";

test("homepage converts: hero + CTA + workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /whatsapp enquiry to quotation/i })).toBeVisible();
  await expect(page.getByRole("list", { name: "What you can rely on" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Enquiry and quotation workflow" })).toBeVisible();
  await page.locator(".hero").getByRole("link", { name: /request a pilot/i }).click();
  await expect(page).toHaveURL(/\/contact/);
});

test("guardrails promise is on the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/the ai never invents services, prices/i)).toBeVisible();
  await expect(page.getByText("Backend calculates", { exact: true })).toBeVisible();
});

test("FAQ answers objections before the form", async ({ page }) => {
  await page.goto("/");
  const faq = page.locator("#faq");
  await faq.getByText("What if a customer asks for a test we don't offer?").click();
  await expect(faq.getByText(/won't invent one/i)).toBeVisible();
  const faqTop = await faq.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const formTop = await page.getByRole("form", { name: "Pilot enquiry form" }).evaluate((el) => el.getBoundingClientRect().top + scrollY);
  expect(faqTop).toBeLessThan(formTop);
});

test("every page has one h1 and its own title", async ({ page }) => {
  const titles = new Set<string>();
  for (const path of ["/", "/demo", "/contact", "/privacy"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    titles.add(await page.title());
  }
  expect(titles.size).toBe(4);
});

test("link previews have an image and staff pages stay out of search", async ({ page, request }) => {
  await page.goto("/");
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toContain("opengraph-image");
  const image = await request.get(new URL(og!).pathname);
  expect(image.ok()).toBeTruthy();
  expect(image.headers()["content-type"]).toBe("image/png");

  await page.goto("/staff/enquiries");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /staff/");
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
});

test("unknown pages show a branded 404 with a way back", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /isn't on file/i })).toBeVisible();
  await page.getByRole("link", { name: /back to home/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("keyboard users can skip to content", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile-chromium", "keyboard flow is desktop only");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
});

test("demo labels prototype honestly", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: /enquiry become a quotation/i })).toBeVisible();
  await expect(page.getByText(/labelled prototype/i)).toBeVisible();
});

test("contact validation blocks empty submit", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: /request a pilot/i }).click();
  await expect(page.getByText(/name, lab \/ organisation and email/i)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Name*" })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Name*" })).toHaveAttribute("aria-invalid", "true");
});

test("bad email is caught before sending, and the error clears on edit", async ({ page }) => {
  let posted = false;
  await page.route("**/api/enquiries", (route) => { posted = true; return route.continue(); });
  // Instant scrolling: Playwright's own scroll-before-click would otherwise still be animating.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact");
  await page.getByRole("textbox", { name: "Name*" }).fill("Asha");
  await page.getByRole("textbox", { name: "Lab / organisation*" }).fill("Test Lab");
  const email = page.getByRole("textbox", { name: "Email ID*" });
  await email.fill("asha@lab");
  await page.getByRole("checkbox", { name: "Quotations" }).check();
  await page.getByRole("button", { name: /request a pilot/i }).click();
  await expect(page.getByText("That email doesn't look right.")).toBeVisible();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
  await expect(email).toBeFocused();
  // Once the (smooth) scroll settles, the focused field must sit below the sticky header.
  const headerBottom = await page.locator(".nav").evaluate((el) => el.getBoundingClientRect().bottom);
  await expect.poll(async () => (await email.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom);
  expect(posted).toBe(false);
  await email.fill("asha@lab.com");
  await expect(page.getByText("That email doesn't look right.")).toHaveCount(0);
});

test("mobile navigation exposes the demo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile navigation only");
  await page.goto("/");
  await page.getByLabel("Open navigation").click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
});

test("mobile menu closes after jumping to a section", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile navigation only");
  await page.goto("/");
  await expect(page.getByRole("banner").getByRole("link", { name: "Contact" })).toBeVisible();
  await page.getByLabel("Open navigation").click();
  const menu = page.getByRole("navigation", { name: "Mobile" });
  await menu.getByRole("link", { name: "Agents" }).click();
  await expect(page).toHaveURL(/#agents$/);
  await expect(menu).toBeHidden();
  await page.getByLabel("Open navigation").click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
});
