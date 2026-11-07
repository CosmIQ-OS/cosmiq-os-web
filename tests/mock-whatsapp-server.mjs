import http from "node:http";

// Local Graph API boundary for Playwright. Never used by the application outside tests.
const sent = [];
const server = http.createServer(async (req, res) => {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const url = new URL(req.url, "http://127.0.0.1:3102");
  if (req.method === "GET" && url.pathname === "/messages") return json(200, { messages: sent });
  if (req.method === "DELETE" && url.pathname === "/messages") {
    sent.length = 0;
    return json(200, { ok: true });
  }
  if (req.method !== "POST" || url.pathname !== "/messages") return json(404, { error: "not found" });
  if (req.headers.authorization !== "Bearer test-whatsapp-token") return json(401, { error: "bad token" });
  let text = "";
  for await (const chunk of req) text += chunk;
  let payload;
  try { payload = JSON.parse(text); } catch { return json(400, { error: "bad JSON" }); }
  if (!payload.to || !payload.text?.body) return json(400, { error: "missing contract" });
  if (payload.to.endsWith("0000")) return json(503, { error: "test provider unavailable" });
  const id = `wamid.mock-${sent.length + 1}`;
  sent.push({ id, to: payload.to, body: payload.text.body, at: Date.now() });
  return json(200, { messaging_product: "whatsapp", messages: [{ id }] });
});
server.listen(3102, "127.0.0.1");
