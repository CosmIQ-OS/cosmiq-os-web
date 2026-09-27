import { test, expect } from "@playwright/test";

test("homepage converts: hero + CTA + workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /stop chasing routine work/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /request a pilot demo/i }).first()).toBeVisible();
  await expect(page.getByText(/request arrives/i).first()).toBeVisible();
  await page.getByRole("link", { name: /request a pilot/i }).first().click();
  await expect(page).toHaveURL(/\/contact/);
});

test("demo labels prototype honestly", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: /watch one task/i })).toBeVisible();
  await expect(page.getByText(/labelled prototype/i)).toBeVisible();
});

test("contact validation blocks empty submit", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: /request a pilot/i }).click();
  await expect(page.getByText(/name, business domain and email/i)).toBeVisible();
});

test("mobile navigation exposes the demo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "mobile navigation only");
  await page.goto("/");
  await page.getByLabel("Open navigation").click();
  await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
});
