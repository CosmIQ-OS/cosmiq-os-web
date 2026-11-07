import { test, expect, type APIRequestContext } from "@playwright/test";
import crypto from "node:crypto";

const APP_SECRET = "test-whatsapp-secret";
const PHONE_NUMBER_ID = "123456789012345";
const VERIFY_TOKEN = "test-whatsapp-verify";
const MOCK_URL = "http://127.0.0.1:3102/messages";

function inboundPayload(messageId: string, from: string, body: string) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "waba-test",
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: { display_phone_number: "15550000000", phone_number_id: PHONE_NUMBER_ID },
          contacts: [{ profile: { name: "Test Customer" }, wa_id: from }],
          messages: [{ from, id: messageId, timestamp: "1700000000", type: "text", text: { body } }],
        },
      }],
    }],
  };
}

const signature = (raw: string) =>
  `sha256=${crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex")}`;

async function postInbound(request: APIRequestContext, messageId: string, from: string, body: string) {
  const raw = JSON.stringify(inboundPayload(messageId, from, body));
  return request.post("/api/whatsapp/webhook", {
    data: raw,
    headers: { "Content-Type": "application/json", "x-hub-signature-256": signature(raw) },
  });
}

async function sentTo(request: APIRequestContext, to: string): Promise<string[]> {
  const response = await request.get(MOCK_URL);
  expect(response.ok()).toBe(true);
  const data = await response.json() as { messages: Array<{ to: string; body: string }> };
  return data.messages.filter((message) => message.to === to).map((message) => message.body);
}

const uniqueFrom = () => `9198${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

test("webhook verification echoes the challenge only for the configured token", async ({ request }) => {
  const ok = await request.get(
    `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=challenge-123`,
  );
  expect(ok.status()).toBe(200);
  expect(await ok.text()).toBe("challenge-123");

  const denied = await request.get(
    "/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=challenge-123",
  );
  expect(denied.status()).toBe(403);
});

test("webhook rejects a forged signature before touching the workflow", async ({ request }) => {
  const raw = JSON.stringify(inboundPayload("wamid.forged", uniqueFrom(), "hello"));
  const response = await request.post("/api/whatsapp/webhook", {
    data: raw,
    headers: { "Content-Type": "application/json", "x-hub-signature-256": `sha256=${"0".repeat(64)}` },
  });
  expect(response.status()).toBe(401);
});

test("one Meta message is processed once even when the webhook is delivered twice", async ({ request }) => {
  const from = uniqueFrom();
  const messageId = `wamid.duplicate.${crypto.randomUUID()}`;

  expect((await postInbound(request, messageId, from, "aflatoxin for chilli, 2 samples")).status()).toBe(200);
  const first = await sentTo(request, from);
  expect(first.length).toBe(1);
  expect(first[0]).toContain("Welcome to FQLab");
  expect(first[0]).toContain("To verify you");

  expect((await postInbound(request, messageId, from, "aflatoxin for chilli, 2 samples")).status()).toBe(200);
  expect(await sentTo(request, from)).toEqual(first);
});

test("a real WhatsApp conversation ends with a confirmed request and no email prompt", async ({ request }) => {
  const from = uniqueFrom();
  const send = (body: string) => postInbound(request, `wamid.flow.${crypto.randomUUID()}`, from, body);

  expect((await send("aflatoxin for chilli, 2 samples")).status()).toBe(200);
  expect((await send("Meera Menon, no GST")).status()).toBe(200);
  expect((await send("Confirm")).status()).toBe(200);

  const messages = await sentTo(request, from);
  expect(messages.length).toBe(3);
  expect(messages.at(-1)).toContain("Confirmed:");
  expect(messages.at(-1)).toContain("request has been recorded");
  expect(messages.at(-1)).not.toContain("email");
});

test("incomplete WhatsApp details are asked for again before confirmation", async ({ request }) => {
  const from = uniqueFrom();
  const send = (body: string) => postInbound(request, `wamid.incomplete.${crypto.randomUUID()}`, from, body);

  expect((await send("aflatoxin test")).status()).toBe(200);
  expect((await send("Meera Menon")).status()).toBe(200);
  expect((await send("12345")).status()).toBe(200);

  const messages = await sentTo(request, from);
  expect(messages[1]).toMatch(/GST number/i);
  expect(messages[2]).toMatch(/GST number/i);
  expect(messages[2]).not.toContain("Confirmed:");
});

test("NEW starts a fresh WhatsApp enquiry after confirmation", async ({ request }) => {
  const from = uniqueFrom();
  const send = (body: string) => postInbound(request, `wamid.restart.${crypto.randomUUID()}`, from, body);

  expect((await send("aflatoxin for chilli, 2 samples")).status()).toBe(200);
  expect((await send("Meera Menon, no GST")).status()).toBe(200);
  expect((await send("Confirm")).status()).toBe(200);
  expect((await send("NEW")).status()).toBe(200);

  const messages = await sentTo(request, from);
  expect(messages.at(-1)).toContain("Welcome to FQLab");
  expect(messages.at(-1)).toContain("Which testing services");
});
