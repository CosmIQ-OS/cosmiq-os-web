"use client";
import { useEffect, useState } from "react";
import type { Enquiry } from "@/lib/validation";

export default function StaffEnquiries() {
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"loading" | "login" | "ready">("loading");

  async function load() {
    const response = await fetch("/api/enquiries", { cache: "no-store" });
    if (response.status === 401) { setStatus("login"); return; }
    if (!response.ok) throw new Error("Could not load enquiries.");
    setRows(await response.json());
    setStatus("ready");
  }

  useEffect(() => {
    load().catch(() => { setError("Could not load enquiries."); setStatus("login"); });
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/staff/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Could not sign in.");
      setPassword("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in.");
    }
  }

  async function logout() {
    await fetch("/api/staff/session", { method: "DELETE" });
    setRows([]);
    setStatus("login");
  }

  function csv() {
    // Prefix formula-looking cells so spreadsheet apps treat user input as text.
    const quote = (value: unknown) => {
      const text = String(value ?? "");
      const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
      return '"' + safe.replace(/"/g, '""') + '"';
    };
    const output = ["when,name,role,domain,email,phone,automations,notes",
      ...rows.map((row) => [row.createdAt, row.name, row.role, row.domain, row.email,
        row.phone, row.automations.join(" | "), row.notes].map(quote).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([output], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cosmiq-enquiries.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="section">
      <div className="wrap">
        <p className="kicker"><span>Staff</span>Internal</p>
        <h1>Enquiries</h1>
        {status === "loading" && <p className="lede">Loading…</p>}
        {status === "login" && (
          <form className="form" onSubmit={login}>
            <label className="f">Staff password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password" required />
            </label>
            <button className="btn" type="submit">Sign in →</button>
            {error && <p className="formmsg err" role="alert">{error}</p>}
          </form>
        )}
        {status === "ready" && (
          <>
            <p className="lede">{rows.length} enquiries</p>
            <div className="hero-btns" style={{ margin: "0 0 24px" }}>
              <button className="btn btn-sm ghost" type="button" onClick={csv}>Export CSV</button>
              <button className="btn btn-sm ghost" type="button" onClick={logout}>Sign out</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="t"><thead><tr><th>When</th><th>Name</th><th>Role</th><th>Lab / org</th><th>Email</th><th>Phone</th><th>Automations</th><th>Notes</th></tr></thead>
                <tbody>{rows.map((row) => (
                  <tr key={row.id}><td>{row.createdAt.slice(0, 16).replace("T", " ")}</td>
                    <td>{row.name}</td><td>{row.role}</td><td>{row.domain}</td><td>{row.email}</td>
                    <td>{row.phone}</td><td>{row.automations.join(", ")}</td><td>{row.notes}</td></tr>
                ))}</tbody></table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
