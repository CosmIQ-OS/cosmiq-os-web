"use client";
import { useEffect, useRef, useState } from "react";
import type { Chip, ConversationView, MessageMeta } from "@/lib/demo/data";

interface Props {
  view: ConversationView | null;
  pending: { text: string; afterCount: number } | null;
  busy: boolean;
  onSend: (text: string) => void;
  onStart: () => void;
  startLabel: string;
}

type Message = ConversationView["messages"][number];
const STEP_MS = 380;
const FRESH_MS = 15000; // only animate messages that just arrived, not ones reloaded later

// "Acting" the database check: steps tick in one by one, then the agent's reply is revealed.
function VerifyCard({ v, animate, onStep, onDone }: {
  v: NonNullable<MessageMeta["verification"]>; animate: boolean; onStep: () => void; onDone: () => void;
}) {
  const total = v.steps.length;
  const [shown, setShown] = useState(animate ? 0 : total);
  const finished = useRef(false);
  useEffect(() => {
    onStep();
    if (shown < total) {
      const timer = setTimeout(() => setShown((n) => n + 1), STEP_MS);
      return () => clearTimeout(timer);
    }
    if (!finished.current) {
      finished.current = true;
      onDone();
    }
  }, [shown, total, onStep, onDone]);
  const mark = (ok: boolean | null) => (ok === true ? "✓" : ok === false ? "✗" : "•");
  return (
    <div className={`vcard v-${v.outcome}`} aria-label="Customer verification">
      <div className="vcard-h">Verifying customer</div>
      <ol>
        {v.steps.slice(0, shown).map((s, i) => (
          <li key={i} className={s.ok === true ? "ok" : s.ok === false ? "bad" : "info"}><span aria-hidden="true">{mark(s.ok)}</span>{s.label}</li>
        ))}
        {shown < total && <li className="checking"><span className="spin" aria-hidden="true" />Checking…</li>}
      </ol>
      {shown >= total && <div className="vcard-result">{v.result}</div>}
    </div>
  );
}

function Bubble({ m, onGrow }: { m: Message; onGrow: () => void }) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [animate] = useState(() => !!m.meta?.verification && !reduced && Date.now() - Date.parse(m.at) < FRESH_MS);
  const [revealed, setRevealed] = useState(!animate);
  const reveal = useRef(() => setRevealed(true)).current;
  return (
    <div className={`msg ${m.sender === "agent" ? "in" : "out"}`}>
      {m.meta?.verification && <VerifyCard v={m.meta.verification} animate={animate} onStep={onGrow} onDone={reveal} />}
      {revealed && <p>{m.body}</p>}
      <time>{new Date(m.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time>
    </div>
  );
}

const chipLabel = (c: Chip) => (typeof c === "string" ? c : c.label);
const chipText = (c: Chip) => (typeof c === "string" ? c : c.text);

export default function PhoneChat({ view, pending, busy, onSend, onStart, startLabel }: Props) {
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const messages = view?.messages ?? [];
  const showPending = pending && messages.length <= pending.afterCount;
  const lastAgent = [...messages].reverse().find((m) => m.sender === "agent");
  const chips: Chip[] = !busy && lastAgent?.meta?.chips ? lastAgent.meta.chips : [];
  // Block body on purpose: scrollTo() returns a Promise in recent Chrome, and React would call
  // anything an effect returns as its cleanup function.
  const scrollToEnd = useRef(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }).current;

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, pending, busy, scrollToEnd]);

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
        {messages.map((m) => <Bubble key={m.id} m={m} onGrow={scrollToEnd} />)}
        {showPending && <div className="msg out pending"><p>{pending.text}</p></div>}
        {busy && view && <div className="msg in typing" aria-label="Agent is typing"><span /><span /><span /></div>}
      </div>
      {chips.length > 0 && (
        <div className="chips" aria-label="Suggested replies">
          {chips.map((c) => (
            <button key={chipLabel(c)} type="button" onClick={() => onSend(chipText(c))} title={chipText(c)}>{chipLabel(c)}</button>
          ))}
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
