import type { Metadata } from "next";
import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { NAV, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — WhatsApp enquiry to quotation for food & testing labs`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", url: "/" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Geist:wght@300..800&family=Geist+Mono:wght@400..700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var root = document.documentElement;
  var t = localStorage.getItem("tandem-theme");
  if (t === "dark") root.dataset.theme = "dark";
  else if (t === "light") delete root.dataset.theme;
  var raw = localStorage.getItem("cosmiq-preview-vars");
  if (raw) {
    var saved = JSON.parse(raw);
    var mode = root.dataset.theme === "dark" ? "dark" : "light";
    var vars = saved && (saved[mode] || saved);
    if (vars && typeof vars === "object") {
      Object.keys(vars).forEach(function (k) {
        if (k.indexOf("--") === 0 && typeof vars[k] === "string") {
          root.style.setProperty(k, vars[k]);
        }
      });
    }
  }
} catch {}
            `,
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>

        <header className="nav" aria-label="Main">
          <div className="nav-in">
            <Link className="wordmark" href="/" aria-label="CosmIQ OS">
              <svg className="wordmark-cube" viewBox="0 0 200 200" width="28" height="28" aria-hidden="true">
                <polygon
                  points="34.53,58.00 100.00,20.20 142.56,44.77 127.89,53.24 100.00,37.13 63.86,58.00 100.00,78.87 127.89,62.76 142.56,71.23 100.00,95.80"
                  fill="currentColor"
                />
                <polygon
                  points="103.93,58.00 117.02,50.44 152.38,50.44 165.48,58.00 152.38,65.56 117.02,65.56"
                  fill="var(--accent-primary)"
                />
                <polygon
                  points="96.36,102.10 30.89,64.30 30.89,139.90 96.36,177.70 96.36,154.26 81.70,145.80 81.70,152.30 45.55,131.43 45.55,89.70 81.70,110.57 81.70,117.07 96.36,125.54"
                  fill="currentColor"
                  fillOpacity="0.86"
                />
                <polygon
                  points="103.64,102.10 169.11,64.30 169.11,81.23 143.71,95.90 143.71,137.63 169.11,122.97 169.11,139.90 103.64,177.70 103.64,160.77 129.04,146.10 129.04,104.37 103.64,119.03"
                  fill="currentColor"
                  fillOpacity="0.68"
                />
              </svg>
              <span className="wordmark-text">
                CosmIQ<sup className="wordmark-os">OS</sup>
              </span>
            </Link>
            <nav className="links" aria-label="Primary">
              {NAV.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="nav-end">
              <ThemeToggle />
              <Link href="/contact" className="btn btn-sm nav-cta">
                <span className="long">Request a pilot →</span>
                <span className="short">Contact</span>
              </Link>
              <MobileMenu links={NAV} />
            </div>
          </div>
        </header>

        <main id="main">{children}</main>

        <footer>
          <div className="wrap foot-row">
            <span>CosmIQ Agentic Automation for food &amp; testing labs. Deterministic LIMS sync.</span>
            <ul>
              <li>
                <Link href="/#agents">Agents</Link>
              </li>
              <li>
                <Link href="/#workflow">Workflow</Link>
              </li>
              <li>
                <Link href="/demo">Demo</Link>
              </li>
              <li>
                <Link href="/#guardrails">Guardrails</Link>
              </li>
              <li>
                <Link href="/contact">Request pilot</Link>
              </li>
              <li>
                <Link href="/styleguide">Design System</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
