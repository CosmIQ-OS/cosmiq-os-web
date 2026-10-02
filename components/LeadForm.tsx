"use client";
import { useState } from "react";
import { AUTOMATION_OPTIONS, EMAIL_RE } from "@/lib/validation";

type Errors = Partial<Record<"name" | "domain" | "email" | "automations", string>>;

export default function LeadForm() {
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | ""; text: string }>({ kind: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const all = selected.includes("All of the above");

  function check(p: { name: string; domain: string; email: string }): Errors {
    const e: Errors = {};
    if (!p.name) e.name = "Please enter your name.";
    if (!p.domain) e.domain = "Please enter your lab or organisation.";
    if (!p.email) e.email = "Please enter your email.";
    else if (!EMAIL_RE.test(p.email)) e.email = "That email doesn't look right.";
    if (selected.length === 0) e.automations = "Pick at least one area (or All of the above).";
    return e;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg({ kind: "", text: "" });
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      role: String(fd.get("role") ?? "").trim(),
      domain: String(fd.get("domain") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      automations: selected,
      notes: String(fd.get("notes") ?? "").trim(),
    };
    const found = check(payload);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      const missing = [!payload.name && "Name", !payload.domain && "Lab / organisation", !payload.email && "Email"].filter(Boolean) as string[];
      const list = missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : missing[0];
      setMsg({ kind: "err", text: list ? `Please fill ${list}.` : "Please fix the highlighted fields." });
      const target = first === "automations" ? form.querySelector<HTMLInputElement>('input[name="automations"]') : form.elements.namedItem(first);
      (target as HTMLElement | null)?.focus();
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
      form.reset();
      setSelected([]);
    } catch (err) {
      // No silent local fallback: surface failure so no lead is lost.
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not send. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  // Clear a field's error as soon as the visitor edits it.
  function onChange(e: React.FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name as keyof Errors;
    if (errors[name]) setErrors(({ [name]: _cleared, ...rest }) => rest);
  }

  const invalid = (k: keyof Errors) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `err-${k}` } : {});
  const errText = (k: keyof Errors) => errors[k] && <span className="field-err" id={`err-${k}`}>{errors[k]}</span>;

  return (
    <form className="form" onSubmit={onSubmit} onChange={onChange} noValidate aria-label="Pilot enquiry form">
      <div className="frow">
        <div><label className="f">Name*<input name="name" required placeholder="Asha Menon" autoComplete="name" {...invalid("name")} /></label>{errText("name")}</div>
        <label className="f">Role<input name="role" placeholder="Lab manager / QA head" autoComplete="organization-title" /></label>
      </div>
      <div className="frow">
        <div><label className="f">Lab / organisation*<input name="domain" required placeholder="Your lab's name" autoComplete="organization" {...invalid("domain")} /></label>{errText("domain")}</div>
        <div><label className="f">Email ID*<input name="email" type="email" required placeholder="you@yourlab.com" autoComplete="email" {...invalid("email")} /></label>{errText("email")}</div>
      </div>
      <label className="f">Phone / WhatsApp (optional)<input name="phone" type="tel" placeholder="+91 …" autoComplete="tel" /></label>
      <div>
        <span className="field-label" id="automations-label">What should we automate?*</span>
        <div className={`checks${errors.automations ? " invalid" : ""}`} role="group" aria-labelledby="automations-label"
          aria-describedby={errors.automations ? "err-automations" : undefined}>
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
        {errText("automations")}
      </div>
      <label className="f">Additional details<textarea name="notes" rows={3} placeholder="Which LIMS do you use? Roughly how many enquiries a week?" /></label>
      <button className="btn" type="submit" disabled={busy}>{busy ? "Sending…" : "Request a pilot →"}</button>
      <p className={`formmsg ${msg.kind}`} role="status">{msg.text}</p>
      <p className="tiny">We use these details only to reply about a pilot. See our <a href="/privacy">privacy note</a>.</p>
    </form>
  );
}
