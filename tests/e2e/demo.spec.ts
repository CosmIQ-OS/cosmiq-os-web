import { test, expect, type Page } from "@playwright/test";

// One shared demo database: run these in order, on desktop only, so resets can't race.
test.describe.configure({ mode: "serial" });
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "chromium", "demo flow runs on desktop"));

async function unlock(page: Page) {
  expect((await page.request.post("/api/demo/access", { data: { code: "playwright-demo-code" } })).ok()).toBeTruthy();
  await page.goto("/pilot-demo");
  await expect(page.getByRole("heading", { name: /agentic enquiry desk/i })).toBeVisible();
}

async function say(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Message" }).fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

const chat = (page: Page) => page.getByRole("log", { name: "Chat messages" });
const lab = (page: Page) => page.getByRole("complementary", { name: "Lab dashboard" });

test("demo is locked without the access code", async ({ page, request }) => {
  expect((await request.get("/api/demo/customers")).status()).toBe(401);
  expect((await request.post("/api/demo/reset")).status()).toBe(401);
  await page.goto("/pilot-demo");
  await expect(page.getByRole("heading", { name: "Enter the demo code." })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByLabel("Demo code").fill("wrong");
  await page.getByRole("button", { name: /open the demo/i }).click();
  await expect(page.getByRole("form", { name: "Demo access" }).getByRole("alert")).toHaveText("That code isn't right.");
  await page.getByLabel("Demo code").fill("playwright-demo-code");
  await page.getByRole("button", { name: /open the demo/i }).click();
  await expect(page.getByRole("heading", { name: /agentic enquiry desk/i })).toBeVisible();
});

test("known customer: enquiry → quotation PDF → order, mirrored on the lab dashboard", async ({ page }) => {
  await unlock(page);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await page.getByLabel("Chat as customer").selectOption("C001");
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await expect(chat(page)).toContainText("Welcome back to FQLab");
  await expect(lab(page)).toContainText("Customer recognised: Arun Menon (C001)");

  await say(page, "Need aflatoxin testing for red chilli powder");
  await expect(chat(page)).toContainText("How many samples of Red Chilli Powder");
  await page.getByRole("button", { name: "3 samples" }).click();

  const card = page.getByLabel(/^Quotation Q-\d{4}-\d{4}$/);
  await expect(card).toContainText("INR 11,328"); // 3 × 3,200 + 18% GST
  await expect(lab(page)).toContainText("Quotation sent");
  const pdf = await page.request.get((await card.getByRole("link", { name: /quotation pdf/i }).getAttribute("href"))!);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(chat(page)).toContainText("Order ORD-1053 created");
  await expect(lab(page)).toContainText("Order ORD-1053 created in lab system");
  await expect(lab(page)).toContainText("Order created");
});

test("guardrails: unknown sample type and discount are declined and flagged for staff", async ({ page }) => {
  await unlock(page);
  await page.getByLabel("Chat as customer").selectOption("new");
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await expect(chat(page)).toContainText("May I have your name and company?");
  await say(page, "Hi, I'm Asha from Spice Route Exports");
  await expect(chat(page)).toContainText("Thanks, Asha!");
  await expect(lab(page)).toContainText("Spice Route Exports");

  await say(page, "honey testing please");
  await expect(chat(page)).toContainText("Honey isn't on our list of accepted sample types");
  await say(page, "any discount?");
  await expect(chat(page)).toContainText("I can't offer discounts");
  await expect(lab(page)).toContainText("⚑ Needs staff");
  await expect(lab(page)).toContainText("Needs staff: discount requested");
});

test("reset clears the demo for the next rehearsal", async ({ page }) => {
  await unlock(page);
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await expect(chat(page)).toContainText("Welcome back");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(chat(page)).toContainText("Start a chat as");
  await expect(lab(page)).toContainText("Start a chat to watch the agent work");
});
