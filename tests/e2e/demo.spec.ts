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

// The verification card "acts" the database check before revealing the reply (~3 s).
const VERIFY_WAIT = { timeout: 10_000 };

async function startAs(page: Page, persona: string) {
  await page.getByLabel("Chat as customer").selectOption(persona);
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await expect(chat(page)).toContainText("please share your name, company, email and GST number");
}

test("known customer: verified → enquiry → quotation PDF → order, mirrored on the lab dashboard", async ({ page }) => {
  await unlock(page);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await startAs(page, "C001");
  await expect(lab(page)).toContainText("Verification in progress");

  await page.getByRole("button", { name: "Send my details" }).click();
  await expect(page.getByLabel("Customer verification").last()).toContainText("Verified", VERIFY_WAIT);
  await expect(chat(page)).toContainText("You're verified. Welcome back, Arun!", VERIFY_WAIT);
  await expect(lab(page)).toContainText("Customer verified: Arun Menon (C001)");
  await expect(lab(page)).toContainText("✓ Verified");

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

test("mismatch: re-check once, then flag staff and continue unverified", async ({ page }) => {
  await unlock(page);
  await startAs(page, "C002");
  await page.getByRole("button", { name: "Send with wrong email" }).click();
  await expect(chat(page)).toContainText("Please re-check your email address", VERIFY_WAIT);
  await expect(lab(page)).toContainText("Details don't match record (attempt 1 of 2)");

  await page.getByRole("button", { name: "Send with wrong email" }).click();
  await expect(chat(page)).toContainText("I still can't match those details", VERIFY_WAIT);
  await expect(lab(page)).toContainText("⚑ Unverified");
  await expect(lab(page)).toContainText("Needs staff: customer details don't match records");
  await expect(lab(page)).not.toContainText("previous orders"); // record history stays hidden

  await say(page, "pesticide residue for turmeric, 2 samples");
  await expect(page.getByLabel(/^Quotation Q-\d{4}-\d{4}$/).last()).toContainText("INR 10,620");
});

test("new customer is registered, and guardrails still apply", async ({ page }) => {
  await unlock(page);
  await startAs(page, "new");
  await page.getByRole("button", { name: "Send my details" }).click();
  await expect(chat(page)).toContainText("I've registered Spice Route Exports as a new customer", VERIFY_WAIT);
  await expect(lab(page)).toContainText("New customer registered: C021");

  await say(page, "honey testing please");
  await expect(chat(page)).toContainText("Honey isn't on our list of accepted sample types");
  await say(page, "any discount?");
  await expect(chat(page)).toContainText("I can't offer discounts");
  await expect(lab(page)).toContainText("⚑ Needs staff");
  await expect(lab(page)).toContainText("Needs staff: discount requested");
});

test("reset clears chats and customers registered during the demo", async ({ page }) => {
  await unlock(page);
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(chat(page)).toContainText("Start a chat as");
  await expect(lab(page)).toContainText("Start a chat to watch the agent work");
  await startAs(page, "new");
  await page.getByRole("button", { name: "Send my details" }).click();
  await expect(lab(page)).toContainText("New customer registered: C021", VERIFY_WAIT); // C021 was freed by reset
});
