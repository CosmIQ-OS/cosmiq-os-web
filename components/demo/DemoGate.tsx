"use client";
import { useState } from "react";

export default function DemoGate() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    const response = await fetch("/api/demo/access", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }),
    }).catch(() => null);
    if (response?.ok) return window.location.reload();
    setBusy(false);
    setError((await response?.json().catch(() => null))?.error ?? "Could not check the code. Please try again.");
  }

  return (
    <section className="section">
      <div className="wrap" style={{ maxWidth: 560 }}>
        <p className="kicker"><span>Private</span>Prototype</p>
        <h1>Enter the demo code.</h1>
        <p className="lede">This prototype is shared privately. Use the code you were given.</p>
        <form className="form" onSubmit={submit} aria-label="Demo access">
          <label className="f">Demo code<input name="code" type="password" autoComplete="off" required autoFocus /></label>
          <button className="btn" type="submit" disabled={busy}>{busy ? "Checking…" : "Open the demo →"}</button>
          {error && <p className="formmsg err" role="alert">{error}</p>}
        </form>
      </div>
    </section>
  );
}
