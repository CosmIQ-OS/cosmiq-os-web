import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cosmiq OS — Stop chasing routine work",
  description:
    "Cosmiq OS uses your business documents to find answers, coordinate tasks, and follow up until work is done.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="nav">
          <div className="wrap nav-in">
            <a className="logo" href="/">◍ Cosmiq&nbsp;OS</a>
            <nav className="links" aria-label="Primary">
              <a href="/#how">How it works</a>
              <a href="/demo">Demo</a>
              <a href="/#pilot">Pilot</a>
              <a href="/contact">Request a pilot</a>
            </nav>
            <details className="mobile-menu">
              <summary aria-label="Open navigation">☰</summary>
              <nav aria-label="Mobile">
                <a href="/#how">How it works</a>
                <a href="/demo">Demo</a>
                <a href="/#pilot">Pilot</a>
                <a href="/contact">Request a pilot</a>
              </nav>
            </details>
            <div>
              <a href="/contact" className="btn btn-sm">Request a pilot →</a>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer>
          <div className="wrap foot">
            <div><b>◍ Cosmiq OS</b><p className="tiny">Find the answer. Coordinate the work. Close the loop.</p></div>
            <div className="flinks">
              <a href="/demo">Demo</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a>
            </div>
            <p className="copy">© 2026 Cosmiq OS · Admin automation for growing service teams</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
