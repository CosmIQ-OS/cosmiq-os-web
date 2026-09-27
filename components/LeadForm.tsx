"use client";
import { useState } from "react";
import { AUTOMATION_OPTIONS } from "@/lib/validation";

export default function LeadForm() {
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | ""; text: string }>({ kind: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const all = selected.includes("All of the above");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg({ kind: "", text: "" });
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      role: String(fd.get("role") ?? "").trim(),
      domain: String(fd.get("domain") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      automations: selected,
      notes: String(fd.get("notes") ?? "").trim(),
    };
    if (!payload.name || !payload.domain || !payload.email) {
      setMsg({ kind: "err", text: "Please fill Name, Business domain and Email." });
      return;
    }
    if (payload.automations.length === 0) {
      setMsg({ kind: "err", text: "Pick at least one automation (or All of the above)." });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(out.error || "Submission failed.");
      setMsg({ kind: "ok", text: `Received. Reference #${String(out.id).slice(-6)} — we'll be in touch about a pilot.` });
      (e.target as HTMLFormElement).reset();
      setSelected([]);
    } catch (err) {
      // No silent local fallback: surface failure so no lead is lost.
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not send. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate aria-label="Pilot enquiry form">
      <div className="frow">
        <label className="f">Name*<input name="name" required placeholder="Asha Menon" autoComplete="name" /></label>
        <label className="f">Role<input name="role" placeholder="Founder / Ops head" /></label>
      </div>
      <div className="frow">
        <label className="f">Business domain*<input name="domain" required placeholder="Clinic, retail, logistics…" /></label>
        <label className="f">Email ID*<input name="email" type="email" required placeholder="you@company.com" autoComplete="email" /></label>
      </div>
      <div className="frow">
        <label className="f">Phone number (optional)<input name="phone" type="tel" placeholder="+91 …" autoComplete="tel" /></label>
        <div>
          <span className="tiny">Admin automations*</span>
          <div className="checks" role="group" aria-label="Admin automations">
            {AUTOMATION_OPTIONS.map((o) =>
              <label key={o} style={o === "All of the above" ? { gridColumn: "1/-1", fontWeight: 700 } : undefined}>
                <input type="checkbox" name="automations" value={o}
                  checked={all || selected.includes(o)} disabled={all && o !== "All of the above"}
                  onChange={(event) => {
                    if (o === "All of the above") setSelected(event.target.checked ? [o] : []);
                    else setSelected((items) => event.target.checked ? [...items, o] : items.filter((item) => item !== o));
                  }} /> {o}
              </label>
            )}
          </div>
        </div>
      </div>
      <label className="f">Additional requests<textarea name="notes" rows={3} placeholder="e.g. Which recurring task eats most of your week?" /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Request a pilot →"}</button>
      <p className={`formmsg darkmsg ${msg.kind}`} role="status">{msg.text}</p>
      <p className="tiny">What admin work takes too much of your time? Tell us above — we reply with a pilot plan.</p>
    </form>
  );
}
