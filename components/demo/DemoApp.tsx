"use client";
import { useEffect, useState } from "react";
import type { ConversationView } from "@/lib/demo/data";
import LabPanel from "./LabPanel";
import PhoneChat from "./PhoneChat";

export interface CustomerOption {
  id: string;
  name: string;
  company: string;
  city: string;
  orders: number;
  billedInr: number;
}

const POLL_MS = 1500;

export default function DemoApp() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [who, setWho] = useState("C001");
  const [view, setView] = useState<ConversationView | null>(null);
  const [pending, setPending] = useState<{ text: string; afterCount: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"chat" | "lab">("chat");
  const conversationId = view?.conversation.id;

  useEffect(() => {
    fetch("/api/demo/customers", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setCustomers)
      .catch(() => setError("Could not load the customer list."));
  }, []);

  // The lab panel follows the database, as a second screen in the lab would.
  useEffect(() => {
    if (!conversationId) return;
    const timer = setInterval(async () => {
      const r = await fetch(`/api/demo/conversations/${conversationId}`, { cache: "no-store" }).catch(() => null);
      if (r?.ok) setView(await r.json());
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  async function call(url: string, body?: unknown): Promise<ConversationView | null> {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) }).catch(() => null);
    if (!r?.ok) {
      setError((await r?.json().catch(() => null))?.error ?? "Network problem. Please try again.");
      return null;
    }
    setError("");
    return r.json();
  }

  async function start() {
    setBusy(true);
    const next = await call("/api/demo/conversations", { customerId: who === "new" ? null : who });
    if (next) {
      setView(next);
      setTab("chat");
    }
    setBusy(false);
  }

  async function send(text: string) {
    if (!view || busy) return;
    setBusy(true);
    setPending({ text, afterCount: view.messages.length });
    const next = await call(`/api/demo/conversations/${view.conversation.id}/messages`, { text });
    if (next) setView(next);
    setPending(null);
    setBusy(false);
  }

  async function reset() {
    setBusy(true);
    if (await fetch("/api/demo/reset", { method: "POST" }).then((r) => r.ok).catch(() => false)) {
      setView(null);
      setError("");
    } else setError("Could not reset the demo.");
    setBusy(false);
  }

  const chosen = customers.find((c) => c.id === who);

  return (
    <section className="demo">
      <div className="demo-bar">
        <div className="demo-title">
          <span className="tag acc">Prototype · sample data</span>
          <h1>FQLab agentic enquiry desk</h1>
        </div>
        <div className="demo-controls">
          <label className="demo-select">
            <span>Chat as</span>
            <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Chat as customer">
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.company}</option>)}
              <option value="new">New customer (not in database)</option>
            </select>
          </label>
          <button className="btn btn-sm" onClick={start} disabled={busy}>{view ? "New chat" : "Start chat"} →</button>
          <button className="btn btn-sm ghost" onClick={reset} disabled={busy}>Reset demo</button>
        </div>
      </div>
      {error && <p className="formmsg err demo-error" role="alert">{error}</p>}
      <div className="demo-tabs" role="tablist" aria-label="Demo views">
        <button role="tab" aria-selected={tab === "chat"} onClick={() => setTab("chat")}>Customer phone</button>
        <button role="tab" aria-selected={tab === "lab"} onClick={() => setTab("lab")}>Lab dashboard</button>
      </div>
      <div className="demo-split" data-tab={tab}>
        <PhoneChat view={view} pending={pending} busy={busy} onSend={send} onStart={start}
          startLabel={who === "new" ? "a new customer" : chosen ? `${chosen.name} (${chosen.company})` : "a customer"} />
        <LabPanel view={view} />
      </div>
    </section>
  );
}
