import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CosmIQ — Agentic automation for food & testing labs",
  description:
    "CosmIQ adds AI agents on top of your LIMS: WhatsApp enquiries turned into accurate quotations, and customer marketing your team approves. Prices and services always come from your LIMS.",
};

const NAV = [
  { href: "/#agents", label: "Agents" },
  { href: "/#workflow", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/#pilot", label: "Pilot" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="nav">
          <div className="wrap nav-in">
            <a className="logo" href="/"><span className="logo-mark" aria-hidden="true" />CosmIQ</a>
            <nav className="links" aria-label="Primary">
              {NAV.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
            </nav>
            <details className="mobile-menu">
              <summary aria-label="Open navigation">MENU</summary>
              <nav aria-label="Mobile">
                {NAV.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
                <a href="/contact">Book a pilot</a>
              </nav>
            </details>
            <a href="/contact" className="btn btn-sm nav-cta">Book a pilot →</a>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <div className="wrap foot">
            <div>
              <a className="logo" href="/"><span className="logo-mark" aria-hidden="true" />CosmIQ</a>
              <p>Agentic automation for food &amp; testing labs. Your LIMS stays the source of truth. Your staff stay in control.</p>
            </div>
            <nav className="flinks" aria-label="Footer">
              <a href="/demo">Demo</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a>
            </nav>
            <p className="copy">© 2026 CosmIQ · Built for labs that quote, test and report.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
