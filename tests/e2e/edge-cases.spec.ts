import { test, expect, type APIRequestContext } from "@playwright/test";
import { signToken } from "../../lib/staff-session";
import seed from "../../lib/demo/seed-data.json";

const sessionSecret = "playwright-session-secret-at-least-32-characters";
const customer = seed.customers[0];
async function unlock(request: APIRequestContext) {
  expect((await request.post("/api/demo/access", { data: { code: "playwright-demo-code" } })).status()).toBe(200);
}
async function start(request: APIRequestContext) {
  await unlock(request);
  const response = await request.post("/api/demo/conversations", { data: { customerId: customer.id } });
  expect(response.status()).toBe(201);
  return (await response.json()).conversation.id as string;
}
async function message(request: APIRequestContext, id: string, text: string) {
  const response = await request.post(`/api/demo/conversations/${id}/messages`, { data: { text } });
  expect(response.status()).toBe(200);
  return response.json();
}
const identity = `${customer.name}, phone ${customer.phone}, GST ${customer.gstNo}`;

test("expired, tampered and wrong-purpose cookies cannot access staff records or actions", async ({ request }) => {
  const tokens = [
    signToken("staff", sessionSecret, -1), signToken("demo", sessionSecret, 60),
    signToken("staff", "a-different-session-secret-at-least-32-chars", 60), "invalid",
    `${signToken("staff", sessionSecret, 60)}.extra`,
  ];
  for (const token of tokens) {
    const headers = { Cookie: `cosmiq_staff=${token}` };
    expect((await request.get("/api/staff/quotations", { headers })).status()).toBe(401);
    expect((await request.post("/api/staff/quotations/unknown", { headers, data: { action: "approve" } })).status()).toBe(401);
  }
});

test("staff tokens cannot be replayed as demo tokens, and expired demo sessions are rejected", async ({ request }) => {
  for (const token of [signToken("staff", sessionSecret, 60), signToken("demo", sessionSecret, -1)]) {
    expect((await request.get("/api/demo/customers", { headers: { Cookie: `cosmiq_demo=${token}` } })).status()).toBe(401);
  }
});

test("malformed sign-in requests and oversized passwords never create an authorised session", async ({ request }) => {
  expect((await request.post("/api/staff/session", { data: Buffer.from("{broken"), headers: { "Content-Type": "application/json" } })).status()).toBe(400);
  for (const password of [null, 123, "x".repeat(257)]) {
    expect((await request.post("/api/staff/session", { data: { password } })).status()).toBe(401);
  }
  expect((await request.get("/api/staff/quotations")).status()).toBe(401);
});

test("malformed conversation JSON is rejected instead of creating a new-customer chat", async ({ request }) => {
  await unlock(request);
  for (const data of ["{broken", "null", "[]", '"not an object"', "123", "true", ""]) {
    const response = await request.post("/api/demo/conversations", { data: Buffer.from(data), headers: { "Content-Type": "application/json" } });
    expect(response.status(), data).toBe(400);
  }
});

test("explicit new-customer and omitted customer choices still start a new chat", async ({ request }) => {
  await unlock(request);
  for (const data of [{ customerId: null }, {}]) {
    const response = await request.post("/api/demo/conversations", { data });
    expect(response.status()).toBe(201);
    const view = await response.json();
    expect(view.conversation.personaId).toBeNull();
    expect(view.conversation.state).toBe("requesting");
  }
});

test("invalid and unknown customer choices do not become server errors", async ({ request }) => {
  await unlock(request);
  for (const customerId of [123, "C001; DROP TABLE lab_customers", "", {}]) {
    expect((await request.post("/api/demo/conversations", { data: { customerId } })).status()).toBe(400);
  }
  expect((await request.post("/api/demo/conversations", { data: { customerId: "C999" } })).status()).toBe(404);
});

test("empty, oversized and non-string messages do not change the conversation", async ({ request }) => {
  const id = await start(request);
  const before = await (await request.get(`/api/demo/conversations/${id}`)).json();
  for (const text of ["", "   ", "x".repeat(501), null, 123]) {
    expect((await request.post(`/api/demo/conversations/${id}/messages`, { data: { text } })).status()).toBe(400);
  }
  const after = await (await request.get(`/api/demo/conversations/${id}`)).json();
  expect(after.messages).toEqual(before.messages);
  expect(after.conversation.draft).toEqual(before.conversation.draft);
});

test("nonexistent chat reads and messages return not found", async ({ request }) => {
  await unlock(request);
  expect((await request.get("/api/demo/conversations/unknown-id")).status()).toBe(404);
  expect((await request.post("/api/demo/conversations/unknown-id/messages", { data: { text: "aflatoxin" } })).status()).toBe(404);
});

test("declining and repeated confirmation cannot bypass the email step or duplicate a quote", async ({ request }) => {
  const id = await start(request);
  await message(request, id, "aflatoxin for pepper, 2 samples");
  await message(request, id, identity);
  const declined = await message(request, id, "No");
  expect(declined.quotations).toEqual([]);
  expect(declined.messages.at(-1).body).toContain("Nothing has been submitted");
  await message(request, id, "Confirm");
  const repeated = await message(request, id, "Confirm");
  expect(repeated.conversation.state).toBe("email"); expect(repeated.quotations).toEqual([]);
  const submitted = await message(request, id, "repeat-safeguard@example.com");
  const duplicate = await message(request, id, "another-recipient@example.com");
  expect(duplicate.quotations).toHaveLength(1);
  expect(duplicate.quotations[0].id).toBe(submitted.quotations[0].id);
  expect(duplicate.conversation.draft.email).toBe("repeat-safeguard@example.com");
  expect(duplicate.orders).toEqual([]);
});

test("changing to an unsupported sample after confirmation cannot submit stale valid details", async ({ request }) => {
  const id = await start(request);
  for (const text of ["aflatoxin for pepper, 2 samples", identity, "Confirm"]) await message(request, id, text);
  const changed = await message(request, id, "honey, 3 samples, early@example.com");
  expect(changed.quotations).toEqual([]); expect(changed.conversation.draft.sampleType).toBeNull();
  expect(changed.conversation.state).toBe("collecting");
  const corrected = await message(request, id, "turmeric");
  expect(corrected.conversation.state).toBe("confirming");
  await message(request, id, "Confirm");
  const final = await message(request, id, "corrected-sample@example.com");
  expect(final.quotations).toHaveLength(1);
  expect([final.conversation.draft.sampleType, final.conversation.draft.samples]).toEqual(["Turmeric Powder", 3]);
});

test("privacy-sensitive demo and staff pages remain non-indexable", async ({ page }) => {
  for (const path of ["/pilot-demo", "/staff/quotations"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});
