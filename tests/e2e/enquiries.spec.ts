import { test, expect } from "@playwright/test";

test("API rejects invalid enquiry", async ({ request }) => {
  const r = await request.post("/api/enquiries", { data: { name: "", domain: "", email: "bad" } });
  expect(r.status()).toBe(400);
});

test("API rejects unauthenticated lead listing", async ({ request }) => {
  const r = await request.get("/api/enquiries");
  expect(r.status()).toBe(401);
  expect((await request.get("/api/enquiries?key=dev-staff-key")).status()).toBe(401);
});

test("submission failure stays visible; it is not treated as saved", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("textbox", { name: "Name*" }).fill("Test Error");
  await page.getByRole("textbox", { name: "Lab / organisation*" }).fill("Agency");
  await page.getByRole("textbox", { name: "Email ID*" }).fill("failure@example.com");
  await page.getByRole("checkbox", { name: "Quotations" }).check();
  await page.route("**/api/enquiries", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Storage unavailable." }) }));
  await page.getByRole("button", { name: /request a pilot/i }).click();
  await expect(page.getByRole("status")).toContainText("Storage unavailable.");
  await expect(page.getByRole("status")).not.toContainText("Received.");
});

test("full lead journey: submit -> sign in -> stored -> sign out", async ({ page }) => {
  const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  await page.goto("/contact");
  await page.getByPlaceholder("Asha Menon").fill("E2E Tester");
  await page.getByPlaceholder("Your lab's name").fill("Test Food Lab");
  await page.getByPlaceholder("you@yourlab.com").fill(email);
  await page.getByText("WhatsApp enquiries", { exact: true }).click();
  await page.getByRole("textbox", { name: "Additional details" }).fill("Follow up on open requests");
  await page.getByRole("button", { name: /request a pilot/i }).click();
  await expect(page.getByText(/received\. reference/i)).toBeVisible();

  await page.goto("/staff/enquiries");
  await page.getByLabel("Staff password").fill("playwright-staff-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("cell", { name: email })).toBeVisible();
  const list = await page.request.get("/api/enquiries");
  expect(list.ok()).toBeTruthy();
  const rows = await list.json();
  expect(rows.some((x: { email: string; notes: string }) => x.email === email && x.notes === "Follow up on open requests")).toBeTruthy();

  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page.getByLabel("Staff password")).toBeVisible(); // sign-out request has completed
  expect((await page.request.get("/api/enquiries")).status()).toBe(401);
});

test("wrong staff password never authorizes listings", async ({ page }) => {
  await page.goto("/staff/enquiries");
  await page.getByLabel("Staff password").fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText("Incorrect password.", { exact: true })).toBeVisible();
  expect((await page.request.get("/api/enquiries")).status()).toBe(401);
});

test("all-of-the-above selection is stored as every category", async ({ page }) => {
  const email = `all-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  await page.goto("/contact");
  await page.getByRole("textbox", { name: "Name*" }).fill("All Tester");
  await page.getByRole("textbox", { name: "Lab / organisation*" }).fill("Agency");
  await page.getByRole("textbox", { name: "Email ID*" }).fill(email);
  await page.getByRole("checkbox", { name: "All of the above" }).check();
  await page.getByRole("button", { name: /request a pilot/i }).click();
  await expect(page.getByText(/received\. reference/i)).toBeVisible();
  await page.goto("/staff/enquiries");
  await page.getByLabel("Staff password").fill("playwright-staff-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row).toContainText("WhatsApp enquiries");
  await expect(row).toContainText("Sample status updates");
});
