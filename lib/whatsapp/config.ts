// CONTRACT
// GUARANTEES: returns a complete WhatsApp configuration or null; never a partial one.
// EXPECTS: server-only environment variables; never imported by a client component.
// FAILURE BEHAVIOR: missing required values fail closed, so callers must return 503 or throw.
// DOES NOT: send messages, read requests or verify signatures.
export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  verifyToken: string;
  graphVersion: string;
  apiUrl: string;
}

const GRAPH_VERSION = /^v\d+\.\d+$/;

export function whatsappConfiguration(): WhatsAppConfig | null {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  if (!accessToken || !phoneNumberId || !appSecret || !verifyToken) return null;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION?.trim() || "v26.0";
  if (!GRAPH_VERSION.test(graphVersion)) return null;
  // Local transport boundary for integration tests; ignored on hosted production deployments.
  const testUrl = process.env.WHATSAPP_API_TEST_URL;
  const apiUrl = testUrl && !process.env.VERCEL && /^http:\/\/127\.0\.0\.1:\d+\/messages$/.test(testUrl)
    ? testUrl
    : `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  return { accessToken, phoneNumberId, appSecret, verifyToken, graphVersion, apiUrl };
}
