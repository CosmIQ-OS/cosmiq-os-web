"use client";
import { useEffect, useState } from "react";
import type { ApprovalRow } from "@/lib/quotations/store";
import { inr } from "@/lib/demo/pricing";

const STATUS: Record<string, string> = {
  pending_approval: "Awaiting approval", sending: "Submitting email", email_failed: "Email failed — retry needed",
  sent: "Email submitted", rejected: "Rejected",
};
export default function StaffQuotations() {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [state, setState] = useState<"loading" | "login" | "ready">("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  async function load() {
    const response = await fetch("/api/staff/quotations", { cache: "no-store" });
    if (response.status === 401) { setRows([]); setState("login"); return; }
    if (!response.ok) throw new Error("Could not load quotations. Please try again.");
    setRows(await response.json()); setState("ready");
  }
  useEffect(() => { load().catch((e) => { setError(e.message); setState("login"); }); }, []);
  async function login(event: React.FormEvent) {
    event.preventDefault(); setError(""); setBusy("login");
    try {
      const response = await fetch("/api/staff/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      if (!response.ok) throw new Error((await response.json()).error);
      setPassword(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign in."); }
    finally { setBusy(null); }
  }
  async function act(id: string, action: "approve" | "retry" | "reject") {
    setBusy(id); setError("");
    try {
      const response = await fetch(`/api/staff/quotations/${id}`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewed: reviewed[id] === true, reason: reasons[id] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not process quotation.");
    } catch (e) { setError(e instanceof Error ? e.message : "Network problem. Please refresh before retrying."); }
    finally { await load().catch((e) => setError(e.message)); setBusy(null); }
  }
  async function logout() {
    const response = await fetch("/api/staff/session", { method: "DELETE" }).catch(() => null);
    if (!response?.ok) { setError("Could not sign out. Please try again."); return; }
    setRows([]); setReviewed({}); setReasons({}); setState("login");
  }
  return (
    <section className="section"><div className="wrap">
      <p className="kicker"><span>Staff</span>Internal</p><h1>Quotation approvals</h1>
      <p className="lede">Review the customer and services before sending. Nothing is emailed without approval.</p>
      {error && <p className="formmsg err" role="alert">{error}</p>}
      {state === "loading" && <p role="status">Loading…</p>}
      {state === "login" && <form className="form" onSubmit={login}>
        <label className="f">Staff password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="btn" disabled={!!busy}>Sign in →</button>
      </form>}
      {state === "ready" && <>
        <div className="hero-btns" style={{ marginBottom: 24 }}>
          <button className="btn btn-sm ghost" disabled={!!busy} onClick={() => load().catch((e) => setError(e.message))}>Refresh queue</button>
          <a className="btn btn-sm ghost" href="/staff/enquiries">Website enquiries</a>
          <button className="btn btn-sm ghost" disabled={!!busy} onClick={logout}>Sign out</button>
        </div>
        {!rows.length && <p role="status">No quotations awaiting review.</p>}
        <div className="approval-list">{rows.map((q) => {
          const needsReview = q.verification !== "verified" || q.needsStaff;
          const canRetry = q.status === "email_failed" || (q.status === "sending" && q.sendStartedAt && Date.now() - Date.parse(q.sendStartedAt) > 120_000);
          return <article className="card approval-card" key={q.id} aria-label={`Quotation ${q.id}`}>
            <div className="approval-heading"><h2>{q.id}</h2><b role="status">{STATUS[q.status] ?? q.status}</b></div>
            <p><b>{q.customerName}</b>{q.company && ` · ${q.company}`}</p>
            <p>Phone: {q.phone ?? "not provided"} · GST: {q.gstNo ?? "Not supplied"}</p>
            <p>Email: <b>{q.recipient}</b></p>
            <p>Identity: <b>{q.verification}</b>{q.needsStaff && " · Needs staff review"}</p>
            {q.flags.length > 0 && <ul>{q.flags.map((flag, i) => <li key={i}>{flag}</li>)}</ul>}
            <ul>{q.quote.lines.map((line) => <li key={line.testId}>{line.testName} · {line.samples} × {line.sampleType} · {inr(line.amountInr)}</li>)}</ul>
            <p>Subtotal {inr(q.quote.subtotalInr)} + GST {inr(q.quote.gstInr)} = <b>{inr(q.quote.totalInr)}</b> · {q.quote.tatDays} days</p>
            <a href={`/api/staff/quotations/${q.id}/pdf`} target="_blank" rel="noreferrer">Preview quotation PDF ↗</a>
            {q.deliveryError && <p className="formmsg err">{q.deliveryError}</p>}
            {q.sentAt && <p>Submitted to email provider: {new Date(q.sentAt).toLocaleString()}. Inbox delivery is not confirmed.</p>}
            {(q.status === "pending_approval" || canRetry) && <>
              {needsReview && <label className="approval-review"><input type="checkbox" checked={!!reviewed[q.id]} onChange={(e) => setReviewed({ ...reviewed, [q.id]: e.target.checked })} />I have reviewed the customer identity and staff flags</label>}
              <div className="hero-btns">
                <button className="btn btn-sm" disabled={!!busy || (needsReview && !reviewed[q.id])} onClick={() => act(q.id, canRetry ? "retry" : "approve")}>{busy === q.id ? "Processing…" : canRetry ? "Retry email" : "Approve & email"}</button>
              </div>
            </>}
            {q.status === "pending_approval" && <div className="approval-reject">
              <label className="f">Rejection reason<textarea maxLength={500} value={reasons[q.id] ?? ""} onChange={(e) => setReasons({ ...reasons, [q.id]: e.target.value })} /></label>
              <button className="btn btn-sm ghost" disabled={!!busy || !reasons[q.id]?.trim()} onClick={() => act(q.id, "reject")}>Reject quotation</button>
            </div>}
          </article>;
        })}</div>
      </>}
    </div></section>
  );
}
