import { test, expect } from "@playwright/test";

test("homepage converts: hero + CTA + workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /whatsapp enquiry to quotation/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /book a pilot/i }).first()).toBeVisible();
  await expect(page.getByRole("list", { name: "Enquiry and quotation workflow" })).toBeVisible();
  await page.getByRole("link", { name: /book a pilot/i }).first().click();
  await expect(page).toHaveURL(/\/contact/);
});

test("guardrails promise is on the homepage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/the ai never invents services, prices/i)).toBeVisible();
  await expect(page.getByRole("cell", { name: "Backend calculates" })).toBeVisible();
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
});

test("mobile navigation exposes the demo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile navigation only");
  await page.goto("/");
  await page.getByLabel("Open navigation").click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
});
