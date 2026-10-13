import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import seed from "../../lib/demo/seed-data.json";
import { PDFDocument } from "pdf-lib";

async function unlock(page: Page) {
  expect((await page.request.post("/api/demo/access", { data: { code: "playwright-demo-code" } })).ok()).toBeTruthy();
  await page.goto("/pilot-demo");
  await expect(page.getByLabel("Chat as customer").locator("option")).toHaveCount(21, { timeout: 20_000 });
}
async function staff(request: APIRequestContext) {
  expect((await request.post("/api/staff/session", { data: { password: "playwright-staff-password" } })).ok()).toBeTruthy();
}
async function say(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Message" }).fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}
const chat = (page: Page) => page.getByRole("log", { name: "Chat messages" });
const arun = seed.customers[0];
const identity = `${arun.name}, phone ${arun.phone}, GST ${arun.gstNo}`;
async function apiQuote(request: APIRequestContext, recipient: string) {
  await request.post("/api/demo/access", { data: { code: "playwright-demo-code" } });
  const created = await request.post("/api/demo/conversations", { data: { customerId: arun.id } });
  const id = (await created.json()).conversation.id;
  let view;
  for (const text of ["aflatoxin for chilli, 3 samples", identity, "Confirm", recipient]) {
    const response = await request.post(`/api/demo/conversations/${id}/messages`, { data: { text } });
    expect(response.ok()).toBeTruthy(); view = await response.json();
  }
  expect(view.conversation.state).toBe("pending_approval");
  return { id, quotationId: view.conversation.draft.quotationId as string, view };
}
async function captured(request: APIRequestContext, id: string) {
  return (await request.get(`http://127.0.0.1:3101/?key=${encodeURIComponent(`quotation/${id}`)}`)).json();
}

test("demo and staff APIs are locked; demo access cannot approve or preview quotations", async ({ page, request }) => {
  for (const path of ["/api/demo/customers", "/api/staff/quotations"]) expect((await request.get(path)).status()).toBe(401);
  await page.goto("/pilot-demo");
  await expect(page.getByRole("heading", { name: "Enter the demo code." })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByLabel("Demo code").fill("wrong");
  await page.getByRole("button", { name: /open the demo/i }).click();
  await expect(page.getByRole("form", { name: "Demo access" }).getByRole("alert")).toContainText("That code isn't right.");
  const { quotationId } = await apiQuote(request, "locked@example.com");
  expect((await request.get(`/api/demo/quotations/${quotationId}/pdf`)).status()).toBe(403);
  expect((await request.get(`/api/staff/quotations/${quotationId}/pdf`)).status()).toBe(401);
  expect((await request.post(`/api/staff/quotations/${quotationId}`, { data: { action: "approve" } })).status()).toBe(401);
  expect((await request.post("/api/demo/reset")).status()).toBe(401);
  expect((await captured(request, quotationId)).accepted).toBeNull();
});

test("full workflow: services first → identity → confirmation → email → staff approval → PDF email", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await unlock(page);
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await expect(chat(page)).toContainText("Which testing services do you need?");
  if (testInfo.project.name === "mobile-chromium") {
    const box = (await page.getByRole("button", { name: "Send", exact: true }).boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
  await say(page, "Need aflatoxin testing for 3 red chilli powder samples");
  await expect(chat(page)).toContainText("please share your full name, phone number");
  await page.getByRole("button", { name: "Send my details", exact: true }).click();
  await expect(chat(page)).toContainText("You're verified. Welcome back, Arun!");
  await expect(chat(page)).toContainText("Please confirm: Aflatoxin for 3 samples of Red Chilli Powder");
  await expect(chat(page)).not.toContainText("What email address");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(chat(page)).toContainText("What email address should we send your quotation to?");
  const recipient = `browser-${testInfo.project.name}-${Date.now()}@example.com`;
  await say(page, recipient);
  await expect(chat(page)).toContainText("Your quotation will be emailed to you after approval.");
  await page.screenshot({ path: testInfo.outputPath("submitted-chat.png"), fullPage: true });
  await expect(page.locator(".qcard")).toHaveCount(0);
  const id = await page.evaluate(() => sessionStorage.getItem("cosmiq-conversation"));
  const view = await (await page.request.get(`/api/demo/conversations/${id}`)).json();
  expect(view.orders).toEqual([]);
  const quotationId = view.conversation.draft.quotationId;
  expect((await captured(page.request, quotationId)).accepted).toBeNull();
  await page.reload();
  await expect(chat(page)).toContainText("Your quotation will be emailed to you after approval.");
  if (testInfo.project.name === "mobile-chromium") await page.getByRole("tab", { name: "Lab dashboard" }).click();
  await expect(page.getByRole("complementary", { name: "Lab dashboard" })).toContainText("Awaiting staff approval");
  await page.goto("/staff/quotations");
  await page.getByLabel("Staff password").fill("playwright-staff-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  const row = page.getByRole("article", { name: `Quotation ${quotationId}`, exact: true });
  await expect(row).toContainText("INR 11,328");
  await expect(row).toContainText(recipient);
  const pdfResponse = await page.request.get(`/api/staff/quotations/${quotationId}/pdf`);
  expect(pdfResponse.headers()["content-type"]).toBe("application/pdf");
  const pdf = await PDFDocument.load(await pdfResponse.body());
  expect(pdf.getPageCount()).toBeGreaterThan(0); expect(pdf.getTitle()).toBe(`Quotation ${quotationId}`);
  await row.getByRole("button", { name: "Approve & email" }).click();
  await expect(row).toContainText("Email submitted");
  await page.screenshot({ path: testInfo.outputPath("approved-quotation.png"), fullPage: true });
  const mail = await captured(page.request, quotationId);
  expect(mail.attempts).toHaveLength(1);
  expect(mail.accepted.payload.to).toEqual([recipient]);
  expect(mail.accepted.payload.attachments[0].filename).toBe(`${quotationId}.pdf`);
  expect(Buffer.from(mail.accepted.payload.attachments[0].content, "base64").subarray(0, 5).toString()).toBe("%PDF-");
  // Repeated approval is a no-op, not another provider call.
  expect((await page.request.post(`/api/staff/quotations/${quotationId}`, { data: { action: "approve" } })).ok()).toBeTruthy();
  expect((await captured(page.request, quotationId)).attempts).toHaveLength(1);
  await page.goto("/pilot-demo");
  if (testInfo.project.name === "mobile-chromium") await page.getByRole("tab", { name: "Lab dashboard" }).click();
  await expect(page.getByRole("complementary", { name: "Lab dashboard" })).toContainText("Email submitted");
});

test("mismatched phone retries once, hides history, and requires staff identity review", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "identity path once");
  await page.emulateMedia({ reducedMotion: "reduce" }); await unlock(page);
  await page.getByLabel("Chat as customer").selectOption("C002");
  await page.getByRole("button", { name: /start chat/i }).first().click();
  await say(page, "pesticide residue for turmeric, 2 samples");
  await page.getByRole("button", { name: "Send with wrong phone" }).click();
  await expect(chat(page)).toContainText("Please re-check your phone number");
  await page.getByRole("button", { name: "Send with wrong phone" }).click();
  await expect(chat(page)).toContainText("I still can't match those details");
  const id = await page.evaluate(() => sessionStorage.getItem("cosmiq-conversation"));
  let view = await (await page.request.get(`/api/demo/conversations/${id}`)).json();
  expect(view.profile).toBeNull(); expect(view.conversation.draft.verification).toBe("unverified");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await say(page, "unverified@example.com");
  await expect(chat(page)).toContainText("Your quotation will be emailed");
  view = await (await page.request.get(`/api/demo/conversations/${id}`)).json();
  await staff(page.request);
  const approval = await page.request.post(`/api/staff/quotations/${view.conversation.draft.quotationId}`, { data: { action: "approve" } });
  expect(approval.status()).toBe(400);
  await page.goto("/staff/quotations");
  const row = page.getByRole("article", { name: `Quotation ${view.conversation.draft.quotationId}`, exact: true });
  await expect(row.getByRole("button", { name: "Approve & email" })).toBeDisabled();
  await row.getByRole("checkbox").check();
  await row.getByRole("button", { name: "Approve & email" }).click();
  await expect(row).toContainText("Email submitted");
});

test("rejecting a quotation sends no email; rejected quotations cannot be approved", async ({ page }) => {
  const { quotationId } = await apiQuote(page.request, "rejected@example.com"); await staff(page.request);
  expect((await page.request.post(`/api/staff/quotations/${quotationId}`, { data: { action: "reject" } })).status()).toBe(400);
  await page.goto("/staff/quotations");
  const row = page.getByRole("article", { name: `Quotation ${quotationId}`, exact: true });
  await row.getByLabel("Rejection reason").fill("Please clarify the requested testing scope.");
  await row.getByRole("button", { name: "Reject quotation" }).click();
  await expect(row.getByRole("status")).toHaveText("Rejected");
  expect((await page.request.post(`/api/staff/quotations/${quotationId}`, { data: { action: "approve" } })).status()).toBe(409);
  expect((await captured(page.request, quotationId)).accepted).toBeNull();
});

test("provider failure is visible and retry preserves the PDF and idempotency key", async ({ page }, testInfo) => {
  const { quotationId } = await apiQuote(page.request, `fail-once-${testInfo.project.name}@example.com`); await staff(page.request);
  await page.goto("/staff/quotations");
  const row = page.getByRole("article", { name: `Quotation ${quotationId}`, exact: true });
  await row.getByRole("button", { name: "Approve & email" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("HTTP 503");
  await expect(row).toContainText("Email failed");
  await row.getByRole("button", { name: "Retry email" }).click();
  await expect(row).toContainText("Email submitted");
  const mail = await captured(page.request, quotationId);
  expect(mail.attempts).toHaveLength(2); expect(mail.attempts[0]).toEqual(mail.attempts[1]);
  expect(mail.accepted).not.toBeNull();
});

test("staff APIs reject cross-origin, malformed and nonexistent quotation actions", async ({ request }) => {
  const { quotationId } = await apiQuote(request, "csrf@example.com"); await staff(request);
  const url = `/api/staff/quotations/${quotationId}`;
  expect((await request.post(url, { headers: { Origin: "https://attacker.example" }, data: { action: "approve" } })).status()).toBe(403);
  expect((await request.post(url, { headers: { "sec-fetch-site": "cross-site" }, data: { action: "reject", reason: "oops" } })).status()).toBe(403);
  expect((await request.post(url, { data: { action: "invalid" } })).status()).toBe(400);
  expect((await request.post("/api/staff/quotations/missing", { data: { action: "approve" } })).status()).toBe(404);
  expect((await captured(request, quotationId)).accepted).toBeNull();
});
