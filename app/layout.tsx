import type { Metadata } from "next";
import Link from "next/link";
import MobileMenu from "@/components/MobileMenu";
import Splash from "@/components/tandem/Splash";
import ScrollReveals from "@/components/tandem/ScrollReveals";
import FooterWordmark from "@/components/tandem/FooterWordmark";
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Geist:wght@300..800&family=Geist+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
try { const t = localStorage.getItem("tandem-theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
try { if (!sessionStorage.getItem("cosmiq-splash") && location.pathname === "/" && !location.hash && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("splash"); } catch {}
            `,
          }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <Splash word="CosmIQ" />
        <ScrollReveals />

        <header className="nav" aria-label="Main">
          <div className="nav-in">
            <Link className="wordmark" href="/">
              CosmIQ
            </Link>
            <nav className="links" aria-label="Primary">
              {NAV.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="nav-end">
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
          <FooterWordmark word="CosmIQ" />
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
                <Link href="/privacy">Privacy</Link>
              </li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
