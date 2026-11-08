import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page not found",
};

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap nf">
        <p className="big" aria-hidden="true">404</p>
        <h1>This page isn&apos;t on file.</h1>
        <p className="lede">The link may be old or mistyped. Here&apos;s where most labs want to go:</p>
        <div className="hero-btns">
          <Link className="btn" href="/">Back to home →</Link>
          <Link className="btn ghost" href="/contact">Request a pilot</Link>
        </div>
      </div>
    </section>
  );
}
