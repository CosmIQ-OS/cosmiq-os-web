import { test, expect, type Page } from "@playwright/test";
import seed from "../../lib/demo/seed-data.json";

async function unlock(page: Page) {
  expect((await page.request.post("/api/demo/access", { data: { code: "playwright-demo-code" } })).ok()).toBeTruthy();
  await page.goto("/pilot-demo");
  await expect(page.getByLabel("Chat as customer").locator("option")).toHaveCount(21, { timeout: 20_000 });
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await expect(chat(page)).toContainText(/Which testing services do you need\?/i);
}
async function say(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Message" }).fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}
const chat = (page: Page) => page.getByRole("log", { name: "Chat messages" });
const arun = seed.customers[0];
const identity = `${arun.name}, phone ${arun.phone}, GST ${arun.gstNo}`;

test("a customer request is verified, completed with details, and confirmed", async ({ page }) => {
  await unlock(page);
  await say(page, "Aflatoxin test");

  await expect(chat(page)).toContainText(/To verify you/i);
  await say(page, identity);
  await expect(chat(page)).toContainText(/You're verified/i);

  await say(page, "Red Chilli Powder, 3 samples");
  await expect(chat(page)).toContainText(/Please confirm:/i);
  await expect(chat(page)).toContainText(/3 samples of Red Chilli Powder/i);

  await say(page, "Confirm");
  await expect(chat(page)).toContainText(/Confirmed:/i);
  await expect(chat(page)).toContainText(/request has been recorded/i);
  await expect(chat(page)).not.toContainText(/email address/i);
  await expect(page.getByLabel("Lab dashboard")).toContainText("Request confirmed");
});

test("missing identity details are asked for again instead of being accepted", async ({ page }) => {
  await unlock(page);
  await say(page, "Aflatoxin test");
  await expect(chat(page)).toContainText(/To verify you/i);

  await say(page, "Meera Menon");
  await expect(chat(page)).toContainText(/phone number/i);
  await expect(chat(page)).toContainText(/GST number/i);

  await say(page, "NO GST");
  await expect(chat(page)).toContainText(/phone number/i);

  await say(page, "+91 9000000000");
  await expect(chat(page)).toContainText(/couldn't find a matching customer record/i);
  await expect(chat(page)).toContainText(/Which sample type is this for/i);
});

test("mismatched identity is retried once before continuing", async ({ page }) => {
  await unlock(page);
  await say(page, "Aflatoxin test");
  await expect(chat(page)).toContainText(/To verify you/i);

  const wrongPhone = identity.replace(arun.phone, "+91 9000000000");
  await say(page, wrongPhone);
  await expect(chat(page)).toContainText(/details don't match our records/i);
  await expect(chat(page)).toContainText(/re-check your phone number/i);

  await say(page, `phone ${arun.phone}`);
  await expect(chat(page)).toContainText(/You're verified/i);
  await expect(chat(page)).toContainText(/Which sample type is this for/i);
});
