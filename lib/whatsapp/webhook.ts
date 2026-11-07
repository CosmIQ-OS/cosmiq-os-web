import crypto from "node:crypto";

// CONTRACT
// GUARANTEES: authenticates Meta webhook deliveries and extracts only plain-text customer messages.
// EXPECTS: the exact raw request body for signature verification; the configured phone number id.
// FAILURE BEHAVIOR: malformed or forged input is rejected; unknown shapes produce no messages.
// DOES NOT: touch the database, run the workflow or send replies.
export interface InboundWhatsAppMessage {
  messageId: string;
  from: string;
  text: string;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function verifyWebhookSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const provided = header.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false;
  const expected = crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  return crypto.timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
}

export function verifyChallenge(
  mode: string | null, token: string | null, challenge: string | null, expected: string,
): string | null {
  if (mode !== "subscribe" || !token || !challenge) return null;
  // Hash both values first so timingSafeEqual always receives equal-length buffers.
  const given = crypto.createHash("sha256").update(token).digest();
  const wanted = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(given, wanted) ? challenge : null;
}

export function parseInbound(payload: unknown, phoneNumberId: string): InboundWhatsAppMessage[] {
  if (!isObject(payload) || payload.object !== "whatsapp_business_account") return [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];
  const messages: InboundWhatsAppMessage[] = [];
  for (const entry of entries) {
    if (!isObject(entry)) continue;
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      if (!isObject(change) || change.field !== "messages" || !isObject(change.value)) continue;
      const metadata = change.value.metadata;
      if (!isObject(metadata) || metadata.phone_number_id !== phoneNumberId) continue;
      const inbound = Array.isArray(change.value.messages) ? change.value.messages : [];
      for (const message of inbound) {
        if (!isObject(message) || message.type !== "text") continue;
        const id = typeof message.id === "string" ? message.id : "";
        const from = typeof message.from === "string" ? message.from : "";
        const text = isObject(message.text) && typeof message.text.body === "string" ? message.text.body.trim() : "";
        if (!id || !/^\d{6,15}$/.test(from) || !text) continue;
        messages.push({ messageId: id, from, text });
      }
    }
  }
  return messages;
}
