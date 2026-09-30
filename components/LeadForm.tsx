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
      setMsg({ kind: "err", text: "Please fill Name, Lab / organisation and Email." });
      return;
    }
    if (payload.automations.length === 0) {
      setMsg({ kind: "err", text: "Pick at least one area to automate (or All of the above)." });
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
      setMsg({ kind: "ok", text: `Received. Reference #${String(out.id).slice(-6)} — we'll be in touch with a pilot plan.` });
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
        <label className="f">Role<input name="role" placeholder="Lab manager / QA head" /></label>
      </div>
      <div className="frow">
        <label className="f">Lab / organisation*<input name="domain" required placeholder="Your lab's name" autoComplete="organization" /></label>
        <label className="f">Email ID*<input name="email" type="email" required placeholder="you@yourlab.com" autoComplete="email" /></label>
      </div>
      <label className="f">Phone / WhatsApp (optional)<input name="phone" type="tel" placeholder="+91 …" autoComplete="tel" /></label>
      <div>
        <span className="field-label" id="automations-label">What should we automate?*</span>
        <div className="checks" role="group" aria-labelledby="automations-label">
          {AUTOMATION_OPTIONS.map((o) =>
            <label key={o} style={o === "All of the above" ? { fontWeight: 700 } : undefined}>
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
      <label className="f">Additional details<textarea name="notes" rows={3} placeholder="Which LIMS do you use? Roughly how many enquiries a week?" /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Request a pilot →"}</button>
      <p className={`formmsg ${msg.kind}`} role="status">{msg.text}</p>
      <p className="tiny">We use these details only to reply about a pilot. See our <a href="/privacy">privacy note</a>.</p>
    </form>
  );
}
