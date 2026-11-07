import { whatsappConfiguration } from "./config";

// CONTRACT
// GUARANTEES: sends plain text through one provider boundary with a bounded timeout; splits long replies.
// EXPECTS: a configured WhatsApp Cloud API account and a recipient wa_id (digits with country code).
// FAILURE BEHAVIOR: missing configuration or a non-2xx provider response throws; never fakes success.
// DOES NOT: create conversations, approve quotations, claim delivery or log access tokens.
const MAX_TEXT = 3500;

export function splitWhatsAppText(body: string): string[] {
  const text = body.trim();
  if (!text) return [];
  if (text.length <= MAX_TEXT) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > MAX_TEXT) {
    const window = rest.slice(0, MAX_TEXT);
    const at = Math.max(window.lastIndexOf("\n\n"), window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const cut = at > MAX_TEXT * 0.6 ? at : MAX_TEXT;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export async function sendWhatsAppText(to: string, body: string): Promise<{ id: string | null }> {
  const config = whatsappConfiguration();
  if (!config) throw new Error("WhatsApp sending is not configured.");
  const parts = splitWhatsAppText(body);
  if (!parts.length) throw new Error("Cannot send an empty WhatsApp message.");
  let lastId: string | null = null;
  for (const part of parts) {
    let response: Response;
    try {
      response = await fetch(config.apiUrl, {
        method: "POST",
        signal: AbortSignal.timeout(10_000),
        headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp", recipient_type: "individual", to, type: "text",
          text: { preview_url: false, body: part },
        }),
      });
    } catch {
      throw new Error("WhatsApp did not accept the message. Check the connection and retry.");
    }
    const data = await response.json().catch(() => null) as {
      messages?: Array<{ id?: unknown }>;
      error?: { message?: unknown };
    } | null;
    if (!response.ok) {
      const detail = typeof data?.error?.message === "string" ? data.error.message.slice(0, 200) : "";
      console.error("[whatsapp] send failed", response.status, detail);
      throw new Error(`WhatsApp did not accept the message (HTTP ${response.status}).`);
    }
    const id = data?.messages?.[0]?.id;
    if (typeof id === "string") lastId = id;
  }
  return { id: lastId };
}
