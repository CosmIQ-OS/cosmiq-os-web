import http from "node:http";
const accepted = new Map();
const attempts = new Map();
const server = http.createServer(async (req, res) => {
  const json = (status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
  if (req.method === "GET") {
    const key = new URL(req.url, "http://127.0.0.1:3101").searchParams.get("key");
    return json(200, key ? { accepted: accepted.get(key) ?? null, attempts: attempts.get(key) ?? [] } : { ready: true });
  }
  if (req.method !== "POST" || req.url !== "/emails") return json(404, { error: "not found" });
  let text = ""; for await (const chunk of req) text += chunk;
  let payload; try { payload = JSON.parse(text); } catch { return json(400, { error: "bad JSON" }); }
  const key = req.headers["idempotency-key"];
  if (!key || req.headers.authorization !== "Bearer test-resend-key" || !payload.from || !payload.to?.[0]) return json(400, { error: "missing contract" });
  const pdf = Buffer.from(payload.attachments?.[0]?.content ?? "", "base64");
  if (pdf.subarray(0, 5).toString() !== "%PDF-") return json(400, { error: "invalid PDF attachment" });
  const history = attempts.get(key) ?? []; history.push(payload); attempts.set(key, history);
  const previous = accepted.get(key);
  if (previous) return JSON.stringify(previous.payload) === text ? json(200, { id: previous.id }) : json(409, { error: "idempotency payload mismatch" });
  const recipient = payload.to[0];
  if (recipient.includes("always-fail") || (recipient.includes("fail-once") && history.length === 1)) return json(503, { error: "test provider unavailable" });
  if (recipient.includes("slow")) await new Promise((resolve) => setTimeout(resolve, 250));
  const record = { id: `mail-${accepted.size + 1}`, payload }; accepted.set(key, record);
  if (recipient.includes("ambiguous-once") && history.length === 1) return json(500, { error: "accepted but response lost" });
  return json(200, { id: record.id });
});
server.listen(3101, "127.0.0.1");
