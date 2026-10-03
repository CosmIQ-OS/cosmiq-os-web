"use client";
import { useEffect, useRef, useState } from "react";
import type { ConversationView, MessageMeta } from "@/lib/demo/data";
import { inr } from "@/lib/demo/pricing";

interface Props {
  view: ConversationView | null;
  pending: { text: string; afterCount: number } | null;
  busy: boolean;
  onSend: (text: string) => void;
  onStart: () => void;
  startLabel: string;
}

function QuoteCard({ quote }: { quote: NonNullable<MessageMeta["quote"]> }) {
  return (
    <div className="qcard" aria-label={`Quotation ${quote.id}`}>
      <div className="qcard-h"><b>Quotation {quote.id}</b><span>PDF</span></div>
      {quote.lines.map((l) => (
        <div className="qrow" key={l.testName}><span>{l.testName} × {l.samples}</span><span>{inr(l.amountInr)}</span></div>
      ))}
      <div className="qrow"><span>GST {Math.round(quote.gstRate * 100)}%</span><span>{inr(quote.gstInr)}</span></div>
      <div className="qrow total"><span>Total</span><span>{inr(quote.totalInr)}</span></div>
      <div className="qrow muted"><span>Turnaround</span><span>{quote.tatDays} days</span></div>
      <a className="qcard-link" href={`/api/demo/quotations/${quote.id}/pdf`} target="_blank" rel="noreferrer">Open quotation PDF ↗</a>
    </div>
  );
}

export default function PhoneChat({ view, pending, busy, onSend, onStart, startLabel }: Props) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const messages = view?.messages ?? [];
  const showPending = pending && messages.length <= pending.afterCount;
  const lastAgent = [...messages].reverse().find((m) => m.sender === "agent");
  const chips: string[] = !busy && lastAgent?.meta?.chips ? lastAgent.meta.chips : [];

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending, busy]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
  }

  return (
    <div className="phone" aria-label="Customer phone">
      <div className="phone-h">
        <span className="phone-avatar" aria-hidden="true">FQ</span>
        <div><b>FQLab</b><small>{busy && view ? "typing…" : "online"}</small></div>
        <span className="phone-sim">Simulated WhatsApp</span>
      </div>
      <div className="phone-body" ref={scroller} role="log" aria-live="polite" aria-label="Chat messages">
        {!view && (
          <div className="phone-empty">
            <p>Start a chat as <b>{startLabel}</b>.</p>
            <button className="btn btn-sm" onClick={onStart} disabled={busy}>Start chat →</button>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.sender === "agent" ? "in" : "out"}`}>
            <p>{m.body}</p>
            {m.meta?.quote && <QuoteCard quote={m.meta.quote} />}
            {m.meta?.order && <div className="ocard"><b>✓ {m.meta.order.ids.join(", ")}</b><span>{m.meta.order.status}</span></div>}
            <time>{new Date(m.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time>
          </div>
        ))}
        {showPending && <div className="msg out pending"><p>{pending.text}</p></div>}
        {busy && view && <div className="msg in typing" aria-label="Agent is typing"><span /><span /><span /></div>}
      </div>
      {chips.length > 0 && (
        <div className="chips" aria-label="Suggested replies">
          {chips.map((c) => <button key={c} type="button" onClick={() => onSend(c)}>{c}</button>)}
        </div>
      )}
      <form className="phone-input" onSubmit={submit}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={view ? "Type a message" : "Start a chat first"}
          disabled={!view} maxLength={500} aria-label="Message" />
        <button type="submit" disabled={!view || busy || !draft.trim()} aria-label="Send">➤</button>
      </form>
    </div>
  );
}
