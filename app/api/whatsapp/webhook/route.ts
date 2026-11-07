import { NextResponse, type NextRequest } from "next/server";
import {
  claimInboundMessage, ensureDemoData, getConversation, markInboundDone, markInboundFailed, setInboundReply,
} from "@/lib/demo/data";
import { handleWhatsAppMessage, restartWhatsAppConversation, startWhatsAppConversation } from "@/lib/demo/agent";
import { sendWhatsAppText } from "@/lib/whatsapp/client";
import { whatsappConfiguration } from "@/lib/whatsapp/config";
import { parseInbound, verifyChallenge, verifyWebhookSignature, type InboundWhatsAppMessage } from "@/lib/whatsapp/webhook";

// Meta must reach this route without a demo cookie; the HMAC signature is the authentication boundary.
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_INBOUND_TEXT = 1000;
const NO_STORE = { "Cache-Control": "private, no-store" };
const maskPhone = (value: string) => (value.length <= 5 ? "…" : `${value.slice(0, 3)}…${value.slice(-2)}`);
const NEW_ENQUIRY = /^(new|start|restart)\b/i;

function text(body: string, status: number, headers: Record<string, string> = {}) {
  return new NextResponse(body, { status, headers: { ...NO_STORE, "Content-Type": "text/plain", ...headers } });
}

export async function GET(req: NextRequest) {
  const config = whatsappConfiguration();
  if (!config) return text("WhatsApp is not configured.", 503);
  const params = req.nextUrl.searchParams;
  const challenge = verifyChallenge(
    params.get("hub.mode"), params.get("hub.verify_token"), params.get("hub.challenge"), config.verifyToken,
  );
  return challenge ? text(challenge, 200) : text("Forbidden", 403);
}

export async function POST(req: NextRequest) {
  const config = whatsappConfiguration();
  if (!config) return text("WhatsApp is not configured.", 503);
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-hub-signature-256"), config.appSecret)) {
    return text("Invalid signature.", 401);
  }
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return text("Invalid JSON.", 400); }

  // The claim table lives beside the demo schema; create both before the first inbound message.
  await ensureDemoData();
  for (const message of parseInbound(payload, config.phoneNumberId)) {
    const response = await processInbound(message);
    // Stop on a retryable failure; Meta resends the batch and completed ids are skipped by the claim.
    if (response.status !== 200) return response;
  }
  return NextResponse.json({ received: true }, { headers: NO_STORE });
}

async function processInbound(message: InboundWhatsAppMessage): Promise<Response> {
  const claim = await claimInboundMessage(message.messageId);
  if (claim.state === "done") return NextResponse.json({ received: true }, { headers: NO_STORE });
  if (claim.state === "busy") return text("Message is already being processed.", 503, { "Retry-After": "5" });
  if (claim.state === "ready") {
    if (!claim.reply) {
      await markInboundDone(message.messageId);
      return NextResponse.json({ received: true }, { headers: NO_STORE });
    }
    try {
      await sendWhatsAppText(message.from, claim.reply);
      await markInboundDone(message.messageId);
      return NextResponse.json({ received: true }, { headers: NO_STORE });
    } catch (error) {
      console.error("[whatsapp] stored reply resend failed", maskPhone(message.from), error);
      return text("Send failed.", 500);
    }
  }

  let replyStored = false;
  try {
    const incoming = message.text.slice(0, MAX_INBOUND_TEXT);
    let { id, greeting } = await startWhatsAppConversation(message.from);
    const conversation = await getConversation(id);
    if (conversation?.state === "confirmed" && NEW_ENQUIRY.test(incoming)) {
      const fresh = await restartWhatsAppConversation(message.from);
      id = fresh.id;
      greeting = fresh.greeting;
    }
    const replies = await handleWhatsAppMessage(id, incoming);
    const body = [greeting, ...replies].filter((part): part is string => !!part).join("\n\n");
    if (!body) throw new Error("The workflow produced no reply.");
    await setInboundReply(message.messageId, id, body);
    replyStored = true;
    await sendWhatsAppText(message.from, body);
    await markInboundDone(message.messageId);
    return NextResponse.json({ received: true }, { headers: NO_STORE });
  } catch (error) {
    console.error("[whatsapp] processing failed", maskPhone(message.from), error);
    // Once the reply is stored, retries must resend it instead of advancing the workflow twice.
    if (!replyStored) await markInboundFailed(message.messageId);
    return text("Processing failed.", 500);
  }
}
