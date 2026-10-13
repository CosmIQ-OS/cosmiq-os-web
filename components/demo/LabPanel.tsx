"use client";
import type { ConversationView } from "@/lib/demo/data";
import { inr } from "@/lib/demo/pricing";

const STAGE: Record<string, string> = {
  requesting: "Waiting for service request",
  identify: "Verifying customer",
  collecting: "Collecting details",
  confirming: "Confirming services and samples",
  email: "Collecting delivery email",
  pending_approval: "Awaiting staff approval",
};
const IDENTITY: Record<string, { label: string; tone: string }> = {
  pending: { label: "Verifying…", tone: "" },
  verified: { label: "✓ Verified", tone: "good" },
  new: { label: "New customer", tone: "good" },
  unverified: { label: "⚑ Unverified", tone: "flagged" },
};
const KIND: Record<string, string> = { ai: "AI", db: "DB", ask: "ASK", flag: "STAFF", quote: "QUOTE", order: "ORDER", info: "INFO" };
const DELIVERY: Record<string, string> = {
  pending_approval: "Awaiting staff approval", sending: "Submitting email", sent: "Email submitted",
  email_failed: "Email failed — staff retry needed", rejected: "Quotation rejected",
};

export default function LabPanel({ view }: { view: ConversationView | null }) {
  if (!view) {
    return (
      <aside className="lab" aria-label="Lab dashboard">
        <div className="lab-h"><b>Lab dashboard</b><span className="live">● live</span></div>
        <p className="lab-empty">Start a chat to watch the agent work: how it verifies the customer, what it read, what it checked in the lab database, and what it created.</p>
      </aside>
    );
  }
  const { conversation, profile, events, quotations, orders } = view;
  const { draft } = conversation;
  const lastAi = [...events].reverse().find((e) => e.kind === "ai");
  const engine = lastAi ? (lastAi.label.includes("Gemini") ? "Gemini" : "Fallback parser") : "—";
  const identity = IDENTITY[draft.verification] ?? IDENTITY.pending;
  const quotationStatus = quotations.at(-1)?.status;
  const stage = conversation.state === "pending_approval" && quotationStatus
    ? DELIVERY[quotationStatus] ?? STAGE.pending_approval : STAGE[conversation.state] ?? conversation.state;

  return (
    <aside className="lab" aria-label="Lab dashboard">
      <div className="lab-h"><b>Lab dashboard</b><span className="live">● live</span></div>

      <div className="lab-status">
        <div><small>Stage</small><b>{stage}</b></div>
        <div className={identity.tone}><small>Customer</small><b>{identity.label}</b></div>
        <div><small>Message reader</small><b>{engine}</b></div>
        <div className={conversation.needsStaff ? "flagged" : ""}><small>Exceptions</small><b>{conversation.needsStaff ? "⚑ Needs staff" : "No flags"}</b></div>
      </div>

      <div className="lab-card">
        <small>Customer</small>
        {profile ? (
          <>
            <b>{profile.customer.name} · {profile.customer.id}{draft.verification === "new" && <span className="tag ok" style={{ marginLeft: 8 }}>Registered now</span>}</b>
            <span>{[profile.customer.company, profile.customer.city].filter(Boolean).join(", ")}</span>
            <span className="mono">{[profile.customer.gstNo && `GST ${profile.customer.gstNo}`, profile.customer.email, profile.customer.phone].filter(Boolean).join(" · ")}</span>
            <span>{profile.orders.length} previous orders · {inr(profile.orders.reduce((s, o) => s + o.totalInr, 0))} billed</span>
            {profile.orders.length > 0 && (
              <ul>
                {profile.orders.slice(0, 3).map((o) => <li key={o.id}><span className="mono">{o.id}</span> {o.testName} · {o.sampleType} · {o.status}</li>)}
              </ul>
            )}
          </>
        ) : (
          <>
            <b>{draft.verification === "unverified" ? "Unverified customer" : "Verification in progress"}</b>
            <ul className="vfields" aria-label="Details received">
              {([["Name", draft.name], ["Phone", draft.phone], ["Email", draft.email], ["GST", draft.gstNo ?? (draft.noGst ? "No GST registration" : null)]] as const).map(([k, val]) => (
                <li key={k} className={val ? "got" : ""}><span>{val ? "✓" : "…"}</span>{k}: {val ?? "waiting"}</li>
              ))}
            </ul>
            {draft.verification === "unverified" && <span className="mono">Details don't match the record on file. History hidden until staff verify.</span>}
          </>
        )}
      </div>

      {(quotations.length > 0 || orders.length > 0) && (
        <div className="lab-card">
          <small>Created by the agent</small>
          {quotations.map((q) => (
            <span key={q.id}>
              <b className="mono">{q.id}</b> · {inr(q.totalInr)} · {q.status === "sent" ? "Email submitted" : q.status.replaceAll("_", " ")}
            </span>
          ))}
          {orders.map((o) => <span key={o.id}><b className="mono">{o.id}</b> · {o.testId} · {o.samples} × {o.sampleType} · {o.status}</span>)}
        </div>
      )}

      <div className="lab-trace">
        <small>Agent trace</small>
        <ol aria-label="Agent trace">
          {[...events].reverse().map((e) => (
            <li key={e.id} className={`ev ev-${e.kind}`}>
              <span className="ev-k">{KIND[e.kind] ?? e.kind}</span>
              <div><b>{e.label}</b>{e.detail && <p>{e.detail}</p>}</div>
              <time>{new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time>
            </li>
          ))}
        </ol>
      </div>
      <p className="lab-foot">Prices, GST and turnaround come from the database and are calculated in code. The AI only reads messages.</p>
      <a href="/staff/quotations" className="btn btn-sm ghost">Staff quotation approvals →</a>
    </aside>
  );
}
