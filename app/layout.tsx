import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import MobileMenu from "@/components/MobileMenu";
import { NAV, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time: no font requests from visitors' browsers to Google.
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-head", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — WhatsApp enquiry to quotation for food & testing labs`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_IN", url: "/" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="nav">
          <div className="wrap nav-in">
            <a className="logo" href="/"><span className="logo-mark" aria-hidden="true" />CosmIQ</a>
            <nav className="links" aria-label="Primary">
              {NAV.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
            </nav>
            <div className="nav-end">
              <a href="/contact" className="btn btn-sm nav-cta">
                <span className="long">Request a pilot →</span><span className="short">Contact</span>
              </a>
              <MobileMenu links={NAV} />
            </div>
          </div>
        </header>
        <main id="main">{children}</main>
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
