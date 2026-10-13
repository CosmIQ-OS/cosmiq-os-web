export interface QuotationEmail {
  from: string; to: string; quotationId: string; customerName: string; attachmentBase64: string;
}

// CONTRACT
// GUARANTEES: submits one PDF email with a stable provider idempotency key and a 15-second timeout.
// EXPECTS: only approved snapshots reach this adapter; caller persists payload across retries.
// FAILURE BEHAVIOR: missing config or unconfirmed provider acceptance throws; never fakes success.
// DOES NOT: approve quotations or claim inbox delivery (provider acceptance is not delivery).
// KNOWN LIMITATIONS: Resend retains idempotency keys for 24 hours; caller bounds retry age.
export function emailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTATION_EMAIL_FROM;
  if (!apiKey || !from || /[\r\n]/.test(from)) return null;
  // Local transport boundary for integration tests; ignored on hosted production deployments.
  const testUrl = process.env.QUOTATION_EMAIL_TEST_URL;
  const url = testUrl && !process.env.VERCEL && /^http:\/\/127\.0\.0\.1:\d+\/emails$/.test(testUrl)
    ? testUrl : "https://api.resend.com/emails";
  return { apiKey, from, url };
}

export async function sendQuotationEmail(message: QuotationEmail): Promise<string> {
  const config = emailConfiguration();
  if (!config) throw new Error("Email sending is not configured. Set RESEND_API_KEY and QUOTATION_EMAIL_FROM.");
  let response: Response;
  try {
    response = await fetch(config.url, {
      method: "POST", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `quotation/${message.quotationId}` },
      body: JSON.stringify({
        from: message.from, to: [message.to], subject: `FQLab quotation ${message.quotationId}`,
        text: `Dear ${message.customerName},\n\nYour approved quotation ${message.quotationId} is attached. Please contact the lab to proceed.\n\nFQLab\nPrototype · sample data; not a real quotation.`,
        attachments: [{ filename: `${message.quotationId}.pdf`, content: message.attachmentBase64 }],
      }),
    });
  } catch {
    throw new Error("Email provider did not confirm acceptance. Retry this quotation; do not create a duplicate.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.id !== "string" || !data.id) {
    throw new Error(`Email provider did not accept the quotation (HTTP ${response.status}). Retry after checking the sender configuration.`);
  }
  return data.id;
}
